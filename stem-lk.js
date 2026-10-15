'use strict';
/* LK interaktif v19 · Di Balik Sebuah Foto
   Setiap LK berupa rangkaian bingkai (frame) seperti pita film. Setiap bingkai berisi aktivitas
   interaktif dan satu penjelasan tertulis. Jawaban disimpan sebagai teks pada kunci field yang
   sama dengan LK v19 sehingga LK Gabungan, PDF, dan LK cetak tetap cocok. */
(function () {
  const MIN = 25; // panjang minimal penjelasan
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
    return el;
  };
  const uniq = a => [...new Set(a)];

  /* ---------- komponen ---------- */
  function chips(options, value, onChange, { multi = false, label } = {}) {
    const box = h('div', { class: 'lkx-chips', role: 'group', 'aria-label': label || 'Pilihan' });
    const cur = () => multi ? (value() || []) : value();
    const draw = () => {
      box.replaceChildren(...options.map(o => {
        const on = multi ? cur().includes(o) : cur() === o;
        return h('button', { type: 'button', class: 'lkx-chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: () => {
          if (multi) { const s = cur(); onChange(s.includes(o) ? s.filter(x => x !== o) : [...s, o]); } else onChange(cur() === o ? '' : o);
          draw();
        } }, o);
      }));
    };
    draw(); return box;
  }
  function field(labelText, input) {
    // Label hanya untuk satu kontrol isian; kelompok tombol memakai div agar klik tidak terpicu dua kali.
    if (input && /^(INPUT|SELECT|TEXTAREA)$/.test(input.tagName)) return h('label', { class: 'lkx-field' }, labelText, input);
    return h('div', { class: 'lkx-field', role: 'group' }, h('span', { class: 'lkx-flabel' }, labelText), input);
  }
  function textIn(value, onInput, attrs = {}) { const i = h('input', { type: 'text', maxlength: 300, ...attrs }); i.value = value || ''; i.addEventListener('input', () => onInput(i.value)); return i; }
  function selectIn(options, value, onChange) {
    const s = h('select', {}, h('option', { value: '' }, 'Pilih…'), ...options.map(o => h('option', { value: o }, o)));
    s.value = value || ''; s.addEventListener('change', () => onChange(s.value)); return s;
  }
  function note(text, kind = '') { return h('p', { class: 'lkx-note ' + kind, role: 'status' }, text); }

  /* ---------- isi tiap LK ---------- */
  const PENERIMA = ['Pembaca umum media sosial', 'Grup kelas tertutup', 'Guru pembimbing', 'Calon pembeli', 'Anggota ekskul', 'Warga sekolah'];
  const INFO = ['Tanggal foto', 'Orientasi tegak', 'Kejelasan objek utama', 'Nama berkas rapi', 'Lokasi umum (nama sekolah)', 'Lokasi persis (GPS)'];
  const SORT = [
    ['Ada tujuh titik di zona permukiman pada filter malam (20 titik ditampilkan).', 'Bukti'],
    ['Tokoh X pasti tinggal di rumah paling dekat titik malam.', 'Dugaan'],
    ['Titik pagi hari kerja muncul di zona pendidikan.', 'Bukti'],
    ['Tokoh X adalah seorang siswa.', 'Dugaan'],
    ['Pola titik pagi berulang pada beberapa hari kerja.', 'Bukti'],
    ['Zona perdagangan dikunjungi karena tokoh X bekerja di sana.', 'Dugaan'],
  ];
  const ZONA = ['Permukiman', 'Pendidikan', 'Perdagangan', 'Taman/lapangan', 'Layanan'];
  const WAKTU = ['Pagi hari kerja', 'Sore hari kerja', 'Malam', 'Akhir pekan'];
  const LAHAN = ['Permukiman', 'Vegetasi/pepohonan', 'Sawah/ladang', 'Badan air', 'Jalan', 'Lahan terbuka', 'Bangunan besar/industri'];
  const PETUNJUK = ['Papan nama/alamat', 'Wajah orang', 'Seragam/logo', 'Plat nomor', 'Bangunan khas', 'Rambu/nama jalan', 'Pemandangan khas'];
  const TINDAKAN = ['Hapus GPS EXIF dengan program', 'Matikan izin lokasi kamera', 'Potong atau buramkan petunjuk visual', 'Bagikan hanya ke grup tertutup', 'Kirim lewat aplikasi pesan biasa', 'Bagikan tangkapan layar foto'];

  const KOSONG = { nama: '-', objek: 'foto kelompok', masalah: '', penerima: [], info: [], petunjuk: [], petunjukBaru: [], tindakanBaru: [], tetap: [], fitur: [], rekContoh: 'Contoh: hapus GPS sebelum unggah', kondisi: '', alasan: '', pertanyaan: [] };
  const KS = api => (api && api.kasus && api.kasus()) || KOSONG;
  const first = (pref, all) => uniq([...pref, ...all]);

  const LK = {
    ips: [
      { key: 'tujuan', title: 'Penerima foto', prompt: K => `Mengapa informasi itu penting bagi penerima ${K.objek}, dan informasi mana yang justru tidak perlu ikut?`, starters: ['Penerima kami adalah', 'Informasi yang harus tetap ada adalah', 'Yang tidak perlu ikut adalah'],
        build(st, set, api) { const K = KS(api); return [field(`Siapa penerima ${K.objek}? (boleh lebih dari satu)`, chips(first(K.penerima, PENERIMA), () => st.penerima, v => set('penerima', v), { multi: true })),
          field('Informasi apa yang harus tetap ada pada foto?', chips(first(K.info, INFO), () => st.info, v => set('info', v), { multi: true }))]; },
        complete: st => (st.penerima || []).length && (st.info || []).length ? true : 'Pilih minimal satu penerima dan satu informasi.',
        summary: st => `Penerima: ${(st.penerima || []).join(', ')}. Informasi yang harus tetap ada: ${(st.info || []).join(', ')}.` },
      { key: 'peta', title: 'Bukti atau dugaan', prompt: 'Jelaskan satu pola pada Peta Jejak Lokasi dengan titik, waktu, dan zona. Tandai mana yang bukti dan mana yang dugaan.', starters: ['Pada filter', 'Buktinya adalah', 'Dugaan kami, tetapi belum pasti,'],
        build(st, set, api) {
          const out = h('div', { class: 'lkx-sort' });
          const fb = h('div');
          const draw = () => {
            out.replaceChildren(...SORT.map(([t], i) => h('div', { class: 'lkx-sortrow' }, h('span', {}, t),
              h('span', { class: 'lkx-seg' }, ...['Bukti', 'Dugaan'].map(c => h('button', { type: 'button', class: (st.sort || {})[i] === c ? 'on' : '', 'aria-pressed': (st.sort || {})[i] === c ? 'true' : 'false', onclick: () => { const ns = { ...(st.sort || {}), [i]: c }; set('sortScore', SORT.filter(([, k], j) => ns[j] === k).length, true); set('sort', ns); draw(); } }, c))))));
            const n = Object.keys(st.sort || {}).length;
            if (n === SORT.length) { const benar = st.sortScore || 0;
              fb.replaceChildren(note(benar === SORT.length ? `Tepat ${benar}/${SORT.length}. Bukti adalah hal yang terlihat di peta; dugaan adalah tafsiran yang belum pasti.` : `Tepat ${benar}/${SORT.length}. Periksa lagi: apakah pernyataan itu terlihat langsung di peta, atau tafsiran tentang orangnya?`, benar === SORT.length ? 'ok' : 'warn')); }
          };
          draw();
          return [h('p', { class: 'lkx-lead' }, 'Pilah contoh pernyataan berikut. Buka Peta Jejak Lokasi bila perlu.'), out, fb,
            h('div', { class: 'lkx-grid3' }, field('Zona yang kalian amati', selectIn(ZONA, st.zona, v => set('zona', v))), field('Filter waktu', selectIn(WAKTU, st.waktu, v => set('waktu', v))), field('Jumlah titik', textIn(st.titik, v => set('titik', v), { inputmode: 'numeric', maxlength: 4 })))];
        },
        complete: st => Object.keys(st.sort || {}).length === SORT.length && st.zona && st.waktu && st.titik ? true : 'Pilah semua pernyataan dan isi zona, waktu, serta jumlah titik.',
        summary: st => `Pemilahan bukti–dugaan: tepat ${st.sortScore || 0}/${SORT.length}. Pola yang diamati: ${st.titik} titik di zona ${st.zona} pada filter ${st.waktu}.` },
      { key: 'citra', title: 'Membaca citra', prompt: 'Jelaskan ciri yang kalian lihat untuk setiap tutupan lahan dan perbedaannya dengan peta fiktif.', starters: ['Tutupan lahan pertama terlihat dari', 'Berbeda dengan peta fiktif, citra ini'],
        build(st, set) { return [h('div', { class: 'lkx-grid3' }, field('Sumber citra', textIn(st.sumber, v => set('sumber', v))), field('Wilayah', textIn(st.wilayah, v => set('wilayah', v))), field('Tanggal citra', textIn(st.tanggal, v => set('tanggal', v)))),
          field('Pilih tepat tiga tutupan lahan yang terlihat', chips(LAHAN, () => st.lahan, v => set('lahan', v.slice(-3)), { multi: true }))]; },
        complete: st => st.sumber && st.wilayah && (st.lahan || []).length === 3 ? true : 'Isi sumber dan wilayah citra, lalu pilih tiga tutupan lahan.',
        summary: st => `Citra: ${st.sumber}, wilayah ${st.wilayah}${st.tanggal ? ', tanggal ' + st.tanggal : ''}. Tutupan lahan: ${(st.lahan || []).join(', ')}.` },
      { key: 'foto', title: 'Periksa tiga foto', prompt: 'Foto mana yang paling berisiko bagi penerima kalian, dan mengapa?', starters: ['Foto paling berisiko adalah', 'Walaupun GPS dihapus,'],
        build(st, set, api) {
          const K = KS(api), PT = first([...K.petunjukBaru, ...K.petunjuk], PETUNJUK);
          const box = h('div', { class: 'lkx-photos' });
          const draw = () => box.replaceChildren(...['F01', 'F02', 'F03'].map(f => {
            const p = (st.foto || {})[f] || {};
            const upd = (k, v) => { set('foto', { ...(st.foto || {}), [f]: { ...p, [k]: v } }); draw(); };
            const skor = (p.gps === 'Ada' ? 2 : p.gps === 'Belum diperiksa' ? 1 : 0) + (p.clue || []).length;
            const saran = skor >= 3 ? 'Tinggi' : skor >= 1 ? 'Sedang' : 'Rendah';
            return h('article', { class: 'lkx-photo' }, h('h4', {}, f),
              field('GPS EXIF', chips(['Ada', 'Tidak ada', 'Belum diperiksa'], () => p.gps, v => upd('gps', v))),
              field('Petunjuk visual yang terlihat', chips(PT, () => p.clue, v => upd('clue', v), { multi: true })),
              h('div', { class: 'lkx-meter r-' + saran.toLowerCase() }, h('span', { style: `width:${Math.min(100, 20 + skor * 16)}%` })),
              h('p', { class: 'lkx-small' }, `Saran risiko dari isian: ${saran}.`),
              field('Risiko menurut kelompok', chips(['Rendah', 'Sedang', 'Tinggi'], () => p.risiko, v => upd('risiko', v))));
          }));
          draw(); return [h('p', { class: 'lkx-lead' }, `F01–F03 adalah ${K.objek} milik kelompok. Isi untuk setiap foto; status GPS dibaca dari Bedah Foto atau notebook.`), box];
        },
        complete: st => ['F01', 'F02', 'F03'].every(f => (st.foto || {})[f]?.gps && (st.foto || {})[f]?.risiko) ? true : 'Isi status GPS dan risiko untuk F01, F02, dan F03.',
        summary: st => ['F01', 'F02', 'F03'].map(f => { const p = st.foto[f]; return `${f}: GPS ${p.gps.toLowerCase()}; petunjuk visual: ${(p.clue || []).join(', ') || 'tidak ada'}; risiko ${p.risiko.toLowerCase()}.`; }).join('\n') },
      { key: 'alternatif', title: 'Dua tindakan', prompt: K => `Tindakan mana yang lebih cocok untuk kasus ${K.nama}, dan apa keterbatasannya?`, starters: ['Tindakan yang lebih cocok adalah', 'Keterbatasannya adalah'],
        build(st, set, api) {
          const K = KS(api), TD = first(K.tindakanBaru, TINDAKAN);
          const wrap = h('div');
          const draw = () => {
            const pilih = st.pilih || [];
            wrap.replaceChildren(field('Pilih dua tindakan perlindungan untuk dibandingkan', chips(TD, () => pilih, v => { set('pilih', v.slice(-2)); draw(); }, { multi: true })),
              ...pilih.map((t, i) => h('div', { class: 'lkx-pair' }, h('h4', {}, t),
                h('div', { class: 'lkx-grid2' }, field('Kelebihan', textIn((st.plus || [])[i], v => { const a = [...(st.plus || [])]; a[i] = v; set('plus', a); })),
                  field('Keterbatasan', textIn((st.minus || [])[i], v => { const a = [...(st.minus || [])]; a[i] = v; set('minus', a); }))))));
          };
          draw(); return [wrap];
        },
        complete: st => (st.pilih || []).length === 2 && [0, 1].every(i => (st.plus || [])[i]?.trim() && (st.minus || [])[i]?.trim()) ? true : 'Pilih dua tindakan dan isi kelebihan serta keterbatasan masing-masing.',
        summary: st => st.pilih.map((t, i) => `${t}: kelebihan ${st.plus[i]}; keterbatasan ${st.minus[i]}.`).join('\n') },
      { key: 'rekomendasi', title: 'Tiga rekomendasi', prompt: K => `Rekomendasi mana yang paling penting untuk ${K.objek} dan mengapa?`, starters: ['Rekomendasi paling penting adalah', 'Buktinya dari'],
        build(st, set, api) {
          const K = KS(api), PN = first(K.penerima, PENERIMA);
          const rows = h('div', { class: 'lkx-recs' });
          const draw = () => rows.replaceChildren(...[0, 1, 2].map(i => { const r = (st.rec || [])[i] || {}; const upd = (k, v) => { const a = [...(st.rec || [{}, {}, {}])]; while (a.length < 3) a.push({}); a[i] = { ...(a[i] || {}), [k]: v }; set('rec', a); };
            return h('div', { class: 'lkx-rec' }, h('b', {}, `Rekomendasi ${i + 1}`), h('div', { class: 'lkx-grid3' },
              field('Tindakan', textIn(r.aksi, v => upd('aksi', v), { placeholder: 'Contoh: ' + K.rekContoh.replace(/^Contoh: /, '') })),
              field('Untuk penerima', selectIn(PN, r.untuk, v => upd('untuk', v))),
              field('Bukti pendukung', selectIn(['F01', 'F02', 'F03', 'Peta Jejak', 'Citra', 'Bedah Foto'], r.bukti, v => upd('bukti', v))))); }));
          draw(); return [rows];
        },
        complete: st => [0, 1, 2].every(i => (st.rec || [])[i]?.aksi?.trim() && st.rec[i].untuk && st.rec[i].bukti) ? true : 'Lengkapi tindakan, penerima, dan bukti untuk tiga rekomendasi.',
        summary: st => st.rec.map((r, i) => `${i + 1}. ${r.aksi} (untuk ${r.untuk.toLowerCase()}; bukti: ${r.bukti}).`).join('\n') },
    ],

    mat: [
      { key: 'prosedur', title: 'Data dan kontrol', needs: 'sim', prompt: 'Mengapa variabel itu harus dibuat sama?', starters: ['Agar perbandingan adil,', 'Yang dibuat sama adalah'],
        build(st, set, api) { const s = api.att().sim; const info = s ? `CSV: ${s.name || 'data simulator'} · ${s.rows.length} baris · set model ${s.rows[0].set_model} · kondisi: ${uniq(s.rows.map(r => r.kondisi)).join(', ')}.` : 'Unggah CSV simulator pada bingkai Bahan lebih dahulu.';
          return [note(info, s ? 'ok' : 'warn'), field('Apa yang dibuat sama pada ketiga kondisi?', chips(['Titik pusat model', 'Set data', 'Interval waktu', 'Durasi pengamatan', 'Jumlah satelit'], () => st.sama, v => set('sama', v), { multi: true }))]; },
        complete: (st, api) => !api.att().sim ? 'Unggah CSV simulator terlebih dahulu.' : (st.sama || []).length >= 3 ? true : 'Pilih minimal tiga hal yang dibuat sama.',
        summary: (st, api) => { const s = api.att().sim; return `Set model ${s.rows[0].set_model}; kondisi ${uniq(s.rows.map(r => r.kondisi)).join(', ')}. Dibuat sama: ${st.sama.join(', ')}.`; } },
      { key: 'sumbu', title: 'Beri label sumbu', needs: 'sim', prompt: 'Jelaskan skala yang dipakai pada kedua diagram.', starters: ['Pada diagram pertama, sumbu x', 'Skala sumbu y'],
        build(st, set) {
          const V = ['Waktu model', 'Simpangan', 'Jumlah satelit', 'Lintang'], U = ['detik', 'meter', 'buah', 'derajat'];
          const kunci = { d1x: ['Waktu model', 'detik'], d1y: ['Simpangan', 'meter'], d2x: ['Jumlah satelit', 'buah'], d2y: ['Simpangan', 'meter'] };
          const nama = { d1x: 'Diagram 1 · sumbu x', d1y: 'Diagram 1 · sumbu y', d2x: 'Diagram 2 · sumbu x', d2y: 'Diagram 2 · sumbu y' };
          const fb = h('div');
          const rows = Object.keys(kunci).map(k => h('div', { class: 'lkx-axis' }, h('span', {}, nama[k]), selectIn(V, (st[k] || [])[0], v => set(k, [v, (st[k] || [])[1]])), selectIn(U, (st[k] || [])[1], v => set(k, [(st[k] || [])[0], v]))));
          const cek = h('button', { type: 'button', class: 'secondary', onclick: () => { const b = Object.keys(kunci).filter(k => (st[k] || []).join() === kunci[k].join()).length; set('axisScore', b);
            fb.replaceChildren(note(b === 4 ? 'Semua label tepat.' : `${b}/4 tepat. Lihat judul sumbu pada diagram di bingkai Bahan.`, b === 4 ? 'ok' : 'warn')); } }, 'Periksa label');
          return [h('p', { class: 'lkx-lead' }, 'Pasangkan variabel dan satuan untuk setiap sumbu.'), ...rows, cek, fb];
        },
        complete: st => ['d1x', 'd1y', 'd2x', 'd2y'].every(k => (st[k] || []).filter(Boolean).length === 2) ? true : 'Pilih variabel dan satuan untuk keempat sumbu.',
        summary: st => `Diagram 1: x ${st.d1x.join(' (')}), y ${st.d1y.join(' (')}). Diagram 2: x ${st.d2x.join(' (')}), y ${st.d2y.join(' (')}). Label tepat ${st.axisScore ?? '-'}/4.` },
      { key: 'pola', title: 'Tunjuk titik bukti', needs: 'sim', prompt: 'Jelaskan pola waktu–simpangan dengan memakai kedua titik bukti.', starters: ['Pada detik ke-', 'Titik ini menunjukkan bahwa'],
        build(st, set, api) {
          const s = api.att().sim; if (!s) return [note('Unggah CSV simulator pada bingkai Bahan lebih dahulu.', 'warn')];
          const wrap = h('div');
          const draw = () => {
            const kond = st.kondisi || 'terbuka';
            const rows = s.rows.filter(r => r.kondisi === kond && api.num(r.waktu_s) !== null && api.num(r.simpangan_m) !== null);
            const cv = api.makeChart(s.rows, 'waktu_s', kond), g = cv.getContext('2d');
            const mx = Math.max(1, ...rows.map(r => api.num(r.waktu_s))), my = Math.max(1, ...rows.map(r => api.num(r.simpangan_m)));
            const px = r => [65 + api.num(r.waktu_s) / mx * 740, 365 - api.num(r.simpangan_m) / my * 300];
            (st.titik || []).forEach((t, i) => { const r = rows.find(x => x.waktu_s === t.w); if (!r) return; const [x, y] = px(r); g.strokeStyle = '#e8a33d'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 11, 0, 7); g.stroke(); g.fillStyle = '#172d46'; g.font = 'bold 18px Arial'; g.fillText(String(i + 1), x + 13, y - 10); });
            cv.style.cursor = 'crosshair'; cv.setAttribute('tabindex', '0');
            cv.addEventListener('click', e => { const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * 850 / b.width, y = (e.clientY - b.top) * 460 / b.height;
              let best = null, d = 1e9; for (const r of rows) { const [qx, qy] = px(r), dd = (qx - x) ** 2 + (qy - y) ** 2; if (dd < d) { d = dd; best = r; } }
              if (!best) return; const t = [...(st.titik || []), { w: best.waktu_s, s: best.simpangan_m, k: kond }].slice(-2); set('titik', t); draw(); });
            wrap.replaceChildren(field('Kondisi yang diamati', chips(['terbuka', 'gedung', 'kelas'], () => kond, v => { set('kondisi', v || 'terbuka'); set('titik', []); draw(); })),
              h('p', { class: 'lkx-lead' }, 'Ketuk dua titik pada diagram sebagai bukti pola.'), cv,
              h('ol', { class: 'lkx-points' }, ...(st.titik || []).map(t => h('li', {}, `${t.k}: detik ke-${t.w}, simpangan ${(+t.s).toFixed(1)} m`))));
          };
          draw(); return [wrap];
        },
        complete: st => (st.titik || []).length === 2 ? true : 'Ketuk dua titik bukti pada diagram.',
        summary: st => `Titik bukti (${st.titik[0].k}): ` + st.titik.map(t => `detik ke-${t.w} dengan simpangan ${(+t.s).toFixed(1)} m`).join('; ') + '.' },
      { key: 'hubungan', title: 'Satelit dan simpangan', needs: 'sim', prompt: 'Sebut bukti dari tabel, data kosong, atau pencilan yang kalian temukan.', starters: ['Dari tabel terlihat', 'Ada data kosong sebanyak'],
        build(st, set, api) {
          const s = api.att().sim; if (!s) return [note('Unggah CSV simulator pada bingkai Bahan lebih dahulu.', 'warn')];
          const g = {}; let kosong = 0;
          for (const r of s.rows) { const n = api.num(r.jumlah_satelit), v = api.num(r.simpangan_m); if (v === null || n === null) { kosong++; continue; } (g[n] = g[n] || []).push(v); }
          const keys = Object.keys(g).map(Number).sort((a, b) => a - b);
          const means = keys.map(k => g[k].reduce((a, b) => a + b, 0) / g[k].length);
          let trend = 0; for (let i = 1; i < means.length; i++) trend += Math.sign(means[i] - means[i - 1]);
          const arah = trend < -1 ? 'negatif' : trend > 1 ? 'positif' : 'tidak jelas';
          set('kosong', kosong, true);
          const tbl = h('div', { class: 'tablewrap' }, h('table', {}, h('tr', {}, h('th', {}, 'Jumlah satelit'), h('th', {}, 'Banyak data'), h('th', {}, 'Rata-rata simpangan (m)')), ...keys.map((k, i) => h('tr', {}, h('td', {}, k), h('td', {}, g[k].length), h('td', {}, means[i].toFixed(1))))));
          const fb = h('div');
          const pilihan = { 'Makin banyak satelit, simpangan cenderung makin kecil': 'negatif', 'Makin banyak satelit, simpangan cenderung makin besar': 'positif', 'Tidak tampak kecenderungan yang jelas': 'tidak jelas' };
          const show = () => { if (!st.asosiasi) return fb.replaceChildren(); const ok = pilihan[st.asosiasi] === arah; fb.replaceChildren(note(ok ? 'Pilihanmu sesuai dengan tabel. Ingat: ini asosiasi, bukan sebab akibat.' : 'Bandingkan lagi rata-rata simpangan dari jumlah satelit kecil ke besar.', ok ? 'ok' : 'warn')); };
          const c = chips(Object.keys(pilihan), () => st.asosiasi, v => { set('asosiasi', v); show(); });
          show();
          return [h('p', { class: 'lkx-lead' }, `Tabel dihitung dari CSV kalian. Data tanpa posisi: ${kosong} baris (tidak dihitung sebagai nol).`), tbl, field('Kecenderungan yang terlihat', c), fb];
        },
        complete: st => st.asosiasi ? true : 'Pilih kecenderungan yang terlihat.',
        summary: st => `Kecenderungan: ${st.asosiasi}. Data tanpa posisi: ${st.kosong ?? 0} baris.` },
      { key: 'prediksi', title: 'Prediksi untuk IPA', needs: 'sim', prompt: K => `Apa alasan prediksi kalian? Apa artinya prediksi kondisi ${K.kondisi || 'yang paling sering kalian alami'} bagi ${K.objek}? Prediksi ini akan diuji dengan foto nyata pada LK IPA.`, starters: ['Kami memprediksi', 'Alasannya'],
        build(st, set, api) {
          const urut = st.urut || ['terbuka', 'gedung', 'kelas'];
          if (!st.urut) set('urut', urut, true);
          const list = h('ol', { class: 'lkx-rank' });
          const draw = () => list.replaceChildren(...(st.urut || urut).map((k, i, arr) => h('li', {}, h('span', {}, k),
            h('span', {}, h('button', { type: 'button', class: 'secondary', disabled: i === 0, 'aria-label': 'Naikkan ' + k, onclick: () => { const a = [...arr];[a[i - 1], a[i]] = [a[i], a[i - 1]]; set('urut', a); set('dikunci', true); draw(); } }, '↑'),
              h('button', { type: 'button', class: 'secondary', disabled: i === arr.length - 1, 'aria-label': 'Turunkan ' + k, onclick: () => { const a = [...arr];[a[i + 1], a[i]] = [a[i], a[i + 1]]; set('urut', a); set('dikunci', true); draw(); } }, '↓')))));
          draw();
          const s = api.att().sim, fb = h('div');
          const cek = h('button', { type: 'button', class: 'secondary', onclick: () => {
            const m = k => { const v = s.rows.filter(r => r.kondisi === k && api.num(r.simpangan_m) !== null).map(r => api.num(r.simpangan_m)); return v.reduce((a, b) => a + b, 0) / Math.max(1, v.length); };
            const model = ['terbuka', 'gedung', 'kelas'].sort((a, b) => m(b) - m(a)); set('dikunci', true);
            fb.replaceChildren(note(`Menurut data model, urutan simpangan rata-rata: ${model.join(' > ')}. ` + (model.join() === (st.urut || urut).join() ? 'Urutan kalian sama.' : 'Urutan kalian berbeda; boleh diperbaiki dengan alasan.'), 'ok')); } }, 'Bandingkan dengan data model');
          const K = KS(api);
          return [K.kondisi ? note(`Kasus ${K.nama}: ${K.alasan} Perhatikan prediksi untuk kondisi ${K.kondisi}.`, 'case') : null, h('p', { class: 'lkx-lead' }, 'Urutkan dari simpangan terbesar (atas) ke terkecil (bawah).'), list, s ? cek : null, fb];
        },
        complete: st => st.dikunci ? true : 'Urutkan kondisi atau tekan Bandingkan dengan data model.',
        summary: st => `Prediksi urutan simpangan (terbesar ke terkecil): ${(st.urut || []).join(' > ')}.` },
      { key: 'batas', title: 'Boleh disimpulkan?', prompt: 'Apa yang belum dapat disimpulkan dari data SIMULASI untuk foto nyata kalian?', starters: ['Data SIMULASI tidak dapat', 'Untuk foto nyata, kami perlu'],
        build(st, set) {
          const K = [
            ['Pada data SIMULASI ini, kondisi dalam kelas memiliki simpangan rata-rata terbesar.', 'Boleh', 'Pernyataan ini merangkum data yang kalian lihat.'],
            ['Jumlah satelit yang sedikit pasti menyebabkan simpangan besar.', 'Tidak boleh', 'Diagram pencar hanya menunjukkan asosiasi, bukan sebab akibat.'],
            ['Foto kelompok kami diambil dalam radius 15 m dari lokasi sebenarnya.', 'Tidak boleh', 'Data model tidak membuktikan ketepatan foto nyata.'],
            ['Pada data ini, makin banyak satelit, simpangan cenderung makin kecil.', 'Boleh', 'Ini pernyataan asosiasi yang dibatasi pada data tersebut.'],
            ['Data kosong berarti simpangannya nol meter.', 'Tidak boleh', 'Data kosong berarti posisi tidak tersedia, bukan nol.'],
          ];
          const box = h('div', { class: 'lkx-sort' });
          const draw = () => box.replaceChildren(...K.map(([t, k, why], i) => { const v = (st.klaim || {})[i];
            return h('div', { class: 'lkx-sortrow' }, h('span', {}, t), h('span', { class: 'lkx-seg' }, ...['Boleh', 'Tidak boleh'].map(c => h('button', { type: 'button', class: v === c ? 'on' : '', 'aria-pressed': v === c ? 'true' : 'false', onclick: () => { const nk = { ...(st.klaim || {}), [i]: c }; set('klaimScore', K.filter(([, kk], j) => nk[j] === kk).length, true); set('klaim', nk); draw(); } }, c))),
              v ? h('small', { class: v === k ? 'lkx-ok' : 'lkx-warn' }, (v === k ? 'Tepat. ' : 'Belum tepat. ') + why) : null); }));
          draw(); return [h('p', { class: 'lkx-lead' }, 'Tentukan apakah klaim berikut boleh disimpulkan dari data.'), box];
        },
        complete: st => Object.keys(st.klaim || {}).length === 5 ? true : 'Nilai kelima klaim.',
        summary: st => `Penilaian klaim: tepat ${st.klaimScore ?? 0}/5.` },
    ],

    kka: [
      { key: 'kebutuhan', title: 'Kebutuhan pengguna', prompt: K => `Bukti apa dari LK IPS yang membuat ${K.objek} memerlukan fitur ini?`, starters: ['Dari LK IPS kami tahu', 'Program harus'],
        build(st, set, api) { const c = api.caseInfo(), K = KS(api);
          const inp = textIn(st.fitur, v => set('fitur', v), { placeholder: 'Tulis fitur kalian sendiri atau pilih ide di atas lalu sesuaikan' });
          return [note(`Arah pengembangan kasus: ${c[3] || '-'}`, 'ok'),
          field('Informasi yang harus tetap ada pada salinan', chips(first(K.tetap, ['Tanggal foto', 'Orientasi', 'Dimensi gambar', 'Kualitas piksel', 'File asli tetap utuh']), () => st.tetap, v => set('tetap', v), { multi: true })),
          K.fitur.length ? field('Ide fitur untuk kasus ini (pilih satu untuk mulai, lalu ubah kata-katanya)', chips(K.fitur, () => st.fitur, v => { if (v) { inp.value = v; set('fitur', v); } })) : null,
          field('Fitur tambahan yang akan dibuat', inp)]; },
        complete: st => (st.tetap || []).length && st.fitur?.trim() ? true : 'Pilih informasi yang harus tetap ada dan tulis fitur tambahan.',
        summary: st => `Harus tetap ada: ${st.tetap.join(', ')}. Fitur tambahan: ${st.fitur}.` },
      { key: 'dugaan', title: 'Dugaan sebelum uji', prompt: 'Mengapa kalian menduga begitu?', starters: ['Kami menduga Alternatif', 'karena'],
        build(st, set, api) {
          const wrap = h('div');
          const draw = () => wrap.replaceChildren(h('div', { class: 'lkx-grid2' }, ...[['A', 'Simpan ulang dengan Pillow', 'Buka foto lalu simpan sebagai berkas baru. Kodenya pendek.'], ['B', 'Hapus tag GPS saja', 'Data gambar disalin apa adanya; hanya tag GPS yang dibuang.']].map(([k, t, d]) =>
            h('button', { type: 'button', class: 'lkx-card' + (st.pilih === k ? ' on' : ''), 'aria-pressed': st.pilih === k ? 'true' : 'false', onclick: () => { set('pilih', k); set('sebelumUji', !api.att().testA && !api.att().testB, true); draw(); } }, h('b', {}, `Alternatif ${k}`), h('span', {}, t), h('small', {}, d)))),
            field(`Seberapa yakin? ${st.yakin || 3} dari 5`, (() => { const r = h('input', { type: 'range', min: 1, max: 5, step: 1 }); r.value = st.yakin || 3; r.addEventListener('input', () => { set('yakin', +r.value); r.parentElement.firstChild.textContent = `Seberapa yakin? ${r.value} dari 5`; }); return r; })()),
            st.pilih ? note(st.sebelumUji ? 'Dugaan dicatat sebelum hasil uji diunggah.' : 'Dugaan dicatat setelah ada hasil uji.', st.sebelumUji ? 'ok' : 'warn') : null);
          draw(); return [wrap];
        },
        complete: st => st.pilih ? true : 'Pilih alternatif yang kalian duga lebih baik.',
        summary: st => `Dugaan: Alternatif ${st.pilih} lebih baik (keyakinan ${st.yakin || 3}/5; ${st.sebelumUji ? 'ditulis sebelum uji' : 'ditulis setelah ada hasil uji'}).` },
      { key: 'alternatif', title: 'Bandingkan A dan B', needs: 'testA,testB', prompt: 'Kolom mana yang gagal dan mengapa? Jelaskan alasan pilihan kalian.', starters: ['Alternatif A gagal pada', 'karena', 'Kami memilih'],
        build(st, set, api) {
          const A = api.att().testA, B = api.att().testB;
          if (!A || !B) return [note('Unggah CSV uji Alternatif A dan B pada bingkai Bahan untuk melihat perbandingan.', 'warn')];
          const ca = api.testCounts(A.rows), cb = api.testCounts(B.rows);
          const bar = (lab, a, b, n) => h('div', { class: 'lkx-cmp' }, h('span', {}, lab), h('div', { class: 'lkx-bars' }, h('i', { class: 'a', style: `width:${a / n * 100}%` }, `A ${a}/${n}`), h('i', { class: 'b', style: `width:${b / n * 100}%` }, `B ${b}/${n}`)));
          const fb = h('div');
          const show = () => { if (!st.final) return fb.replaceChildren(); const c = st.final === 'A' ? ca : cb, o = st.final === 'A' ? cb : ca; fb.replaceChildren(note(c.k2 + c.k3 >= o.k2 + o.k3 ? 'Pilihan ini didukung hasil uji.' : 'Pilihan ini kalah pada K2/K3. Tulis alasan yang kuat atau tinjau kembali.', c.k2 + c.k3 >= o.k2 + o.k3 ? 'ok' : 'warn')); };
          const c = chips(['A', 'B'], () => st.final, v => { set('final', v); set('ringkas', `A: K1 ${ca.k1}/${ca.n}, K2 ${ca.k2}/${ca.n}, K3 ${ca.k3}/${ca.n}; B: K1 ${cb.k1}/${cb.n}, K2 ${cb.k2}/${cb.n}, K3 ${cb.k3}/${cb.n}`, true); show(); });
          set('ringkas', `A: K1 ${ca.k1}/${ca.n}, K2 ${ca.k2}/${ca.n}, K3 ${ca.k3}/${ca.n}; B: K1 ${cb.k1}/${cb.n}, K2 ${cb.k2}/${cb.n}, K3 ${cb.k3}/${cb.n}`, true);
          show();
          return [h('div', { class: 'lkx-cmpbox' }, bar('K1 GPS hilang', ca.k1, cb.k1, ca.n), bar('K2 piksel utuh', ca.k2, cb.k2, ca.n), bar('K3 tanggal–orientasi dan asli utuh', ca.k3, cb.k3, ca.n)),
            field('Alternatif yang dipilih kelompok', c), fb];
        },
        complete: (st, api) => !(api.att().testA && api.att().testB) ? 'Unggah CSV uji A dan B.' : st.final ? true : 'Pilih alternatif berdasarkan hasil uji.',
        summary: st => `Hasil uji ${st.ringkas}. Dipilih: Alternatif ${st.final}.` },
      { key: 'revisi', title: 'Catatan uji dan perbaikan', needs: 'test', prompt: 'Apa pelajaran terpenting dari pengujian ini?', starters: ['Setelah uji pertama,', 'Hasil uji ulang menunjukkan'],
        build(st, set, api) {
          const T = api.att().test;
          const box = h('div', { class: 'lkx-log' });
          const draw = () => { const L = st.log && st.log.length ? st.log : [{}];
            box.replaceChildren(...L.map((r, i) => h('div', { class: 'lkx-logrow' }, h('b', {}, `Uji ${i + 1}`),
              h('div', { class: 'lkx-grid3' }, ...[['temuan', 'Temuan'], ['ubah', 'Perubahan'], ['hasil', 'Hasil uji ulang']].map(([k, l]) => field(l, textIn(r[k], v => { const a = [...(st.log && st.log.length ? st.log : [{}])]; a[i] = { ...(a[i] || {}), [k]: v }; set('log', a); })))))),
              h('button', { type: 'button', class: 'secondary', onclick: () => { set('log', [...L, {}]); draw(); } }, 'Tambah catatan uji')); };
          draw();
          return [T ? note('Uji final: ' + api.testSummary(T.rows), 'ok') : note('Unggah CSV uji final pada bingkai Bahan.', 'warn'), field('Fitur kasus yang ditambahkan', textIn(st.fitur, v => set('fitur', v), { placeholder: KS(api).fitur[0] ? 'Contoh: ' + KS(api).fitur[0] : '' })), box];
        },
        complete: (st, api) => !api.att().test ? 'Unggah CSV uji final.' : st.fitur?.trim() && (st.log || []).some(r => r.temuan?.trim() && r.hasil?.trim()) ? true : 'Tulis fitur dan minimal satu catatan uji (temuan dan hasil).',
        summary: (st, api) => `Fitur: ${st.fitur}. Uji final: ${api.testSummary(api.att().test.rows)}\n` + st.log.filter(r => r.temuan).map((r, i) => `Uji ${i + 1}: temuan ${r.temuan}; perubahan ${r.ubah || '-'}; hasil ${r.hasil || '-'}.`).join('\n') },
      { key: 'ai', title: 'Bantuan AI', prompt: 'Apa yang kalian pelajari dari memeriksa saran AI?', starters: ['AI menyarankan', 'Kami memeriksanya dengan'],
        build(st, set, api) { const ta = h('textarea', { rows: 5, maxlength: 4000 }); ta.value = st.prompt || ''; ta.addEventListener('input', () => set('prompt', ta.value));
          const K = KS(api), cid = (api.caseInfo() || [])[0] || '', P = window.STEM_PROMPT && K.nama !== '-' ? window.STEM_PROMPT.buat(K) : [];
          const bank = P.length ? h('details', { class: 'lkx-bank' }, h('summary', {}, `Contoh prompt untuk kasus ${K.nama} (${P.length})`),
            h('p', { class: 'lkx-small' }, 'Pilih satu sebagai draf, ganti setiap bagian [dalam kurung siku], kirim ke AI, lalu uji kodenya.'),
            ...P.map(p => h('div', { class: 'lkx-pcard' }, h('b', {}, p.judul), h('span', { class: 'lkx-small' }, ' · ' + p.kapan), h('p', { class: 'lkx-ptext' }, p.teks),
              h('button', { type: 'button', class: 'secondary', onclick: () => { if (ta.value.trim() && !confirm('Ganti prompt yang sudah ditulis dengan draf ini?')) return; ta.value = p.teks; set('prompt', ta.value); ta.focus(); } }, 'Pakai sebagai draf'))),
            h('a', { href: 'bank-prompt.html' + (cid ? '?kasus=' + cid : ''), target: '_blank', rel: 'noopener' }, 'Buka Bank Prompt AI dan program awal')) : null;
          return [bank, field('Prompt yang kalian kirim ke AI (setelah bagian [ ] diganti; kode tidak perlu ditempel ulang, tulis "(kode program kami)")', ta), field('Bagian kode yang diubah', textIn(st.bagian, v => set('bagian', v), { placeholder: 'Contoh: fungsi lindungi_foto, baris penamaan berkas' })),
            field('Cara memeriksa saran AI', chips(['Menjalankan kode', 'Menguji 10 JPEG', 'Membaca setiap baris', 'Bertanya kepada guru', 'Membandingkan dengan dokumentasi'], () => st.cek, v => set('cek', v), { multi: true }))]; },
        complete: st => /\[(tempel|tulis|A\/B)[^\]]*\]/i.test(st.prompt || '') ? 'Ganti setiap bagian [dalam kurung siku] pada prompt dengan isi yang benar-benar dikirim.' : st.prompt?.trim() && st.bagian?.trim() && (st.cek || []).length >= 2 ? true : 'Tulis prompt, bagian kode, dan minimal dua cara memeriksa.',
        summary: st => `Prompt: "${st.prompt.trim()}". Bagian kode diubah: ${st.bagian}. Diperiksa dengan: ${st.cek.join(', ')}.` },
      { key: 'batas', title: 'Batas program', prompt: K => `Jelaskan perbedaan GPS EXIF dan petunjuk visual pada ${K.objek}.`, starters: ['Program kami belum dapat', 'Petunjuk visual'],
        build(st, set) { return [field('Hal yang belum ditangani program', chips(['Petunjuk visual dalam gambar', 'Format selain JPEG', 'Metadata lokasi di luar EXIF', 'Nama berkas yang memuat lokasi', 'Foto yang sudah terlanjur dibagikan'], () => st.batas, v => set('batas', v), { multi: true }))]; },
        complete: st => (st.batas || []).length ? true : 'Pilih minimal satu batas program.',
        summary: st => `Belum ditangani: ${st.batas.join(', ')}.` },
    ],

    ipa: [
      { key: 'prosedur', title: 'Rancangan pengukuran', prompt: 'Mengapa setiap variabel itu dikendalikan?', starters: ['Kami memakai ponsel yang sama agar', 'Jeda antarfoto'],
        build(st, set, api) { const K = KS(api); return [K.kondisi ? note(`Kasus ${K.nama}: ${K.alasan} Tetap ukur ketiga kondisi agar dapat dibandingkan.`, 'case') : null, h('div', { class: 'lkx-grid3' }, field('Ponsel (merek/model)', textIn(st.ponsel, v => set('ponsel', v))), field('Jeda antarfoto (detik)', textIn(st.jeda, v => set('jeda', v), { inputmode: 'numeric' })), field('Cuaca saat memotret', selectIn(['Cerah', 'Berawan', 'Hujan'], st.cuaca, v => set('cuaca', v)))),
          field('Variabel yang dikendalikan', chips(['Ponsel sama', 'Titik berdiri sama', 'Jeda sama', 'Jumlah foto sama', 'Izin lokasi aktif'], () => st.kendali, v => set('kendali', v), { multi: true }))]; },
        complete: st => st.ponsel?.trim() && st.jeda && (st.kendali || []).length >= 3 ? true : 'Isi ponsel, jeda, dan minimal tiga variabel terkendali.',
        summary: st => `Ponsel ${st.ponsel}; jeda ${st.jeda} detik; cuaca ${st.cuaca || '-'}. Dikendalikan: ${st.kendali.join(', ')}.` },
      { key: 'alat', title: 'Besaran dan alat ukur', prompt: 'Jelaskan dengan kata-kata sendiri bagaimana program mengubah lintang–bujur menjadi meter.', starters: ['Program mengambil lintang dan bujur', 'lalu menghitung'],
        build(st, set, api) {
          const Q = [['Besaran yang diukur', ['Jarak', 'Kecepatan', 'Waktu'], 'Jarak'], ['Satuan hasil', ['meter', 'derajat', 'detik'], 'meter'], ['Alat ukur', ['GPS ponsel dan program haversine', 'Penggaris', 'Stopwatch'], 'GPS ponsel dan program haversine']];
          const fb = h('div'), show = () => { const n = Q.filter(([l, , k]) => (st.q || {})[l] === k).length; if (Object.keys(st.q || {}).length === 3) fb.replaceChildren(note(n === 3 ? 'Ketiganya tepat.' : `${n}/3 tepat. Ingat: hasil program berupa jarak dalam meter.`, n === 3 ? 'ok' : 'warn')); };
          const qs = Q.map(([l, o]) => field(l, chips(o, () => (st.q || {})[l], v => { const nq = { ...(st.q || {}), [l]: v }; set('qScore', Q.filter(([ll, , k]) => nq[ll] === k).length, true); set('q', nq); show(); })));
          const s = api.att().spread; const first = s ? s.rows.filter(r => r.lintang !== '') : [];
          const ins = ['lat1', 'lon1', 'lat2', 'lon2'].map((k, i) => { const d = first[Math.floor(i / 2)]; const v = st[k] ?? (d ? (i % 2 ? d.bujur : d.lintang) : ['-6.4800', '106.8500', '-6.4801', '106.8501'][i]); return textIn(v, x => { set(k, x); calc(); }, { inputmode: 'decimal' }); });
          const out = h('p', { class: 'lkx-calc', role: 'status' });
          const calc = () => { const v = ins.map(i => parseFloat(i.value.replace(',', '.'))); if (v.some(isNaN)) { out.textContent = 'Isi empat angka koordinat.'; return; }
            const R = 6371000, r = Math.PI / 180, dp = (v[2] - v[0]) * r, dl = (v[3] - v[1]) * r, q = Math.sin(dp / 2) ** 2 + Math.cos(v[0] * r) * Math.cos(v[2] * r) * Math.sin(dl / 2) ** 2;
            const m = 2 * R * Math.asin(Math.sqrt(q)); out.textContent = `Jarak dua titik: ${m.toFixed(2)} m`; set('coba', m.toFixed(2), true); };
          calc(); show();
          return [...qs, fb, h('h4', {}, 'Coba rumus jarak (haversine)'), h('p', { class: 'lkx-small' }, 'Ubah angka koordinat dan amati jaraknya. Selisih 0,0001° kira-kira 11 m.'),
            h('div', { class: 'lkx-grid2' }, field('Lintang 1', ins[0]), field('Bujur 1', ins[1]), field('Lintang 2', ins[2]), field('Bujur 2', ins[3])), out];
        },
        complete: st => Object.keys(st.q || {}).length === 3 ? true : 'Jawab ketiga pertanyaan besaran, satuan, dan alat ukur.',
        summary: st => `Besaran ${(st.q || {})['Besaran yang diukur']}; satuan ${(st.q || {})['Satuan hasil']}; alat ${(st.q || {})['Alat ukur']} (tepat ${st.qScore ?? 0}/3). Percobaan kalkulator: ${st.coba || '-'} m.` },
      { key: 'analisis', title: 'Uji prediksi', needs: 'spread', prompt: 'Bandingkan rata-rata dan rentang ketiga kondisi. Apakah sesuai prediksi model? Mengapa?', starters: ['Rata-rata jarak terbesar ada pada', 'Dibandingkan prediksi,'],
        build(st, set, api) {
          const s = api.att().spread; if (!s) return [note('Unggah CSV sebaran lokasi pada bingkai Bahan lebih dahulu.', 'warn')];
          const stats = api.spreadStats(s.rows).filter(x => x.mean !== null), nyata = [...stats].sort((a, b) => b.mean - a.mean).map(x => x.k);
          const pm = api.matPrediction();
          const pred = st.pred || pm || null;
          const wrap = h('div');
          const draw = () => {
            const p = st.pred || pm;
            const cocok = p ? nyata.filter((k, i) => p[i] === k).length : 0;
            if (p) { set('cocok', cocok, true); set('nyata', nyata, true); set('predDipakai', p, true); if (st.kes) set('kes', st.kes); }
            wrap.replaceChildren(
              h('div', { class: 'lkx-duo' }, h('div', {}, h('h4', {}, 'Prediksi model (LK MAT)'), p ? h('ol', {}, ...p.map(k => h('li', {}, k))) : h('div', {}, note('Prediksi LK MAT tidak ditemukan di browser ini. Pilih urutan prediksi kalian:', 'warn'), chips(['terbuka > gedung > kelas', 'kelas > gedung > terbuka', 'gedung > kelas > terbuka', 'kelas > terbuka > gedung'], () => st.predText, v => { set('predText', v); set('pred', v ? v.split(' > ') : null); draw(); }))),
                h('div', {}, h('h4', {}, 'Hasil nyata (rata-rata terbesar ke terkecil)'), h('ol', {}, ...[...stats].sort((a, b) => b.mean - a.mean).map(x => h('li', {}, `${x.k}: ${x.mean.toFixed(1)} m (rentang ${(x.max - x.min).toFixed(1)} m)`))))),
              p ? note(`${cocok}/${nyata.length} posisi sama dengan prediksi.`, cocok === nyata.length ? 'ok' : 'warn') : null,
              field('Kesimpulan kelompok', chips(['Sesuai prediksi', 'Sebagian sesuai', 'Tidak sesuai'], () => st.kes, v => set('kes', v))));
          };
          draw(); return [wrap];
        },
        complete: (st, api) => !api.att().spread ? 'Unggah CSV sebaran lokasi.' : st.kes && (st.pred || api.matPrediction()) ? true : 'Tentukan prediksi (bila perlu) dan pilih kesimpulan.',
        summary: st => `Prediksi: ${(st.predDipakai || []).join(' > ')}. Hasil nyata: ${(st.nyata || []).join(' > ')} (${st.cocok ?? 0} posisi sama). Kesimpulan: ${st.kes}.` },
      { key: 'batas', title: 'Ketidakpastian', prompt: 'Sumber mana yang paling berpengaruh pada data kalian, dan bagaimana memperbaikinya?', starters: ['Sumber paling berpengaruh adalah', 'Perbaikan prosedur yang kami usulkan'],
        build(st, set, api) { const s = api.att().spread; const tanpa = s ? s.rows.filter(r => r.jarak_ke_pusat_m === '').length : null;
          return [s ? note(`Foto tanpa GPS pada data kalian: ${tanpa}.`, tanpa ? 'warn' : 'ok') : null,
            field('Sumber ketidakpastian', chips(['Atap dan tembok menghalangi sinyal', 'Pantulan sinyal dari gedung', 'Jumlah satelit berubah', 'Posisi berdiri bergeser', 'Ponsel memakai lokasi lama', 'Jumlah foto sedikit', 'Foto tanpa GPS'], () => st.sumber, v => set('sumber', v), { multi: true })),
            field('Satu perbaikan prosedur', textIn(st.perbaikan, v => set('perbaikan', v), { placeholder: 'Contoh: tunggu 30 detik setelah membuka kamera' }))]; },
        complete: st => (st.sumber || []).length >= 2 && st.perbaikan?.trim() ? true : 'Pilih minimal dua sumber dan tulis satu perbaikan.',
        summary: st => `Sumber ketidakpastian: ${st.sumber.join(', ')}. Perbaikan: ${st.perbaikan}.` },
      { key: 'implikasi', title: 'Lingkaran risiko', needs: 'spread', prompt: K => `Apa artinya lingkaran ini bagi ${K.objek}? Hubungkan dengan keputusan desain KKA kalian.`, starters: ['Lingkaran ini menunjukkan bahwa', 'Karena itu, program kami'],
        build(st, set, api) {
          const s = api.att().spread; if (!s) return [note('Unggah CSV sebaran lokasi pada bingkai Bahan lebih dahulu.', 'warn')];
          const stats = api.spreadStats(s.rows).filter(x => x.mean !== null);
          const wrap = h('div');
          const draw = () => {
            const K = KS(api), k = st.kond || (stats.some(z => z.k === K.kondisi) ? K.kondisi : stats[0]?.k), x = stats.find(z => z.k === k); if (!x) return wrap.replaceChildren(note('Belum ada data ber-GPS.', 'warn'));
            set('kond', k, true); set('radius', x.mean.toFixed(1), true);
            const cv = h('canvas', { width: 600, height: 340, role: 'img', 'aria-label': `Lingkaran sebaran ${x.mean.toFixed(1)} meter pada denah skematik` }), g = cv.getContext('2d');
            const px = 600 / 120; // 120 m selebar kanvas
            g.fillStyle = '#f4f7f2'; g.fillRect(0, 0, 600, 340);
            for (let gx = 0; gx < 600; gx += 15 * px) for (let gy = 0; gy < 340; gy += 15 * px) { g.fillStyle = '#d9e2d0'; g.fillRect(gx + 4, gy + 4, 15 * px - 8, 15 * px - 8); }
            g.fillStyle = '#ffffff'; g.fillRect(0, 160, 600, 20); g.fillRect(290, 0, 20, 340);
            g.beginPath(); g.arc(300, 170, x.mean * px, 0, 7); g.fillStyle = 'rgba(232,163,61,.28)'; g.fill(); g.strokeStyle = '#c47d12'; g.lineWidth = 3; g.stroke();
            g.fillStyle = '#173852'; g.beginPath(); g.arc(300, 170, 6, 0, 7); g.fill();
            g.fillStyle = '#173852'; g.font = '15px Arial'; g.fillText('Satu kotak ≈ 15 m (contoh bangunan)', 12, 330); g.fillText(`Rata-rata sebaran ${k}: ${x.mean.toFixed(1)} m`, 12, 22);
            wrap.replaceChildren(field('Kondisi', chips(stats.map(z => z.k), () => k, v => { set('kond', v || stats[0].k); draw(); })), cv,
              h('p', { class: 'lkx-small' }, `Lingkaran berjari-jari ${x.mean.toFixed(1)} m menunjukkan seberapa sempit area yang dapat ditunjuk oleh koordinat foto.`));
          };
          draw(); return [wrap];
        },
        complete: (st, api) => api.att().spread ? true : 'Unggah CSV sebaran lokasi.',
        summary: st => `Rata-rata sebaran kondisi ${st.kond}: ${st.radius} m (digambarkan sebagai lingkaran risiko).` },
    ],
  };

  /* ---------- pemasangan ---------- */
  let ctx = null;
  const TEAM = { key: 'kontribusi', title: 'Tim', team: true };

  function mount(id, api) {
    const root = document.getElementById('lkx'); if (!root) return;
    const steps = LK[id]; const a = api.answers();
    const bahan = ['mat', 'kka', 'ipa'].includes(id);
    const frames = [...(bahan ? [{ key: '_bahan', title: 'Bahan', bahan: true }] : []), ...steps, TEAM];
    ctx = { id, api, frames, steps, cur: Math.min(+(a._frame || 0), frames.length - 1) };
    const W = k => { try { return JSON.parse(a['w_' + k] || '{}'); } catch { return {}; } };
    const strip = h('nav', { class: 'lkx-strip', 'aria-label': 'Bingkai LK' });
    const stage = h('div', { class: 'lkx-stage' });
    const statusOf = f => f.bahan ? (bahanOk() ? 'done' : '') : f.team ? (a.kontribusi ? 'done' : '') : (a[f.key] ? 'done' : '');
    const bahanOk = () => { const t = api.att(); return id === 'mat' ? !!t.sim : id === 'kka' ? !!(t.testA && t.testB && t.test && t.code) : id === 'ipa' ? !!t.spread : true; };
    function drawStrip() {
      strip.replaceChildren(...frames.map((f, i) => h('button', { type: 'button', class: 'lkx-frame ' + statusOf(f) + (i === ctx.cur ? ' cur' : ''), 'aria-current': i === ctx.cur ? 'step' : null, onclick: () => go(i) },
        h('span', { class: 'n' }, String(i + 1)), h('span', { class: 't' }, f.title))));
      const done = frames.filter(f => statusOf(f) === 'done').length;
      meter.style.setProperty('--p', (done / frames.length * 100) + '%'); meterText.textContent = `${done} dari ${frames.length} bingkai selesai`;
    }
    const meter = h('div', { class: 'lkx-progress' }), meterText = h('span', { class: 'lkx-small' });
    const panes = [];
    function commit(step) {
      if (step.team) {
        const m = api.members(), t = W('kontribusi');
        const ok = m.length && m.every(x => (t[x] || '').trim().length >= 8);
        a.kontribusi = ok ? m.map(x => `${x}: ${t[x].trim()}`).join('\n') : '';
      } else if (!step.bahan) {
        const st = W(step.key), txt = (a['t_' + step.key] || '').trim();
        const c = step.complete(st, api);
        a[step.key] = c === true && txt.length >= MIN ? step.summary(st, api) + '\nPenjelasan: ' + txt : '';
      }
      api.persist(); api.completion(); drawStrip(); refreshStatus(step);
    }
    function refreshStatus(step) {
      const i = frames.indexOf(step), el = panes[i]?.querySelector('.lkx-status'); if (!el) return;
      let msg, kind;
      if (step.bahan) { msg = bahanOk() ? 'Semua bahan wajib sudah diunggah dan diperiksa.' : 'Unggah bahan yang diminta di bawah ini.'; kind = bahanOk() ? 'ok' : 'warn'; }
      else if (step.team) { msg = a.kontribusi ? 'Kontribusi semua anggota sudah tercatat.' : 'Isi kontribusi setiap anggota (minimal 8 karakter).'; kind = a.kontribusi ? 'ok' : 'warn'; }
      else { const c = step.complete(W(step.key), api), txt = (a['t_' + step.key] || '').trim();
        msg = c !== true ? c : txt.length < MIN ? `Tulis penjelasan minimal ${MIN} karakter (sekarang ${txt.length}).` : 'Bingkai ini selesai.'; kind = c === true && txt.length >= MIN ? 'ok' : 'warn'; }
      el.className = 'lkx-status ' + kind; el.textContent = msg;
    }
    function buildPane(step, i) {
      const pane = h('section', { class: 'lkx-pane', 'aria-labelledby': 'lkx-h' + i });
      const head = h('div', { class: 'lkx-head' }, h('span', { class: 'lkx-count' }, `Bingkai ${i + 1} dari ${frames.length}`), h('h3', { id: 'lkx-h' + i }, step.title), KS(api).nama !== '-' ? h('span', { class: 'lkx-casechip', style: `--case:${KS(api).warna}` }, KS(api).nama) : null);
      pane.append(head);
      const body = h('div', { class: 'lkx-body' });
      if (step.bahan) {
        const att = document.getElementById('attachments'); if (att) { att.classList.add('lkx-attach'); body.append(att); }
      } else if (step.team) {
        const m = api.members(), t = W('kontribusi');
        if (!m.length) body.append(note('Isi kode anggota pada Identitas bersama di atas.', 'warn'));
        m.forEach(x => body.append(field(`${x} menjelaskan atau mengerjakan…`, textIn(t[x], v => { const cur = W('kontribusi'); cur[x] = v; a.w_kontribusi = JSON.stringify(cur); commit(step); }, { placeholder: 'Contoh: menjelaskan cara membaca diagram 1' }))));
        const um = h('textarea', { rows: 2, maxlength: 6000 }); um.value = a.umpan || ''; um.addEventListener('input', () => { a.umpan = um.value; api.persist(); });
        body.append(field('Masukan guru dan tindak lanjut (bila ada)', um));
      } else {
        const st = W(step.key);
        const set = (k, v, quiet) => { st[k] = v; a['w_' + step.key] = JSON.stringify(st); if (!quiet) commit(step); else api.persist(); };
        const act = h('div', { class: 'lkx-act' }); step._act = act;
        const render = () => { act.replaceChildren(...[].concat(step.build(st, set, api)).filter(Boolean)); };
        step._render = render; render();
        const PR = typeof step.prompt === 'function' ? step.prompt(KS(api)) : step.prompt;
        const ta = h('textarea', { rows: 4, maxlength: 6000, 'aria-label': PR }); ta.value = a['t_' + step.key] || '';
        const count = h('span', { class: 'lkx-small' });
        const upd = () => { a['t_' + step.key] = ta.value; count.textContent = `${ta.value.trim().length} karakter`; commit(step); };
        ta.addEventListener('input', upd); count.textContent = `${ta.value.trim().length} karakter`;
        const st2 = h('div', { class: 'lkx-starters' }, h('span', { class: 'lkx-small' }, 'Pembuka kalimat:'), ...[...(KS(api).nama !== '-' ? [`Untuk ${KS(api).objek},`] : []), ...(step.starters || [])].map(s => h('button', { type: 'button', class: 'lkx-chip small', onclick: () => { const p = ta.selectionStart ?? ta.value.length; ta.value = ta.value.slice(0, p) + (p && !/\s$/.test(ta.value.slice(0, p)) ? ' ' : '') + s + ' ' + ta.value.slice(p); ta.focus(); upd(); } }, s)));
        body.append(act, h('div', { class: 'lkx-write' }, h('label', { class: 'lkx-field' }, PR, ta), st2, count));
      }
      pane.append(body, h('p', { class: 'lkx-status', role: 'status', 'aria-live': 'polite' }));
      pane.append(h('div', { class: 'lkx-nav' }, h('button', { type: 'button', class: 'secondary', disabled: i === 0, onclick: () => go(i - 1) }, 'Bingkai sebelumnya'),
        i < frames.length - 1 ? h('button', { type: 'button', onclick: () => go(i + 1) }, 'Bingkai berikutnya') : h('a', { class: 'secondary', href: '#simpan-lk', onclick: () => document.getElementById('savejson')?.focus() }, 'Ke bagian simpan hasil')));
      return pane;
    }
    function go(i) { ctx.cur = Math.max(0, Math.min(frames.length - 1, i)); a._frame = String(ctx.cur); api.persist(); panes.forEach((p, j) => p.hidden = j !== ctx.cur); drawStrip(); strip.children[ctx.cur]?.scrollIntoView({ block: 'nearest', inline: 'center' }); }
    frames.forEach((f, i) => { const p = buildPane(f, i); p.hidden = i !== ctx.cur; panes.push(p); stage.append(p); });
    const K = KS(api);
    root.replaceChildren(...(K.nama !== '-' ? [h('div', { class: 'lkx-casebar', style: `--case:${K.warna}` }, h('b', {}, 'Kasus ' + K.nama), h('span', {}, K.masalah))] : []), h('div', { class: 'lkx-top' }, meter, meterText), strip, stage);
    frames.forEach(f => refreshStatus(f)); drawStrip();
    ctx.onData = () => { steps.forEach(s => { if (s.needs && s._render) s._render(); commit(s); }); commit(TEAM); refreshStatus(frames[0]); drawStrip(); };
    ctx.onIdentity = () => { const i = frames.indexOf(TEAM); const np = buildPane(TEAM, i); np.hidden = panes[i].hidden; panes[i].replaceWith(np); panes[i] = np; commit(TEAM); };
  }
  window.LKX = { mount, onData: () => ctx && ctx.onData && ctx.onData(), onIdentity: () => ctx && ctx.onIdentity && ctx.onIdentity(), steps: LK };
})();
