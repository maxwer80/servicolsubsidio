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
        var tools = { ffmpeg: null, afconvert: null, avconvert: null };
        for (var i = 0; i < dirs.length && !tools.ffmpeg; i++) {
            var p = path.join(dirs[i], 'ffmpeg');
            if (fs.existsSync(p)) { tools.ffmpeg = p; }
        }
        if (fs.existsSync('/usr/bin/afconvert')) { tools.afconvert = '/usr/bin/afconvert'; }
        if (fs.existsSync('/usr/bin/avconvert')) { tools.avconvert = '/usr/bin/avconvert'; }
        tools.kind = tools.ffmpeg ? 'ffmpeg' : 'macOS (PCM propio + afconvert + avconvert)';
        return tools;
    }

    function removeMean(x) {
        var mean = 0, i;
        for (i = 0; i < x.length; i++) { mean += x[i]; }
        mean /= x.length || 1;
        for (i = 0; i < x.length; i++) { x[i] -= mean; }
        return x;
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
        var x = new Float32Array(n), i, c, s;
        for (i = 0; i < n; i++) {
            s = 0;
            for (c = 0; c < channels; c++) { s += buf.readInt16LE(dataStart + 2 * (i * channels + c)); }
            x[i] = s / channels;
        }
        return removeMean(x);
    }

    function tmpName(ext) {
        return path.join(os.tmpdir(), 'mcsync_' + Date.now() + '_' + Math.floor(Math.random() * 1e6) + ext);
    }

    function run(bin, args) {
        return new Promise(function (resolve, reject) {
            cp.execFile(bin, args, { maxBuffer: 1 << 22 }, function (err, stdout, stderr) {
                if (err) { reject(new Error(path.basename(bin) + ': ' + String(stderr || err.message).trim().slice(0, 200))); }
                else { resolve(); }
            });
        });
    }

    function toWavThen(bin, args, out) {
        return run(bin, args).then(function () {
            try { return parseWav(fs.readFileSync(out)); }
            finally { try { fs.unlinkSync(out); } catch (e) { /* nada */ } }
        }, function (err) {
            try { fs.unlinkSync(out); } catch (e) { /* nada */ }
            throw err;
        });
    }

    // ---------------- lector propio de audio PCM dentro de .MP4 / .MOV
    // (cámaras Sony XAVC S, Panasonic, Canon, etc. guardan el audio sin comprimir)
    function readMp4Pcm(file) {
        var fd = fs.openSync(file, 'r');
        try {
            var fileSize = fs.fstatSync(fd).size;
            var head = Buffer.alloc(16), pos = 0, moov = null;
            while (pos + 8 <= fileSize) {
                fs.readSync(fd, head, 0, 16, pos);
                var size = head.readUInt32BE(0), type = head.toString('latin1', 4, 8), hdr = 8;
                if (size === 1) { size = head.readUInt32BE(8) * 4294967296 + head.readUInt32BE(12); hdr = 16; }
                else if (size === 0) { size = fileSize - pos; }
                if (size < 8) { break; }
                if (type === 'moov') {
                    moov = Buffer.alloc(size - hdr);
                    fs.readSync(fd, moov, 0, size - hdr, pos + hdr);
                    break;
                }
                pos += size;
            }
            if (!moov) { throw new Error('NO_MP4'); }

            var boxes = function (buf, s, e) {
                var out = [], p = s;
                while (p + 8 <= e) {
                    var sz = buf.readUInt32BE(p), t = buf.toString('latin1', p + 4, p + 8), h = 8;
                    if (sz === 1) { sz = buf.readUInt32BE(p + 8) * 4294967296 + buf.readUInt32BE(p + 12); h = 16; }
                    else if (sz === 0) { sz = e - p; }
                    if (sz < h || p + sz > e) { break; }
                    out.push({ type: t, start: p + h, end: p + sz });
                    p += sz;
                }
                return out;
            };
            var child = function (buf, box, type) {
                var list = boxes(buf, box.start, box.end);
                for (var i = 0; i < list.length; i++) { if (list[i].type === type) { return list[i]; } }
                return null;
            };

            var traks = boxes(moov, 0, moov.length).filter(function (b) { return b.type === 'trak'; });
            var stbl = null;
            for (var ti = 0; ti < traks.length && !stbl; ti++) {
                var mdia = child(moov, traks[ti], 'mdia');
                var hdlr = mdia && child(moov, mdia, 'hdlr');
                if (hdlr && moov.toString('latin1', hdlr.start + 8, hdlr.start + 12) === 'soun') {
                    var minf = child(moov, mdia, 'minf');
                    stbl = minf && child(moov, minf, 'stbl');
                }
            }
            if (!stbl) { throw new Error('NO_PCM'); }

            // --- descripción del audio
            var stsd = child(moov, stbl, 'stsd');
            var e0 = stsd.start + 8;                       // primera entrada
            var eEnd = e0 + moov.readUInt32BE(e0);
            var fmt = moov.toString('latin1', e0 + 4, e0 + 8);
            var d = e0 + 16;                               // tras reserved + dref
            var ver = moov.readUInt16BE(d);
            var channels = moov.readUInt16BE(d + 8);
            var bits = moov.readUInt16BE(d + 10);
            var rate = moov.readUInt32BE(d + 16) / 65536;
            var bigEndian = true, isFloat = false, signed = true, ext = d + 20;
            if (ver === 1) { ext = d + 36; }
            if (ver === 2) {
                rate = moov.readDoubleBE(d + 24);
                channels = moov.readUInt32BE(d + 32);
                bits = moov.readUInt32BE(d + 40);
                var flags = moov.readUInt32BE(d + 44);
                isFloat = !!(flags & 1); bigEndian = !!(flags & 2); signed = isFloat || !!(flags & 4);
                ext = d + 56;
            }
            if (fmt === 'sowt') { bigEndian = false; }
            else if (fmt === 'twos') { bigEndian = true; signed = bits > 8; }
            else if (fmt === 'in24') { bits = 24; }
            else if (fmt === 'in32') { bits = 32; }
            else if (fmt === 'fl32') { bits = 32; isFloat = true; }
            else if (fmt === 'ipcm' || fmt === 'fpcm') { isFloat = (fmt === 'fpcm'); }
            else if (fmt !== 'lpcm') { throw new Error('NO_PCM'); }
            // cajas extra: 'enda' (orden de bytes) y 'pcmC' (ISO)
            for (var q = ext; q + 8 <= eEnd; q++) {
                var tag = moov.toString('latin1', q, q + 4);
                if (tag === 'enda' && q + 6 <= eEnd) { bigEndian = moov.readUInt16BE(q + 4) === 0; }
                if (tag === 'pcmC' && q + 10 <= eEnd) {
                    bigEndian = (moov[q + 8] & 1) === 0;
                    bits = moov[q + 9];
                }
            }
            var bps = bits / 8;
            if ([1, 2, 3, 4].indexOf(bps) < 0 || !channels || !rate) { throw new Error('NO_PCM'); }
            var frameBytes = bps * channels;

            // --- tablas de muestras -> bytes por chunk
            var stsz = child(moov, stbl, 'stsz'), stsc = child(moov, stbl, 'stsc');
            var stco = child(moov, stbl, 'stco'), co64 = child(moov, stbl, 'co64');
            var offsets = [], i, k;
            if (stco) {
                for (i = 0, k = moov.readUInt32BE(stco.start + 4); i < k; i++) { offsets.push(moov.readUInt32BE(stco.start + 8 + 4 * i)); }
            } else if (co64) {
                for (i = 0, k = moov.readUInt32BE(co64.start + 4); i < k; i++) {
                    var o = co64.start + 8 + 8 * i;
                    offsets.push(moov.readUInt32BE(o) * 4294967296 + moov.readUInt32BE(o + 4));
                }
            } else { throw new Error('NO_PCM'); }
            var scN = moov.readUInt32BE(stsc.start + 4), sc = [];
            for (i = 0; i < scN; i++) {
                sc.push({ first: moov.readUInt32BE(stsc.start + 8 + 12 * i), spc: moov.readUInt32BE(stsc.start + 12 + 12 * i) });
            }
            var uniform = moov.readUInt32BE(stsz.start + 4), szCount = moov.readUInt32BE(stsz.start + 8);
            var chunkBytes = [], sIdx = 0;
            for (var ch = 0; ch < offsets.length; ch++) {
                var spc = 0;
                for (i = sc.length - 1; i >= 0; i--) { if (ch + 1 >= sc[i].first) { spc = sc[i].spc; break; } }
                var bytes = 0;
                if (uniform) {
                    bytes = spc * (uniform === 1 ? frameBytes : uniform);
                } else {
                    for (i = 0; i < spc && sIdx < szCount; i++, sIdx++) { bytes += moov.readUInt32BE(stsz.start + 12 + 4 * sIdx); }
                }
                chunkBytes.push(bytes);
            }

            // --- leer, mezclar a mono y bajar a SR Hz
            var totalFrames = 0;
            for (ch = 0; ch < chunkBytes.length; ch++) { totalFrames += Math.floor(chunkBytes[ch] / frameBytes); }
            var ratio = rate / SR;
            var out = new Float32Array(Math.ceil(totalFrames / ratio) + 1);
            var cnt = new Float32Array(out.length);
            var frameIdx = 0, buf = Buffer.alloc(0);
            var readSample;
            if (isFloat) {
                readSample = bps === 4 ? (bigEndian ? function (b, p) { return b.readFloatBE(p); } : function (b, p) { return b.readFloatLE(p); })
                                       : (bigEndian ? function (b, p) { return b.readDoubleBE(p); } : function (b, p) { return b.readDoubleLE(p); });
            } else if (bps === 1) {
                readSample = signed ? function (b, p) { return b.readInt8(p); } : function (b, p) { return b[p] - 128; };
            } else {
                readSample = bigEndian ? function (b, p) { return b.readIntBE(p, bps); } : function (b, p) { return b.readIntLE(p, bps); };
            }
            for (ch = 0; ch < offsets.length; ch++) {
                var len = chunkBytes[ch] - (chunkBytes[ch] % frameBytes);
                if (len <= 0) { continue; }
                if (buf.length < len) { buf = Buffer.alloc(len); }
                fs.readSync(fd, buf, 0, len, offsets[ch]);
                for (var f = 0; f < len; f += frameBytes, frameIdx++) {
                    var s = 0;
                    for (var c = 0; c < channels; c++) { s += readSample(buf, f + c * bps); }
                    var oi = Math.floor(frameIdx / ratio);
                    out[oi] += s; cnt[oi] += channels;
                }
            }
            var n = Math.floor(frameIdx / ratio);
            var x = new Float32Array(n);
            for (i = 0; i < n; i++) { x[i] = cnt[i] ? out[i] / cnt[i] : 0; }
            return removeMean(x);
        } finally {
            fs.closeSync(fd);
        }
    }

    // Prueba varios lectores hasta que uno funcione
    function extractAudio(file, tools) {
        var ext = path.extname(file).toLowerCase();
        var attempts = [];
        var errors = [];
        if (tools.ffmpeg) {
            attempts.push(function () {
                var out = tmpName('.wav');
                return toWavThen(tools.ffmpeg, ['-v', 'error', '-y', '-i', file, '-vn', '-ac', '1', '-ar', String(SR),
                                                '-acodec', 'pcm_s16le', '-f', 'wav', out], out);
            });
        }
        if (['.mp4', '.mov', '.m4v', '.3gp'].indexOf(ext) >= 0) {
            attempts.push(function () {
                return new Promise(function (resolve) { resolve(readMp4Pcm(file)); });
            });
        }
        if (tools.afconvert) {
            attempts.push(function () {
                var out = tmpName('.wav');
                return toWavThen(tools.afconvert, ['-f', 'WAVE', '-d', 'LEI16@' + SR, '-c', '1', file, out], out);
            });
        }
        if (tools.avconvert && tools.afconvert) {
            attempts.push(function () {
                var m4a = tmpName('.m4a'), out = tmpName('.wav');
                return run(tools.avconvert, ['--source', file, '--preset', 'PresetAppleM4A', '--output', m4a, '--replace'])
                    .then(function () {
                        return toWavThen(tools.afconvert, ['-f', 'WAVE', '-d', 'LEI16@' + SR, '-c', '1', m4a, out], out);
                    })
                    .then(function (x) { try { fs.unlinkSync(m4a); } catch (e) { /* nada */ } return x; },
                          function (err) { try { fs.unlinkSync(m4a); } catch (e) { /* nada */ } throw err; });
            });
        }
        var i = 0;
        function next() {
            if (i >= attempts.length) {
                var hint = (ext === '.mxf' || ext === '.mts' || ext === '.m2ts') ? ' (este formato necesita ffmpeg)' : '';
                var why = errors.length ? errors.join(' | ') : 'formato de audio no reconocido';
                return Promise.reject(new Error('no se pudo leer el audio' + hint + ': ' + why));
            }
            return attempts[i++]().then(function (x) {
                if (!x || x.length < SR) { throw new Error('sin audio o dura menos de 1 s'); }
                return x;
            }).catch(function (err) {
                if (err.message !== 'NO_PCM' && err.message !== 'NO_MP4') { errors.push(err.message); }
                return next();
            });
        }
        return next();
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
