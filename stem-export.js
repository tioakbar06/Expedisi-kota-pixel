const CRC_LK = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crcLK = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_LK[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipLK(berkas, mime) {
  const enc = new TextEncoder(), bag = [], pusat = []; let off = 0;
  const d = new Date(), tgl = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), jam = (d.getHours() << 11) | (d.getMinutes() << 5);
  const tulis = (dv, spec) => spec.forEach(([o, val, s]) => s === 4 ? dv.setUint32(o, val, true) : dv.setUint16(o, val, true));
  for (const { nama, isi } of berkas) {
    const data = typeof isi === 'string' ? enc.encode(isi) : isi, n = enc.encode(nama), crc = crcLK(data);
    const lok = new DataView(new ArrayBuffer(30));
    tulis(lok, [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, jam, 2], [12, tgl, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, n.length, 2], [28, 0, 2]]);
    bag.push(new Uint8Array(lok.buffer), n, data);
    const c = new DataView(new ArrayBuffer(46));
    tulis(c, [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, jam, 2], [14, tgl, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, n.length, 2], [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]]);
    pusat.push(new Uint8Array(c.buffer), n);
    off += 30 + n.length + data.length;
  }
  const uk = pusat.reduce((s, b) => s + b.length, 0), akhir = new DataView(new ArrayBuffer(22));
  tulis(akhir, [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, berkas.length, 2], [10, berkas.length, 2], [12, uk, 4], [16, off, 4], [20, 0, 2]]);
  return new Blob([...bag, ...pusat, new Uint8Array(akhir.buffer)], { type: mime });
}
const dataUrlKeBytes = u => { const b = atob(u.split(',')[1]), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; };
const ukuranGambar = src => new Promise(r => { const i = new Image(); i.onload = () => r({ w: i.naturalWidth, h: i.naturalHeight }); i.onerror = () => r({ w: 900, h: 600 }); i.src = src; });

/* ---------- PDF ---------- */
const PDF_GANTI = { '≤': '<=', '≥': '>=', '√': 'akar ', 'Δ': 'd', 'φ': 'phi', 'λ': 'lambda', 'Σ': 'jumlah ', '→': '->', '←': '<-', '⬅': '<-', '➡': '->', '−': '-', '☐': '[ ]', '☑': '[x]', '✓': 'v', '·': '·', ' ': ' ', ' ': ' ' };
const WINANSI = { '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159 };
const pdfTeks = s => [...String(s ?? '')].map(ch => PDF_GANTI[ch] ?? ch).join('');
function pdfByte(s) { let o = ''; for (const ch of pdfTeks(s)) { const c = ch.charCodeAt(0); o += WINANSI[ch] ? String.fromCharCode(WINANSI[ch]) : (c < 256 ? ch : '?'); } return o; }
const pdfLit = s => '(' + pdfByte(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)') + ')';
const ukurKanvas = document.createElement('canvas').getContext('2d');
function lebarTeks(s, uk, tebal, mono) { ukurKanvas.font = `${tebal ? 'bold ' : ''}100px ${mono ? '"Courier New", Courier, monospace' : 'Arial, Helvetica, "Liberation Sans", sans-serif'}`; return ukurKanvas.measureText(pdfTeks(s)).width / 100 * uk * 1.01; }
function bungkus(s,maks,uk,tebal,mono){
 const out=[];
 for(let line of pdfTeks(s).split('\n')){
  if(!line){out.push('');continue;}
  const width=t=>mono?t.length*uk*.6:lebarTeks(t,uk,tebal,false);
  while(width(line)>maks){let n=1;while(n<line.length&&width(line.slice(0,n+1))<=maks)n++;
   if(!mono){const k=line.lastIndexOf(' ',n);if(k>0)n=k;}
   out.push(line.slice(0,n));line=line.slice(n);if(!mono)line=line.trimStart();
  }out.push(line);
 }return out;
}
async function pdfDariModel(daftarModel) {
  const W = 595.28, H = 841.89, ML = 40, MR = 40, MT = 42, MB = 46, LB = W - ML - MR;
  const hal = []; let c = null, y = 0;
  const gambar = []; /* {nama, bytes, w, h} */
  const halBaru = () => { c = []; hal.push(c); y = MT; };
  const butuh = h => { if (!c || y + h > H - MB) halBaru(); };
  const warna = hx => { const n = parseInt(hx.slice(1), 16); return `${((n >> 16) & 255) / 255} ${((n >> 8) & 255) / 255} ${(n & 255) / 255}`; };
  const teks = (s, x, yy, uk, tebal, mono, rgb) => c.push(`BT /${mono ? 'F3' : tebal ? 'F2' : 'F1'} ${uk} Tf ${rgb ? warna(rgb) + ' rg ' : '0 0 0 rg '}${x.toFixed(2)} ${(H - yy).toFixed(2)} Td ${pdfLit(s)} Tj ET`);
  const kotak = (x, yy, w, h, isi, garis) => c.push(`${isi ? warna(isi) + ' rg ' : ''}${garis ? warna(garis) + ' RG 0.6 w ' : ''}${x.toFixed(2)} ${(H - yy - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${isi && garis ? 'B' : isi ? 'f' : 'S'}`);
  const paragraf = (runs, uk = 10, jarak = 4) => {
    /* gabung run menjadi kata bertanda tebal */
    const kata = []; runs.forEach(r => String(r.x ?? '').split(/(\s+)/).forEach(k => k && kata.push({ k, b: r.b })));
    const lh = uk * 1.32; let baris = [], lebar = 0;
    const cetak = () => { butuh(lh); let x = ML; baris.forEach(w => { teks(w.k, x, y + uk, uk, w.b); x += lebarTeks(w.k, uk, w.b); }); y += lh; baris = []; lebar = 0; };
    kata.forEach(w => { const lw = lebarTeks(w.k, uk, w.b); if (lebar + lw > LB && baris.length && w.k.trim()) { cetak(); if (!w.k.trim()) return; } if (!baris.length && !w.k.trim()) return; baris.push(w); lebar += lw; });
    if (baris.length) cetak();
    y += jarak;
  };
  const tabel = b => {
    const ws = b.w.map(p => p / 100 * LB), uk = 8.6, lh = uk * 1.28, pad = 3.5;
    const sel = (cc, i, kepala) => { const x = typeof cc === 'string' ? { x: cc } : cc; return { ...x, baris: bungkus(x.x, ws[i] - pad * 2, uk, x.th || kepala) }; };
    const gambarBaris = (cells, kepala) => {
      const s = cells.map((cc, i) => sel(cc, i, kepala)), tinggi = Math.max(kepala ? 0 : 17, ...s.map(z => z.baris.length * lh + pad * 2));
      butuh(tinggi); let x = ML;
      s.forEach((z, i) => { kotak(x, y, ws[i], tinggi, kepala ? '#1D3557' : z.th ? '#F1F1F1' : null, '#777777'); z.baris.forEach((t, k) => teks(t, x + pad, y + pad + uk + k * lh - 1, uk, z.th || kepala, false, kepala ? '#FFFFFF' : null)); x += ws[i]; });
      y += tinggi;
    };
    if (b.head) { butuh(40); gambarBaris(b.head, true); }
    b.rows.forEach(r => gambarBaris(r, false));
    y += 6;
  };
  for (let mi = 0; mi < daftarModel.length; mi++) {
    halBaru();
    for (const b of daftarModel[mi]) {
      if (b.t === 'judul') { butuh(48); kotak(ML, y, 7, 40, b.warna); kotak(ML, y, LB, 40, null, '#1D3557'); teks(b.kode, ML + 16, y + 18, 15, 1, 0, b.warna); teks(b.judul, ML + 16 + lebarTeks(b.kode + '  ', 15, 1), y + 18, 15, 1); teks(b.meta, ML + 16, y + 32, 8.5, 0, 0, '#5A6B85'); y += 50; }
      else if (b.t === 'tabel') tabel(b);
      else if (b.t === 'p') paragraf(b.runs);
      else if (b.t === 'h') { butuh(40); y += 6; paragraf([{ x: b.x, b: 1 }], 12, 3); }
      else if (b.t === 'tanya') { butuh(30); paragraf([{ x: b.x, b: 1 }], 10, 2); }
      else if (b.t === 'jawab') { const uk = b.kode ? 8.4 : 10, lh = uk * 1.3, L = bungkus(b.x, LB - 12, uk, 0, b.kode); let i = 0; if(L.length*lh+8<180)butuh(L.length*lh+8); while (i < L.length) { butuh(lh + 10); const muat = Math.max(1, Math.floor((H - MB - y - 8) / lh)), pot = L.slice(i, i + muat); kotak(ML, y, LB, pot.length * lh + 8, null, '#999999'); pot.forEach((t, k) => teks(t, ML + 6, y + 4 + uk + k * lh - 1, uk, 0, b.kode)); y += pot.length * lh + 8; i += muat; } y += 6; }
      else if (b.t === 'garis') { for (let i = 0; i < b.n; i++) { butuh(18); c.push(`0.6 0.6 0.6 RG 0.5 w [1 2] 0 d ${ML} ${(H - y - 14).toFixed(2)} m ${W - MR} ${(H - y - 14).toFixed(2)} l S [] 0 d`); y += 18; } y += 4; }
      else if (b.t === 'kotak') { butuh(150); kotak(ML, y, LB, 140, null, '#999999'); y += 148; }
      else if (b.t === 'img') {
        let src = b.src;
        if (!src.startsWith('data:image/jpeg')) { const i = new Image(); await new Promise(r => { i.onload = r; i.onerror = r; i.src = src; }); const cv = document.createElement('canvas'); cv.width = i.naturalWidth || 900; cv.height = i.naturalHeight || 600; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(i, 0, 0); src = cv.toDataURL('image/jpeg', .85); }
        const uk = await ukuranGambar(src), lw = Math.min(LB, 420), lh = lw * uk.h / uk.w;
        butuh(lh + 8); const nama = 'Im' + (gambar.length + 1); gambar.push({ nama, bytes: dataUrlKeBytes(src), w: uk.w, h: uk.h });
        c.push(`q ${lw.toFixed(2)} 0 0 ${lh.toFixed(2)} ${ML} ${(H - y - lh).toFixed(2)} cm /${nama} Do Q`); kotak(ML, y, lw, lh, null, '#999999'); y += lh + 8;
      }
      else if (b.t === 'kaki') { butuh(20); y += 8; const t = pdfTeks(b.x); teks(t, W - MR - lebarTeks(t, 7.5), y + 8, 7.5, 0, 0, '#777777'); y += 14; }
    }
  }
  /* nomor halaman */
  hal.forEach((h, i) => { c = h; teks(`Halaman ${i + 1} / ${hal.length}`, W / 2 - 25, H - 22, 7.5, 0, 0, '#999999'); });
  /* rakit objek PDF */
  const enc = s => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 255; return a; };
  const bagian = [], offset = []; let pos = 0;
  const tambah = u8 => { bagian.push(u8); pos += u8.length; };
  const obj = (n, isi) => { offset[n] = pos; tambah(enc(`${n} 0 obj\n`)); (Array.isArray(isi) ? isi : [isi]).forEach(p => tambah(typeof p === 'string' ? enc(p) : p)); tambah(enc('\nendobj\n')); };
  tambah(enc('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
  const nHal = hal.length, idHal0 = 6, idIsi0 = idHal0 + nHal, idGbr0 = idIsi0 + nHal;
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, `<< /Type /Pages /Count ${nHal} /Kids [${hal.map((_, i) => `${idHal0 + i} 0 R`).join(' ')}] >>`);
  obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  obj(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  obj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
  const xo = gambar.map((g, i) => `/${g.nama} ${idGbr0 + i} 0 R`).join(' ');
  hal.forEach((_, i) => obj(idHal0 + i, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >>${xo ? ` /XObject << ${xo} >>` : ''} >> /Contents ${idIsi0 + i} 0 R >>`));
  hal.forEach((h, i) => { const s = h.join('\n'); obj(idIsi0 + i, `<< /Length ${s.length} >>\nstream\n${s}\nendstream`); });
  gambar.forEach((g, i) => obj(idGbr0 + i, [`<< /Type /XObject /Subtype /Image /Width ${g.w} /Height ${g.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${g.bytes.length} >>\nstream\n`, g.bytes, '\nendstream']));
  const total = idGbr0 + gambar.length, xref = pos;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`; for (let n = 1; n < total; n++) x += String(offset[n]).padStart(10, '0') + ' 00000 n \n';
  tambah(enc(x + `trailer\n<< /Size ${total} /Root 1 0 R /Info << /Title (LKPD Di Balik Sebuah Foto) /Producer (LKPD Digital Ekspedisi Kota Piksel) >> >>\nstartxref\n${xref}\n%%EOF`));
  return new Blob(bagian, { type: 'application/pdf' });
}

