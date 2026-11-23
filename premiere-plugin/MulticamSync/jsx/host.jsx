// Parte de Premiere (ExtendScript) del panel Multicam Sync.
// MC_getSelection() -> lista de clips seleccionados (JSON)
// MC_build(json)    -> crea la secuencia multicámara sincronizada

var MC_TICKS = 254016000000;

function MC_str(s) {
    s = String(s);
    var out = '"';
    for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i), code = s.charCodeAt(i);
        if (ch === '"' || ch === '\\') { out += '\\' + ch; }
        else if (code < 32) { out += '\\u' + ('0000' + code.toString(16)).slice(-4); }
        else { out += ch; }
    }
    return out + '"';
}

function MC_getSelection() {
    try {
        if (!app.project) { return '{"error":"Abre un proyecto primero."}'; }
        var sel = app.getCurrentProjectViewSelection ? app.getCurrentProjectViewSelection() : null;
        var parts = [];
        if (sel) {
            for (var i = 0; i < sel.length; i++) {
                var it = sel[i];
                if (!it || it.type !== ProjectItemType.CLIP) { continue; }
                var p = it.getMediaPath ? it.getMediaPath() : '';
                if (!p) { continue; }
                parts.push('{"name":' + MC_str(it.name) + ',"path":' + MC_str(p) + ',"nodeId":' + MC_str(it.nodeId) + '}');
            }
        }
        return '{"clips":[' + parts.join(',') + ']}';
    } catch (e) {
        return '{"error":' + MC_str(e.toString()) + '}';
    }
}

function MC_findNode(item, nodeId) {
    for (var i = 0; i < item.children.numItems; i++) {
        var ch = item.children[i];
        if (ch.nodeId === nodeId) { return ch; }
        if (ch.type === ProjectItemType.BIN) {
            var r = MC_findNode(ch, nodeId);
            if (r) { return r; }
        }
    }
    return null;
}

function MC_sec(t) { return parseFloat(t) / MC_TICKS; }
function MC_pad(n) { return (n < 10 ? '0' : '') + n; }
function MC_tc(sec, fps, df) {
    var fpsInt = Math.round(fps);
    var f = Math.round(sec * fps);
    var sep = ':';
    if (df) {
        // timecode drop-frame (29,97 / 59,94 DF)
        var drop = Math.round(fps * 0.066666);
        var per10 = Math.round(fps * 600);
        var perMin = fpsInt * 60 - drop;
        var d = Math.floor(f / per10), m = f % per10;
        f += 9 * drop * d + (m > drop ? drop * Math.floor((m - drop) / perMin) : 0);
        sep = ';';
    }
    var ts = Math.floor(f / fpsInt);
    return MC_pad(Math.floor(ts / 3600)) + ':' + MC_pad(Math.floor(ts / 60) % 60) + ':' +
           MC_pad(ts % 60) + sep + MC_pad(f % fpsInt);
}

// data = {name, shotLen, clips:[{nodeId, name, offset, master}]}
function MC_build(json) {
    try {
        var data = eval('(' + json + ')');
        app.enableQE();
        var cams = [], offsets = [], master = 0, i;
        for (i = 0; i < data.clips.length; i++) {
            var pi = MC_findNode(app.project.rootItem, data.clips[i].nodeId);
            if (!pi) { return 'ERROR|No encuentro en el proyecto: ' + data.clips[i].name; }
            if (data.clips[i].master) { master = cams.length; }
            cams.push(pi);
            offsets.push(parseFloat(data.clips[i].offset));
        }
        if (cams.length < 2) { return 'ERROR|Se necesitan al menos 2 cámaras sincronizadas.'; }

        // formato de la secuencia: primera cámara con video
        var seed = cams[master];
        var audioExt = /\.(wav|m4a|mp3|aif|aiff)$/i;
        if (audioExt.test(seed.name)) {
            for (i = 0; i < cams.length; i++) { if (!audioExt.test(cams[i].name)) { seed = cams[i]; break; } }
        }
        var seq = app.project.createNewSequenceFromClips(data.name, [seed], app.project.getInsertionBin());
        if (!seq) { return 'ERROR|No se pudo crear la secuencia.'; }
        app.project.activeSequence = seq;

        var clearTracks = function (tracks) {
            for (var t = 0; t < tracks.numTracks; t++) {
                var cl = tracks[t].clips;
                for (var k = cl.numItems - 1; k >= 0; k--) { cl[k].remove(0, 0); }
            }
        };
        clearTracks(seq.videoTracks);
        clearTracks(seq.audioTracks);

        var qeSeq = qe.project.getActiveSequence();
        var needV = cams.length - seq.videoTracks.numTracks;
        var needA = cams.length - seq.audioTracks.numTracks;
        if (needV > 0) { qeSeq.addTracks(needV, seq.videoTracks.numTracks, 0); }
        if (needA > 0) { qeSeq.addTracks(0, 0, needA, 1, seq.audioTracks.numTracks); }

        for (i = 0; i < cams.length; i++) { seq.videoTracks[i].overwriteClip(cams[i], offsets[i]); }
        for (i = 0; i < seq.audioTracks.numTracks; i++) { seq.audioTracks[i].setMute(i === master ? 0 : 1); }

        var shotLen = parseFloat(data.shotLen) || 0;
        var nCuts = 0;
        if (shotLen > 0) {
            var fps = MC_TICKS / parseFloat(seq.timebase);
            var zero = MC_sec(seq.zeroPoint);
            var endSec = MC_sec(seq.end);
            var df = false;
            try {
                var vf = seq.getSettings().videoDisplayFormat;
                df = (vf === 102 || vf === 106);
            } catch (eDf) { df = false; }
            var cuts = [], chosen = [], v, ci, k;

            var covers = function (ci2, s) {
                var cl = seq.videoTracks[ci2].clips;
                for (var q = 0; q < cl.numItems; q++) {
                    if (s >= MC_sec(cl[q].start.ticks) && s < MC_sec(cl[q].end.ticks)) { return true; }
                }
                return false;
            };

            if (data.cuts && data.segCams) {
                cuts = data.cuts;                 // ponche planificado en el panel
                chosen = data.segCams;
            } else {
                var t0 = 0;
                while (true) {
                    t0 += shotLen * (0.65 + Math.random() * 0.7);
                    if (t0 >= endSec - 0.5) { break; }
                    cuts.push(t0);
                }
            }
            var bounds = [0].concat(cuts).concat([endSec]);

            // si falta la cámara elegida en un tramo, usar otra que tenga imagen
            var prev = -1;
            for (var sg = 0; sg < bounds.length - 1; sg++) {
                var mid = (bounds[sg] + bounds[sg + 1]) / 2;
                var pick = (sg < chosen.length) ? chosen[sg] : -1;
                if (pick < 0 || pick >= cams.length || !covers(pick, mid)) {
                    var opts = [];
                    for (var cc = 0; cc < cams.length; cc++) { if (cc !== prev && covers(cc, mid)) { opts.push(cc); } }
                    if (!opts.length && prev >= 0 && covers(prev, mid)) { opts.push(prev); }
                    pick = opts.length ? opts[Math.floor(Math.random() * opts.length)] : master;
                }
                chosen[sg] = pick;
                prev = pick;
            }

            for (v = 0; v < cams.length; v++) {
                var qTrack = qeSeq.getVideoTrackAt(v);
                for (ci = 0; ci < cuts.length; ci++) { qTrack.razor(MC_tc(cuts[ci] + zero, fps, df)); }
            }
            nCuts = cuts.length;

            var segmentOf = function (s) {
                for (var b = 0; b < bounds.length - 1; b++) { if (s >= bounds[b] && s < bounds[b + 1]) { return b; } }
                return bounds.length - 2;
            };
            for (v = 0; v < cams.length; v++) {
                var vc = seq.videoTracks[v].clips;
                for (k = 0; k < vc.numItems; k++) {
                    var m = (MC_sec(vc[k].start.ticks) + MC_sec(vc[k].end.ticks)) / 2;
                    vc[k].disabled = (chosen[segmentOf(m)] !== v);
                }
            }
        }
        return 'OK|Secuencia "' + data.name + '" creada con ' + cams.length + ' cámaras' +
               (nCuts ? ' y ' + (nCuts + 1) + ' planos ponchados.' : '.');
    } catch (e) {
        return 'ERROR|' + e.toString() + (e.line ? ' (línea ' + e.line + ')' : '');
    }
}

// ---------------------------------------------------------------- revisión
// Info de la secuencia activa: nombres de las cámaras (una por pista de video)
function MC_seqInfo() {
    try {
        var seq = app.project.activeSequence;
        if (!seq) { return '{"error":"No hay secuencia abierta."}'; }
        var names = [];
        for (var v = 0; v < seq.videoTracks.numTracks; v++) {
            var cl = seq.videoTracks[v].clips;
            names.push(cl.numItems ? MC_str(cl[0].name) : '""');
        }
        return '{"names":[' + names.join(',') + ']}';
    } catch (e) {
        return '{"error":' + MC_str(e.toString()) + '}';
    }
}

// Pone en pantalla la cámara (pista) cam en el tramo donde está el cabezal
function MC_switchAt(cam) {
    try {
        var seq = app.project.activeSequence;
        if (!seq) { return 'ERROR|No hay secuencia abierta.'; }
        var t = MC_sec(seq.getPlayerPosition().ticks);
        if (cam >= seq.videoTracks.numTracks) { return 'ERROR|La secuencia no tiene la cámara ' + (cam + 1) + '.'; }
        var found = null, v, k, cl;
        cl = seq.videoTracks[cam].clips;
        for (k = 0; k < cl.numItems; k++) {
            if (t >= MC_sec(cl[k].start.ticks) && t < MC_sec(cl[k].end.ticks)) { found = cl[k]; break; }
        }
        if (!found) { return 'ERROR|La cámara ' + (cam + 1) + ' no tiene imagen en este punto.'; }
        var a = MC_sec(found.start.ticks), b = MC_sec(found.end.ticks), mid = (a + b) / 2;
        // si otra cámara tiene un tramo más largo, cortarla en los bordes para no dejar huecos negros
        var fps = MC_TICKS / parseFloat(seq.timebase), df = false, qeSeq = null;
        try { var vf = seq.getSettings().videoDisplayFormat; df = (vf === 102 || vf === 106); } catch (e1) { df = false; }
        var eps = 0.5 / fps;
        for (v = 0; v < seq.videoTracks.numTracks; v++) {
            if (v === cam) { continue; }
            cl = seq.videoTracks[v].clips;
            for (k = 0; k < cl.numItems; k++) {
                var s0 = MC_sec(cl[k].start.ticks), s1 = MC_sec(cl[k].end.ticks);
                if (s0 < b && s1 > a && (s0 < a - eps || s1 > b + eps)) {
                    if (!qeSeq) { app.enableQE(); qeSeq = qe.project.getActiveSequence(); }
                    var zero = MC_sec(seq.zeroPoint);
                    if (s0 < a - eps) { qeSeq.getVideoTrackAt(v).razor(MC_tc(a + zero, fps, df)); }
                    if (s1 > b + eps) { qeSeq.getVideoTrackAt(v).razor(MC_tc(b + zero, fps, df)); }
                    break;
                }
            }
        }
        for (v = 0; v < seq.videoTracks.numTracks; v++) {
            cl = seq.videoTracks[v].clips;
            for (k = 0; k < cl.numItems; k++) {
                var c0 = MC_sec(cl[k].start.ticks), c1 = MC_sec(cl[k].end.ticks);
                if (mid >= c0 && mid < c1) { cl[k].disabled = (v !== cam); }
            }
        }
        return 'OK|Cámara ' + (cam + 1) + ' en ' + a.toFixed(1) + '–' + b.toFixed(1) + ' s.';
    } catch (e) {
        return 'ERROR|' + e.toString();
    }
}

// Corta todas las cámaras donde está el cabezal
function MC_cutHere() {
    try {
        app.enableQE();
        var seq = app.project.activeSequence;
        if (!seq) { return 'ERROR|No hay secuencia abierta.'; }
        var qeSeq = qe.project.getActiveSequence();
        var fps = MC_TICKS / parseFloat(seq.timebase);
        var df = false;
        try { var vf = seq.getSettings().videoDisplayFormat; df = (vf === 102 || vf === 106); } catch (e1) { df = false; }
        var t = MC_sec(seq.getPlayerPosition().ticks);
        var tc = MC_tc(t, fps, df);
        for (var v = 0; v < seq.videoTracks.numTracks; v++) { qeSeq.getVideoTrackAt(v).razor(tc); }
        return 'OK|Corte en ' + tc + '. Ahora elige la cámara para el tramo nuevo.';
    } catch (e) {
        return 'ERROR|' + e.toString();
    }
}
