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

    // energía por canal en bloques de 100 ms -> dB
    function toDb(sums, counts) {
        var out = new Float32Array(sums.length);
        for (var i = 0; i < sums.length; i++) {
            out[i] = 10 * Math.log(sums[i] / Math.max(1, counts[i]) + 1e-3) / Math.LN10;
        }
        return out;
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
        var sr = SR;
        try { sr = buf.readUInt32LE(buf.indexOf('fmt ') + 12) || SR; } catch (e) { sr = SR; }
        var n = Math.floor(dataLen / (2 * channels));
        var x = new Float32Array(n), i, c, s, v;
        var blk = Math.round(sr / 10), nb = Math.ceil(n / blk) + 1;
        var sums = [], cnts = new Float32Array(nb);
        for (c = 0; c < channels; c++) { sums.push(new Float64Array(nb)); }
        for (i = 0; i < n; i++) {
            s = 0;
            var b = Math.floor(i / blk);
            for (c = 0; c < channels; c++) {
                v = buf.readInt16LE(dataStart + 2 * (i * channels + c));
                s += v;
                sums[c][b] += v * v;
            }
            cnts[b]++;
            x[i] = s / channels;
        }
        x = removeMean(x);
        x.chanLevels = sums.map(function (sm) { return toDb(sm, cnts); });
        return x;
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
    // Analiza la estructura del MP4/MOV (rápido; no lee el audio todavía)
    function parseMp4Pcm(fd) {
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
            var chunkBytes = new Array(offsets.length), sIdx = 0, scPos = 0, totalFrames = 0;
            for (var ch = 0; ch < offsets.length; ch++) {
                // avanzar en la tabla stsc (lineal, sin recorrerla entera cada vez)
                while (scPos + 1 < sc.length && ch + 1 >= sc[scPos + 1].first) { scPos++; }
                var spc = sc.length ? sc[scPos].spc : 0;
                var bytes = 0;
                if (uniform) {
                    bytes = spc * (uniform === 1 ? frameBytes : uniform);
                } else {
                    for (i = 0; i < spc && sIdx < szCount; i++, sIdx++) { bytes += moov.readUInt32BE(stsz.start + 12 + 4 * sIdx); }
                }
                bytes -= bytes % frameBytes;
                chunkBytes[ch] = bytes;
                totalFrames += bytes / frameBytes;
            }
            return { offsets: offsets, chunkBytes: chunkBytes, totalFrames: totalFrames, rate: rate, channels: channels,
                     bps: bps, bigEndian: bigEndian, isFloat: isFloat, signed: signed, frameBytes: frameBytes };
        } catch (e) {
            fs.closeSync(fd);
            throw e;
        }
    }

    // Lee el audio por partes, cediendo el control al panel cada ~100 ms
    function readMp4Pcm(file, onProgress) {
        return new Promise(function (resolve, reject) {
            var fd = fs.openSync(file, 'r');
            var info = parseMp4Pcm(fd);          // cierra fd si falla
            var channels = info.channels, bps = info.bps, frameBytes = info.frameBytes;
            var ratio = info.rate / SR;
            var out = new Float32Array(Math.ceil(info.totalFrames / ratio) + 1);
            var cnt = new Uint16Array(out.length);
            var frameIdx = 0, buf = Buffer.alloc(1 << 16), ch = 0, lastPct = -1;
            var blkF = Math.round(info.rate / 10), nBlk = Math.ceil(info.totalFrames / blkF) + 1;
            var eSums = [], eCnt = new Float32Array(nBlk);
            for (var ec = 0; ec < channels; ec++) { eSums.push(new Float64Array(nBlk)); }
            var be = info.bigEndian;
            var readSample;
            if (info.isFloat) {
                readSample = bps === 4 ? (be ? function (b, p) { return b.readFloatBE(p) * 32768; } : function (b, p) { return b.readFloatLE(p) * 32768; })
                                       : (be ? function (b, p) { return b.readDoubleBE(p) * 32768; } : function (b, p) { return b.readDoubleLE(p) * 32768; });
            } else if (bps === 1) {
                readSample = info.signed ? function (b, p) { return b.readInt8(p); } : function (b, p) { return b[p] - 128; };
            } else if (bps === 2) {
                readSample = be ? function (b, p) { return ((b[p] << 24) >> 16) | b[p + 1]; }
                                : function (b, p) { return ((b[p + 1] << 24) >> 16) | b[p]; };
            } else {
                readSample = be ? function (b, p) { return b.readIntBE(p, bps); } : function (b, p) { return b.readIntLE(p, bps); };
            }

            function slice() {
                try {
                    var t0 = Date.now();
                    while (ch < info.offsets.length && Date.now() - t0 < 100) {
                        var len = info.chunkBytes[ch];
                        if (len > 0) {
                            if (buf.length < len) { buf = Buffer.alloc(len); }
                            var got = fs.readSync(fd, buf, 0, len, info.offsets[ch]);
                            len = got - (got % frameBytes);
                            for (var f = 0; f < len; f += frameBytes, frameIdx++) {
                                var s = 0, bi = Math.floor(frameIdx / blkF);
                                for (var c = 0; c < channels; c++) {
                                    var sv = readSample(buf, f + c * bps);
                                    s += sv;
                                    eSums[c][bi] += sv * sv;
                                }
                                eCnt[bi]++;
                                var oi = Math.floor(frameIdx / ratio);
                                out[oi] += s / channels; cnt[oi]++;
                            }
                        }
                        ch++;
                    }
                    var pct = Math.floor(100 * ch / info.offsets.length / 20) * 20;
                    if (onProgress && pct !== lastPct && pct < 100) { lastPct = pct; onProgress(pct); }
                    if (ch < info.offsets.length) { setTimeout(slice, 0); return; }
                    fs.closeSync(fd);
                    var n = Math.floor(frameIdx / ratio), x = new Float32Array(n);
                    for (var i = 0; i < n; i++) { x[i] = cnt[i] ? out[i] / cnt[i] : 0; }
                    x = removeMean(x);
                    x.chanLevels = eSums.map(function (sm) { return toDb(sm, eCnt); });
                    resolve(x);
                } catch (e) {
                    try { fs.closeSync(fd); } catch (e2) { /* nada */ }
                    reject(e);
                }
            }
            slice();
        });
    }

    // Prueba varios lectores hasta que uno funcione
    function extractAudio(file, tools, onProgress) {
        var ext = path.extname(file).toLowerCase();
        var attempts = [];
        var errors = [];
        if (tools.ffmpeg) {
            attempts.push(function () {
                var out = tmpName('.wav');
                return toWavThen(tools.ffmpeg, ['-v', 'error', '-y', '-i', file, '-vn', '-ar', String(SR),
                                                '-acodec', 'pcm_s16le', '-f', 'wav', out], out);
            });
        }
        if (['.mp4', '.mov', '.m4v', '.3gp'].indexOf(ext) >= 0) {
            attempts.push(function () {
                return readMp4Pcm(file, onProgress);
            });
        }
        if (tools.afconvert) {
            attempts.push(function () {
                var out = tmpName('.wav');
                return toWavThen(tools.afconvert, ['-f', 'WAVE', '-d', 'LEI16@' + SR, file, out], out);
            });
        }
        if (tools.avconvert && tools.afconvert) {
            attempts.push(function () {
                var m4a = tmpName('.m4a'), out = tmpName('.wav');
                return run(tools.avconvert, ['--source', file, '--preset', 'PresetAppleM4A', '--output', m4a, '--replace'])
                    .then(function () {
                        return toWavThen(tools.afconvert, ['-f', 'WAVE', '-d', 'LEI16@' + SR, m4a, out], out);
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

    // Nivel de audio en dB cada 100 ms (para el ponche)
    function levels(x) {
        var hop = SR / 10, n = Math.floor(x.length / hop), e = new Float32Array(n), i, k, s, v;
        for (i = 0; i < n; i++) {
            s = 0;
            for (k = 0; k < hop; k++) { v = x[i * hop + k]; s += v * v; }
            e[i] = 10 * Math.log(s / hop + 1e-3) / Math.LN10;
        }
        return e;
    }

    /**
     * Ponche por VOZ: en cada momento elige la cámara que mejor oye a quien habla.
     * clips: resultado de syncClips (con offset), lv: niveles (dB cada 100 ms) alineados con clips.
     * minShot: duración mínima de cada plano en segundos.
     * Devuelve {cuts: [segundos], segCams: [índice de clip por tramo], stats}.
     */
    function planCuts(clips, lv, minShot) {
        var HZ = 10, HYST = 1.0, CONFIRM = 0.5, SMOOTH = 8;
        var audioOnly = /\.(wav|m4a|mp3|aif|aiff)$/i;
        var end = 0, mi = 0, i, t, k;
        for (i = 0; i < clips.length; i++) {
            end = Math.max(end, clips[i].offset + lv[i].length / HZ);
            if (clips[i].master) { mi = i; }
        }
        var T = Math.ceil(end * HZ);
        function pct(arr, p) {
            var v = Array.prototype.filter.call(arr, function (x) { return !isNaN(x); }).sort(function (x, y) { return x - y; });
            return v.length ? v[Math.min(v.length - 1, Math.floor(v.length * p))] : 0;
        }
        // nivel suavizado (~0,8 s) de cada clip sobre la línea de tiempo común
        var line = [], video = [];
        for (i = 0; i < clips.length; i++) {
            var raw = new Float32Array(T).fill(NaN), sm = new Float32Array(T).fill(NaN);
            var off = Math.round(clips[i].offset * HZ);
            for (k = 0; k < lv[i].length; k++) { if (off + k >= 0 && off + k < T) { raw[off + k] = lv[i][k]; } }
            for (t = 0; t < T; t++) {
                if (isNaN(raw[t])) { continue; }
                var sum = 0, n = 0;
                for (k = t - SMOOTH / 2; k < t + SMOOTH / 2; k++) { if (k >= 0 && k < T && !isNaN(raw[k])) { sum += raw[k]; n++; } }
                sm[t] = sum / n;
            }
            // normalizar por el nivel típico de cada cámara (cada una tiene distinta ganancia)
            var ref = pct(sm, 0.5);
            for (t = 0; t < T; t++) { if (!isNaN(sm[t])) { sm[t] -= ref; } }
            line.push({ raw: raw, rel: sm });
            if (!audioOnly.test(clips[i].name)) { video.push(i); }
        }
        // ¿hay voz? (maestra por encima de su ruido de fondo)
        var floor = pct(line[mi].raw, 0.2);
        function speaking(tt) { var v = line[mi].raw[tt]; return !isNaN(v) && v > floor + 6; }
        function best(tt) {
            var b = -1, bv = -Infinity;
            for (var q = 0; q < video.length; q++) {
                var v = line[video[q]].rel[tt];
                if (!isNaN(v) && v > bv) { bv = v; b = video[q]; }
            }
            return b;
        }
        function covers(ci, tt) { return ci >= 0 && !isNaN(line[ci].raw[tt]); }
        // momento más silencioso entre a y b (índices) para cortar
        function quietest(a, b) {
            var bi = b, bv = Infinity;
            for (var q = Math.max(0, a); q <= b && q < T; q++) {
                var v = line[mi].raw[q];
                if (!isNaN(v) && v < bv) { bv = v; bi = q; }
            }
            return bi;
        }

        var cuts = [], cams = [], cur = -1, lastCut = 0, pend = -1, since = 0, margins = [];
        for (t = 0; t < T; t++) {
            if (cur < 0 || !covers(cur, t)) {            // inicio o la cámara se acabó
                var nb = best(t);
                if (nb >= 0 && nb !== cur) {
                    if (cur >= 0 || cams.length) { cuts.push(t / HZ); } else if (t > 0) { cuts.push(t / HZ); cams.push(-1); }
                    cams.push(nb); cur = nb; lastCut = t; pend = -1;
                }
                continue;
            }
            if (!speaking(t)) { continue; }
            var c = best(t);
            if (c >= 0 && c !== cur && line[c].rel[t] - line[cur].rel[t] >= HYST) {
                if (pend !== c) { pend = c; since = t; }
                if (t - since >= CONFIRM * HZ && t - lastCut >= minShot * HZ) {
                    // cortar en la pausa justo antes de que empiece a hablar
                    var cutAt = quietest(Math.max(lastCut + Math.round(minShot * HZ / 2), since - 12), since + 2);
                    cuts.push(cutAt / HZ); cams.push(c);
                    margins.push(line[c].rel[t] - line[cur].rel[t]);
                    cur = c; lastCut = cutAt; pend = -1;
                }
            } else if (pend >= 0 && c === cur) {
                pend = -1;
            }
        }
        if (!cams.length) { cams.push(video.length ? video[0] : -1); }
        // separación típica de voz entre cámaras (diagnóstico)
        var sepSum = 0, sepN = 0;
        for (t = 0; t < T; t += 5) {
            if (!speaking(t)) { continue; }
            var vals = [];
            for (k = 0; k < video.length; k++) { var v = line[video[k]].rel[t]; if (!isNaN(v)) { vals.push(v); } }
            if (vals.length > 1) { vals.sort(function (x, y) { return y - x; }); sepSum += vals[0] - vals[1]; sepN++; }
        }
        return { cuts: cuts, segCams: cams, stats: { separacionDb: sepN ? sepSum / sepN : 0 } };
    }

    function percentile(arr, p) {
        var v = Array.prototype.filter.call(arr, function (x) { return !isNaN(x); }).sort(function (x, y) { return x - y; });
        return v.length ? v[Math.min(v.length - 1, Math.floor(v.length * p))] : 0;
    }

    // Calidad de cada canal: diferencia entre la voz (percentil 90) y el ruido de fondo (percentil 15)
    function channelStats(clips, chl) {
        var list = [];
        for (var i = 0; i < clips.length; i++) {
            for (var c = 0; c < (chl[i] || []).length; c++) {
                var floor = percentile(chl[i][c], 0.15), voice = percentile(chl[i][c], 0.9);
                list.push({ clip: i, ch: c, name: clips[i].name, snr: Math.round(voice - floor), silent: voice < 20 });
            }
        }
        list.sort(function (a, b) { return b.snr - a.snr; });
        return list;
    }

    /**
     * Ponche por CANALES DE VOZ (micrófonos de solapa / audio limpio).
     * voices: [{clip, ch, cam}] -> cuando suena el canal ch del clip, ir a la cámara cam.
     * wideCam: cámara para cuando hablan a la vez (o -1).
     * Devuelve {cuts, segCams, stats}.
     */
    function planVoice(clips, chl, voices, wideCam, minShot) {
        var HZ = 10, THR = 8, BOTH = 4, CONFIRM = 0.5, SMOOTH = 6;
        var audioOnly = /\.(wav|m4a|mp3|aif|aiff)$/i;
        var end = 0, i, t, k, q;
        var dur = clips.map(function (c, ci) { return ((chl[ci] && chl[ci][0]) ? chl[ci][0].length : 0) / HZ; });
        for (i = 0; i < clips.length; i++) { end = Math.max(end, clips[i].offset + dur[i]); }
        var T = Math.ceil(end * HZ);
        function covers(ci, tt) {
            if (ci < 0 || ci >= clips.length || audioOnly.test(clips[ci].name)) { return false; }
            var x = tt / HZ - clips[ci].offset;
            return x >= 0 && x < dur[ci];
        }
        // actividad de cada voz = nivel suavizado sobre su propio ruido de fondo
        var act = voices.map(function (v) {
            var src = chl[v.clip][v.ch], off = Math.round(clips[v.clip].offset * HZ);
            var raw = new Float32Array(T).fill(NaN), sm = new Float32Array(T).fill(NaN);
            for (k = 0; k < src.length; k++) { if (off + k >= 0 && off + k < T) { raw[off + k] = src[k]; } }
            for (t = 0; t < T; t++) {
                var sum = 0, n = 0;
                for (k = t - SMOOTH / 2; k < t + SMOOTH / 2; k++) { if (k >= 0 && k < T && !isNaN(raw[k])) { sum += raw[k]; n++; } }
                sm[t] = n ? sum / n : NaN;
            }
            var floor = percentile(sm, 0.15);
            for (t = 0; t < T; t++) { sm[t] = isNaN(sm[t]) ? -99 : sm[t] - floor; }
            return sm;
        });
        function target(tt) {
            var a0 = -99, a1 = -99, s0 = -1;
            for (q = 0; q < act.length; q++) {
                var a = act[q][tt];
                if (a > a0) { a1 = a0; a0 = a; s0 = q; } else if (a > a1) { a1 = a; }
            }
            if (a0 < THR) { return null; }                         // nadie habla
            if (a1 >= THR && a0 - a1 < BOTH) { return wideCam >= 0 ? wideCam : null; }  // hablan a la vez
            return voices[s0].cam;
        }
        function loudness(tt) {
            var m = -99;
            for (q = 0; q < act.length; q++) { if (act[q][tt] > m) { m = act[q][tt]; } }
            return m;
        }
        function quietest(a, b) {
            var bi = b, bv = Infinity;
            for (var z = Math.max(0, a); z <= b && z < T; z++) { var v = loudness(z); if (v < bv) { bv = v; bi = z; } }
            return bi;
        }
        function anyCover(tt, prefer) {
            if (covers(prefer, tt)) { return prefer; }
            if (covers(wideCam, tt)) { return wideCam; }
            for (var z = 0; z < clips.length; z++) { if (covers(z, tt)) { return z; } }
            return -1;
        }

        var cuts = [], cams = [], cur = -1, lastCut = 0, pend = -1, since = 0;
        for (t = 0; t < T; t++) {
            var want = target(t);
            if (!covers(cur, t)) {
                var nb = anyCover(t, want !== null ? want : cur);
                if (nb !== cur) {
                    if (cams.length) { cuts.push(t / HZ); } else if (t > 0) { cuts.push(t / HZ); cams.push(-1); }
                    cams.push(nb); cur = nb; lastCut = t; pend = -1;
                }
                continue;
            }
            if (want === null || want === cur || !covers(want, t)) {
                if (want === cur) { pend = -1; }
                continue;
            }
            if (pend !== want) { pend = want; since = t; }
            if (t - since >= CONFIRM * HZ && t - lastCut >= minShot * HZ) {
                var cutAt = quietest(Math.max(lastCut + Math.round(minShot * HZ / 2), since - 12), since + 2);
                cuts.push(cutAt / HZ); cams.push(want);
                cur = want; lastCut = cutAt; pend = -1;
            }
        }
        if (!cams.length) { cams.push(anyCover(0, wideCam)); }
        var usage = {};
        var bounds = [0].concat(cuts, [end]);
        for (i = 0; i < cams.length; i++) { usage[cams[i]] = (usage[cams[i]] || 0) + (bounds[i + 1] - bounds[i]); }
        return { cuts: cuts, segCams: cams, stats: { usage: usage } };
    }

    // ================================================================
    //  IDENTIFICAR HABLANTES en un solo audio (mono o estéreo mezclado)
    //  Rasgos por fragmento de 1 s: timbre (MFCC) + tono (pitch).
    //  Se agrupan en K hablantes con k-means.
    // ================================================================
    function melBank(nBands, nfft, sr, fmin, fmax) {
        function hz2mel(h) { return 2595 * Math.log(1 + h / 700) / Math.LN10; }
        function mel2hz(m) { return 700 * (Math.pow(10, m / 2595) - 1); }
        var pts = [], i, k, bank = [];
        for (i = 0; i < nBands + 2; i++) {
            pts.push(Math.floor((nfft / 2) * mel2hz(hz2mel(fmin) + (hz2mel(fmax) - hz2mel(fmin)) * i / (nBands + 1)) / (sr / 2)));
        }
        for (i = 0; i < nBands; i++) {
            var w = new Float64Array(nfft / 2 + 1);
            for (k = pts[i]; k < pts[i + 1]; k++) { w[k] = (k - pts[i]) / Math.max(1, pts[i + 1] - pts[i]); }
            for (k = pts[i + 1]; k < pts[i + 2]; k++) { w[k] = (pts[i + 2] - k) / Math.max(1, pts[i + 2] - pts[i + 1]); }
            bank.push(w);
        }
        return bank;
    }

    function kmeans(data, K, iters) {
        var n = data.length, d = data[0].length, best = null;
        for (var restart = 0; restart < 6; restart++) {
            // k-means++
            var cent = [data[Math.floor(Math.random() * n)].slice()];
            while (cent.length < K) {
                var dist = data.map(function (x) {
                    var m = Infinity;
                    cent.forEach(function (c) { var s = 0; for (var j = 0; j < d; j++) { s += (x[j] - c[j]) * (x[j] - c[j]); } m = Math.min(m, s); });
                    return m;
                });
                var tot = dist.reduce(function (a, b) { return a + b; }, 0), r = Math.random() * tot, idx = 0;
                while (idx < n - 1 && (r -= dist[idx]) > 0) { idx++; }
                cent.push(data[idx].slice());
            }
            var lab = new Int32Array(n), inertia = 0;
            for (var it = 0; it < iters; it++) {
                inertia = 0;
                for (var i = 0; i < n; i++) {
                    var bi = 0, bv = Infinity;
                    for (var c = 0; c < K; c++) {
                        var s2 = 0;
                        for (var j2 = 0; j2 < d; j2++) { var df = data[i][j2] - cent[c][j2]; s2 += df * df; }
                        if (s2 < bv) { bv = s2; bi = c; }
                    }
                    lab[i] = bi; inertia += bv;
                }
                var sum = [], cnt = [];
                for (c = 0; c < K; c++) { sum.push(new Float64Array(d)); cnt.push(0); }
                for (i = 0; i < n; i++) { cnt[lab[i]]++; for (j2 = 0; j2 < d; j2++) { sum[lab[i]][j2] += data[i][j2]; } }
                for (c = 0; c < K; c++) { if (cnt[c]) { for (j2 = 0; j2 < d; j2++) { cent[c][j2] = sum[c][j2] / cnt[c]; } } }
            }
            if (!best || inertia < best.inertia) { best = { labels: lab, inertia: inertia }; }
        }
        return best.labels;
    }

    /**
     * x: audio mono a SR Hz. K: número de hablantes.
     * Devuelve Promise<{speakers:[{pitch, seconds, examples:[s]}], levels:[Float32Array 10 Hz por hablante]}>
     */
    function diarize(x, K, onProgress) {
        var N = 256, NF = 512, HOP = 160;                  // 32 ms de ventana, 20 ms de salto
        var nFr = Math.max(0, Math.floor((x.length - N) / HOP));
        var win = new Float64Array(N), i, k;
        for (i = 0; i < N; i++) { win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)); }
        var bank = melBank(24, NF, SR, 90, 3800);
        var energy = new Float32Array(nFr);
        for (var f = 0; f < nFr; f++) {
            var s = 0;
            for (i = 0; i < N; i += 2) { var v = x[f * HOP + i]; s += v * v; }
            energy[f] = 10 * Math.log(s / (N / 2) + 1e-3) / Math.LN10;
        }
        var floorDb = percentile(energy, 0.15), peakDb = percentile(energy, 0.95);
        var thr = floorDb + Math.max(8, (peakDb - floorDb) * 0.35);
        var mfcc = new Array(nFr), pitch = new Float32Array(nFr);
        var re = new Float64Array(NF), im = new Float64Array(NF), mel = new Float64Array(24);
        var f0 = 0;

        return new Promise(function (resolve) {
            function slice() {
                var t0 = Date.now();
                for (; f0 < nFr && Date.now() - t0 < 100; f0++) {
                    if (energy[f0] < thr) { continue; }
                    re.fill(0); im.fill(0);
                    for (i = 0; i < N; i++) { re[i] = x[f0 * HOP + i] * win[i]; }
                    fft(re, im, false);
                    for (k = 0; k <= NF / 2; k++) { re[k] = re[k] * re[k] + im[k] * im[k]; }
                    // MFCC
                    for (var b = 0; b < 24; b++) {
                        var e = 0, w = bank[b];
                        for (k = 0; k <= NF / 2; k++) { if (w[k]) { e += w[k] * re[k]; } }
                        mel[b] = Math.log(e + 1e-6);
                    }
                    var cc = new Float32Array(12);
                    for (var c = 1; c <= 12; c++) {
                        var acc = 0;
                        for (b = 0; b < 24; b++) { acc += mel[b] * Math.cos(Math.PI * c * (b + 0.5) / 24); }
                        cc[c - 1] = acc;
                    }
                    mfcc[f0] = cc;
                    // tono: autocorrelación = IFFT(|X|²)
                    for (k = 1; k < NF / 2; k++) { re[NF - k] = re[k]; }
                    im.fill(0);
                    fft(re, im, true);
                    var r0 = re[0] || 1, bl = 0, bvv = 0.3;
                    for (var lag = 20; lag <= 100; lag++) {          // 400 Hz .. 80 Hz
                        var rv = re[lag] / r0;
                        if (rv > bvv && re[lag] >= re[lag - 1] && re[lag] >= re[lag + 1]) { bvv = rv; bl = lag; }
                    }
                    pitch[f0] = bl ? SR / bl : 0;
                }
                if (onProgress) { onProgress(Math.floor(100 * f0 / Math.max(1, nFr))); }
                if (f0 < nFr) { setTimeout(slice, 0); return; }
                resolve(cluster());
            }
            slice();
        });

        function cluster() {
            // fragmentos de 1 s cada 0,5 s
            var WIN = 50, STEP = 25, feats = [], centers = [];
            var allP = [];
            for (var st = 0; st + WIN <= nFr; st += STEP) {
                var m = new Float64Array(12), n = 0, ps = [];
                for (var q = st; q < st + WIN; q++) {
                    if (!mfcc[q]) { continue; }
                    for (var j = 0; j < 12; j++) { m[j] += mfcc[q][j]; }
                    n++;
                    if (pitch[q] > 0) { ps.push(pitch[q]); }
                }
                if (n < WIN * 0.3) { continue; }
                for (j = 0; j < 12; j++) { m[j] /= n; }
                ps.sort(function (a, b2) { return a - b2; });
                var p = ps.length >= 3 ? ps[Math.floor(ps.length / 2)] : 0;
                if (p) { allP.push(p); }
                feats.push({ v: Array.prototype.slice.call(m), p: p });
                centers.push(st + WIN / 2);
            }
            var empty = { speakers: [], levels: [], labels: null };
            if (feats.length < K * 3) { return empty; }
            allP.sort(function (a, b2) { return a - b2; });
            var medP = allP.length ? allP[Math.floor(allP.length / 2)] : 150;
            var data = feats.map(function (o) { return o.v.concat([Math.log(o.p || medP)]); });
            // normalizar cada rasgo y dar más peso al tono
            var d = data[0].length;
            for (var j3 = 0; j3 < d; j3++) {
                var mu = 0, sd = 0;
                data.forEach(function (r) { mu += r[j3]; }); mu /= data.length;
                data.forEach(function (r) { sd += (r[j3] - mu) * (r[j3] - mu); }); sd = Math.sqrt(sd / data.length) || 1;
                var wgt = (j3 === d - 1) ? 3 : 1;
                data.forEach(function (r) { r[j3] = wgt * (r[j3] - mu) / sd; });
            }
            var lab = kmeans(data, K, 25);

            // a 10 Hz: etiqueta del fragmento más cercano, solo donde hay voz
            var T = Math.ceil(nFr * HOP / SR * 10), label = new Int8Array(T).fill(-1), lvl = new Float32Array(T).fill(-99);
            var fi = 0;
            for (var t = 0; t < T; t++) {
                var fr = Math.floor(t * SR / 10 / HOP);
                var eMax = -99, speech = false;
                for (q = fr; q < fr + 5 && q < nFr; q++) { if (energy[q] > eMax) { eMax = energy[q]; } if (energy[q] >= thr) { speech = true; } }
                lvl[t] = eMax;
                if (!speech) { continue; }
                while (fi + 1 < centers.length && Math.abs(centers[fi + 1] - fr) <= Math.abs(centers[fi] - fr)) { fi++; }
                if (Math.abs(centers[fi] - fr) <= WIN) { label[t] = lab[fi]; }
            }
            // suavizar: mayoría en ±0,7 s
            var sm = new Int8Array(T).fill(-1), votes = new Int32Array(K);
            for (t = 0; t < T; t++) {
                if (label[t] < 0) { continue; }
                votes.fill(0);
                for (q = Math.max(0, t - 7); q <= Math.min(T - 1, t + 7); q++) { if (label[q] >= 0) { votes[label[q]]++; } }
                var bk = 0;
                for (var c2 = 1; c2 < K; c2++) { if (votes[c2] > votes[bk]) { bk = c2; } }
                sm[t] = bk;
            }
            // niveles por hablante (para el ponche) e info para la interfaz
            var levels = [], speakers = [];
            for (var c3 = 0; c3 < K; c3++) {
                var L = new Float32Array(T).fill(floorDb - 20), secs = 0, pv = [], runs = [], runStart = -1;
                for (t = 0; t <= T; t++) {
                    var on = t < T && sm[t] === c3;
                    if (on) { L[t] = lvl[t]; secs += 0.1; }
                    if (on && runStart < 0) { runStart = t; }
                    if (!on && runStart >= 0) { runs.push([runStart, t]); runStart = -1; }
                }
                for (var w2 = 0; w2 < feats.length; w2++) { if (lab[w2] === c3 && feats[w2].p) { pv.push(feats[w2].p); } }
                pv.sort(function (a, b2) { return a - b2; });
                runs.sort(function (a, b2) { return (b2[1] - b2[0]) - (a[1] - a[0]); });
                levels.push(L);
                speakers.push({
                    pitch: pv.length ? Math.round(pv[Math.floor(pv.length / 2)]) : 0,
                    seconds: Math.round(secs),
                    examples: runs.slice(0, 3).map(function (r) { return r[0] / 10; })
                });
            }
            // orden estable: de la voz más grave a la más aguda
            var order = speakers.map(function (sp, i) { return i; })
                .sort(function (a, b2) { return (speakers[a].pitch || 999) - (speakers[b2].pitch || 999); });
            return { speakers: order.map(function (i) { return speakers[i]; }), levels: order.map(function (i) { return levels[i]; }) };
        }
    }

    /**
     * clips: [{name, path, ...}]  masterIndex: índice de la maestra
     * log: función(texto)   -> Promise<{clips: [...con offset], dropped: [nombres]}>
     */
    function syncClips(clips, masterIndex, log, extraDirs) {
        log = log || function () {};
        var decoder = findDecoder(extraDirs);
        log('Lector de audio: ' + decoder.kind);
        var results = {}, dropped = [], ref, lv = {}, chl = {};
        var master = clips[masterIndex];
        log('Leyendo audio de la maestra: ' + master.name + ' ...');
        var progress = function (pct) { log('   leyendo audio ' + pct + ' %'); };
        var pause = function (v) { return new Promise(function (r) { setTimeout(function () { r(v); }, 30); }); };
        return extractAudio(master.path, decoder, progress).then(function (x) {
            ref = x;
            results[masterIndex] = 0;
            lv[masterIndex] = levels(x);
            chl[masterIndex] = x.chanLevels || [];
            var chain = Promise.resolve();
            clips.forEach(function (clip, idx) {
                if (idx === masterIndex) { return; }
                chain = chain.then(function () {
                    log('Sincronizando ' + clip.name + ' ...');
                    return extractAudio(clip.path, decoder, progress).then(function (cam) {
                        log('   comparando con la maestra...');
                        return pause(cam);
                    }).then(function (cam) {
                        var r = offset(ref, cam);
                        if (r.confidence >= THRESHOLD) {
                            results[idx] = r.offset;
                            lv[idx] = levels(cam);
                            chl[idx] = cam.chanLevels || [];
                            log('   ' + (r.offset >= 0 ? '+' : '') + r.offset.toFixed(3) + ' s  (confianza ' + Math.round(r.confidence) + ')');
                        } else {
                            dropped.push(clip.name);
                            log('   NO coincide con la maestra (confianza ' + Math.round(r.confidence) + '): se omite');
                        }
                    }).catch(function (err) {
                        dropped.push(clip.name);
                        log('   ERROR: ' + err.message);
                    });
                });
            });
            return chain;
        }).then(function () {
            var min = Infinity, k;
            for (k in results) { if (results[k] < min) { min = results[k]; } }
            var out = [], outLv = [], outCh = [];
            clips.forEach(function (clip, idx) {
                if (results.hasOwnProperty(idx)) {
                    var o = {};
                    for (var key in clip) { o[key] = clip[key]; }
                    o.offset = Math.round((results[idx] - min) * 10000) / 10000;
                    o.master = (idx === masterIndex);
                    out.push(o);
                    outLv.push(lv[idx]);
                    outCh.push(chl[idx]);
                }
            });
            return { clips: out, dropped: dropped, levels: outLv, chanLevels: outCh, channels: channelStats(out, outCh) };
        });
    }

    var api = { syncClips: syncClips, planCuts: planCuts, planVoice: planVoice, diarize: diarize, offset: offset, extractAudio: extractAudio, findDecoder: findDecoder };
    if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
    root.MulticamSync = api;
})(typeof window !== 'undefined' ? window : this);
