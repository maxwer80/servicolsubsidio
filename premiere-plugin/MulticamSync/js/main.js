/* Lógica del panel: une la interfaz, el motor de audio y Premiere. */
(function () {
    'use strict';

    var AUDIO_ONLY = /\.(wav|m4a|mp3|aif|aiff)$/i;
    var clips = [];        // seleccionados en el proyecto
    var analysis = null;   // resultado de syncClips
    var $ = function (id) { return document.getElementById(id); };

    function log(msg) {
        var el = $('log');
        el.textContent += msg + '\n';
        el.scrollTop = el.scrollHeight;
    }

    function evalScript(script) {
        return new Promise(function (resolve) {
            if (!window.__adobe_cep__) { resolve('ERROR|Este panel solo funciona dentro de Premiere Pro.'); return; }
            window.__adobe_cep__.evalScript(script, resolve);
        });
    }

    function result(out) {
        var p = String(out).split('|');
        log(p[0] === 'OK' ? '✔ ' + p.slice(1).join('|') : '✖ ' + (p.slice(1).join('|') || out));
        return p[0] === 'OK';
    }

    function opt(sel, value, text, selected) {
        var o = document.createElement('option');
        o.value = value; o.textContent = text; o.selected = !!selected;
        sel.appendChild(o);
    }

    // ------------------------------------------------------------ 1 · cámaras
    function renderList() {
        var ul = $('list');
        ul.innerHTML = '';
        if (!clips.length) { ul.innerHTML = '<li class="empty">No hay clips. Selecciona al menos 2 en el panel Proyecto.</li>'; }
        clips.forEach(function (c) {
            var li = document.createElement('li');
            li.textContent = (AUDIO_ONLY.test(c.name) ? '🎙 ' : '🎥 ') + c.name;
            li.title = c.path;
            ul.appendChild(li);
        });
        $('analyze').disabled = clips.length < 2;
    }

    $('load').addEventListener('click', function () {
        evalScript('MC_getSelection()').then(function (res) {
            var data;
            try { data = JSON.parse(res); } catch (e) { log('Error leyendo la selección: ' + res); return; }
            if (data.error) { log(data.error); return; }
            clips = data.clips.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            analysis = null;
            $('chanBox').classList.add('hidden');
            $('mapBox').classList.add('hidden');
            renderList();
            log(clips.length + ' clip(s) cargados.');
        });
    });

    // ------------------------------------------------------- 2 · analizar
    $('analyze').addEventListener('click', function () {
        $('analyze').disabled = true; $('load').disabled = true;
        $('log').textContent = '';
        window.MulticamSync.syncClips(clips, 0, log).then(function (res) {
            if (res.clips.length < 2) { throw new Error('No se pudo sincronizar las cámaras entre sí.'); }
            if (res.dropped.length) { log('\nQuedaron fuera (su audio no coincide): ' + res.dropped.join(', ')); }
            analysis = res;
            analysis.baseChannels = res.chanLevels.map(function (c) { return c.length; });
            renderChannels();
            return identify();
        }).catch(function (err) {
            log('✖ ' + err.message);
        }).then(function () {
            $('analyze').disabled = clips.length < 2; $('load').disabled = false;
        });
    });

    function chanLabel(c) {
        return c.name + ' · canal ' + (c.ch + 1);
    }

    // ------------------------------------------- identificar hablantes
    function voiceType(hz) {
        if (!hz) { return 'voz'; }
        return (hz < 150 ? 'grave' : hz < 185 ? 'media' : 'aguda') + ' ' + hz + ' Hz';
    }

    function identify() {
        var K = Math.max(1, Math.min(6, parseInt($('nspk').value, 10) || 2));
        var cleanClip = parseInt($('cleanSel').value, 10);
        if (isNaN(cleanClip)) { cleanClip = analysis.channels.length ? analysis.channels[0].clip : 0; }
        var clip = analysis.clips[cleanClip];
        // quitar hablantes de un análisis anterior
        analysis.chanLevels.forEach(function (c, i) { c.length = analysis.baseChannels[i]; });
        analysis.speakers = [];
        if (analysis.cleanClip !== cleanClip) { analysis.cleanAudio = null; }
        var getAudio = analysis.cleanAudio ? Promise.resolve(analysis.cleanAudio)
            : (log('\nLeyendo el audio limpio (' + clip.name + ') para identificar voces...'),
               window.MulticamSync.extractAudio(clip.path, window.MulticamSync.findDecoder(), function (p) { log('   leyendo ' + p + ' %'); }));
        return getAudio.then(function (x) {
            analysis.cleanAudio = x;
            analysis.cleanClip = cleanClip;
            log('Identificando ' + K + ' hablante(s)...');
            var last = -1;
            return window.MulticamSync.diarize(x, K, function (p) {
                p = Math.floor(p / 25) * 25; if (p !== last && p < 100) { last = p; log('   analizando voces ' + p + ' %'); }
            });
        }).then(function (dz) {
            if (!dz.speakers.length) {
                log('✖ No hay suficiente voz para separar hablantes. Puedes usar los canales directamente.');
            }
            var base = analysis.baseChannels[cleanClip];
            dz.speakers.forEach(function (sp, k) {
                analysis.chanLevels[cleanClip].push(dz.levels[k]);
                analysis.speakers.push({
                    key: cleanClip + ':' + (base + k),
                    label: 'Voz ' + 'ABCDEF'.charAt(k) + ' · ' + voiceType(sp.pitch),
                    examples: sp.examples, seconds: sp.seconds
                });
                log('   Voz ' + 'ABCDEF'.charAt(k) + ': ' + voiceType(sp.pitch) + ', habla ' + sp.seconds + ' s');
            });
            renderMapping();
            log('\nListo. Escucha cada hablante con ▶, elige su cámara y pulsa "Crear secuencia ponchada".');
        });
    }

    $('cleanSel').addEventListener('change', function () { if (analysis) { $('rediar').click(); } });
    $('rediar').addEventListener('click', function () {
        if (!analysis) { return; }
        $('rediar').disabled = true;
        identify().catch(function (err) { log('✖ ' + err.message); }).then(function () { $('rediar').disabled = false; });
    });

    // ▶ escuchar un ejemplo de un hablante (4 s)
    var audioCtx = null, playing = null, exampleTurn = {};
    function playExample(key) {
        var sp = (analysis.speakers || []).filter(function (o) { return o.key === key; })[0];
        if (!sp || !sp.examples.length || !analysis.cleanAudio) { log('Solo se pueden escuchar los hablantes identificados.'); return; }
        try {
            if (playing) { playing.stop(); playing = null; }
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            var n = exampleTurn[key] = ((exampleTurn[key] || 0) + 1) % sp.examples.length;
            var x = analysis.cleanAudio, sr = 8000;
            var a = Math.max(0, Math.floor(sp.examples[n] * sr)), len = Math.min(4 * sr, x.length - a);
            var peak = 1;
            for (var i = 0; i < len; i++) { peak = Math.max(peak, Math.abs(x[a + i])); }
            var buf = audioCtx.createBuffer(1, len, sr), ch = buf.getChannelData(0);
            for (i = 0; i < len; i++) { ch[i] = 0.8 * x[a + i] / peak; }
            var src = audioCtx.createBufferSource();
            src.buffer = buf; src.connect(audioCtx.destination); src.start();
            playing = src;
            log('▶ ' + sp.label + ' (ejemplo en ' + Math.floor(sp.examples[n] / 60) + ':' + ('0' + Math.floor(sp.examples[n] % 60)).slice(-2) + ' de ' + analysis.clips[analysis.cleanClip].name + ')');
        } catch (e) { log('No se pudo reproducir: ' + e.message); }
    }

    function renderChannels() {
        var tb = $('chanTable');
        tb.innerHTML = '';
        var sel = $('cleanSel'); sel.innerHTML = '';
        var seen = {};
        analysis.channels.forEach(function (c) {
            if (seen[c.clip]) { return; }
            seen[c.clip] = true;
            opt(sel, c.clip, c.name + (Object.keys(seen).length === 1 ? '  (el más limpio)' : ''), Object.keys(seen).length === 1);
        });
        var best = analysis.channels.length ? analysis.channels[0].snr : 0;
        analysis.channels.forEach(function (c) {
            var tr = document.createElement('tr');
            var clean = c.snr >= Math.max(20, best - 8);
            tr.innerHTML = '<td></td><td class="q"></td><td></td>';
            tr.children[0].textContent = chanLabel(c);
            tr.children[1].textContent = c.snr + ' dB';
            tr.children[2].innerHTML = clean ? '<span class="tag clean">limpio</span>' : '<span class="tag">referencia</span>';
            tb.appendChild(tr);
        });
        $('chanBox').classList.remove('hidden');
    }

    // --------------------------------------------------- 3 · mapa de voces
    function videoClips() {
        var out = [];
        analysis.clips.forEach(function (c, i) { if (!AUDIO_ONLY.test(c.name)) { out.push(i); } });
        return out;
    }

    function camLabel(i) {
        return (videoClips().indexOf(i) + 1) + ' · ' + analysis.clips[i].name;
    }

    function addVoiceRow(srcKey, camIdx) {
        var row = document.createElement('div');
        row.className = 'voice';
        var src = document.createElement('select'), cam = document.createElement('select');
        (analysis.speakers || []).forEach(function (sp) { opt(src, sp.key, sp.label, sp.key === srcKey); });
        analysis.channels.forEach(function (c) {
            var key = c.clip + ':' + c.ch;
            opt(src, key, chanLabel(c) + ' (' + c.snr + ' dB)', key === srcKey);
        });
        videoClips().forEach(function (i) { opt(cam, i, camLabel(i), i === camIdx); });
        cam.className = 'cam';
        var play = document.createElement('button'); play.className = 'play'; play.textContent = '▶'; play.title = 'Escuchar';
        play.addEventListener('click', function () { playExample(src.value); });
        var l1 = document.createElement('span'); l1.className = 'lbl'; l1.textContent = 'Quién';
        var l2 = document.createElement('span'); l2.className = 'lbl'; l2.textContent = '→ Cámara';
        var del = document.createElement('button'); del.textContent = '×'; del.title = 'Quitar';
        del.addEventListener('click', function () { row.parentNode.removeChild(row); });
        row.appendChild(l1); row.appendChild(src); row.appendChild(play); row.appendChild(del);
        row.appendChild(l2); row.appendChild(cam);
        $('voices').appendChild(row);
    }

    function renderMapping() {
        $('voices').innerHTML = '';
        var vids = videoClips();
        // por defecto: los 2 canales más limpios -> las cámaras que no tienen el audio limpio
        var cleanClip = analysis.cleanClip !== undefined ? analysis.cleanClip : (analysis.channels.length ? analysis.channels[0].clip : 0);
        var others = vids.filter(function (i) { return i !== cleanClip; });
        var keys = (analysis.speakers && analysis.speakers.length)
            ? analysis.speakers.map(function (sp) { return sp.key; })
            : analysis.channels.slice(0, 2).map(function (c) { return c.clip + ':' + c.ch; });
        keys.forEach(function (key, n) {
            addVoiceRow(key, others[n] !== undefined ? others[n] : vids[n % vids.length]);
        });
        var wide = $('wide');
        wide.innerHTML = '';
        var wideDefault = vids.indexOf(cleanClip) >= 0 ? cleanClip : vids[0];
        vids.forEach(function (i) { opt(wide, i, camLabel(i), i === wideDefault); });
        opt(wide, -1, '(no cambiar de cámara)', false);
        $('mapBox').classList.remove('hidden');
    }

    $('addVoice').addEventListener('click', function () {
        if (!analysis) { return; }
        var used = {};
        Array.prototype.forEach.call(document.querySelectorAll('#voices .voice'), function (r) {
            used[r.querySelector('select').value] = true;
        });
        var next = analysis.channels.filter(function (c) { return !used[c.clip + ':' + c.ch]; })[0] || analysis.channels[0];
        addVoiceRow(next.clip + ':' + next.ch, videoClips()[0]);
    });

    // ----------------------------------------------------------- 4 · crear
    $('go').addEventListener('click', function () {
        if (!analysis) { return; }
        var voices = [];
        Array.prototype.forEach.call(document.querySelectorAll('#voices .voice'), function (r) {
            var sels = r.querySelectorAll('select');
            var k = sels[0].value.split(':');
            voices.push({ clip: parseInt(k[0], 10), ch: parseInt(k[1], 10), cam: parseInt(sels[1].value, 10) });
        });
        if (!voices.length) { log('✖ Agrega al menos una voz en el paso 3.'); return; }
        var wide = parseInt($('wide').value, 10);
        var shot = parseFloat($('shot').value) || 1.5;
        var name = $('name').value.trim() || 'MULTICAM';

        // el audio que se escucha = el audio limpio elegido
        var cleanClip = analysis.cleanClip !== undefined ? analysis.cleanClip : (analysis.channels.length ? analysis.channels[0].clip : 0);
        var plan = window.MulticamSync.planVoice(analysis.clips, analysis.chanLevels, voices, wide, shot);
        var payloadClips = analysis.clips.map(function (c, i) {
            return { name: c.name, nodeId: c.nodeId, offset: c.offset, master: i === cleanClip };
        });
        var usage = [];
        Object.keys(plan.stats.usage).forEach(function (key) {
            if (key >= 0) { usage.push(analysis.clips[key].name + ' ' + Math.round(plan.stats.usage[key]) + ' s'); }
        });
        log('\nPonche por voz: ' + plan.segCams.length + ' planos (' + usage.join(', ') + ').');
        log('Audio que se escucha: ' + analysis.clips[cleanClip].name);
        log('Creando secuencia en Premiere...');
        $('go').disabled = true;
        var payload = { name: name, shotLen: shot, clips: payloadClips, cuts: plan.cuts, segCams: plan.segCams };
        evalScript('MC_build(' + JSON.stringify(JSON.stringify(payload)) + ')').then(function (out) {
            result(out);
            refreshCams();
            $('go').disabled = false;
        });
    });

    // ----------------------------------------------- 5 · revisar el ponche
    function renderCams(names) {
        var box = $('cams');
        box.innerHTML = '';
        var n = Math.max(3, names.length);
        for (var i = 0; i < n; i++) {
            var b = document.createElement('button');
            b.textContent = 'Cámara ' + (i + 1);
            if (names[i]) { b.title = names[i]; }
            b.addEventListener('click', (function (cam) {
                return function () { evalScript('MC_switchAt(' + cam + ')').then(result); };
            })(i));
            box.appendChild(b);
        }
    }
    function refreshCams() {
        evalScript('MC_seqInfo()').then(function (res) {
            try { var d = JSON.parse(res); renderCams(d.names || []); } catch (e) { renderCams([]); }
        });
    }
    $('cut').addEventListener('click', function () { evalScript('MC_cutHere()').then(result); });

    renderCams([]);
    refreshCams();
    renderList();
})();
