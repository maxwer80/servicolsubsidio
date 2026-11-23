/*
 * Motor de sincronización por audio (sin dependencias).
 * Lee el audio con afconvert (incluido en macOS) o ffmpeg si está instalado,
 * y calcula el desfase de cada cámara respecto a la maestra.
 * Funciona dentro del panel de Premiere (CEP con Node.js) y en Node normal.
 */
(function (root) {
    'use strict';

    var SR = 8000;          // Hz para el afinado
    var HOP = 40;           // 8000/40 = 200 Hz envolvente (búsqueda gruesa)
    var FINE_WIN = 20;      // segundos de ventana para afinar
    var MARGIN = 0.1;       // segundos de búsqueda alrededor del resultado grueso
    var THRESHOLD = 12;     // confianza mínima

    var nodeRequire = (typeof require === 'function') ? require
        : (root.cep_node && root.cep_node.require);
    var cp = nodeRequire('child_process');
    var fs = nodeRequire('fs');
    var os = nodeRequire('os');
    var path = nodeRequire('path');

    // ------------------------------------------------------------ decodificar
    function findDecoder(extraDirs) {
        var dirs = (extraDirs || []).concat(['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin']);
        var i, p;
        for (i = 0; i < dirs.length; i++) {
            p = path.join(dirs[i], 'ffmpeg');
            if (fs.existsSync(p)) { return { kind: 'ffmpeg', bin: p }; }
        }
        if (fs.existsSync('/usr/bin/afconvert')) { return { kind: 'afconvert', bin: '/usr/bin/afconvert' }; }
        return null;
    }

    function parseWav(buf) {
        if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
            throw new Error('WAV inválido');
        }
        var pos = 12, channels = 1, bits = 16, dataStart = -1, dataLen = 0;
        while (pos + 8 <= buf.length) {
            var id = buf.toString('ascii', pos, pos + 4);
            var size = buf.readUInt32LE(pos + 4);
            if (id === 'fmt ') {
                channels = buf.readUInt16LE(pos + 10);
                bits = buf.readUInt16LE(pos + 22);
            } else if (id === 'data') {
                dataStart = pos + 8;
                dataLen = Math.min(size, buf.length - dataStart);
                break;
            }
            pos += 8 + size + (size % 2);
        }
        if (dataStart < 0 || bits !== 16) { throw new Error('WAV sin datos PCM de 16 bits'); }
        var n = Math.floor(dataLen / (2 * channels));
        var x = new Float32Array(n);
        var mean = 0, i, c, s;
        for (i = 0; i < n; i++) {
            s = 0;
            for (c = 0; c < channels; c++) { s += buf.readInt16LE(dataStart + 2 * (i * channels + c)); }
            x[i] = s / channels;
            mean += x[i];
        }
        mean /= n || 1;
        for (i = 0; i < n; i++) { x[i] -= mean; }
        return x;
    }

    function extractAudio(file, decoder) {
        return new Promise(function (resolve, reject) {
            var out = path.join(os.tmpdir(), 'mcsync_' + Date.now() + '_' + Math.floor(Math.random() * 1e6) + '.wav');
            var args = decoder.kind === 'ffmpeg'
                ? ['-v', 'error', '-y', '-i', file, '-vn', '-ac', '1', '-ar', String(SR), '-acodec', 'pcm_s16le', '-f', 'wav', out]
                : ['-f', 'WAVE', '-d', 'LEI16@' + SR, '-c', '1', file, out];
            cp.execFile(decoder.bin, args, { maxBuffer: 1 << 20 }, function (err, stdout, stderr) {
                if (err || !fs.existsSync(out)) {
                    try { fs.unlinkSync(out); } catch (e) { /* nada */ }
                    var ext = path.extname(file).toLowerCase();
                    var hint = (decoder.kind === 'afconvert' && (ext === '.mxf' || ext === '.mts' || ext === '.m2ts'))
                        ? ' (este formato necesita ffmpeg)' : '';
                    reject(new Error('no se pudo leer el audio' + hint + ': ' + String(stderr || err).slice(0, 200)));
                    return;
                }
                try {
                    var x = parseWav(fs.readFileSync(out));
                    fs.unlinkSync(out);
                    if (x.length < SR) { throw new Error('sin audio o dura menos de 1 s'); }
                    resolve(x);
                } catch (e) {
                    try { fs.unlinkSync(out); } catch (e2) { /* nada */ }
                    reject(e);
                }
            });
        });
    }

    // ------------------------------------------------------------------- FFT
    function fft(re, im, inverse) {
        var n = re.length, i, j, k, len, half, ang, wr, wi, cr, ci, tr, ti, ur, ui, tmp, step;
        for (i = 1, j = 0; i < n; i++) {
            var bit = n >> 1;
            for (; j & bit; bit >>= 1) { j ^= bit; }
            j ^= bit;
            if (i < j) {
                tmp = re[i]; re[i] = re[j]; re[j] = tmp;
                tmp = im[i]; im[i] = im[j]; im[j] = tmp;
            }
        }
        for (len = 2; len <= n; len <<= 1) {
            half = len >> 1;
            ang = (inverse ? 2 : -2) * Math.PI / len;
            wr = Math.cos(ang); wi = Math.sin(ang);
            for (i = 0; i < n; i += len) {
                cr = 1; ci = 0;
                for (k = 0; k < half; k++) {
                    ur = re[i + k]; ui = im[i + k];
                    tr = re[i + k + half] * cr - im[i + k + half] * ci;
                    ti = re[i + k + half] * ci + im[i + k + half] * cr;
                    re[i + k] = ur + tr; im[i + k] = ui + ti;
                    re[i + k + half] = ur - tr; im[i + k + half] = ui - ti;
                    step = cr * wr - ci * wi;
                    ci = cr * wi + ci * wr;
                    cr = step;
                }
            }
        }
        if (inverse) { for (i = 0; i < n; i++) { re[i] /= n; im[i] /= n; } }
    }

    // c[lag] = sum a[t]·b[t-lag]; devuelve función lag -> valor
    function correlate(a, b, phat) {
        var need = a.length + b.length - 1, n = 1;
        while (n < need) { n <<= 1; }
        var ar = new Float64Array(n), ai = new Float64Array(n);
        var br = new Float64Array(n), bi = new Float64Array(n);
        ar.set(a); br.set(b);
        fft(ar, ai, false); fft(br, bi, false);
        for (var i = 0; i < n; i++) {
            var r = ar[i] * br[i] + ai[i] * bi[i];
            var im = ai[i] * br[i] - ar[i] * bi[i];
            if (phat) { var m = Math.sqrt(r * r + im * im) + 1e-9; r /= m; im /= m; }
            ar[i] = r; ai[i] = im;
        }
        fft(ar, ai, true);
        return function (lag) { return lag >= 0 ? ar[lag] : ar[n + lag]; };
    }

    function envelope(x) {
        var n = Math.floor(x.length / HOP), e = new Float64Array(n), i, k, s, v;
        for (i = 0; i < n; i++) {
            s = 0;
            for (k = 0; k < HOP; k++) { v = x[i * HOP + k]; s += v * v; }
            e[i] = Math.log(Math.sqrt(s / HOP + 1e-6));
        }
        var d = new Float64Array(Math.max(0, n - 1)), mean = 0;
        for (i = 0; i < d.length; i++) { d[i] = e[i + 1] - e[i]; mean += d[i]; }
        mean /= d.length || 1;
        for (i = 0; i < d.length; i++) { d[i] -= mean; }
        return d;
    }

    // Segundos desde el inicio de ref hasta el inicio de cam (puede ser negativo)
    function offset(ref, cam) {
        // 1) grueso: envolvente de cambios de volumen
        var ea = envelope(ref), eb = envelope(cam);
        var c = correlate(ea, eb, false);
        var minOverlap = Math.min(ea.length, eb.length) * 0.1;
        var best = -Infinity, bestLag = 0, lag, ov, v;
        for (lag = -(eb.length - 1); lag < ea.length; lag++) {
            ov = Math.min(ea.length, lag + eb.length) - Math.max(0, lag);
            if (ov <= minOverlap) { continue; }
            v = c(lag) / ov;
            if (v > best) { best = v; bestLag = lag; }
        }
        var coarse = bestLag * HOP / SR;

        // 2) fino: GCC-PHAT en una ventana del tramo común
        var start = Math.max(0, coarse);
        var end = Math.min(ref.length / SR, coarse + cam.length / SR);
        var mid = (start + end) / 2;
        var halfW = Math.min(FINE_WIN, end - start) / 2;
        if (halfW < 1) { return { offset: coarse, confidence: 0 }; }
        var b0 = Math.max(0, Math.floor((mid - coarse - halfW) * SR));
        var b = cam.subarray(b0, b0 + Math.floor(2 * halfW * SR));
        var a0 = Math.floor((mid - halfW - MARGIN) * SR);
        var aStart = Math.max(0, a0);
        var a = ref.subarray(aStart, a0 + Math.floor((2 * halfW + 2 * MARGIN) * SR));
        var c2 = correlate(a, b, true);

        // desviación típica sobre todos los desfases posibles
        var sum = 0, sum2 = 0, count = 0;
        for (lag = -(b.length - 1); lag < a.length; lag++) { v = c2(lag); sum += v; sum2 += v * v; count++; }
        var std = Math.sqrt(Math.max(0, sum2 / count - (sum / count) * (sum / count)));

        var expected = Math.round(coarse * SR) + b0 - aStart;
        var range = Math.round(MARGIN * SR), bestJ = expected, bestV = -Infinity;
        for (lag = expected - range; lag <= expected + range; lag++) {
            if (lag <= -b.length || lag >= a.length) { continue; }
            v = c2(lag);
            if (v > bestV) { bestV = v; bestJ = lag; }
        }
        if (bestV === -Infinity) { return { offset: coarse, confidence: 0 }; }
        return { offset: (bestJ + aStart - b0) / SR, confidence: bestV / (std + 1e-12) };
    }

    /**
     * clips: [{name, path, ...}]  masterIndex: índice de la maestra
     * log: función(texto)   -> Promise<{clips: [...con offset], dropped: [nombres]}>
     */
    function syncClips(clips, masterIndex, log, extraDirs) {
        log = log || function () {};
        var decoder = findDecoder(extraDirs);
        if (!decoder) { return Promise.reject(new Error('No encontré afconvert ni ffmpeg.')); }
        log('Lector de audio: ' + decoder.kind);
        var results = {}, dropped = [], ref;
        var master = clips[masterIndex];
        log('Leyendo audio de la maestra: ' + master.name + ' ...');
        return extractAudio(master.path, decoder).then(function (x) {
            ref = x;
            results[masterIndex] = 0;
            var chain = Promise.resolve();
            clips.forEach(function (clip, idx) {
                if (idx === masterIndex) { return; }
                chain = chain.then(function () {
                    log('Sincronizando ' + clip.name + ' ...');
                    return extractAudio(clip.path, decoder).then(function (cam) {
                        var r = offset(ref, cam);
                        if (r.confidence >= THRESHOLD) {
                            results[idx] = r.offset;
                            log('   ' + (r.offset >= 0 ? '+' : '') + r.offset.toFixed(3) + ' s  (confianza ' + Math.round(r.confidence) + ')');
                        } else {
                            dropped.push(clip.name);
                            log('   NO coincide con la maestra (confianza ' + Math.round(r.confidence) + '): se omite');
                        }
                    }, function (err) {
                        dropped.push(clip.name);
                        log('   ERROR: ' + err.message);
                    });
                });
            });
            return chain;
        }).then(function () {
            var min = Infinity, k;
            for (k in results) { if (results[k] < min) { min = results[k]; } }
            var out = [];
            clips.forEach(function (clip, idx) {
                if (results.hasOwnProperty(idx)) {
                    var o = {};
                    for (var key in clip) { o[key] = clip[key]; }
                    o.offset = Math.round((results[idx] - min) * 10000) / 10000;
                    o.master = (idx === masterIndex);
                    out.push(o);
                }
            });
            return { clips: out, dropped: dropped };
        });
    }

    var api = { syncClips: syncClips, offset: offset, extractAudio: extractAudio, findDecoder: findDecoder };
    if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
    root.MulticamSync = api;
})(typeof window !== 'undefined' ? window : this);
