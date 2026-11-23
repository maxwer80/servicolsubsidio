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
            renderChannels();
            renderMapping();
            log('\nListo. Revisa el paso 3 y pulsa "Crear secuencia ponchada".');
        }).catch(function (err) {
            log('✖ ' + err.message);
        }).then(function () {
            $('analyze').disabled = clips.length < 2; $('load').disabled = false;
        });
    });

    function chanLabel(c) {
        return c.name + ' · canal ' + (c.ch + 1);
    }

    function renderChannels() {
        var tb = $('chanTable');
        tb.innerHTML = '';
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
        analysis.channels.forEach(function (c) {
            var key = c.clip + ':' + c.ch;
            opt(src, key, chanLabel(c) + ' (' + c.snr + ' dB)', key === srcKey);
        });
        videoClips().forEach(function (i) { opt(cam, i, camLabel(i), i === camIdx); });
        var l1 = document.createElement('span'); l1.className = 'lbl'; l1.textContent = 'Voz';
        var l2 = document.createElement('span'); l2.className = 'lbl'; l2.textContent = '→ Cámara';
        var del = document.createElement('button'); del.textContent = '×'; del.title = 'Quitar';
        del.addEventListener('click', function () { row.parentNode.removeChild(row); });
        row.appendChild(l1); row.appendChild(src); row.appendChild(del);
        row.appendChild(l2); row.appendChild(cam);
        $('voices').appendChild(row);
    }

    function renderMapping() {
        $('voices').innerHTML = '';
        var vids = videoClips();
        // por defecto: los 2 canales más limpios -> las cámaras que no tienen el audio limpio
        var top = analysis.channels.slice(0, 2);
        var cleanClip = top.length ? top[0].clip : 0;
        var others = vids.filter(function (i) { return i !== cleanClip; });
        top.forEach(function (c, n) {
            addVoiceRow(c.clip + ':' + c.ch, others[n] !== undefined ? others[n] : vids[n]);
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

        // el audio que se escucha = el clip del canal de voz más limpio
        var cleanClip = analysis.channels.length ? analysis.channels[0].clip : 0;
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
