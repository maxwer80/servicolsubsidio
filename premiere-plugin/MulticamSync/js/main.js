/* Lógica del panel: une la interfaz, el motor de audio y Premiere. */
(function () {
    'use strict';

    var clips = [];
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

    function render() {
        var ul = $('list');
        ul.innerHTML = '';
        if (!clips.length) {
            ul.innerHTML = '<li class="empty">No hay clips. Selecciona al menos 2 en el panel Proyecto.</li>';
        }
        clips.forEach(function (c, i) {
            var li = document.createElement('li');
            var r = document.createElement('input');
            r.type = 'radio'; r.name = 'master'; r.id = 'm' + i; r.value = i; r.checked = (i === 0);
            var l = document.createElement('label');
            l.htmlFor = 'm' + i; l.textContent = c.name; l.title = c.path;
            li.appendChild(r); li.appendChild(l);
            ul.appendChild(li);
        });
        $('go').disabled = clips.length < 2;
    }

    $('load').addEventListener('click', function () {
        evalScript('MC_getSelection()').then(function (res) {
            var data;
            try { data = JSON.parse(res); } catch (e) { log('Error leyendo la selección: ' + res); return; }
            if (data.error) { log(data.error); return; }
            clips = data.clips.sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
            render();
            log(clips.length + ' clip(s) cargados.');
        });
    });

    $('go').addEventListener('click', function () {
        var checked = document.querySelector('input[name=master]:checked');
        var masterIndex = checked ? parseInt(checked.value, 10) : 0;
        var name = $('name').value.trim() || 'MULTICAM';
        var shot = parseFloat($('shot').value) || 0;
        $('go').disabled = true; $('load').disabled = true;
        $('log').textContent = '';

        window.MulticamSync.syncClips(clips, masterIndex, log).then(function (res) {
            if (res.clips.length < 2) { throw new Error('No se pudo sincronizar ninguna cámara con la maestra.'); }
            if (res.dropped.length) {
                log('\nQuedaron fuera (no coinciden con la maestra): ' + res.dropped.join(', '));
            }
            log('\nCreando secuencia en Premiere...');
            var payload = { name: name, shotLen: shot, clips: res.clips };
            if (shot > 0) {
                var plan = window.MulticamSync.planCuts(res.clips, res.levels, shot);
                payload.cuts = plan.cuts;
                payload.segCams = plan.segCams;
                log('Ponche: ' + (plan.cuts.length + 1) + ' planos (cortes en pausas, prioridad a quien habla).');
            }
            return evalScript('MC_build(' + JSON.stringify(JSON.stringify(payload)) + ')');
        }).then(function (out) {
            var parts = String(out).split('|');
            log(parts[0] === 'OK' ? '✔ ' + parts.slice(1).join('|') : '✖ ' + (parts.slice(1).join('|') || out));
        }).catch(function (err) {
            log('✖ ' + err.message);
        }).then(function () {
            $('go').disabled = clips.length < 2; $('load').disabled = false;
        });
    });

    render();
})();
