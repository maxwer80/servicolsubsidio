// ============================================================================
//  MULTICAM AUTOMÁTICO PARA ADOBE PREMIERE PRO  (ExtendScript .jsx)
// ----------------------------------------------------------------------------
//  Qué hace:
//    1. Toma los clips seleccionados en el panel Proyecto (una cámara por clip).
//    2. Los sincroniza por TIMECODE (o los alinea todos al inicio).
//    3. Crea una secuencia nueva con cada cámara en su propia pista (V1..Vn / A1..An).
//    4. Deja sonando solo el audio de la cámara "maestra" (silencia las demás pistas).
//    5. OPCIONAL: hace un corte automático, cambiando de cámara cada N segundos
//       (con algo de variación) y deshabilitando las cámaras que no están "al aire".
//
//  Cómo usarlo:
//    - Premiere Pro 2020 o superior.
//    - Selecciona en el panel Proyecto los clips de las cámaras (Ctrl/Cmd + clic).
//      Se ordenan por nombre: CAM_A, CAM_B, CAM_C... => V1, V2, V3...
//    - Ejecuta el script con:
//        * VS Code + extensión "ExtendScript Debugger" (destino: Premiere Pro), o
//        * File > Scripts (si tienes un panel tipo "JSX Launcher"/"Commander").
//    - Responde las preguntas que aparecen.
//
//  Para editar a mano después (multicámara "de verdad" con el monitor de 4 ángulos):
//    selecciona todos los clips de la secuencia > clic derecho > Anidar (Nest)
//    > clic derecho sobre el anidado > Multicámara > Habilitar.
//
//  Notas:
//    - Si tus cámaras no tienen timecode en común, usa sincronización por audio
//      nativa: clic derecho sobre los clips > "Crear secuencia de origen multicámara"
//      > Sincronizar por Audio. ExtendScript no puede analizar audio.
//    - El corte automático usa el objeto QE (no documentado oficialmente por Adobe,
//      pero muy usado). Con timecode drop-frame (29.97 DF) los cortes pueden
//      quedar desplazados unos cuadros.
// ============================================================================

#target premierepro

(function () {
    var TICKS_PER_SECOND = 254016000000;

    // ---------------------------------------------------------------- utilidades
    function ticksToSec(t) { return parseFloat(t) / TICKS_PER_SECOND; }

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    function secToTimecode(sec, fps) {
        var fpsInt = Math.round(fps);
        var totalFrames = Math.round(sec * fps);
        var ff = totalFrames % fpsInt;
        var totalSec = Math.floor(totalFrames / fpsInt);
        var ss = totalSec % 60;
        var mm = Math.floor(totalSec / 60) % 60;
        var hh = Math.floor(totalSec / 3600);
        return pad(hh) + ":" + pad(mm) + ":" + pad(ss) + ":" + pad(ff);
    }

    function randInt(n) { return Math.floor(Math.random() * n); }

    // ---------------------------------------------------------- comprobaciones
    if (!app.project) { alert("Abre un proyecto primero."); return; }
    app.enableQE();

    var selection = app.getCurrentProjectViewSelection ? app.getCurrentProjectViewSelection() : null;
    var cams = [];
    if (selection) {
        for (var s = 0; s < selection.length; s++) {
            var it = selection[s];
            if (it && it.type === ProjectItemType.CLIP) { cams.push(it); }
        }
    }
    if (cams.length < 2) {
        alert("Selecciona al menos 2 clips (una cámara por clip) en el panel Proyecto.");
        return;
    }
    cams.sort(function (a, b) { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0); });

    // ---------------------------------------------------------------- preguntas
    var camList = "";
    for (var c = 0; c < cams.length; c++) { camList += "  " + (c + 1) + " = " + cams[c].name + "\n"; }

    var seqName = prompt("Nombre de la secuencia multicámara:", "MULTICAM_" + cams.length + "cams");
    if (seqName === null) { return; }

    var syncByTC = confirm("¿Sincronizar por TIMECODE?\n\nSí = por timecode\nNo = todos empiezan en 0");

    var masterAns = prompt("Cámara MAESTRA de audio (número):\n" + camList, "1");
    if (masterAns === null) { return; }
    var master = parseInt(masterAns, 10) - 1;
    if (isNaN(master) || master < 0 || master >= cams.length) { master = 0; }

    var cutAns = prompt("Corte automático: segundos promedio por plano\n(0 = no cortar, solo apilar y sincronizar)", "4");
    if (cutAns === null) { return; }
    var shotLen = parseFloat(cutAns);
    if (isNaN(shotLen) || shotLen < 0) { shotLen = 0; }

    // ------------------------------------------------------- calcular offsets
    var offsets = [];
    var minStart = null;
    for (var i = 0; i < cams.length; i++) {
        var st = syncByTC ? ticksToSec(cams[i].startTime().ticks) : 0;
        offsets.push(st);
        if (minStart === null || st < minStart) { minStart = st; }
    }
    for (i = 0; i < offsets.length; i++) { offsets[i] -= minStart; }

    var maxOff = 0;
    for (i = 0; i < offsets.length; i++) { if (offsets[i] > maxOff) { maxOff = offsets[i]; } }
    if (maxOff > 3 * 3600) {
        if (!confirm("Los timecodes difieren más de 3 horas (" + Math.round(maxOff / 60) +
                     " min). Probablemente no comparten timecode.\n¿Continuar de todos modos?")) { return; }
    }

    // ------------------------------------------------------- crear secuencia
    var seq = app.project.createNewSequenceFromClips(seqName, [cams[0]], app.project.getInsertionBin());
    if (!seq) { alert("No se pudo crear la secuencia."); return; }
    app.project.activeSequence = seq;

    // vaciar lo que createNewSequenceFromClips puso
    function clearTracks(tracks) {
        for (var t = 0; t < tracks.numTracks; t++) {
            var clips = tracks[t].clips;
            for (var k = clips.numItems - 1; k >= 0; k--) { clips[k].remove(0, 0); }
        }
    }
    clearTracks(seq.videoTracks);
    clearTracks(seq.audioTracks);

    // asegurar suficientes pistas
    var qeSeq = qe.project.getActiveSequence();
    var needV = cams.length - seq.videoTracks.numTracks;
    var needA = cams.length - seq.audioTracks.numTracks;
    if (needV > 0) { qeSeq.addTracks(needV, seq.videoTracks.numTracks, 0); }
    if (needA > 0) { qeSeq.addTracks(0, 0, needA, 1, seq.audioTracks.numTracks); }

    // --------------------------------------------- colocar cada cámara en su pista
    for (i = 0; i < cams.length; i++) {
        seq.videoTracks[i].overwriteClip(cams[i], offsets[i]);
    }

    // solo el audio de la cámara maestra queda sonando
    for (i = 0; i < seq.audioTracks.numTracks; i++) {
        seq.audioTracks[i].setMute(i === master ? 0 : 1);
    }

    // ------------------------------------------------------ corte automático
    if (shotLen > 0) {
        var fps = TICKS_PER_SECOND / parseFloat(seq.timebase);
        var zero = ticksToSec(seq.zeroPoint);
        var endSec = ticksToSec(seq.end);

        // puntos de corte con variación de ±35 %
        var cuts = [];
        var t0 = 0;
        while (true) {
            t0 += shotLen * (0.65 + Math.random() * 0.7);
            if (t0 >= endSec - 0.5) { break; }
            cuts.push(t0);
        }

        // cortar todas las pistas de video en cada punto
        for (var v = 0; v < cams.length; v++) {
            var qTrack = qeSeq.getVideoTrackAt(v);
            for (var ci = 0; ci < cuts.length; ci++) {
                qTrack.razor(secToTimecode(cuts[ci] + zero, fps));
            }
        }

        var bounds = [0].concat(cuts).concat([endSec]);

        function segmentOf(sec) {
            for (var b = 0; b < bounds.length - 1; b++) {
                if (sec >= bounds[b] && sec < bounds[b + 1]) { return b; }
            }
            return bounds.length - 2;
        }

        function camCovers(camIdx, sec) {
            var clips = seq.videoTracks[camIdx].clips;
            for (var k = 0; k < clips.numItems; k++) {
                if (sec >= ticksToSec(clips[k].start.ticks) && sec < ticksToSec(clips[k].end.ticks)) { return true; }
            }
            return false;
        }

        // elegir cámara por segmento (distinta a la anterior y con material)
        var chosen = [];
        var prev = -1;
        for (var sg = 0; sg < bounds.length - 1; sg++) {
            var mid = (bounds[sg] + bounds[sg + 1]) / 2;
            var options = [];
            for (var cc = 0; cc < cams.length; cc++) {
                if (cc !== prev && camCovers(cc, mid)) { options.push(cc); }
            }
            if (options.length === 0 && prev >= 0 && camCovers(prev, mid)) { options.push(prev); }
            var pick = options.length ? options[randInt(options.length)] : 0;
            chosen.push(pick);
            prev = pick;
        }

        // habilitar solo la cámara elegida en cada segmento
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
          (shotLen > 0 ? "Corte automático aplicado. Reactiva cualquier clip con Shift+E para cambiar de plano."
                       : "Para editar en vivo: selecciona todo > Anidar > Multicámara > Habilitar."));
})();
