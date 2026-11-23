// ============================================================================
//  MULTICAM PARA ADOBE PREMIERE PRO — PASO 2 de 2  (ExtendScript .jsx)
// ----------------------------------------------------------------------------
//  PASO 1 (en el Mac): doble clic en "Sincronizar Multicam.command".
//         Sincroniza las cámaras por AUDIO y crea  multicam_sync.json.
//  PASO 2 (en Premiere): ejecuta este script y elige ese multicam_sync.json.
//
//  Qué hace este script:
//    1. Importa los videos al proyecto (si no estaban ya) en una carpeta nueva.
//    2. Crea una secuencia con cada cámara en su pista (V1..Vn / A1..An),
//       colocada en el punto exacto que calculó la sincronización por audio.
//    3. Deja sonando solo el audio de la cámara maestra.
//    4. OPCIONAL: corte automático, cambiando de cámara cada N segundos.
//
//  Si cancelas la elección del .json, el script usa los clips que tengas
//  seleccionados en el panel Proyecto y los sincroniza por TIMECODE.
//
//  Cómo ejecutarlo en Mac:
//    - VS Code + extensión "ExtendScript Debugger" (de Adobe): abre este
//      archivo, abajo elige "Adobe Premiere Pro" como destino y pulsa F5
//      (o comando "ExtendScript: Evaluate Script in Attached Host").
//
//  Para editar a mano con el monitor multicámara (4 ángulos):
//    selecciona todos los clips de la secuencia > clic derecho > Anidar
//    > clic derecho sobre el anidado > Multicámara > Habilitar.
// ============================================================================

#target premierepro

(function () {
    var TICKS_PER_SECOND = 254016000000;

    // ---------------------------------------------------------------- utilidades
    function ticksToSec(t) { return parseFloat(t) / TICKS_PER_SECOND; }
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function randInt(n) { return Math.floor(Math.random() * n); }

    function secToTimecode(sec, fps) {
        var fpsInt = Math.round(fps);
        var totalFrames = Math.round(sec * fps);
        var ff = totalFrames % fpsInt;
        var totalSec = Math.floor(totalFrames / fpsInt);
        return pad(Math.floor(totalSec / 3600)) + ":" + pad(Math.floor(totalSec / 60) % 60) + ":" +
               pad(totalSec % 60) + ":" + pad(ff);
    }

    function baseName(p) {
        p = String(p).replace(/\\/g, "/");
        return p.substring(p.lastIndexOf("/") + 1).toLowerCase();
    }

    // Recorre todo el proyecto buscando clips
    function allClips(item, out) {
        for (var i = 0; i < item.children.numItems; i++) {
            var ch = item.children[i];
            if (ch.type === ProjectItemType.BIN) { allClips(ch, out); }
            else if (ch.type === ProjectItemType.CLIP) { out.push(ch); }
        }
        return out;
    }

    function findByPath(clips, path) {
        var i, mp;
        var lower = String(path).toLowerCase();
        for (i = 0; i < clips.length; i++) {
            mp = clips[i].getMediaPath ? clips[i].getMediaPath() : "";
            if (mp && String(mp).toLowerCase() === lower) { return clips[i]; }
        }
        // respaldo: mismo nombre de archivo (acentos con otra normalización, etc.)
        for (i = 0; i < clips.length; i++) {
            mp = clips[i].getMediaPath ? clips[i].getMediaPath() : "";
            if (mp && baseName(mp) === baseName(path)) { return clips[i]; }
        }
        return null;
    }

    // ---------------------------------------------------------- comprobaciones
    if (!app.project) { alert("Abre un proyecto primero."); return; }
    app.enableQE();

    var cams = [];      // ProjectItems
    var offsets = [];   // segundos
    var master = 0;
    var defaultName = "MULTICAM";

    var jsonFile = File.openDialog("Elige multicam_sync.json (Cancelar = usar clips seleccionados + timecode)");

    if (jsonFile) {
        // ------------------------------------------- modo AUDIO (desde el .json)
        jsonFile.encoding = "UTF-8";
        jsonFile.open("r");
        var txt = jsonFile.read();
        jsonFile.close();
        var data;
        try { data = eval("(" + txt + ")"); } catch (e) { alert("El archivo no es un multicam_sync.json válido."); return; }
        if (!data || !data.clips || data.clips.length < 2) { alert("El .json tiene menos de 2 cámaras."); return; }

        var existing = allClips(app.project.rootItem, []);
        var missing = [];
        var c;
        for (c = 0; c < data.clips.length; c++) {
            if (!findByPath(existing, data.clips[c].path)) {
                if (!new File(data.clips[c].path).exists) {
                    alert("No encuentro el archivo:\n" + data.clips[c].path + "\n¿Moviste la carpeta? Vuelve a sincronizar.");
                    return;
                }
                missing.push(data.clips[c].path);
            }
        }
        defaultName = "MULTICAM_" + decodeURI(jsonFile.parent.name);
        if (missing.length) {
            var bin = app.project.rootItem.createBin("Cámaras " + decodeURI(jsonFile.parent.name));
            app.project.importFiles(missing, true, bin, false);
            existing = allClips(app.project.rootItem, []);
        }
        for (c = 0; c < data.clips.length; c++) {
            var pi = findByPath(existing, data.clips[c].path);
            if (!pi) { alert("No se pudo importar:\n" + data.clips[c].path); return; }
            cams.push(pi);
            offsets.push(parseFloat(data.clips[c].offset));
            if (data.clips[c].name === data.master) { master = c; }
        }
    } else {
        // --------------------------------- modo TIMECODE (clips seleccionados)
        var selection = app.getCurrentProjectViewSelection ? app.getCurrentProjectViewSelection() : null;
        if (selection) {
            for (var s = 0; s < selection.length; s++) {
                if (selection[s] && selection[s].type === ProjectItemType.CLIP) { cams.push(selection[s]); }
            }
        }
        if (cams.length < 2) {
            alert("Sin .json: selecciona al menos 2 clips en el panel Proyecto y vuelve a ejecutar.");
            return;
        }
        cams.sort(function (a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });
        var syncByTC = confirm("¿Sincronizar por TIMECODE?\n\nSí = por timecode\nNo = todos empiezan en 0");
        var minStart = null, i0;
        for (i0 = 0; i0 < cams.length; i0++) {
            var st = syncByTC ? ticksToSec(cams[i0].startTime().ticks) : 0;
            offsets.push(st);
            if (minStart === null || st < minStart) { minStart = st; }
        }
        for (i0 = 0; i0 < offsets.length; i0++) { offsets[i0] -= minStart; }

        var camList = "";
        for (i0 = 0; i0 < cams.length; i0++) { camList += "  " + (i0 + 1) + " = " + cams[i0].name + "\n"; }
        var masterAns = prompt("Cámara MAESTRA de audio (número):\n" + camList, "1");
        if (masterAns === null) { return; }
        master = parseInt(masterAns, 10) - 1;
        if (isNaN(master) || master < 0 || master >= cams.length) { master = 0; }
    }

    var i;
    var seqName = prompt("Nombre de la secuencia multicámara:", defaultName);
    if (seqName === null) { return; }

    var cutAns = prompt("Corte automático: segundos promedio por plano\n(0 = no cortar, solo sincronizar y apilar)", "4");
    if (cutAns === null) { return; }
    var shotLen = parseFloat(cutAns);
    if (isNaN(shotLen) || shotLen < 0) { shotLen = 0; }

    // ------------------------------------------------------- crear secuencia
    // La secuencia toma formato (tamaño/fps) de la primera cámara con video
    var seed = cams[master];
    var audioExt = /\.(wav|m4a|mp3|aif|aiff)$/i;
    if (audioExt.test(seed.name)) {
        for (i = 0; i < cams.length; i++) { if (!audioExt.test(cams[i].name)) { seed = cams[i]; break; } }
    }
    var seq = app.project.createNewSequenceFromClips(seqName, [seed], app.project.getInsertionBin());
    if (!seq) { alert("No se pudo crear la secuencia."); return; }
    app.project.activeSequence = seq;

    function clearTracks(tracks) {
        for (var t = 0; t < tracks.numTracks; t++) {
            var clips = tracks[t].clips;
            for (var k = clips.numItems - 1; k >= 0; k--) { clips[k].remove(0, 0); }
        }
    }
    clearTracks(seq.videoTracks);
    clearTracks(seq.audioTracks);

    var qeSeq = qe.project.getActiveSequence();
    var needV = cams.length - seq.videoTracks.numTracks;
    var needA = cams.length - seq.audioTracks.numTracks;
    if (needV > 0) { qeSeq.addTracks(needV, seq.videoTracks.numTracks, 0); }
    if (needA > 0) { qeSeq.addTracks(0, 0, needA, 1, seq.audioTracks.numTracks); }

    // ------------------------------------------- colocar cada cámara en su pista
    for (i = 0; i < cams.length; i++) {
        seq.videoTracks[i].overwriteClip(cams[i], offsets[i]);
    }

    // Solo suena la cámara maestra
    for (i = 0; i < seq.audioTracks.numTracks; i++) {
        seq.audioTracks[i].setMute(i === master ? 0 : 1);
    }

    // ------------------------------------------------------ corte automático
    if (shotLen > 0) {
        var fps = TICKS_PER_SECOND / parseFloat(seq.timebase);
        var zero = ticksToSec(seq.zeroPoint);
        var endSec = ticksToSec(seq.end);

        var cuts = [];
        var t0 = 0;
        while (true) {
            t0 += shotLen * (0.65 + Math.random() * 0.7);   // variación ±35 %
            if (t0 >= endSec - 0.5) { break; }
            cuts.push(t0);
        }

        var v, ci;
        for (v = 0; v < cams.length; v++) {
            var qTrack = qeSeq.getVideoTrackAt(v);
            for (ci = 0; ci < cuts.length; ci++) { qTrack.razor(secToTimecode(cuts[ci] + zero, fps)); }
        }

        var bounds = [0].concat(cuts).concat([endSec]);
        var segmentOf = function (sec) {
            for (var b = 0; b < bounds.length - 1; b++) {
                if (sec >= bounds[b] && sec < bounds[b + 1]) { return b; }
            }
            return bounds.length - 2;
        };
        var camCovers = function (camIdx, sec) {
            var clips = seq.videoTracks[camIdx].clips;
            for (var k = 0; k < clips.numItems; k++) {
                if (sec >= ticksToSec(clips[k].start.ticks) && sec < ticksToSec(clips[k].end.ticks)) { return true; }
            }
            return false;
        };

        var chosen = [];
        var prev = -1;
        for (var sg = 0; sg < bounds.length - 1; sg++) {
            var mid = (bounds[sg] + bounds[sg + 1]) / 2;
            var options = [];
            for (var cc = 0; cc < cams.length; cc++) {
                if (cc !== prev && camCovers(cc, mid)) { options.push(cc); }
            }
            if (options.length === 0 && prev >= 0 && camCovers(prev, mid)) { options.push(prev); }
            var pick = options.length ? options[randInt(options.length)] : master;
            chosen.push(pick);
            prev = pick;
        }

        for (v = 0; v < cams.length; v++) {
            var vClips = seq.videoTracks[v].clips;
            for (var k = 0; k < vClips.numItems; k++) {
                var clip = vClips[k];
                var m = (ticksToSec(clip.start.ticks) + ticksToSec(clip.end.ticks)) / 2;
                clip.disabled = (chosen[segmentOf(m)] !== v);
            }
        }
    }

    alert("Listo: secuencia '" + seqName + "' con " + cams.length + " cámaras.\n" +
          "Audio maestro: " + cams[master].name + "\n" +
          (shotLen > 0 ? "Corte automático aplicado. Activa/desactiva un clip con Shift+E para cambiar de plano."
                       : "Para editar en vivo: selecciona todo > Anidar > Multicámara > Habilitar."));
})();
