'use strict';
/* Pembuat laporan HTML interaktif mandiri (satu berkas, tanpa internet).
   buildReportHTML(data) mengembalikan teks HTML lengkap. Data ditanam sebagai JSON yang
   karakter "<"-nya di-escape; seluruh isi dirender dengan textContent sehingga teks siswa
   tidak pernah dijalankan sebagai HTML. */
(function () {
  const CSS = `
:root{--ink:#11263a;--ink2:#1d3b57;--safe:#e8a33d;--teal:#1f7a6e;--rust:#b4602f;--paper:#fbfcfd;--mist:#eef3f7;--line:#d4dfe8;--text:#1b2b3a;--muted:#566b7e}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--text);font:17px/1.6 system-ui,'Segoe UI',Roboto,Arial,sans-serif}
h1,h2,h3,.disp{font-family:'Bahnschrift','Segoe UI Variable Display','Avenir Next Condensed','Roboto Condensed','Arial Narrow',system-ui;letter-spacing:.2px}
a{color:var(--teal)}
.draf{background:#fdf0dc;color:#6d3c05;padding:10px 20px;font-weight:600;text-align:center}
.cover{min-height:100vh;background:var(--ink);color:#e9f0f6;display:grid;grid-template-rows:auto 1fr auto;padding:28px max(20px,calc((100vw - 1080px)/2));position:relative;overflow:hidden}
.cover .sprocket{position:absolute;left:0;right:0;height:14px;background:repeating-linear-gradient(90deg,transparent 0 16px,rgba(255,255,255,.12) 16px 28px)}
.cover .sprocket.t{top:10px}.cover .sprocket.b{bottom:10px}
.cover .top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#a9c0d4;font-size:15px;padding-top:18px}
.cover .mid{align-self:center;max-width:860px}
.cover h1{font-size:clamp(40px,7vw,86px);line-height:.98;margin:.2em 0;color:#fff}
.cover .sub{font-size:clamp(18px,2.2vw,24px);color:#cfe0ee;max-width:46ch}
.cover .case{display:inline-block;background:var(--case,var(--safe));color:#fff;font-weight:700;border-radius:6px;padding:4px 12px;margin-bottom:10px}
.members{display:flex;flex-wrap:wrap;gap:8px;margin:22px 0}
.members span{border:1px solid #3d5c78;border-radius:99px;padding:5px 14px;color:#e9f0f6}
.cover .btns{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.btn{display:inline-block;border:2px solid var(--safe);background:var(--safe);color:var(--ink);font:700 16px system-ui;border-radius:9px;padding:11px 18px;cursor:pointer;text-decoration:none}
.btn.ghost{background:transparent;color:#fff}
.cover .chain{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding-bottom:26px}
.chain div{background:var(--ink2);border-top:4px solid var(--case,var(--safe));padding:10px 12px;border-radius:6px;font-size:14px;color:#cfe0ee}
.chain b{display:block;color:#fff;font-size:15px}
nav.toc{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid var(--line);display:flex;gap:4px;overflow-x:auto;padding:8px max(12px,calc((100vw - 1080px)/2))}
nav.toc a{flex:0 0 auto;text-decoration:none;color:var(--ink);padding:7px 12px;border-radius:7px;font-size:15px;font-weight:600}
nav.toc a.on{background:var(--ink);color:#fff}
nav.toc .present{margin-left:auto;background:var(--safe);color:var(--ink)}
section.ch{max-width:1080px;margin:0 auto;padding:56px 20px 30px;scroll-margin-top:56px}
.ch>.num{color:var(--safe);font:700 18px 'Bahnschrift',system-ui}
.ch h2{font-size:clamp(30px,4vw,46px);line-height:1.08;margin:.15em 0 .5em;color:var(--ink)}
.lead{font-size:20px;max-width:62ch;color:#2c4052}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.box{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.box h3{margin:0 0 6px;color:var(--ink);font-size:21px}
.tag{display:inline-block;font-size:13px;font-weight:700;border-radius:5px;padding:2px 8px;margin:0 6px 6px 0;background:var(--mist);color:var(--ink)}
.tag.ips{background:#f3e8d6}.tag.mat{background:#e4e8f8}.tag.kka{background:#dcefe9}.tag.ipa{background:#e6f1df}
.risk{height:10px;border-radius:99px;background:#e2e9ef;overflow:hidden;margin:8px 0}.risk i{display:block;height:100%}
.r-rendah i{background:#7fb5a6;width:30%}.r-sedang i{background:var(--safe);width:62%}.r-tinggi i{background:#c2522d;width:95%}
.quote{border-left:5px solid var(--safe);padding:6px 0 6px 16px;font-size:19px;white-space:pre-wrap}
.pre{white-space:pre-wrap;overflow-wrap:anywhere}
.chart{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;position:relative}
.chart svg{width:100%;height:auto;display:block;max-height:72vh}
body.present .chart svg{max-height:52vh}
.toggles{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 8px}
.toggles button{border:1.5px solid #9fb4c6;background:#fff;color:var(--ink);border-radius:99px;padding:6px 13px;font:600 14px system-ui;cursor:pointer}
.toggles button.on{background:var(--ink);border-color:var(--ink);color:#fff}
.tip{position:absolute;pointer-events:none;background:var(--ink);color:#fff;font-size:13px;padding:6px 9px;border-radius:6px;transform:translate(-50%,-120%);white-space:nowrap;opacity:0;transition:opacity .12s}
table{width:100%;border-collapse:collapse;font-size:15px;background:#fff}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}th{background:var(--ink);color:#fff;font-weight:600}
.tw{overflow-x:auto}
.ok{color:#11604f;font-weight:700}.no{color:#a63d1d;font-weight:700}
.bars .row{margin:10px 0}.bars .row span{font-weight:600}.bars i{display:block;height:24px;border-radius:5px;color:#fff;font-style:normal;font-size:13px;padding:3px 8px;margin-top:4px;min-width:62px;width:0;transition:width .9s ease}
.bars i.a{background:var(--rust)}.bars i.b{background:var(--teal)}
.timeline{list-style:none;padding:0;margin:0;border-left:3px solid var(--line)}
.timeline li{position:relative;padding:4px 0 14px 18px}.timeline li::before{content:"";position:absolute;left:-8px;top:10px;width:13px;height:13px;border-radius:50%;background:var(--safe)}
details{background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:10px 0}summary{cursor:pointer;font-weight:700;color:var(--ink)}
details pre{max-height:60vh;background:#0f2133;color:#e3edf5;padding:14px;border-radius:8px;overflow:auto;font-size:13px;line-height:1.5}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.gallery figure{margin:0;background:#fff;border:1px solid var(--line);border-radius:10px;overflow:hidden;cursor:zoom-in}
.gallery img{width:100%;height:180px;object-fit:cover;display:block}.gallery figcaption{padding:8px 10px;font-size:14px;color:var(--muted)}
.lightbox{position:fixed;inset:0;background:rgba(8,20,32,.92);display:none;align-items:center;justify-content:center;z-index:60;padding:20px;flex-direction:column;gap:10px}
.lightbox.on{display:flex}.lightbox img{max-width:100%;max-height:82vh;border-radius:8px}.lightbox p{color:#e9f0f6;margin:0}
.chainbig{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0;margin:14px 0}
.chainbig div{background:#fff;border:1px solid var(--line);padding:14px;position:relative}
.chainbig div+div{border-left:0}.chainbig div:not(:last-child)::after{content:"";position:absolute;right:-9px;top:50%;width:16px;height:16px;background:#fff;border-top:1px solid var(--line);border-right:1px solid var(--line);transform:translateY(-50%) rotate(45deg);z-index:2}
.chainbig b{display:block;color:var(--ink);font-size:16px}
.empty{color:var(--muted);font-style:italic}
footer{max-width:1080px;margin:30px auto;padding:20px;color:var(--muted);font-size:14px;border-top:1px solid var(--line)}
/* Mode presentasi */
body.present nav.toc,body.present footer,body.present .draf{display:none}
body.present .slide{display:none!important}
body.present .slide.cur{display:block!important;min-height:100vh;max-width:none;margin:0;padding:48px 6vw 90px;overflow:auto;height:100vh}
body.present .cover.slide.cur{display:grid!important}
body.present section.ch.cur h2{font-size:clamp(36px,5vw,60px)}
.pbar{position:fixed;left:0;right:0;bottom:0;height:54px;background:var(--ink);color:#e9f0f6;display:none;align-items:center;gap:12px;padding:0 16px;z-index:50}
body.present .pbar{display:flex}.pbar .prog{flex:1;height:6px;background:#2a4560;border-radius:9px;overflow:hidden}.pbar .prog i{display:block;height:100%;background:var(--safe);width:0}
.pbar button{background:#22405b;color:#fff;border:1px solid #3d5c78;border-radius:7px;padding:8px 12px;font:600 14px system-ui;cursor:pointer}
@media(max-width:760px){.grid2,.grid3,.chainbig,.cover .chain{grid-template-columns:1fr}.chainbig div+div{border-left:1px solid var(--line);border-top:0}.chainbig div::after{display:none}section.ch{padding-top:40px}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.bars i,.tip{transition:none}}
@media print{nav.toc,.pbar,.btns,.toggles{display:none}section.ch{break-inside:avoid-page}}
:focus-visible{outline:3px solid var(--safe);outline-offset:2px}`;

  function runtime(D) {
    const $ = s => document.querySelector(s);
    const h = (tag, attrs, ...kids) => { const el = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) { if (v == null || v === false) continue; if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); } for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); return el; };
    const S = 'http://www.w3.org/2000/svg';
    const sv = (tag, attrs) => { const el = document.createElementNS(S, tag); for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v); return el; };
    const lk = D.lk || {}, W = (m, k) => ((lk[m] || {}).w || {})[k] || {}, F = (m, k) => ((lk[m] || {}).f || {})[k] || '';
    const penj = t => { const i = String(t || '').indexOf('Penjelasan:'); return i < 0 ? '' : t.slice(i + 11).trim(); };
    const fx = (x, d) => Number(x).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
    const empty = t => h('p', { class: 'empty' }, t);
    const COL = { terbuka: '#1f7a6e', gedung: '#e8a33d', kelas: '#5467c2' };
    const main = $('#app');
    const id = D.id || {};
    const PF = id.profil || {}, CW = /^#[0-9a-fA-F]{6}$/.test(PF.warna || '') ? PF.warna : '#e8a33d';
    document.documentElement.style.setProperty('--case', CW);

    /* ---------- grafik ---------- */
    function scatter(rows, opt) {
      const box = h('div', { class: 'chart' }), tip = h('div', { class: 'tip' });
      const groups = [...new Set(rows.map(r => r.g))];
      let active = new Set(groups);
      const tg = h('div', { class: 'toggles', role: 'group', 'aria-label': 'Tampilkan kondisi' });
      const svg = sv('svg', { viewBox: '0 0 760 380', role: 'img', 'aria-label': opt.label });
      const draw = () => {
        svg.replaceChildren();
        const vis = rows.filter(r => active.has(r.g));
        const mx = opt.xMax || Math.max(1, ...rows.map(r => r.x)), my = opt.yMax || Math.max(1, ...rows.map(r => r.y));
        const X = v => 60 + v / mx * 670, Y = v => 330 - v / my * 290;
        for (let i = 0; i <= 5; i++) { const y = 330 - i * 58; svg.append(sv('line', { x1: 60, x2: 730, y1: y, y2: y, stroke: '#e1e8ee' })); const t = sv('text', { x: 52, y: y + 4, 'text-anchor': 'end', 'font-size': 12, fill: '#566b7e' }); t.textContent = fx(my * i / 5, opt.yDec ?? 1); svg.append(t); }
        (opt.xTicks || [0, 1, 2, 3, 4, 5].map(i => [mx * i / 5, fx(mx * i / 5, opt.xDec ?? 0)])).forEach(([v, lab]) => { const t = sv('text', { x: X(v), y: 350, 'text-anchor': 'middle', 'font-size': opt.xTicks ? 14 : 12, fill: opt.xTicks ? '#1b2b3a' : '#566b7e' }); t.textContent = lab; svg.append(t); });
        const xl = sv('text', { x: 395, y: 374, 'text-anchor': 'middle', 'font-size': 13, fill: '#1b2b3a' }); xl.textContent = opt.xLabel; svg.append(xl);
        const yl = sv('text', { x: 14, y: 190, 'font-size': 13, fill: '#1b2b3a', transform: 'rotate(-90 14 190)', 'text-anchor': 'middle' }); yl.textContent = opt.yLabel; svg.append(yl);
        vis.forEach((r, i) => { const c = sv('circle', { cx: opt.jitter ? X(r.x) + ((i * 37) % 28 - 14) : X(r.x), cy: Y(r.y), r: opt.r || 4, fill: COL[r.g] || '#1f7a6e', 'fill-opacity': .7, tabindex: opt.focus ? 0 : -1 });
          const show = () => { const b = box.getBoundingClientRect(), cb = c.getBoundingClientRect(); tip.textContent = opt.tip(r); tip.style.left = (cb.left - b.left + cb.width / 2) + 'px'; tip.style.top = (cb.top - b.top) + 'px'; tip.style.opacity = 1; };
          c.addEventListener('mouseenter', show); c.addEventListener('focus', show); c.addEventListener('mouseleave', () => tip.style.opacity = 0); c.addEventListener('blur', () => tip.style.opacity = 0); svg.append(c); });
        (opt.lines || []).filter(l => active.has(l.g)).forEach(l => { svg.append(sv('line', { x1: X(l.x) - 60, x2: X(l.x) + 60, y1: Y(l.y), y2: Y(l.y), stroke: '#11263a', 'stroke-width': 3, 'pointer-events': 'none' })); const t = sv('text', { x: X(l.x), y: Y(l.y) - 8, 'font-size': 13, 'font-weight': 600, 'text-anchor': 'middle', fill: '#11263a', 'pointer-events': 'none' }); t.textContent = l.text; svg.append(t); });
      };
      const tdraw = () => tg.replaceChildren(...groups.map(g => h('button', { type: 'button', class: active.has(g) ? 'on' : '', style: active.has(g) ? `background:${COL[g] || '#11263a'};border-color:${COL[g] || '#11263a'}` : `border-color:${COL[g] || '#9fb4c6'}`, 'aria-pressed': active.has(g) ? 'true' : 'false', onclick: () => { if (active.has(g) && active.size > 1) active.delete(g); else active.add(g); tdraw(); draw(); } }, g)));
      tdraw(); draw(); box.append(tg, svg, tip); return box;
    }
    function radius(stats) {
      const box = h('div', { class: 'chart' }); if (!stats.length) return empty('Belum ada data sebaran.');
      let cur = stats.some(s => s.k === PF.kondisi) ? PF.kondisi : stats[0].k; const tg = h('div', { class: 'toggles' }), svg = sv('svg', { viewBox: '0 0 600 320', role: 'img' }), cap = h('p', { class: 'pre' });
      const draw = () => { const x = stats.find(s => s.k === cur), px = 600 / 120; svg.replaceChildren(sv('rect', { x: 0, y: 0, width: 600, height: 320, fill: '#f4f7f2' }));
        for (let gx = 0; gx < 600; gx += 15 * px) for (let gy = 0; gy < 320; gy += 15 * px) svg.append(sv('rect', { x: gx + 4, y: gy + 4, width: 15 * px - 8, height: 15 * px - 8, fill: '#d9e2d0', rx: 3 }));
        svg.append(sv('rect', { x: 0, y: 150, width: 600, height: 20, fill: '#fff' }), sv('rect', { x: 290, y: 0, width: 20, height: 320, fill: '#fff' }));
        svg.append(sv('circle', { cx: 300, cy: 160, r: Math.max(3, x.mean * px), fill: 'rgba(232,163,61,.3)', stroke: '#c47d12', 'stroke-width': 3 }), sv('circle', { cx: 300, cy: 160, r: 6, fill: '#11263a' }));
        cap.textContent = `Kondisi ${x.k}: rata-rata jarak ${fx(x.mean, 1)} m. Satu kotak pada denah ≈ 15 m (sebesar satu bangunan). Lingkaran menunjukkan seberapa sempit area yang dapat ditunjuk oleh koordinat foto.`;
        tg.replaceChildren(...stats.map(s => h('button', { type: 'button', class: s.k === cur ? 'on' : '', onclick: () => { cur = s.k; draw(); } }, s.k))); };
      draw(); box.append(tg, svg, cap); return box;
    }
    const gp = v => String(v).toLowerCase() === 'true' ? 'ada' : 'tidak ada';
    const counts = rows => { const t = v => v === true || String(v).toLowerCase() === 'true'; const n = rows.length; return { n, k1: rows.filter(r => (!t(r.gps0) || String(r.gps1).toLowerCase() === 'false') && t(r.buka)).length, k2: rows.filter(r => t(r.buka) && t(r.dim) && t(r.hash)).length, k3: rows.filter(r => t(r.meta) && t(r.asli)).length }; };
    const statsOf = rows => ['terbuka', 'gedung', 'kelas'].map(k => { const d = rows.filter(r => r.k === k && r.jarak != null).map(r => r.jarak); const n = rows.filter(r => r.k === k).length; return { k, n, gps: d.length, mean: d.length ? d.reduce((a, b) => a + b, 0) / d.length : null, min: d.length ? Math.min(...d) : null, max: d.length ? Math.max(...d) : null }; });

    /* ---------- bab ---------- */
    const chapters = [];
    const ch = (key, title, build) => chapters.push({ key, title, build });
    const sp = statsOf((D.data || {}).spread || []).filter(s => s.mean !== null);
    const kka = W('kka', 'alternatif'), pred = (W('mat', 'prediksi').dikunci && W('mat', 'prediksi').urut) || W('ipa', 'analisis').predDipakai || null, real = [...sp].sort((a, b) => b.mean - a.mean).map(s => s.k);
    const finalC = (D.data || {}).test ? counts(D.data.test) : null;

    ch('masalah', 'Masalah dan tujuan', sec => {
      const t = W('ips', 'tujuan');
      sec.append(h('p', { class: 'lead' }, `Kasus kami: ${id.kasusNama || '-'}. ${PF.masalah || id.kebutuhan || ''}`),
        h('div', { class: 'grid2' },
          h('div', { class: 'box' }, h('h3', {}, 'Penerima foto'), (t.penerima || []).length ? h('div', {}, ...(t.penerima || []).map(x => h('span', { class: 'tag' }, x))) : empty('Belum diisi.'),
            h('h3', { style: 'margin-top:12px' }, 'Informasi yang harus tetap ada'), (t.info || []).length ? h('div', {}, ...(t.info || []).map(x => h('span', { class: 'tag' }, x))) : empty('Belum diisi.')),
          h('div', { class: 'box' }, h('h3', {}, 'Pertanyaan penuntun'), h('ol', {}, ...((PF.pertanyaan || []).length ? PF.pertanyaan : ['Seberapa tepat koordinat dalam foto menunjukkan tempat pemotretan?', 'Risiko apa yang tetap ada dari isi gambar walaupun GPS dihapus?', 'Bagaimana membuat salinan foto yang aman tetapi tetap berguna?']).map(q => h('li', {}, q))), id.kebutuhan ? h('p', { class: 'pre', style: 'color:var(--muted);font-size:15px' }, id.kebutuhan) : null)),
        h('h3', {}, 'Tujuan lintas mapel'), h('div', { class: 'grid2' },
          ...[['ipa', 'IPA', 'Mengukur ketepatan posisi yang tersimpan pada foto beserta ketidakpastiannya.'], ['mat', 'Matematika', 'Menafsirkan diagram pencar untuk membuat prediksi dan menyatakan batas kesimpulan.'], ['kka', 'KKA', 'Menulis dan menguji program Python yang melindungi metadata lokasi dengan AI yang diverifikasi.'], ['ips', 'IPS', 'Menafsirkan pola keruangan dan menilai risiko berbagi informasi lokasi.']]
            .map(([m, n, tx]) => h('div', { class: 'box' }, h('span', { class: 'tag ' + m }, n), h('p', {}, tx)))),
        penj(F('ips', 'tujuan')) ? h('p', { class: 'quote' }, penj(F('ips', 'tujuan'))) : null);
    });
    ch('risiko', 'Penyelidikan risiko foto', sec => {
      const f = W('ips', 'foto').foto || {}, pe = W('ips', 'peta'), ci = W('ips', 'citra'), al = W('ips', 'alternatif');
      sec.append(h('p', { class: 'lead' }, `Kami memeriksa tiga ${PF.objek || 'foto asli kelompok'} (F01–F03): metadata GPS dan petunjuk visual yang terlihat di dalam gambar.`),
        h('div', { class: 'grid3' }, ...['F01', 'F02', 'F03'].map(k => { const p = f[k] || {}; const r = String(p.risiko || '').toLowerCase();
          return h('div', { class: 'box' }, h('h3', {}, k), h('p', {}, `GPS EXIF: ${p.gps || 'belum diisi'}`), h('div', { class: 'risk r-' + (r || 'rendah') }, h('i')), h('p', {}, `Risiko: ${p.risiko || '-'}`), (p.clue || []).length ? h('div', {}, ...p.clue.map(c => h('span', { class: 'tag ips' }, c))) : h('p', { class: 'empty' }, 'Tidak ada petunjuk visual tercatat.')); })),
        penj(F('ips', 'foto')) ? h('p', { class: 'quote' }, penj(F('ips', 'foto'))) : null,
        h('div', { class: 'grid2', style: 'margin-top:16px' },
          h('div', { class: 'box' }, h('h3', {}, 'Pola di Peta Jejak (fiktif)'), pe.zona ? h('p', {}, `${pe.titik} titik di zona ${pe.zona} pada filter ${pe.waktu}. Ketepatan memilah bukti dan dugaan: ${pe.sortScore ?? '-'}/6.`) : empty('Belum diisi.'), penj(F('ips', 'peta')) ? h('p', { class: 'pre' }, penj(F('ips', 'peta'))) : null),
          h('div', { class: 'box' }, h('h3', {}, 'Membaca citra'), ci.sumber ? h('p', {}, `${ci.sumber}, ${ci.wilayah}${ci.tanggal ? ', ' + ci.tanggal : ''}.`) : empty('Belum diisi.'), h('div', {}, ...(ci.lahan || []).map(x => h('span', { class: 'tag ips' }, x))))),
        (al.pilih || []).length ? h('div', {}, h('h3', {}, 'Dua tindakan yang dibandingkan'), h('div', { class: 'tw' }, h('table', {}, h('tr', {}, h('th', {}, 'Tindakan'), h('th', {}, 'Kelebihan'), h('th', {}, 'Keterbatasan')), ...al.pilih.map((t, i) => h('tr', {}, h('td', {}, t), h('td', {}, (al.plus || [])[i] || ''), h('td', {}, (al.minus || [])[i] || '')))))) : null);
    });
    ch('model', 'Model dan prediksi', sec => {
      const sim = (D.data || {}).sim || [];
      sec.append(h('p', { class: 'lead' }, 'Sebelum mengukur, kami membaca data SIMULASI dari Simulator Posisi Ponsel untuk membuat prediksi. Data ini model, bukan foto nyata.'));
      if (sim.length) sec.append(scatter(sim.filter(r => r.s != null).map(r => ({ x: r.t, y: r.s, g: r.k, n: r.n })), { label: 'Diagram pencar waktu dan simpangan (SIMULASI)', xLabel: 'Waktu model (detik)', yLabel: 'Simpangan (m)', tip: r => `${r.g} · detik ${r.x} · ${fx(r.y, 1)} m · ${r.n ?? '-'} satelit`, focus: false }));
      else sec.append(empty('Data simulator tidak dilampirkan.'));
      const g = {}; sim.forEach(r => { if (r.s == null || r.n == null) return; (g[r.n] = g[r.n] || []).push(r.s); });
      const keys = Object.keys(g).map(Number).sort((a, b) => a - b);
      sec.append(h('div', { class: 'grid2', style: 'margin-top:16px' },
        h('div', { class: 'box' }, h('h3', {}, 'Jumlah satelit dan simpangan'), keys.length ? h('div', { class: 'tw' }, h('table', {}, h('tr', {}, h('th', {}, 'Satelit'), h('th', {}, 'Data'), h('th', {}, 'Rata-rata (m)')), ...keys.map(k => h('tr', {}, h('td', {}, k), h('td', {}, g[k].length), h('td', {}, fx(g[k].reduce((a, b) => a + b, 0) / g[k].length, 1)))))) : empty('-'),
          W('mat', 'hubungan').asosiasi ? h('p', {}, `Kesimpulan kelompok: ${W('mat', 'hubungan').asosiasi}. Ini asosiasi, bukan sebab akibat.`) : null),
        h('div', { class: 'box' }, h('h3', {}, 'Prediksi untuk diuji'), pred ? h('ol', {}, ...pred.map(k => h('li', {}, k))) : empty('Belum ada prediksi.'), h('p', {}, `Penilaian klaim: ${W('mat', 'batas').klaimScore ?? '-'}/5 tepat.`))),
        penj(F('mat', 'prediksi')) ? h('p', { class: 'quote' }, penj(F('mat', 'prediksi'))) : null);
    });
    ch('ukur', 'Pengukuran nyata', sec => {
      const sp0 = (D.data || {}).spread || [];
      const pr = W('ipa', 'prosedur');
      sec.append(h('p', { class: 'lead' }, `Kami memotret minimal lima foto di setiap titik acuan sekolah${pr.ponsel ? ' dengan ' + pr.ponsel : ''}, lalu program di notebook Google Colab menghitung jarak setiap foto ke titik pusat kondisinya.${PF.kondisi ? ' Kondisi yang paling dekat dengan kasus kami adalah ' + PF.kondisi + ': ' + PF.alasan.charAt(0).toLowerCase() + PF.alasan.slice(1) : ''}`));
      if (sp0.length) {
        const xi = { terbuka: 1, gedung: 3, kelas: 5 };
        sec.append(scatter(sp0.filter(r => r.jarak != null).map(r => ({ x: xi[r.k], y: r.jarak, g: r.k, kode: r.kode })), { label: 'Jarak setiap foto ke pusat', xLabel: 'Kondisi', yLabel: 'Jarak ke pusat (m)', xMax: 6, xTicks: [[1, 'terbuka'], [3, 'gedung'], [5, 'kelas']], jitter: true, r: 7, focus: true, tip: r => `${r.kode} · ${r.g} · ${fx(r.y, 1)} m`, lines: sp.map(s => ({ g: s.k, x: xi[s.k], y: s.mean, text: `rata-rata ${fx(s.mean, 1)} m` })) }));
        sec.append(h('div', { class: 'tw', style: 'margin-top:12px' }, h('table', {}, h('tr', {}, ...['Kondisi', 'Foto', 'Ber-GPS', 'Rata-rata (m)', 'Rentang (m)'].map(t => h('th', {}, t))), ...statsOf(sp0).map(s => h('tr', {}, h('td', {}, s.k), h('td', {}, s.n), h('td', {}, s.gps), h('td', {}, s.mean == null ? '–' : fx(s.mean, 2)), h('td', {}, s.max == null ? '–' : fx(s.max - s.min, 2)))))));
      } else sec.append(empty('Data sebaran lokasi tidak dilampirkan.'));
      sec.append(h('div', { class: 'grid2', style: 'margin-top:16px' },
        h('div', { class: 'box' }, h('h3', {}, 'Prediksi model'), pred ? h('ol', {}, ...pred.map(k => h('li', {}, k))) : empty('-')),
        h('div', { class: 'box' }, h('h3', {}, 'Hasil nyata'), real.length ? h('ol', {}, ...real.map((k, i) => h('li', {}, k, ' ', pred ? h('span', { class: pred[i] === k ? 'ok' : 'no' }, pred[i] === k ? '✓ sama' : '✗ berbeda') : ''))) : empty('-'), W('ipa', 'analisis').kes ? h('p', {}, `Kesimpulan: ${W('ipa', 'analisis').kes}.`) : null)),
        penj(F('ipa', 'analisis')) ? h('p', { class: 'quote' }, penj(F('ipa', 'analisis'))) : null,
        h('h3', {}, 'Lingkaran risiko'), radius(sp),
        (W('ipa', 'batas').sumber || []).length ? h('div', { class: 'box', style: 'margin-top:12px' }, h('h3', {}, 'Sumber ketidakpastian'), h('div', {}, ...W('ipa', 'batas').sumber.map(x => h('span', { class: 'tag ipa' }, x))), W('ipa', 'batas').perbaikan ? h('p', {}, 'Perbaikan prosedur: ' + W('ipa', 'batas').perbaikan) : null) : null);
    });
    ch('solusi', 'Rekayasa solusi', sec => {
      const A = (D.data || {}).testA, B = (D.data || {}).testB, dg = W('kka', 'dugaan'), kb = W('kka', 'kebutuhan');
      sec.append(h('p', { class: 'lead' }, `Kami menguji dua alternatif pada 10 JPEG yang sama di notebook Google Colab, lalu memilih berdasarkan bukti.${kb.fitur ? ' Fitur tambahan kami: ' + kb.fitur + '.' : ''}`));
      const g2 = h('div', { class: 'grid2' });
      g2.append(h('div', { class: 'box' }, h('h3', {}, 'Dugaan sebelum uji'), dg.pilih ? h('p', {}, `Alternatif ${dg.pilih} (keyakinan ${dg.yakin || 3}/5)${dg.sebelumUji ? ', ditulis sebelum uji.' : '.'}`) : empty('-'), h('h3', {}, 'Keputusan setelah uji'), kka.final ? h('p', { class: 'disp', style: 'font-size:28px;margin:0' }, `Alternatif ${kka.final}`) : empty('-')));
      const bars = h('div', { class: 'box bars' }, h('h3', {}, 'Hasil uji K1–K3'));
      if (A && B) { const a = counts(A), b = counts(B); [['K1 GPS hilang', 'k1'], ['K2 piksel utuh', 'k2'], ['K3 tanggal–orientasi dan asli utuh', 'k3']].forEach(([l, k]) => bars.append(h('div', { class: 'row' }, h('span', {}, l), h('i', { class: 'a', 'data-w': a[k] / a.n * 100 }, `A ${a[k]}/${a.n}`), h('i', { class: 'b', 'data-w': b[k] / b.n * 100 }, `B ${b[k]}/${b.n}`)))); }
      else bars.append(empty('CSV uji A dan B tidak dilampirkan.'));
      g2.append(bars); sec.append(g2);
      if ((D.data || {}).test) sec.append(h('h3', {}, `Uji final program: K1 ${finalC.k1}/${finalC.n} · K2 ${finalC.k2}/${finalC.n} · K3 ${finalC.k3}/${finalC.n}`), h('div', { class: 'tw' }, h('table', {}, h('tr', {}, ...['Foto', 'Sumber', 'GPS sebelum → sesudah', 'Piksel', 'Tanggal–orientasi', 'Asli utuh'].map(t => h('th', {}, t))),
        ...D.data.test.map(r => { const t = v => String(v).toLowerCase() === 'true'; const ck = v => h('td', { class: t(v) ? 'ok' : 'no' }, t(v) ? '✓' : '✗'); return h('tr', {}, h('td', {}, r.kode), h('td', {}, r.sumber), h('td', {}, `${gp(r.gps0)} → ${r.gps1 ? gp(r.gps1) : 'gagal dibaca'}`), ck(r.hash), ck(r.meta), ck(r.asli)); }))));
      const lg = (W('kka', 'revisi').log || []).filter(r => r.temuan);
      if (lg.length) sec.append(h('h3', {}, 'Catatan uji dan perbaikan'), h('ul', { class: 'timeline' }, ...lg.map((r, i) => h('li', {}, h('b', {}, `Uji ${i + 1}: `), `${r.temuan}. Perubahan: ${r.ubah || '-'}. Hasil: ${r.hasil || '-'}.`))));
      const ai = W('kka', 'ai');
      if (ai.prompt) sec.append(h('div', { class: 'box', style: 'margin-top:12px' }, h('h3', {}, 'Bantuan AI dan verifikasinya'), h('p', { class: 'quote' }, ai.prompt), h('p', {}, `Bagian kode diubah: ${ai.bagian || '-'}`), h('div', {}, ...(ai.cek || []).map(x => h('span', { class: 'tag kka' }, x)))));
      if (D.code) sec.append(h('details', {}, h('summary', {}, 'Lihat kode program kelompok'), h('pre', {}, D.code)));
      if ((W('kka', 'batas').batas || []).length) sec.append(h('p', {}, 'Batas program: ' + W('kka', 'batas').batas.join(', ') + '.'));
    });
    ch('protokol', 'Protokol berbagi foto', sec => {
      const rec = (W('ips', 'rekomendasi').rec || []).filter(r => r && r.aksi);
      sec.append(h('p', { class: 'lead' }, `Protokol ini ditujukan bagi pengguna ${PF.objek || 'foto'} dan disusun dari bukti keempat mapel.`), D.akhir.protokol ? h('p', { class: 'quote', style: 'font-size:21px' }, D.akhir.protokol) : empty('Protokol belum diisi.'),
        rec.length ? h('div', { class: 'grid3', style: 'margin-top:16px' }, ...rec.map((r, i) => h('div', { class: 'box' }, h('span', { class: 'tag' }, `Rekomendasi ${i + 1}`), h('h3', {}, r.aksi), h('p', {}, `Untuk: ${r.untuk || '-'}`), h('p', {}, `Bukti: ${r.bukti || '-'}`)))) : null,
        D.akhir.ujibaca ? h('div', { class: 'box', style: 'margin-top:16px' }, h('h3', {}, 'Uji baca oleh calon pengguna'), h('p', { class: 'pre' }, D.akhir.ujibaca)) : null);
    });
    ch('galeri', 'Dokumentasi', sec => {
      const ft = D.foto || [];
      if (!ft.length) return sec.append(empty('Kelompok belum menambahkan foto dokumentasi.'));
      const lb = h('div', { class: 'lightbox', role: 'dialog', 'aria-label': 'Foto diperbesar', onclick: () => lb.classList.remove('on') }), im = h('img', { alt: '' }), cp = h('p');
      lb.append(im, cp);
      sec.append(h('p', { class: 'lead' }, 'Foto disalin ulang oleh generator sehingga metadata aslinya tidak ikut tersimpan.'), h('div', { class: 'gallery' }, ...ft.map(f => h('figure', { tabindex: 0, onclick: () => { im.src = f.src; im.alt = f.cap || ''; cp.textContent = f.cap || ''; lb.classList.add('on'); }, onkeydown: e => { if (e.key === 'Enter') e.currentTarget.click(); } }, h('img', { src: f.src, alt: f.cap || 'Foto dokumentasi', loading: 'lazy' }), h('figcaption', {}, f.cap || '')))), lb);
    });
    ch('kesimpulan', 'Kesimpulan dan refleksi', sec => {
      sec.append(h('h3', {}, 'Rantai bukti kelompok kami'), h('div', { class: 'chainbig' },
        h('div', {}, h('span', { class: 'tag mat' }, 'MAT'), h('b', {}, 'Prediksi model'), pred ? `${pred[0]} paling besar` : '-'),
        h('div', {}, h('span', { class: 'tag ipa' }, 'IPA'), h('b', {}, 'Data nyata'), real.length ? `${real[0]} ${fx(sp.find(s => s.k === real[0]).mean, 1)} m` : '-'),
        h('div', {}, h('span', { class: 'tag kka' }, 'KKA'), h('b', {}, 'Keputusan desain'), kka.final ? `Alternatif ${kka.final}${finalC ? `, uji final ${finalC.k2}/${finalC.n}` : ''}` : '-'),
        h('div', {}, h('span', { class: 'tag ips' }, 'IPS'), h('b', {}, 'Protokol'), `${(W('ips', 'rekomendasi').rec || []).filter(r => r && r.aksi).length} rekomendasi berbukti`)),
        h('div', { class: 'grid2' }, h('div', { class: 'box' }, h('h3', {}, 'Kesimpulan integrasi'), D.akhir.kesimpulan ? h('p', { class: 'pre' }, D.akhir.kesimpulan) : empty('-')),
          h('div', { class: 'box' }, h('h3', {}, 'Risiko tersisa'), D.akhir.risiko ? h('p', { class: 'pre' }, D.akhir.risiko) : empty('-'))),
        h('div', { class: 'box', style: 'margin-top:16px' }, h('h3', {}, 'Refleksi kelompok'), D.akhir.refleksi ? h('p', { class: 'pre' }, D.akhir.refleksi) : empty('-')),
        h('h3', {}, 'Kontribusi anggota'), h('div', { class: 'grid2' }, ...['ips', 'mat', 'kka', 'ipa'].map(m => h('div', { class: 'box' }, h('span', { class: 'tag ' + m }, m.toUpperCase()), h('p', { class: 'pre' }, (lk[m] || {}).kontribusi || '-')))));
    });
    ch('lampiran', 'Lampiran jawaban LK', sec => {
      const lab = { ips: 'LK IPS', mat: 'LK Matematika', kka: 'LK KKA', ipa: 'LK IPA' };
      sec.append(h('p', {}, 'Jawaban lengkap empat LK, termasuk penjelasan setiap bingkai.'), ...['ips', 'mat', 'kka', 'ipa'].map(m => h('details', {}, h('summary', {}, lab[m]), ...((lk[m] || {}).q || []).map(([k, q]) => h('div', {}, h('p', { style: 'font-weight:700;margin-bottom:2px' }, q), h('p', { class: 'pre', style: 'margin-top:0' }, F(m, k) || '—'))))));
    });

    /* ---------- susun halaman ---------- */
    if (D.draf) main.append(h('div', { class: 'draf' }, 'DRAF — belum lengkap: ' + (D.kurang || []).join('; ')));
    const cover = h('header', { class: 'cover slide', id: 'sampul' }, h('div', { class: 'sprocket t' }), h('div', { class: 'top' }, h('span', {}, id.sekolah || ''), h('span', {}, `Kelas ${id.kelas || '-'} · Kelompok ${id.kelompok || '-'}`)),
      h('div', { class: 'mid' }, h('span', { class: 'case' }, 'Kasus ' + (id.kasusNama || '')), h('h1', {}, id.judul || 'Kit Berbagi Foto Aman'), h('p', { class: 'sub' }, 'Laporan proyek STEM Di Balik Sebuah Foto: mengukur jejak lokasi digital dan merekayasa perlindungan privasi.'),
        h('div', { class: 'members' }, ...(id.anggota || []).map(m => h('span', {}, m.nama ? `${m.nama} (${m.kode})` : m.kode))),
        h('div', { class: 'btns' }, h('a', { class: 'btn', href: '#masalah' }, 'Baca laporan'), h('button', { class: 'btn ghost', type: 'button', onclick: () => present(true) }, 'Mode presentasi'))),
      h('div', { class: 'chain' }, h('div', {}, h('b', {}, 'IPS'), 'Risiko dan penerima'), h('div', {}, h('b', {}, 'Matematika'), 'Model dan prediksi'), h('div', {}, h('b', {}, 'IPA'), 'Pengukuran nyata'), h('div', {}, h('b', {}, 'KKA'), 'Program teruji')), h('div', { class: 'sprocket b' }));
    main.append(cover);
    const toc = h('nav', { class: 'toc', 'aria-label': 'Bab laporan' });
    main.append(toc);
    const secs = chapters.map((c, i) => { const s = h('section', { class: 'ch slide', id: c.key }, h('div', { class: 'num' }, `Bab ${i + 1}`), h('h2', {}, c.title)); try { c.build(s); } catch (e) { s.append(empty('Bagian ini tidak dapat ditampilkan: ' + e.message)); } main.append(s); return s; });
    toc.append(...chapters.map(c => h('a', { href: '#' + c.key }, c.title)), h('a', { class: 'present', href: '#', onclick: e => { e.preventDefault(); present(true); } }, 'Mode presentasi'));
    main.append(h('footer', {}, `Dibuat dengan Generator Laporan Akhir v19 pada ${new Date(D.dibuat).toLocaleString('id-ID')}. Data latihan berlabel SIMULASI atau FIKTIF tidak membuktikan lokasi foto nyata.`));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { toc.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); e.target.querySelectorAll('.bars i[data-w]').forEach(i => i.style.width = i.dataset.w + '%'); } }), { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(s => io.observe(s));
    setTimeout(() => document.querySelectorAll('.bars i[data-w]').forEach(i => { if (!i.style.width || i.style.width === '0px') { const r = i.getBoundingClientRect(); if (r.top < innerHeight) i.style.width = i.dataset.w + '%'; } }), 300);

    /* ---------- mode presentasi ---------- */
    const slides = [cover, ...secs]; let cur = 0;
    const bar = h('div', { class: 'pbar' }), prog = h('div', { class: 'prog' }, h('i')), lbl = h('span');
    bar.append(h('button', { type: 'button', onclick: () => step(-1) }, '‹ Sebelumnya'), lbl, prog, h('button', { type: 'button', onclick: () => step(1) }, 'Berikutnya ›'), h('button', { type: 'button', onclick: () => present(false) }, 'Keluar (Esc)'));
    document.body.append(bar);
    function show() { slides.forEach((s, i) => s.classList.toggle('cur', i === cur)); lbl.textContent = `${cur + 1} / ${slides.length}`; prog.firstChild.style.width = ((cur + 1) / slides.length * 100) + '%'; slides[cur].scrollTop = 0; slides[cur].querySelectorAll('.bars i[data-w]').forEach(i => i.style.width = i.dataset.w + '%'); }
    function step(d) { cur = Math.max(0, Math.min(slides.length - 1, cur + d)); show(); }
    function present(on) { document.body.classList.toggle('present', on); if (on) { cur = 0; show(); if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); } else { slides.forEach(s => s.classList.remove('cur')); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } }
    document.addEventListener('keydown', e => { if (!document.body.classList.contains('present')) { if (e.key === 'p' || e.key === 'P') present(true); return; }
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(1); } else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); } else if (e.key === 'Escape') present(false); else if (e.key === 'Home') { cur = 0; show(); } else if (e.key === 'End') { cur = slides.length - 1; show(); } });
    window.__laporan = { present, step, slides: () => slides.length };
  }

  function buildReportHTML(data) {
    const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
    const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const title = esc((data.id && data.id.judul) || 'Laporan Proyek STEM') + ' · ' + esc(data.id && data.id.kelompok);
    return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'">' +
      '<title>' + title + '</title><style>' + CSS + '</style></head><body><div id="app"></div>' +
      '<script type="application/json" id="laporan-data">' + json + '</script>' +
      '<script>(' + runtime.toString() + ')(JSON.parse(document.getElementById("laporan-data").textContent));</script></body></html>';
  }
  window.STEM_REPORT = { buildReportHTML };
})();
