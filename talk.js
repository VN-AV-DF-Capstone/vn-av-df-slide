/* Bản thuyết trình v003: vẽ sơ đồ SVG từ các hàm nhỏ (box / icon / txt / arrow) và điều hướng từng trang.
   Số liệu lấy từ v003_model.md §5.3-5.6; không viết dấu đóng chú thích kiểu C trong comment. */
(function () {
  const INK = '#1d1d1d', MUTE = '#555';
  const COL = {
    blue:   { f: '#E4EEFA', s: '#6F9FD8' },
    orange: { f: '#FDEBDA', s: '#DE9A5E' },
    green:  { f: '#E4F3E1', s: '#7DB674' },
    purple: { f: '#EEE7F7', s: '#A38CCB' },
    yellow: { f: '#FFF5D2', s: '#D2AE40' },
    red:    { f: '#FBE1E0', s: '#D27B78' },
    grey:   { f: '#F3F3F3', s: '#A5A5A5' },
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* ---------- hai ngôn ngữ: chữ trong sơ đồ viết bằng tiếng Việt, bản Anh tra bảng EN_D theo từng dòng.
     Chữ ngoài sơ đồ (tiêu đề, ghi chú) nằm trong index.html / index.en.html. Số: bản Anh đổi dấu phẩy thập phân thành dấu chấm. */
  const EN = document.documentElement.lang === 'en';
  const miss = new Set();
  const HAS_VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const EN_D = {
    'Hình': 'Visual', 'Tiếng': 'Audio', 'Khớp?': 'Sync?', 'sham: tiếng thật clip khác': "sham: other clip's audio", 'so Hình với Tiếng': 'visual vs. audio', 'hình giả': 'fake visuals', 'HOẶC': 'OR', 'Lệch: có': 'Mismatch: yes', 'Lệch: không': 'Mismatch: no', 'Có AI: môi + tiếng': 'AI: lips + audio', 'thật': 'real', 'giả': 'fake', 'lệch': 'off', 'giọng AI đặt lên môi gốc': 'AI voice over original lips', 'lệch mà không có AI': 'out of sync, no AI involved',
    'Video thật': 'Real video', 'HÌNH': 'VISUAL',
    'TIẾNG': 'AUDIO', 'AI vẽ lại môi': 'AI redraws lips',
    'AI nhân bản giọng': 'AI voice cloning',
    'Hình giả?': 'Fake visuals?', 'bởi generator': 'by a generator',
    'Giọng giả?': 'Fake voice?',
    'Môi lệch?': 'Mismatch?',
    'Tiếng gốc': 'Original audio', 'Tiếng thật · clip khác': 'Real audio · other clip', 'Giọng AI': 'AI voice',
    'Hình thật': 'Real visual', 'môi gốc': 'original lips', 'Môi vẽ lại': 'Redrawn lips',
    'Không có AI': 'No AI', 'clip gốc': 'original clip',
    'tiếng thật của chính': 'real audio of the same', 'người đó, ở clip khác': 'person, from another clip',
    'Có AI: tiếng': 'AI: audio', 'giọng AI nhân bản': 'AI-cloned voice', 'giọng người đó': 'of that person',
    'Có AI: môi': 'AI: lips', 'môi vẽ lại': 'lips redrawn', 'theo tiếng gốc': 'to the original audio',
    'môi vẽ theo tiếng': 'lips drawn to the real', 'thật của clip khác': 'audio of another clip',
    'sửa một cụm bằng giọng AI,': 'one phrase replaced by AI voice,',
    'môi vẽ theo tiếng đã sửa': 'lips drawn to the edited audio', 'chìa khoá': 'key cell',
    'clip real · 40 người': 'real clips · 40 people',
    'file giả + thật': 'files, fake + real', 'có thành phần AI': 'contain AI',
    'gần ngẫu nhiên': 'near chance', 
    'không học được': 'fails to learn', 
    'âm thanh': 'waveform',
    'tư thế đầu': 'head pose', 
    'so với': 'based on', 'người đó': 'person',
    'dấu vết': 'trace', 'khớp': 'sync', 'giọng': 'voice', 
    'đóng băng': 'frozen', '1,94 M tham số học': '1.94 M trainable parameters',
    'đặc trưng': 'features', 
    '1,92 M tham số học': '1.92 M trainable parameters',
    'ngẫu nhiên (0,5)': 'chance (0.5)', 'cùng dữ liệu, cùng đầu vào': 'same data, same input', 'cùng nền Φ': 'same Φ backbone',
    'Bỏ từng nhánh của M1': 'Removing each M1 branch', 'Nhánh khớp': 'Sync branch', 'tác vụ: lệch tiếng-môi': 'task: audio-lip mismatch',
    'mất 0,30': 'drops 0.30', 'Nhánh dấu vết': 'Trace branch', 'tác vụ: hình giả': 'task: fake visuals', 'không đổi': 'no change',
    'Tham chiếu người': 'Person reference', 'tác vụ: có AI?': 'task: AI?',
    'Clip thật lệch tiếng bị báo giả': 'Real out-of-sync clips flagged as fake', 'AUC sham so với real · 0,5 = không nhầm': 'AUC sham vs. real · 0.5 = no confusion',
    'Chưa thấy → AUC giảm': 'Unseen → AUC drops', 'đã thấy': 'seen', 'chưa thấy': 'unseen', 'Giọng': 'Voice',
    'Khó nhất với M1': 'Hardest for M1', 'generator · họ diffusion': 'generator · diffusion family',
    'giọng · sửa một đoạn': 'voice · edits one segment', 'giọng · chỉ có ở test': 'voice · test only',
    'Giả cả clip 0,971 · giả một đoạn 0,941': 'Full-clip fakes 0.971 · partial fakes 0.941',
    'Giới hạn': 'Limitations', '1 seed · 10 người test': '1 seed · 10 test people',
    'kết luận cuối cần nhiều hơn': 'final conclusions need more', 'Baseline đơn kênh yếu bất thường': 'Single-channel baselines unusually weak',
    'khoảng cách +0,35 bị phóng đại': 'the +0.35 gap is exaggerated', 
    'chưa chứng minh được đóng góp': 'contribution not yet shown', 'Định vị đoạn giả': 'Localizing fake segments',
    'AP@0,5 chỉ khoảng 0,02': 'AP@0.5 is only about 0.02', 
    'bắt được clip giả': 'fakes caught', 'báo nhầm clip thật': 'real clips flagged', 'ở test': 'on test',
    'TTS · chuyển giọng': 'TTS · voice conversion', 'Ghép': 'Splice', 'A: cả câu': 'A: full sentence', 'B: một cụm': 'B: one phrase', 'Tiếng lái': 'Audio input', 'Trộn đoạn': 'Blend', 'Nhãn': 'Labels', 'hình · tiếng · lệch': 'visual, audio, sync', 'Kiểm lối tắt': 'Shortcut audit', 'giờ video': 'hours of video', 'File theo ô': 'Files per cell', 'Hình giả · theo generator': 'Fake visuals · by generator', 'Tiếng giả · theo hệ giọng': 'Fake audio · by voice system', 'Nhãn · % số file': 'Labels · % of files', 'tiếng giả': 'fake audio', 'lệch tiếng-môi': 'audio-lip mismatch',
    'nối lặng < 0,6 s': 'pauses < 0.6 s', 'đệm 0,15 s': 'pad 0.15 s', 'cùng người: cos ≥ 0,5': 'same person: cos ≥ 0.5', '12 / 3 / 5 mỗi giới': '12 / 3 / 5 per gender', 'có AI (hình hoặc tiếng)': 'AI-made (visual or audio)',
    'Tải': 'Fetch', 'Cắt': 'Cut', 'Kiểm hình': 'Visual check', 'Căn tiếng-hình': 'Audio-visual sync', 'Người, part': 'People, part', 'Lọc video ngang': 'Landscape filter', 'Tải 720p': 'Download 720p', 'thử lại 5/20/60 s': 'retry 5/20/60 s', 'Đầu vào': 'Input', 'khúc 32 ms → xác suất p': '32 ms chunk → probability p', 'Ngưỡng': 'Threshold', 'p ≥ 0,5 là có tiếng': 'p ≥ 0.5 means speech', 'Làm mượt': 'Smoothing', 'Cắt cửa sổ': 'Window cut', '4–7 s · chỗ ngắt dài nhất': '4–7 s · at the longest pause', 'Dò mặt': 'Face detection', 'hộp mặt + landmark': 'face box + landmarks', 'Cổng mặt': 'Face gate', 'conf ≥ 0,85 · cạnh ≥ 48 px': 'conf ≥ 0.85 · side ≥ 48 px', 'Hình học': 'Geometry', 'miệng rộng ≥ 12 % mặt': 'mouth width ≥ 12% of face', 'Liền mạch': 'Continuity', 'hụt ≤ 3 khung, ≤ 2 liền': '≤ 3 missed, ≤ 2 in a row', 'Chuyển cảnh': 'Scene change', 'histogram màu ≥ 0,55': 'color histogram ≥ 0.55', '5 khung miệng': '5 mouth frames', 'CNN tiếng': 'Audio CNN', 'CNN hình': 'Visual CNN', 'Khoảng cách theo độ lệch': 'Distance per lag', '−15 … +15 khung': '−15 … +15 frames', 'Đáy đường cong = độ lệch': 'Curve minimum = lag', '≤ 20 clip · lấy trung bình': '≤ 20 clips · averaged', 'Luật tin cậy': 'Reliability rule', 'conf ≥ 3,0 · đồng ý ≥ 80 %': 'conf ≥ 3.0 · agree ≥ 80%', 'Dịch tiếng về 0': 'Shift audio to 0', 'một hằng số cho cả video': 'one constant per video', 'Embedding': 'Embeddings', 'mặt: SFace': 'face: SFace', 'giọng: WeSpeaker': 'voice: WeSpeaker', 'Gom cụm': 'Clustering', 'so với registry': 'vs. the registry', 'Duyệt tay': 'Manual review', '15–20 clip mỗi người': '15–20 clips per person', 'Split theo người': 'Split by person', 'Chuẩn xuất': 'Export format',
    'Đóng gói': 'Packaging', 'nguồn tiếng': 'audio source', 'từ một lần chạy': 'from a single run', 'mọi file, cả real': 'every file, real included', 'Lấy lời': 'Transcribe', 'Nhân bản giọng': 'Voice cloning', 'co giãn ≤ ±15 %': 'stretch ≤ ±15%', 'Chỉ ở test': 'Test only', 'Tiếng clip khác': 'Other clip audio', 'ô 4': 'cell 4', 'ô 5 · cùng người': 'cell 5 · same person', 'cùng split': 'same split', 'ô 6': 'cell 6', 'Khung gốc': 'Original frames', 'giữ độ phân giải': 'keep resolution', 'Vẽ lại môi': 'Lip redraw', 'cả clip': 'whole clip', 'cách mép ≥ 0,5 s': '≥ 0.5 s from edges', '50 % cắt thẳng': '50% hard cut', '50 % trộn 2–6 khung': '50% blend 2–6 frames', 'Chỗ nối': 'Seams', 'mỗi 0,04 s': 'every 0.04 s', 'AUC mỗi đặc trưng': 'AUC per feature', 'trong 0,3–0,7': 'within 0.3–0.7',
    'Generator': 'Generator', '7 hệ giọng': '7 voice systems', '6 generator': '6 generators', 'giọng mẫu: clip khác, cùng người': 'voice sample: other clip, same person', 'mỗi cái một họ kiến trúc': 'one architecture family each', 'dùng chung · train, val, test': 'shared · train, val, test', 'chỉ ở test · chưa từng thấy': 'test only · never seen', 'sửa đoạn': 'segment edit', 'latent 1 bước': 'one-step latent', 'nhiều tầng': 'multi-stage', 'diffusion pixel': 'pixel diffusion', 'C: sửa đoạn': 'C: segment edit', 'full: cả clip': 'full: whole clip', 'phải trong 0,3–0,7': 'must stay within 0.3–0.7', 'sáu ô': 'six cells', 'Clip real': 'Real clip', 'giọng AI · ô 6': 'AI voice · cell 6',
    'Ghi chú: tắt (N)': 'Notes: off (N)', 'Ghi chú: bật (N)': 'Notes: on (N)',
  };
  function tr(s) {
    if (!EN) return s;
    if (EN_D[s] !== undefined) return EN_D[s];
    if (HAS_VI.test(s)) miss.add(s);
    return s.replace(/(\d),(\d)/g, '$1.$2').replace(/(\d) %/g, '$1%');
  }

  function box(x, y, w, h, c, o = {}) {
    const k = COL[c];
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 20}" fill="${o.fill ?? k.f}" ` +
      `stroke="${o.stroke ?? k.s}" stroke-width="${o.sw ?? 2.5}"${o.dash ? ' stroke-dasharray="10 8"' : ''}/>`;
  }
  function icon(n, x, y, s = 64, o = {}) {
    return `<g transform="translate(${x} ${y}) scale(${s / 48})" fill="none" stroke="${o.col ?? INK}" ` +
      `stroke-width="${o.sw ?? 2.6}" stroke-linecap="round" stroke-linejoin="round"><use href="#i-${n}"/></g>`;
  }
  function txt(x, y, lines, o = {}) {
    lines = [].concat(lines);
    const sz = o.size ?? 30, lh = o.lh ?? sz * 1.25;
    return `<text x="${x}" y="${y}" font-size="${sz}" font-weight="${o.w ?? 400}"${o.it ? ' font-style="italic"' : ''} ` +
      `text-anchor="${o.a ?? 'start'}" fill="${o.fill ?? INK}"${o.halo ? ' stroke="#fff" stroke-width="10" paint-order="stroke"' : ''}>` +
      lines.map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}">${esc(o.raw ? l : tr(l))}</tspan>`).join('') + '</text>';
  }
  function arrow(d, o = {}) {
    return `<path d="${d}" fill="none" stroke="${o.col ?? '#444'}" stroke-width="${o.sw ?? 3}"` +
      `${o.dash ? ' stroke-dasharray="9 7"' : ''} marker-end="url(#ah${o.m ?? ''})"/>`;
  }
  /* mũi tên gấp khúc qua các điểm pts, góc bo bán kính r */
  function rarr(pts, o = {}) {
    const r = o.r ?? 12;
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i - 1], [x, y] = pts[i], [nx, ny] = pts[i + 1];
      const l1 = Math.hypot(x - px, y - py), l2 = Math.hypot(nx - x, ny - y), k = Math.min(r, l1 / 2, l2 / 2);
      d += ` L${x - (x - px) / l1 * k} ${y - (y - py) / l1 * k} Q${x} ${y} ${x + (nx - x) / l2 * k} ${y + (ny - y) / l2 * k}`;
    }
    const e = pts[pts.length - 1];
    d += ` L${e[0]} ${e[1]}`;
    return `<path d="${d}" fill="none" stroke="${o.col ?? '#444'}" stroke-width="${o.sw ?? 3}"${o.dash ? ' stroke-dasharray="9 7"' : ''} marker-end="url(#ah${o.m ?? ''})"/>`;
  }
  function line(x1, y1, x2, y2, o = {}) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.col ?? '#888'}" stroke-width="${o.sw ?? 2}"` +
      `${o.dash ? ' stroke-dasharray="8 7"' : ''}/>`;
  }
  /* viên thuốc có chữ, canh giữa */
  function pill(x, y, w, h, c, t, o = {}) {
    const sz = o.size ?? 26;
    return box(x, y, w, h, c, { r: h / 2, fill: o.fill ?? '#fff', sw: o.sw ?? 2.5, dash: o.dash }) +
      txt(x + w / 2, y + h / 2 + sz * 0.35, t, { size: sz, a: 'middle', w: o.w ?? 400 });
  }
  /* khối có icon trái, tiêu đề + dòng phụ */
  function card(x, y, w, h, c, ic, title, sub, o = {}) {
    const isz = o.isz ?? 70, tx = x + (o.tx ?? 120), ts = o.ts ?? 34, ss = o.ss ?? 26;
    const subs = [].concat(sub || []);
    /* khối chữ (tiêu đề + dòng phụ) canh giữa theo chiều dọc của thẻ */
    const blockH = ts * 0.85 + (subs.length ? 12 + ss * 0.95 + (subs.length - 1) * 32 : 0);
    const base = y + (h - blockH) / 2 + ts * 0.85;
    return box(x, y, w, h, c, { fill: o.fill, dash: o.dash }) +
      icon(ic, x + 25, y + (h - isz) / 2, isz) +
      txt(tx, base, title, { size: ts, w: 700 }) +
      (subs.length ? txt(tx, base + 12 + ss * 0.95, subs, { size: ss, it: 1, lh: 32, fill: MUTE }) : '');
  }

  /* ---------- hình minh hoạ dùng chung: khuôn mặt sticker, sóng tiếng, ma trận khớp ---------- */
  /* ai = môi bị vẽ lại (đỏ, quầng nét đứt) */
  function face(x, y, w, h, mouth, ai) {
    const cx = x + w / 2, cy = y + h * 0.46, r = w * 0.27, my = cy + r * 0.55;
    let s = '<g style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.22))"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="#fff" stroke="' + (ai ? '#E3B5BA' : '#BFD0EA') + '" stroke-width="3"/></g>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#F3D6C2" stroke="#C9A58E" stroke-width="2"/>';
    s += '<path d="M' + (cx - r) + ' ' + (cy - 1) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + (cy - 1) + ' Z" fill="#6B5B53"/>';
    s += '<circle cx="' + (cx - r * 0.4) + '" cy="' + (cy + r * 0.12) + '" r="2.6" fill="#4A3B35"/><circle cx="' + (cx + r * 0.4) + '" cy="' + (cy + r * 0.12) + '" r="2.6" fill="#4A3B35"/>';
    s += '<ellipse cx="' + cx + '" cy="' + my + '" rx="' + r * 0.36 + '" ry="' + mouth + '" fill="' + (ai ? '#E04B45' : '#B5524A') + '"/>';
    if (ai) s += '<ellipse cx="' + cx + '" cy="' + my + '" rx="' + r * 0.7 + '" ry="' + r * 0.42 + '" fill="none" stroke="#D2514C" stroke-width="2.4" stroke-dasharray="5 4"/>';
    return s;
  }
  /* sóng tiếng; seed đổi dáng sóng; seg = [từ, đến, màu] tô một đoạn (tỉ lệ 0-1) */
  function wave(x, y, w, h, col, seed = 0, seg = null) {
    let s = '';
    const n = Math.floor(w / 10);
    for (let i = 0; i < n; i++) {
      const a = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.9 + seed) + 0.55 * Math.sin(i * 2.3 + 1 + seed * 1.7));
      const bh = Math.max(6, Math.min(1, a / 1.3) * h);
      const c = seg && i / n >= seg[0] && i / n < seg[1] ? seg[2] : col;
      s += '<rect x="' + (x + i * 10) + '" y="' + (y + (h - bh) / 2) + '" width="6" height="' + bh + '" rx="3" fill="' + c + '"/>';
    }
    return s;
  }
  /* ma trận điểm khớp 6 x 6: đường chéo sáng = khớp, rời rạc = lệch */
  function heat(x, y, ok) {
    let s = '';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const v = ok ? Math.exp(-((i - j) * (i - j)) / 0.9) : 0.22 * (0.5 + 0.5 * Math.sin(i * 7.3 + j * 3.1));
      const c = ok ? 'rgb(' + Math.round(238 - v * 170) + ',' + Math.round(246 - v * 100) + ',' + Math.round(238 - v * 150) + ')' :
        'rgb(' + Math.round(250 - v * 90) + ',' + Math.round(240 - v * 150) + ',' + Math.round(238 - v * 150) + ')';
      s += '<rect x="' + (x + j * 12) + '" y="' + (y + i * 12) + '" width="10.5" height="10.5" rx="2" fill="' + c + '"/>';
    }
    return s;
  }
  const D = {};

  /* ---------- bìa: dải ba viên Hình / Tiếng / Khớp? ---------- */
  D.cover = () => [
    ['blue', 'video', 'Hình', 0], ['orange', 'wave', 'Tiếng', 340], ['green', 'sync', 'Khớp?', 680],
  ].map((c) => box(c[3], 5, 320, 100, c[0]) + icon(c[1], c[3] + 28, 27, 56) + txt(c[3] + 105, 71, c[2], { size: 38, w: 700 })).join('');

  /* ---------- 2 · luồng gọn: mũi tên thẳng, góc bo nhỏ; bước AI là viên đậm nằm trên đường nối; mặt sticker, sóng tiếng, ma trận khớp trong nút ---------- */
  D.s3 = () => {
    const RED = '#B24A47';
    const strip = (x, y, ai) => face(x, y, 64, 80, 3, ai) + face(x + 72, y, 64, 80, 7, ai) + face(x + 144, y, 64, 80, 4.5, ai);
    /* nút lớn: nền pastel, icon + tiêu đề ở hàng trên */
    const node = (x, y, w, h, c, ic, title) => box(x, y, w, h, c) + icon(ic, x + 16, y + 14, 36) + txt(x + 64, y + 44, title, { size: 34, w: 700 });
    /* bước AI: viên đậm, nổi hẳn so với nút pastel */
    const aiPill = (cx, cy, label) => '<g style="filter:drop-shadow(0 3px 5px rgba(120,30,30,0.35))"><rect x="' + (cx - 160) + '" y="' + (cy - 24) + '" width="320" height="48" rx="24" fill="#B84A47"/></g>' +
      icon('bolt', cx - 144, cy - 15, 30, { col: '#fff', sw: 2.4 }) + txt(cx - 104, cy + 9, label, { size: 26, w: 700, fill: '#fff' });

    let s = '';
    /* đường nối trước, khối vẽ đè lên sau */
    s += arrow('M192 212 H202 Q220 212 220 194 V124 Q220 106 238 106 H248') + arrow('M192 212 H202 Q220 212 220 230 V300 Q220 318 238 318 H248');
    s += arrow('M492 106 H858') + arrow('M492 318 H858');
    s += arrow('M502 106 V512 Q502 530 520 530 H858') + '<circle cx="502" cy="106" r="6" fill="#444"/><circle cx="502" cy="318" r="6" fill="#444"/>' +
      txt(522, 508, 'so Hình với Tiếng', { size: 26, it: 1, fill: MUTE });
    s += arrow('M1192 106 H1312 Q1330 106 1330 124 V188') + arrow('M1192 318 H1312 Q1330 318 1330 300 V236');
    s += arrow('M1025 406 V448', { dash: 1 }) + txt(1045, 434, 'giọng AI đặt lên môi gốc', { size: 26, it: 1, fill: MUTE });
    s += arrow('M1025 656 V612');
    /* video thật: một khuôn mặt + sóng tiếng */
    s += box(0, 125, 190, 175, 'grey') + face(60, 138, 70, 84, 5, false) + wave(24, 232, 142, 34, '#E0A06A') + txt(95, 290, 'Video thật', { size: 26, w: 700, a: 'middle' });
    /* hai luồng */
    s += node(250, 20, 240, 172, 'blue', 'video', 'HÌNH') + strip(266, 100, false);
    s += node(250, 232, 240, 172, 'orange', 'wave', 'TIẾNG') + wave(270, 306, 200, 70, '#E0A06A');
    /* AI tác động lên từng luồng */
    s += aiPill(675, 106, 'AI vẽ lại môi') + aiPill(675, 318, 'AI nhân bản giọng');
    /* ba câu hỏi */
    s += node(860, 20, 330, 172, 'blue', 'eye', 'Hình giả?') + strip(878, 100, true);
    s += node(860, 232, 330, 172, 'orange', 'speaker', 'Giọng giả?') + wave(880, 306, 290, 70, '#D27B78');
    s += node(860, 450, 330, 160, 'green', 'sync', 'Môi lệch?') + heat(880, 510, true) + txt(964, 558, 'khớp', { size: 26, it: 1, fill: '#3F7A38' }) +
      heat(1040, 510, false) + txt(1124, 558, 'lệch', { size: 26, it: 1, fill: RED });
    /* sham: nhãn có đuôi */
    s += '<polygon points="840,660 1260,660 1292,687 1260,714 840,714" fill="' + COL.grey.f + '" stroke="' + COL.grey.s + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="862" cy="687" r="7" fill="#fff" stroke="' + COL.grey.s + '" stroke-width="2.5"/>' +
      txt(884, 697, 'sham: tiếng thật clip khác', { size: 26 }) + txt(1040, 750, 'lệch mà không có AI', { size: 26, it: 1, a: 'middle', fill: MUTE });
    /* AI? = hình giả HOẶC giọng giả: viên HOẶC gom hai đường, rồi thẻ kết quả có thanh điểm thật -> giả */
    s += '<g style="filter:drop-shadow(0 3px 5px rgba(90,60,0,0.3))"><rect x="1282" y="190" width="96" height="44" rx="22" fill="#B58A1E"/></g>' + txt(1330, 221, 'HOẶC', { size: 26, w: 700, a: 'middle', fill: '#fff' });
    s += arrow('M1380 212 H1458');
    s += box(1460, 132, 280, 160, 'yellow', { stroke: '#C9A12E', sw: 3.5 }) + icon('target', 1478, 146, 36) + txt(1526, 176, 'AI?', { size: 40, w: 700 });
    s += '<defs><linearGradient id="score" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#A8D8AD"/><stop offset="1" stop-color="#E9928D"/></linearGradient></defs>' +
      '<rect x="1482" y="208" width="236" height="18" rx="9" fill="url(#score)"/>' +
      '<circle cx="1668" cy="217" r="13" fill="#fff" stroke="#444" stroke-width="3"/>' +
      txt(1482, 262, 'thật', { size: 26, it: 1, fill: MUTE }) + txt(1718, 262, 'giả', { size: 26, it: 1, a: 'end', fill: MUTE });
    return s;
  };

  /* ---------- 5 · sáu ô ---------- */
  D.s5 = () => {
    const x0 = 350, cw = 462, gap = 12;
    const heads = [['wave', 'Tiếng gốc'], ['wave', 'Tiếng thật · clip khác'], ['speaker', 'Giọng AI']];
    let s = heads.map((h, i) => {
      const x = x0 + i * (cw + gap);
      return box(x, 0, cw, 100, 'grey', { fill: '#fff' }) + icon(h[0], x + 22, 26, 48) + txt(x + 86, 61, h[1], { size: 30, w: 700 });
    }).join('');
    const rows = [['face', 'Hình thật', 'môi gốc'], ['bolt', 'Môi vẽ lại', 'bởi generator']];
    s += rows.map((r, j) => {
      const y = 120 + j * 330;
      return icon(r[0], 10, y + 85, 70) + txt(100, y + 140, r[1], { size: 36, w: 700 }) + txt(100, y + 180, r[2], { size: 28, it: 1, fill: MUTE });
    }).join('');
    /* [tên, màu, AI, mismatch, sticker đơn màu cạnh mô tả, mô tả]; AI và mismatch gộp một dòng, ngăn bằng | */
    const cells = [
      ['1. real', 'green', 'Không có AI', 'Lệch: không', 'film', ['clip gốc']],
      ['2. sham', 'green', 'Không có AI', 'Lệch: có', 'user', ['tiếng thật của chính', 'người đó, ở clip khác']],
      ['3. voice', 'orange', 'Có AI: tiếng', 'Lệch: có', 'speaker', ['giọng AI nhân bản', 'giọng người đó']],
      ['4. source', 'orange', 'Có AI: môi', 'Lệch: không', 'lips', ['môi vẽ lại', 'theo tiếng gốc']],
      ['5. donor', 'orange', 'Có AI: môi', 'Lệch: không', 'lips', ['môi vẽ theo tiếng', 'thật của clip khác']],
      ['6. both', 'orange', 'Có AI: môi + tiếng', 'Lệch: không', 'sliders', ['sửa một cụm bằng giọng AI,', 'môi vẽ theo tiếng đã sửa']],
    ];
    s += cells.map((c, i) => {
      const x = x0 + (i % 3) * (cw + gap), y = 120 + Math.floor(i / 3) * 330;
      const hl = i === 1;
      return box(x, y, cw, 310, c[1], hl ? { stroke: '#C05A5A', sw: 5, dash: true } : {}) +
        txt(x + 28, y + 80, c[0], { size: 50, w: 700 }) +
        txt(x + 28, y + 150, tr(c[2]) + ' | ' + tr(c[3]), { size: 28, w: 600 }) +
        icon(c[4], x + 28, y + (c[5].length > 1 ? 216 : 200), 36, { col: MUTE, sw: 3 }) +
        txt(x + 78, y + 226, c[5], { size: 26, fill: MUTE, lh: 32 }) +
        (hl ? pill(x + 28, y - 20, 190, 40, 'yellow', 'chìa khoá', { size: 26, fill: '#FFF5D2', w: 700 }) : '');
    }).join('');
    return s;
  };

  /* ---------- 6r · pipeline dữ liệu real: năm khối, mỗi khối là một mô hình và các lớp của nó ---------- */
  D.s6r = () => {
    const GAP = 20, PH = 690;
    /* một lớp: tên in đậm, dòng thông số bên dưới; trả [svg, cao] */
    const layer = (x, y, w, c, name, params) => {
      params = [].concat(params);
      const h = 68 + 25 * (params.length - 1);
      return [box(x, y, w, h, c, { fill: '#fff', r: 14, sw: 2 }) + txt(x + 14, y + 28, name, { size: 22, w: 700 }) +
        txt(x + 14, y + 56, params, { size: 21, lh: 25, fill: '#333' }), h];
    };
    const down = (cx, y) => arrow(`M${cx} ${y + 2} V${y + GAP - 2}`, { sw: 2 });
    /* chồng các lớp theo chiều dọc, mũi tên nhỏ nối giữa các lớp */
    const stack = (x, w, c, layers) => {
      let y = 140, s = '';
      layers.forEach((l, i) => {
        const [g, h] = layer(x + 16, y, w - 32, c, l[0], l[1]);
        s += g;
        y += h;
        if (i < layers.length - 1) { s += down(x + w / 2, y); y += GAP; }
      });
      return s;
    };
    const head = (x, w, n, title, chip, cc) =>
      `<circle cx="${x + 34}" cy="40" r="20" fill="#5B8DD6"/>` + txt(x + 34, 48, String(n), { size: 24, a: 'middle', w: 700, fill: '#fff', raw: 1 }) +
      txt(x + 66, 49, title, { size: 30, w: 700 }) + pill(x + 16, 80, w - 32, 42, cc, chip, { size: 24, w: 700 });
    const W = [250, 320, 320, 420, 320], PAD = (1760 - 1630) / 4;
    const X = []; let xx = 0; W.forEach((w) => { X.push(xx); xx += w + PAD; });
    const panel = (i, c, fill, h) => box(X[i], 0, W[i], h, c, { fill, sw: 2 });
    let s = '';

    /* 1 · tải */
    s += panel(0, 'grey', '#F6F6F6', 316) + head(X[0], W[0], 1, 'Tải', 'yt-dlp', 'grey') +
      stack(X[0], W[0], 'grey', [['Lọc video ngang', '≥ 720p · ≥ 25 fps'], ['Tải 720p', 'thử lại 5/20/60 s']]);

    /* 2 · cắt */
    s += panel(1, 'orange', '#FFF6EC', PH) + head(X[1], W[1], 2, 'Cắt', 'Silero VAD', 'orange') +
      stack(X[1], W[1], 'orange', [['Đầu vào', '16 kHz · mono'], ['VAD', 'khúc 32 ms → xác suất p'], ['Ngưỡng', 'p ≥ 0,5 là có tiếng'],
        ['Làm mượt', ['nối lặng < 0,6 s', 'đệm 0,15 s']], ['Cắt cửa sổ', '4–7 s · chỗ ngắt dài nhất']]);

    /* 3 · kiểm hình */
    s += panel(2, 'blue', '#F2F7FD', PH) + head(X[2], W[2], 3, 'Kiểm hình', 'YuNet · SFace', 'blue') +
      stack(X[2], W[2], 'blue', [['Dò mặt', 'hộp mặt + landmark'], ['Cổng mặt', 'conf ≥ 0,85 · cạnh ≥ 48 px'], ['Hình học', 'miệng rộng ≥ 12 % mặt'],
        ['Liền mạch', 'hụt ≤ 3 khung, ≤ 2 liền'], ['Chuyển cảnh', 'histogram màu ≥ 0,55'], ['SFace', 'cùng người: cos ≥ 0,5']]);

    /* 4 · SyncNet: hai nhánh → khoảng cách theo độ lệch → luật tin cậy → dịch tiếng */
    {
      const x = X[3], w = W[3], iw = w - 32, bw = (iw - 12) / 2, x0 = x + 16, x1 = x0 + bw + 12;
      s += panel(3, 'green', '#EFF8ED', PH) + head(x, w, 4, 'Căn tiếng-hình', 'SyncNet v2', 'green');
      let y = 140;
      let [g, h] = layer(x0, y, bw, 'orange', 'Tiếng', 'MFCC 13 · 0,2 s'); s += g;
      [g] = layer(x1, y, bw, 'blue', 'Hình', '5 khung miệng'); s += g;
      y += h; s += down(x0 + bw / 2, y) + down(x1 + bw / 2, y); y += GAP;
      s += box(x0, y, bw, 48, 'orange', { fill: '#fff', r: 14, sw: 2 }) + txt(x0 + 14, y + 31, 'CNN tiếng', { size: 22, w: 700 }) +
        box(x1, y, bw, 48, 'blue', { fill: '#fff', r: 14, sw: 2 }) + txt(x1 + 14, y + 31, 'CNN hình', { size: 22, w: 700 });
      y += 48;
      s += down(x0 + bw / 2, y) + down(x1 + bw / 2, y); y += GAP;
      /* khoảng cách theo độ lệch: đường cong có đáy tại độ lệch đúng */
      s += box(x0, y, iw, 108, 'green', { fill: '#fff', r: 14, sw: 2 }) + txt(x0 + 14, y + 28, 'Khoảng cách theo độ lệch', { size: 22, w: 700 }) +
        txt(x0 + 14, y + 56, '−15 … +15 khung', { size: 21, fill: '#333' });
      let d = '';
      for (let i = 0; i <= 30; i++) {
        const lag = i - 15, v = 1 - 0.85 * Math.exp(-((lag - 2) * (lag - 2)) / 5) + 0.05 * Math.sin(i * 2.1);
        d += (i ? ' L' : 'M') + (x0 + 230 + i * 4.4).toFixed(1) + ' ' + (y + 30 + (1 - v) * 52).toFixed(1);
      }
      s += `<path d="${d}" fill="none" stroke="#5E9F55" stroke-width="3" stroke-linejoin="round"/>` +
        line(x0 + 230 + 17 * 4.4, y + 24, x0 + 230 + 17 * 4.4, y + 90, { col: '#C05A5A', sw: 2, dash: 1 });
      y += 108; s += down(x + w / 2, y); y += GAP;
      [g, h] = layer(x0, y, iw, 'green', 'Đáy đường cong = độ lệch', '≤ 20 clip · lấy trung bình'); s += g; y += h; s += down(x + w / 2, y); y += GAP;
      [g, h] = layer(x0, y, iw, 'green', 'Luật tin cậy', 'conf ≥ 3,0 · đồng ý ≥ 80 %'); s += g; y += h; s += down(x + w / 2, y); y += GAP;
      [g, h] = layer(x0, y, iw, 'green', 'Dịch tiếng về 0', 'một hằng số cho cả video'); s += g;
    }

    /* 5 · người, part */
    s += panel(4, 'purple', '#F6F1FB', PH) + head(X[4], W[4], 5, 'Người, part', 'SFace · WeSpeaker', 'purple') +
      stack(X[4], W[4], 'purple', [['Embedding', ['mặt: SFace', 'giọng: WeSpeaker']], ['Gom cụm', 'so với registry'], ['Duyệt tay', '15–20 clip mỗi người'],
        ['Split theo người', '12 / 3 / 5 mỗi giới'], ['Chuẩn xuất', ['25 fps · H.264 CRF 18', 'AAC 48 kHz']]]);

    /* mũi tên nối các khối */
    for (let i = 0; i < 4; i++) s += arrow(`M${X[i] + W[i] + 3} 60 H${X[i + 1] - 3}`, { sw: 2.5 });
    return s;
  };

  /* ---------- 6a · pipeline sinh giả: năm cột, mỗi cột một chồng lớp, sticker nhỏ mô tả từng lớp ---------- */
  D.s6a = () => {
    const W = 330, PAD = (1760 - 5 * W) / 4, PH = 660, GAP = 20, SW = 64;
    /* sticker vẽ trong khung SW × SW, góc trái trên là (x, y) */
    const sw = (seed, seg, col) => (x, y) => wave(x, y + 10, 64, 44, col || '#E9B27C', seed, seg);
    const sf = (ai) => (x, y) => face(x, y, 64, 64, ai ? 9 : 5, ai);
    const si = (n) => (x, y) => icon(n, x + 8, y + 8, 48, { col: MUTE, sw: 2.6 });
    const ss = (mask) => (x, y) => mask.map((m, k) => `<rect x="${x + 2 + k * 10.2}" y="${y + 20}" width="8" height="24" rx="2" fill="${m === 1 ? '#E9A9A6' : m === 0 ? '#E4EEFA' : '#F3D2D0'}" ` +
      `stroke="${m === 1 ? '#D27B78' : '#6F9FD8'}" stroke-width="1.5"/>`).join('');
    const dots = (x, y) => [['#6F9FD8', 0], ['#DE9A5E', 1], ['#7DB674', 2]].map((d) => `<circle cx="${x + 14}" cy="${y + 12 + d[1] * 20}" r="7" fill="${d[0]}"/>` +
      `<rect x="${x + 28}" y="${y + 8 + d[1] * 20}" width="30" height="8" rx="4" fill="#DDD"/>`).join('');
    const cols = [
      { t: 'Giọng', chip: 'TTS · chuyển giọng', c: 'orange', fill: '#FFF6EC', L: [
        ['Lấy lời', 'PhoWhisper', sw(1)],
        ['Nhân bản giọng', ['VieNeu v3', 'F5-VN · OmniVoice', 'TTS → Seed-VC'], si('speaker')],
        ['Ghép', ['A: cả câu', 'co giãn ≤ ±15 %', 'B: một cụm', 'crossfade 15 ms'], sw(3, [0.35, 0.7, '#E04B45'])],
        ['Chỉ ở test', ['VoxCPM2 · viXTTS', 'F5 inpainting (C)'], null, 1]] },
      { t: 'Tiếng lái', chip: 'nguồn tiếng', c: 'orange', fill: '#FFF6EC', L: [
        ['Tiếng gốc', 'ô 4', sw(2)],
        ['Tiếng clip khác', ['ô 5 · cùng người', 'cùng split'], sw(5)],
        ['Giọng AI', 'ô 6', sw(4, null, '#E04B45')]] },
      { t: 'Hình', chip: 'Generator', c: 'blue', fill: '#F2F7FD', L: [
        ['Khung gốc', ['≤ 720p', 'giữ độ phân giải'], sf(0)],
        ['Vẽ lại môi', ['Wav2Lip-GAN', 'MuseTalk 1.5', 'IP-LAP', 'VideoReTalking'], sf(1)],
        ['Chỉ ở test', ['LatentSync 1.5', 'Diff2Lip'], null, 1]] },
      { t: 'Trộn đoạn', chip: 'từ một lần chạy', c: 'blue', fill: '#F2F7FD', L: [
        ['Full', 'cả clip', ss([1, 1, 1, 1, 1, 1])],
        ['Partial', ['0,3–3 s', 'cách mép ≥ 0,5 s'], ss([0, 0, 1, 1, 0, 0])],
        ['Chỗ nối', ['50 % cắt thẳng', '50 % trộn 2–6 khung'], ss([0, 0, 0.5, 1, 0.5, 0])]] },
      { t: 'Đóng gói', chip: 'mọi file, cả real', c: 'yellow', fill: '#FFFCF0', L: [
        ['Encode', ['H.264 CRF 18', '25 fps · ≤ 720p', 'AAC 48 kHz'], si('film')],
        ['Nhãn', ['hình · tiếng · lệch', 'mỗi 0,04 s'], dots],
        ['Kiểm lối tắt', ['AUC mỗi đặc trưng', 'trong 0,3–0,7'], si('mag')]] },
    ];
    let s = '';
    const pos = [];
    cols.forEach((c, i) => {
      const x = i * (W + PAD), bx = x + 16, bw = W - 32;
      s += box(x, 0, W, PH, c.c, { fill: c.fill, sw: 2 }) +
        `<circle cx="${x + 34}" cy="40" r="20" fill="#5B8DD6"/>` + txt(x + 34, 48, String(i + 1), { size: 24, a: 'middle', w: 700, fill: '#fff', raw: 1 }) +
        txt(x + 66, 49, c.t, { size: 30, w: 700 }) + pill(x + 16, 80, W - 32, 42, c.c, c.chip, { size: 24, w: 700 });
      let y = 140;
      pos[i] = [];
      c.L.forEach((l, k) => {
        const params = [].concat(l[1]);
        const h = Math.max(78, 68 + 25 * (params.length - 1));
        s += box(bx, y, bw, h, c.c, { fill: '#fff', r: 14, sw: 2, dash: l[3] }) + txt(bx + 14, y + 28, l[0], { size: 22, w: 700 }) +
          txt(bx + 14, y + 56, params, { size: 21, lh: 25, fill: '#333' });
        if (l[2]) s += l[2](bx + bw - SW - 12, y + (h - SW) / 2);
        pos[i][k] = [y, h];
        y += h;
        if (k < c.L.length - 1) { if (!c.L[k + 1][3]) s += arrow(`M${bx + bw / 2} ${y + 2} V${y + GAP - 2}`, { sw: 2 }); y += GAP; }
      });
    });
    /* giọng AI chảy sang nguồn tiếng của ô 6 */
    const x0 = 0, x1 = W + PAD, ya = pos[0][2][0] + pos[0][2][1] / 2, yb = pos[1][2][0] + pos[1][2][1] / 2;
    s += rarr([[x0 + W - 16, ya], [x0 + W + PAD / 2, ya], [x0 + W + PAD / 2, yb], [x1 + 14, yb]], { dash: 1 });
    for (let i = 0; i < 4; i++) s += arrow(`M${i * (W + PAD) + W + 3} 60 H${(i + 1) * (W + PAD) - 3}`, { sw: 2.5 });
    return s;
  };

  /* ---------- 6ad · pipeline sinh giả, kiểu sơ đồ hình: hai làn, các lựa chọn mô hình là tâm điểm (khung to, viền dày, thẻ màu) ---------- */
  D.s6ad = () => {
    const nm = (vi, en) => (EN ? en : vi);
    const LH = 350, L1 = 0, L2 = 370, PX = 290, PW = 776, PY = 50, CW = 176, CG = 12;
    const black = (x, y, n) => `<circle cx="${x}" cy="${y}" r="15" fill="#111"/>` + txt(x, y + 7, String(n), { size: 20, a: 'middle', w: 700, fill: '#fff', raw: 1 });
    /* khối phụ: viền mỏng, chữ cỡ thường */
    const small = (x, y, w, h, c, name, params) => {
      params = [].concat(params || []);
      return box(x, y, w, h, c, { fill: '#fff', r: 14, sw: 2 }) + txt(x + w / 2, y + 29, name, { size: 22, w: 700, a: 'middle' }) +
        (params.length ? txt(x + w / 2, y + 56, params, { size: 20, a: 'middle', lh: 24, fill: '#333' }) : '');
    };
    /* thẻ mô hình: tên to, họ / loại bên dưới; thẻ chỉ ở test viền nét đứt */
    const mc = (x, y, c, name, tag, test) => box(x, y, CW, 66, c, { fill: test ? '#fff' : COL[c].f, stroke: COL[c].s, sw: test ? 2.5 : 3.5, r: 14, dash: test }) +
      txt(x + CW / 2, y + 29, name, { size: 22, w: 700, a: 'middle' }) + txt(x + CW / 2, y + 54, tag, { size: 19, a: 'middle', fill: MUTE });
    /* khung lựa chọn: viền dày, tiêu đề lớn, hai hàng thẻ (dùng chung / chỉ test) */
    const choice = (y0, c, title, sub, shared, test) => {
      const py = y0 + PY;
      let s = box(PX, py, PW, 282, c, { fill: '#fff', sw: 4.5, r: 22 }) + txt(PX + 20, py + 38, title, { size: 30, w: 700 }) + txt(PX + 20, py + 64, sub, { size: 20, it: 1, fill: MUTE });
      s += txt(PX + 20, py + 94, 'dùng chung · train, val, test', { size: 20, it: 1, fill: MUTE });
      shared.forEach((m, i) => { s += mc(PX + 18 + i * (CW + CG), py + 104, c, m[0], m[1], 0); });
      s += txt(PX + 20, py + 196, 'chỉ ở test · chưa từng thấy', { size: 20, it: 1, fill: '#A0522D' });
      test.forEach((m, i) => { s += mc(PX + 18 + i * (CW + CG), py + 206, c, m[0], m[1], 1); });
      return s;
    };
    const lane = (y0, c, tint, n, title, chip) => {
      const cw = Math.round(chip.length * 11.5 + 28), tx = 1254 - cw - 16;
      return box(130, y0, 1144, LH, c, { fill: tint, sw: 2 }) + pill(1254 - cw, y0 + 8, cw, 34, c, chip, { size: 22, w: 700 }) +
        txt(tx, y0 + 36, title, { size: 28, w: 700, a: 'end' }) + black(tx - tr(title).length * 15 - 26, y0 + 28, n);
    };
    let s = '';
    const m1 = L1 + PY + 141, m2 = L2 + PY + 141;
    /* làn 1: giọng */
    s += lane(L1, 'orange', '#FFF6EC', 1, 'Giọng', nm('TTS · chuyển giọng', 'TTS · VC'));
    s += small(142, m1 - 50, 124, 100, 'orange', 'Lấy lời', 'PhoWhisper') + arrow(`M268 ${m1} H288`, { sw: 2.5 });
    s += choice(L1, 'orange', '7 hệ giọng', 'giọng mẫu: clip khác, cùng người', [['VieNeu v3', 'TTS'], ['F5-VN', 'TTS'], ['OmniVoice', 'TTS'], ['Seed-VC', 'TTS → VC']],
      [['VoxCPM2', 'TTS'], ['viXTTS', 'TTS'], ['F5 inpainting', 'sửa đoạn']]);
    s += arrow(`M1068 ${m1} H1088`, { sw: 2.5 });
    s += small(1090, m1 - 75, 170, 150, 'orange', 'Ghép', []) + txt(1175, m1 - 75 + 58, ['A: cả câu', 'B: một cụm', 'C: sửa đoạn'], { size: 20, a: 'middle', lh: 26, fill: '#333' });
    /* làn 2: hình */
    s += lane(L2, 'blue', '#F2F7FD', 2, 'Hình', 'Generator');
    s += small(142, m2 - 76, 124, 70, 'blue', nm('Tiếng lái', 'Audio in'), nm('ô 4 · 5 · 6', 'cells 4–6')) + small(142, m2 + 6, 124, 70, 'blue', nm('Khung gốc', 'Frames'), '≤ 720p');
    s += arrow(`M268 ${m2 - 41} H288`, { sw: 2.5 }) + arrow(`M268 ${m2 + 41} H288`, { sw: 2.5 });
    s += choice(L2, 'blue', '6 generator', 'mỗi cái một họ kiến trúc', [['Wav2Lip-GAN', 'GAN'], ['MuseTalk 1.5', 'latent 1 bước'], ['IP-LAP', 'landmark → render'], ['VideoReTalking', 'nhiều tầng']],
      [['LatentSync 1.5', 'latent diffusion'], ['Diff2Lip', 'diffusion pixel']]);
    s += arrow(`M1068 ${m2} H1088`, { sw: 2.5 });
    s += small(1090, m2 - 60, 170, 120, 'blue', 'Trộn đoạn', []) + txt(1175, m2 - 60 + 58, ['full: cả clip', 'partial: 0,3–3 s'], { size: 20, a: 'middle', lh: 26, fill: '#333' });
    /* giọng AI chảy sang tiếng lái của ô 6 */
    s += rarr([[1175, m1 + 77], [1175, 360], [204, 360], [204, m2 - 78]], { dash: 1 }) + pill(460, 340, 250, 40, 'orange', 'giọng AI · ô 6', { size: 22 });
    /* đầu vào */
    s += box(0, 305, 100, 110, 'grey', { fill: '#fff', r: 14, sw: 2.5 }) + icon('video', 22, 321, 56, { col: '#555' }) + txt(50, 400, 'Clip real', { size: 20, a: 'middle', fill: '#333' });
    [m1, m2 - 41, m2 + 41].forEach((yy) => { s += rarr([[101, 360], [118, 360], [118, yy], [140, yy]], { sw: 2.5 }); });
    /* đóng gói */
    s += box(1310, 0, 450, 720, 'yellow', { fill: '#FFFCF0', sw: 2 }) + black(1338, 30, 3) + txt(1362, 40, 'Đóng gói', { size: 28, w: 700 }) + pill(1560, 8, 190, 34, 'yellow', nm('mọi file, cả real', 'all files'), { size: 22, w: 700 });
    s += small(1330, 70, 410, 110, 'yellow', 'Encode', ['H.264 CRF 18 · 25 fps', '≤ 720p · AAC 48 kHz']) + arrow('M1535 182 V218', { sw: 2 });
    s += small(1330, 220, 410, 92, 'yellow', 'Nhãn', ['hình · tiếng · lệch', 'mỗi 0,04 s']) + arrow('M1535 314 V350', { sw: 2 });
    s += small(1330, 352, 410, 92, 'yellow', 'Kiểm lối tắt', ['AUC mỗi đặc trưng', 'phải trong 0,3–0,7']) + arrow('M1535 446 V482', { sw: 2 });
    const six = [['green', 1], ['green', 2], ['orange', 3], ['orange', 4], ['orange', 5], ['orange', 6]];
    six.forEach((c, i) => { s += `<circle cx="${1362 + i * 62}" cy="530" r="25" fill="${COL[c[0]].f}" stroke="${COL[c[0]].s}" stroke-width="3"/>` + txt(1362 + i * 62, 539, String(c[1]), { size: 24, a: 'middle', w: 700, raw: 1 }); });
    s += txt(1535, 590, 'sáu ô', { size: 22, a: 'middle', fill: MUTE });
    /* hai làn đổ vào Encode */
    s += line(1262, m1, 1292, m1, { col: '#444', sw: 3 }) + rarr([[1262, m2], [1292, m2], [1292, 125], [1328, 125]], { sw: 3 });
    return s;
  };

  /* ---------- 6b · số liệu bộ dữ liệu (bản mới) ---------- */
  D.s6b = () => {
    const fi = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, EN ? ',' : '.');
    const raw = { raw: 1 };
    let s = '';
    /* bốn số lớn: mỗi số một thẻ riêng, chữ giải thích nằm ngay dưới */
    const big = [['green', '800', 1, 'clip real · 40 người'], ['grey', fi(7622), 1, 'file giả + thật'], ['grey', '10,6', 0, 'giờ video'], ['red', '69,4 %', 0, 'có thành phần AI']];
    big.forEach((b, i) => {
      const x = i * 450;
      s += box(x, 0, 410, 124, b[0]) + txt(x + 26, 68, b[1], { size: 58, w: 700, ...(b[2] ? raw : {}) }) + txt(x + 26, 106, b[3], { size: 28, fill: MUTE });
    });
    s += line(665, 150, 665, 785, { col: '#E3E3E3' }) + line(1310, 150, 1310, 785, { col: '#E3E3E3' });
    /* A · file theo ô và tập */
    const SP = ['#CFE0F5', '#EAF2FB', '#8FB4E3'];
    const cells = [['1. real', 'green', [480, 120, 200]], ['2. sham', 'green', [924, 228, 382]], ['3. voice', 'orange', [960, 240, 600]],
      ['4. source', 'orange', [648, 166, 398]], ['5. donor', 'orange', [596, 144, 372]], ['6. both', 'orange', [626, 154, 384]]];
    s += txt(0, 190, 'File theo ô', { size: 32, w: 700 });
    cells.forEach((c, i) => {
      const y = 215 + i * 74, tot = c[2][0] + c[2][1] + c[2][2], sc = 360 / 1800;
      s += `<rect x="0" y="${y + 4}" width="8" height="38" rx="4" fill="${COL[c[1]].s}"/>` + txt(24, y + 34, c[0], { size: 28, w: 700 });
      let x = 190;
      c[2].forEach((v, k) => {
        s += `<rect x="${x}" y="${y}" width="${v * sc}" height="46" fill="${SP[k]}" stroke="#6F9FD8" stroke-width="1.5"/>`;
        x += v * sc;
      });
      s += txt(x + 14, y + 34, fi(tot), { size: 28, ...raw });
    });
    [['Train', 4234, 0], ['Val', 1052, 1], ['Test', 2336, 2]].forEach((l, i) => {
      const x = i * 215;
      s += `<rect x="${x}" y="712" width="26" height="26" fill="${SP[l[2]]}" stroke="#6F9FD8" stroke-width="1.5"/>` +
        txt(x + 36, 735, l[0] + ' ' + fi(l[1]), { size: 26, ...raw });
    });
    /* B · generator và giọng */
    const bars = (x0, y0, rows, fill, fillT, stroke) => rows.map((r, i) => {
      const y = y0 + i * 36, w = r[1] * 270 / 800;
      return txt(x0, y + 22, r[0], { size: 26 }) +
        `<rect x="${x0 + 235}" y="${y}" width="${w}" height="27" rx="4" fill="${r[2] ? fillT : fill}" stroke="${stroke}" stroke-width="2"${r[2] ? ' stroke-dasharray="7 5"' : ''}/>` +
        txt(x0 + 235 + w + 12, y + 22, fi(r[1]), { size: 26, ...raw });
    }).join('');
    s += txt(700, 190, 'Hình giả · theo generator', { size: 32, w: 700 });
    s += bars(700, 212, [['Wav2Lip-GAN', 798, 0], ['MuseTalk 1.5', 798, 0], ['VideoReTalking', 784, 0], ['IP-LAP', 714, 0], ['LatentSync 1.5', 200, 1], ['Diff2Lip', 194, 1]], '#9DBDE6', '#E4EEFA', '#6F9FD8');
    s += txt(700, 478, 'Tiếng giả · theo hệ giọng', { size: 32, w: 700 });
    s += bars(700, 500, [['OmniVoice', 654, 0], ['VieNeu v3', 626, 0], ['Seed-VC', 622, 0], ['F5-VN', 608, 0], ['F5 inpainting', 200, 1], ['viXTTS', 128, 1], ['VoxCPM2', 126, 1]], '#F0C49C', '#FDEBDA', '#DE9A5E');
    /* C · nhãn: hình giả, tiếng giả, rồi có AI (hợp của hai) kề bên lệch tiếng-môi */
    s += txt(1340, 190, 'Nhãn · % số file', { size: 32, w: 700 });
    [['hình giả', 45.8, '#9DBDE6', '#6F9FD8'], ['tiếng giả', 38.9, '#F0C49C', '#DE9A5E'], ['có AI (hình hoặc tiếng)', 69.4, '#E9A9A6', '#D27B78'], ['lệch tiếng-môi', 43.7, '#B5DAAE', '#7DB674']].forEach((l, i) => {
      const y = 250 + i * 120, w = 400 * l[1] / 100;
      s += txt(1340, y, l[0], { size: 28, w: 600 }) +
        `<rect x="1340" y="${y + 16}" width="${w}" height="44" rx="5" fill="${l[2]}" stroke="${l[3]}" stroke-width="2"/>` +
        txt(1340 + w + 12, y + 50, String(l[1]).replace('.', ',') + ' %', { size: 28 });
    });
    return s;
  };

  /* ---------- phần model: trợ giúp dùng chung (chữ viết sẵn hai ngôn ngữ bằng MT(vi, en), bỏ qua bảng dịch) ---------- */
  const MT = (vi, en) => (EN ? en : vi);
  const MTX = (x, y, l, o = {}) => txt(x, y, l, { ...o, raw: 1 });
  const mf3 = (n) => (EN ? n.toFixed(3) : n.toFixed(3).replace('.', ','));
  const mwrap = (t, mc) => {
    const out = []; let cur = '';
    t.split(' ').forEach((w) => { if (cur && (cur + ' ' + w).length > mc) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; });
    if (cur) out.push(cur);
    return out;
  };
  /* khối dọc: tên lớp trong khối, thông số ghi dưới */
  const mblk = (x, y, w, h, c, name, cap, sz = 22, o = {}) => {
    const nl = mwrap(name, w > 100 ? 9 : 6);
    return box(x, y, w, h, c, { fill: '#fff', r: 14, sw: 2.5, dash: o.dash }) + MTX(x + w / 2, y + (h - nl.length * (sz + 4)) / 2 + sz - 2, nl, { size: sz, w: 700, a: 'middle', lh: sz + 4 }) +
      (cap ? MTX(x + w / 2, y + h + 24, cap, { size: 20, a: 'middle', lh: 23, fill: '#333' }) : '');
  };
  /* khung công thức quan trọng: nền vàng, viền dày, chữ đậm; dòng cuối (nếu có) in nghiêng ngoài khung */
  const mhl = (x, y, w, lines, extra) => {
    const h = 22 + lines.length * 38;
    let s = box(x, y, w, h, 'yellow', { fill: '#FFF5D2', stroke: '#D2AE40', sw: 4.5, r: 16 });
    lines.forEach((l, i) => { s += MTX(x + 22, y + 40 + i * 38, l, { size: 22, w: 700 }); });
    if (extra) s += MTX(x + 4, y + h + 30, extra, { size: 20, it: 1, fill: MUTE });
    return s;
  };
  /* gạch đầu dòng tự ngắt dòng */
  const mbul = (x, y, list, size, lh, mc) => {
    let s = '', yy = y;
    list.forEach((t) => {
      mwrap(t, mc).forEach((ln, k) => { s += (k === 0 ? `<circle cx="${x + 6}" cy="${yy - size * 0.3}" r="4" fill="${INK}"/>` : '') + MTX(x + 22, yy, ln, { size }); yy += lh; });
      yy += 6;
    });
    return [s, yy];
  };
  /* thanh ngang theo AUC (0-1), vạch 0,5 */
  const mbars = (x, y, rows, lw, bs, sz, pitch, fill, stroke) => {
    let s = '';
    rows.forEach((r, i) => {
      const yy = y + i * pitch;
      s += MTX(x, yy + sz, r[0], { size: sz }) + `<rect x="${x + lw}" y="${yy}" width="${r[1] * bs}" height="${sz + 8}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` +
        MTX(x + lw + r[1] * bs + 12, yy + sz, mf3(r[1]), { size: sz, w: 700 });
    });
    s += line(x + lw + 0.5 * bs, y - 8, x + lw + 0.5 * bs, y + rows.length * pitch - 8, { col: '#777', dash: 1 });
    return s;
  };
  /* chuỗi khối ngang, mũi tên nhỏ giữa các khối */
  const mrow = (x, y, w, h, pitch, items, sz) => {
    let s = '';
    items.forEach((b, i) => {
      s += mblk(x + i * pitch, y, w, h, b[2], b[0], b[1], sz || 22, { dash: b[3] });
      if (i < items.length - 1) s += arrow(`M${x + i * pitch + w + 2} ${y + h / 2} H${x + (i + 1) * pitch - 2}`, { sw: 2 });
    });
    return s;
  };

  /* ---------- 7a · BL-V (LIPINC-V2) ---------- */
  D.s7a = () => {
    const rx = 1040, rw = 720;
    let s = box(0, 0, 1010, 760, 'blue', { fill: '#F2F7FD', sw: 2 }) + MTX(22, 40, MT('Kiến trúc', 'Architecture'), { size: 28, w: 700 }) +
      pill(770, 10, 222, 38, 'blue', MT('4,59 M tham số', '4.59 M parameters'), { size: 22, w: 700 });
    const aw = 118, ap = 138, ax = 22, ay = 84, ah = 86, by = 266, cy = 458;
    s += MTX(22, 70, MT('Nhánh khung hình (MSTIE)', 'Frame branch (MSTIE)'), { size: 22, it: 1, fill: MUTE });
    s += mrow(ax, ay, aw, ah, ap, [
      [MT('Crop miệng', 'Mouth crops'), ['8 × 64×144', MT('5 + 3 khung', '5 + 3 frames')], 'grey'], ['Patch', ['8×8', MT('144 patch', '144 patches')], 'blue'],
      ['Dense', ['→ 128', MT('+ vị trí', '+ position')], 'blue'], ['Spatial', [MT('×2 lớp', '×2 layers'), '4 head'], 'blue'], [MT('Gộp', 'Pool'), [MT('trung bình', 'mean over'), 'patch'], 'blue'],
      ['Temporal', [MT('×2 lớp', '×2 layers'), '4 head'], 'blue'], ['Dense', ['→ 8×8×3', MT('bản đồ', 'map')], 'blue']]);
    s += MTX(22, 252, MT('Nhánh ảnh hiệu', 'Difference branch'), { size: 22, it: 1, fill: MUTE });
    s += mblk(ax, by, aw, ah, 'grey', MT('Ảnh hiệu', 'Diff images'), [MT('7 ảnh', '7 images'), '|R(t+1) − R(t)|'], 22) + arrow(`M${ax + aw + 2} ${by + ah / 2} H${ax + ap - 2}`, { sw: 2 });
    s += box(ax + ap, by, 6 * ap - 20, ah, 'blue', { fill: '#fff', r: 14, sw: 2.5, dash: 1 }) + MTX(ax + ap + (6 * ap - 20) / 2, by + 40, MT('MSTIE thứ hai', 'Second MSTIE'), { size: 22, w: 700, a: 'middle' }) +
      MTX(ax + ap + (6 * ap - 20) / 2, by + 68, MT('cùng cấu trúc, trọng số riêng', 'same layout, separate weights'), { size: 21, a: 'middle', fill: '#333' });
    s += line(ax + 7 * ap - 18, ay + ah / 2, 996, ay + ah / 2, { col: '#444', sw: 2 }) + line(ax + 7 * ap - 18, by + ah / 2, 996, by + ah / 2, { col: '#444', sw: 2 }) +
      rarr([[996, ay + ah / 2], [996, 446], [66, 446], [66, cy - 2]], { sw: 2.5 });
    s += MTX(22, 434, MT('Hợp nhất · CNN · Dense', 'Fusion · CNN · Dense'), { size: 22, it: 1, fill: MUTE });
    s += mrow(ax, cy, 86, 96, 97, [['Cross attn', [MT('×3 lớp', '×3 layers')], 'blue'], ['Conv 3×3', ['12 → 64'], 'blue'], ['Conv 1×1', ['64 → 64'], 'blue'], ['Pool', ['2'], 'blue'],
      ['Conv 3×3', ['64 → 128'], 'blue'], ['Conv 1×1', ['128 → 128'], 'blue'], ['Pool', ['4'], 'blue'], ['Dense', ['→ 1024'], 'grey'], ['Dense', ['→ 1024'], 'grey'], ['Dense', ['→ 2'], 'grey']], 20);
    s += mhl(16, 606, 978, [MT('Cross attn: softmax(QKᵀ/√192)V · conv: ReLU + BN · encoder FFN 512', 'Cross attn: softmax(QKᵀ/√192)V · conv: ReLU + BN · encoder FFN 512'),
      MT('Loss: CE + 5 × inconsistency (SSIM) · Adam lr 1e-3, eps 0,1 · batch 64 · 100 epoch', 'Loss: CE + 5 × inconsistency (SSIM) · Adam lr 1e-3, eps 0.1 · batch 64 · 100 epochs')],
    MT('Khác bản gốc: SSIM khả vi · ảnh chia 255 · ảnh hiệu có dấu · nhãn = visual fake', 'Differs from the original: differentiable SSIM · images ÷255 · signed difference images · label = visual fake'));
    /* phải: paper gốc, part 1 */
    s += box(rx, 0, rw, 300, 'grey', { fill: '#F6F6F6', sw: 2 }) + MTX(rx + 22, 44, MT('Paper gốc', 'Original paper'), { size: 30, w: 700 });
    s += mbul(rx + 22, 98, [MT('huấn luyện: FakeAV-LS (phần lip-sync của FakeAVCeleb)', 'trained on FakeAV-LS (the lip-sync part of FakeAVCeleb)'), MT('AUC: FakeAV-LS 0,99 · KODF-LS 0,97', 'AUC: FakeAV-LS 0.99 · KODF-LS 0.97'),
      MT('LipSyncTIMIT: 0,97 · nén CRF 40: 0,76', 'LipSyncTIMIT: 0.97 · CRF 40 compression: 0.76')], 28, 40, 42)[0];
    s += box(rx, 320, rw, 440, 'blue', { fill: '#F2F7FD', sw: 2 }) + MTX(rx + 22, 364, MT('Trên VN-AV-DF part 1', 'On VN-AV-DF part 1'), { size: 30, w: 700 }) + MTX(rx + rw - 22, 364, MT('test, 10 người', 'test, 10 people'), { size: 22, a: 'end', it: 1, fill: MUTE });
    s += mbars(rx + 22, 400, [['AI?', 0.568], ['visual', 0.603], [MT('generator chưa thấy', 'unseen generator'), 0.604], ['partial', 0.497]], 300, 330, 26, 56, '#9DBDE6', '#6F9FD8');
    s += MTX(rx + 22, 654, MT('0,5 = đoán mò · val 0,563 · dừng sớm epoch 19', '0.5 = chance · val 0.563 · early stop at epoch 19'), { size: 22, it: 1, fill: MUTE });
    s += mbul(rx + 22, 692, [MT('giả thuyết ○: 4.234 mẫu có thể không đủ cho 4,59 M tham số học từ đầu', 'hypothesis ○: 4,234 samples may not be enough for 4.59 M parameters trained from scratch')], 23, 30, 56)[0];
    return s;
  };

  /* ---------- 7b · BL-A (XLS-R + AASIST) ---------- */
  D.s7b = () => {
    const rx = 1040, rw = 720;
    let s = box(0, 0, 1010, 760, 'orange', { fill: '#FFF6EC', sw: 2 }) + MTX(22, 40, MT('Kiến trúc', 'Architecture'), { size: 28, w: 700 }) +
      pill(560, 10, 432, 38, 'orange', MT('0,45 M + XLS-R 315 M tham số', '0.45 M + XLS-R 315 M parameters'), { size: 22, w: 700 });
    const aw = 118, ap = 138, ax = 22, ay = 84, ah = 86, by = 266, cy = 458;
    s += MTX(22, 70, MT('Đầu vào và XLS-R', 'Input and XLS-R'), { size: 22, it: 1, fill: MUTE });
    s += mrow(ax, ay, aw, ah, ap, [[MT('Sóng', 'Wave'), ['16 kHz', MT('64.600 mẫu', '64,600 samples')], 'grey'], ['RawBoost', ['algo 3'], 'orange'], ['XLS-R', [MT('fine-tune', 'fine-tuned'), '1024-d'], 'orange'],
      ['Linear', ['1024 → 128'], 'orange'], ['Max pool', ['3×3'], 'orange'], ['BN + SELU', [''], 'orange'], [MT('Mã hoá', 'Encoder'), [MT('6 khối', '6 blocks')], 'orange']]);
    s += MTX(22, 252, MT('Encoder residual và attention', 'Residual encoder and attention'), { size: 22, it: 1, fill: MUTE });
    s += mrow(ax, by, aw, ah, ap, [['Res 1', ['1 → 32'], 'orange'], ['Res 2', ['32 → 32'], 'orange'], ['Res 3', ['32 → 64'], 'orange'], ['Res 4', ['64 → 64'], 'orange'], ['Res 5', ['64 → 64'], 'orange'],
      ['Res 6', ['64 → 64'], 'orange'], ['Attention', ['Conv 1×1', '64→128→64'], 'orange']]);
    s += line(ax + 7 * ap - 18, ay + ah / 2, 996, ay + ah / 2, { col: '#444', sw: 2 }) + line(ax + 7 * ap - 18, by + ah / 2, 996, by + ah / 2, { col: '#444', sw: 2 }) +
      rarr([[996, ay + ah / 2], [996, 446], [66, 446], [66, cy - 2]], { sw: 2.5 });
    s += MTX(22, 434, MT('Đồ thị attention (AASIST)', 'Graph attention (AASIST)'), { size: 22, it: 1, fill: MUTE });
    s += mrow(ax, cy, aw, 96, ap, [[MT('GAT phổ', 'Spectral GAT'), ['64-d', MT('+ vị trí 42', '+ position 42')], 'orange'], [MT('GAT thời gian', 'Temporal GAT'), ['64-d'], 'orange'], ['Pool', ['0,5'], 'orange'],
      ['HtrgGAT', [MT('2 nhánh', '2 branches'), '64 → 32 → 32'], 'orange'], ['Max', [MT('2 nhánh', '2 branches')], 'orange'], [MT('Nối', 'Concat'), [MT('5 vector', '5 vectors')], 'grey'], ['Linear', ['160 → 2'], 'grey']], 20);
    s += mhl(16, 606, 978, [MT('Điểm giả = logit giả − logit thật · cửa sổ 64.600 mẫu · chấm: trượt 4 s, bước 1 s, lấy max', 'Fake score = fake logit − real logit · 64,600-sample window · scoring: slide 4 s, step 1 s, take max'),
      MT('Adam lr 1e-6, wd 1e-4 · batch 14 · 100 epoch · CE trọng số 0,63 / 0,37 (gốc 0,1 / 0,9)', 'Adam lr 1e-6, wd 1e-4 · batch 14 · 100 epochs · CE weights 0.63 / 0.37 (original 0.1 / 0.9)')],
    MT('Khác bản gốc: XLS-R qua transformers · AMP fp16 · chọn checkpoint theo val loss', 'Differs from the original: XLS-R via transformers · AMP fp16 · checkpoint chosen by val loss'));
    s += box(rx, 0, rw, 300, 'grey', { fill: '#F6F6F6', sw: 2 }) + MTX(rx + 22, 44, MT('Paper gốc', 'Original paper'), { size: 30, w: 700 });
    s += mbul(rx + 22, 98, [MT('huấn luyện: ASVspoof 2019 LA', 'trained on ASVspoof 2019 LA'), MT('EER 0,82 % (LA 2021) · 2,85 % (DF 2021)', 'EER 0.82% (LA 2021) · 2.85% (DF 2021)'),
      MT('ngoài miền giảm mạnh (Müller et al. 2022)', 'drops sharply out of domain (Müller et al. 2022)')], 28, 40, 42)[0];
    s += box(rx, 320, rw, 440, 'orange', { fill: '#FFF6EC', sw: 2 }) + MTX(rx + 22, 364, MT('Trên VN-AV-DF part 1', 'On VN-AV-DF part 1'), { size: 30, w: 700 }) + MTX(rx + rw - 22, 364, MT('test, 10 người', 'test, 10 people'), { size: 22, a: 'end', it: 1, fill: MUTE });
    s += mbars(rx + 22, 400, [['audio', 0.514], ['AI?', 0.512], [MT('giọng đã thấy', 'seen voices'), 0.518], [MT('giọng chưa thấy', 'unseen voices'), 0.504]], 300, 330, 26, 56, '#F0C49C', '#DE9A5E');
    s += MTX(rx + 22, 654, MT('0,5 = đoán mò · val 0,506 · dao động 0,46–0,54, mọi ô', '0.5 = chance · val 0.506 · fluctuates 0.46–0.54, every cell'), { size: 22, it: 1, fill: MUTE });
    s += mbul(rx + 22, 692, [MT('giả thuyết ○: lớp cuối XLS-R và AASIST khởi tạo ngẫu nhiên, lr 1e-6, ~300 bước mỗi epoch (gốc ~1.800)', 'hypothesis ○: top XLS-R layer and AASIST start random, lr 1e-6, ~300 steps per epoch (original ~1,800)')], 23, 30, 56)[0];
    return s;
  };

  /* ---------- 7c · BL-M và BL-M/sup (AVH-Align) ---------- */
  D.s7c = () => {
    const rx = 1040, rw = 720;
    let s = box(0, 0, 1010, 760, 'green', { fill: '#EFF8ED', sw: 2 }) + MTX(22, 40, MT('Kiến trúc Φ', 'Architecture of Φ'), { size: 28, w: 700 }) +
      pill(780, 10, 212, 38, 'green', MT('Φ: 1,74 M tham số', 'Φ: 1.74 M params'), { size: 22, w: 700 });
    const bw = 150, bp = 190, ax = 22;
    /* hàng 1-2: hai luồng hình / tiếng song song, thông số nằm trong khối (không có chữ dưới khối nên không đè nhau) */
    s += MTX(22, 74, MT('Đặc trưng và chiếu', 'Features and projection'), { size: 22, it: 1, fill: MUTE });
    const pb = (x, y, c, name, l1, l2) => box(x, y, bw, 88, c, { fill: '#fff', r: 14, sw: 2.5 }) + MTX(x + bw / 2, y + 30, name, { size: 22, w: 700, a: 'middle' }) +
      MTX(x + bw / 2, y + 56, l1, { size: 20, a: 'middle', fill: '#333' }) + (l2 ? MTX(x + bw / 2, y + 78, l2, { size: 20, a: 'middle', fill: '#333' }) : '');
    const y1 = 88, y2 = 190;
    const A = [[MT('Hình', 'Visual'), 'AV-HuBERT', '1024-d · 25 Hz', 'blue'], ['L2', MT('chuẩn hoá', 'normalize'), '', 'grey'], ['Linear', '1024 → 512', '', 'blue']];
    const B = [[MT('Tiếng', 'Audio'), 'AV-HuBERT', '1024-d', 'orange'], ['L2', MT('chuẩn hoá', 'normalize'), '', 'grey'], ['Linear', '1024 → 512', '', 'orange']];
    A.forEach((b, i) => { s += pb(ax + i * bp, y1, b[3], b[0], b[1], b[2]); if (i < 2) s += arrow(`M${ax + i * bp + bw + 2} ${y1 + 44} H${ax + (i + 1) * bp - 2}`, { sw: 2 }); });
    B.forEach((b, i) => { s += pb(ax + i * bp, y2, b[3], b[0], b[1], b[2]); if (i < 2) s += arrow(`M${ax + i * bp + bw + 2} ${y2 + 44} H${ax + (i + 1) * bp - 2}`, { sw: 2 }); });
    const gx = ax + 3 * bp, gy = (y1 + y2) / 2 + 44 - 44;
    s += pb(gx, gy + 0, 'green', MT('Ghép', 'Concat'), '1024', '') +
      rarr([[ax + 2 * bp + bw + 2, y1 + 44], [ax + 2 * bp + bw + 28, y1 + 44], [ax + 2 * bp + bw + 28, gy + 36], [gx - 2, gy + 36]], { sw: 2 }) +
      rarr([[ax + 2 * bp + bw + 2, y2 + 44], [ax + 2 * bp + bw + 28, y2 + 44], [ax + 2 * bp + bw + 28, gy + 56], [gx - 2, gy + 56]], { sw: 2 });
    /* hàng 3: MLP chấm độ khớp */
    s += MTX(22, 318, MT('MLP chấm độ khớp (LayerNorm + ReLU)', 'Sync-scoring MLP (LayerNorm + ReLU)'), { size: 22, it: 1, fill: MUTE });
    s += mrow(ax, 328, bw, 80, bp, [['Linear', ['1024 → 512'], 'green'], ['Linear', ['512 → 256'], 'green'], ['Linear', ['256 → 128'], 'green'], ['Linear', ['128 → 1'], 'green'], [MT('Điểm khớp', 'Sync score'), ['Φ(v, a)'], 'grey']], 22);
    /* hàng 4: độ lệch và điểm video */
    s += MTX(22, 470, MT('Độ lệch và điểm video', 'Lags and video score'), { size: 22, it: 1, fill: MUTE });
    s += mrow(ax, 482, bw, 80, bp, [[MT('Dịch tiếng', 'Shift audio'), ['δ ∈ [−15, 15]'], 'blue'], [MT('31 điểm', '31 scores'), [MT('mỗi khung', 'per frame')], 'blue'], ['log-sum-exp', [MT('theo khung', 'over frames')], 'blue'], [MT('Điểm video', 'Video score'), [''], 'grey']], 22);
    s += mhl(16, 606, 978, [MT('Φ(v_t, a_t+δ) · δ ∈ [−15, 15] · điểm video = log-sum-exp theo khung', 'Φ(v_t, a_t+δ) · δ ∈ [−15, 15] · video score = log-sum-exp over frames'),
      MT('BL-M: InfoNCE · Adam lr 1e-5 · checkpoint công bố · chỉ clip real', 'BL-M: InfoNCE · Adam lr 1e-5 · published checkpoint · real clips only'),
      MT('BL-M/sup: CE trên (−s, s) · Adam lr 1e-3 · batch 1 video · 100 epoch · ngẫu nhiên', 'BL-M/sup: CE on (−s, s) · Adam lr 1e-3 · batch 1 video · 100 epochs · random init')]);
    s += box(rx, 0, rw, 300, 'grey', { fill: '#F6F6F6', sw: 2 }) + MTX(rx + 22, 44, MT('Paper gốc', 'Original paper'), { size: 30, w: 700 });
    s += mbul(rx + 22, 98, [MT('học chỉ trên video real (AV-1M, 45 k)', 'trained on real videos only (AV-1M, 45 k)'), MT('AUC: FakeAVCeleb 94,6 · AV-1M 85,9', 'AUC: FakeAVCeleb 94.6 · AV-1M 85.9'),
      MT('test AV-1M chính thức: 85,24', 'official AV-1M test: 85.24'), MT('BL-M/sup: bản có giám sát do chính tác giả đặt', 'BL-M/sup: supervised variant set by the authors')], 27, 38, 44)[0];
    s += box(rx, 320, rw, 440, 'green', { fill: '#EFF8ED', sw: 2 }) + MTX(rx + 22, 364, MT('Trên VN-AV-DF part 1', 'On VN-AV-DF part 1'), { size: 30, w: 700 });
    const cx1 = rx + 410, cx2 = rx + 590;
    s += MTX(cx1, 404, 'BL-M', { size: 26, w: 700, a: 'middle' }) + MTX(cx2, 404, 'BL-M/sup', { size: 26, w: 700, a: 'middle' });
    [['AI?', 0.416, 0.843], ['visual', 0.261, 0.865], ['audio', 0.608, 0.548], ['mismatch', 0.871, 0.221], [MT('sham ↔ real', 'sham vs. real'), 0.981, 0.527]].forEach((r, i) => {
      const y = 442 + i * 46;
      s += MTX(rx + 22, y, r[0], { size: 26 }) + MTX(cx1, y, mf3(r[1]), { size: 26, w: 700, a: 'middle', fill: r[1] < 0.5 ? '#C05A5A' : INK }) + MTX(cx2, y, mf3(r[2]), { size: 26, w: 700, a: 'middle', fill: r[2] < 0.5 ? '#C05A5A' : INK });
    });
    s += mbul(rx + 22, 692, [MT('đỏ: dưới 0,5. BL-M chấm sham giả hơn cả fake (0,981) nên AI? chỉ 0,416; BL-M/sup có một điểm cho mọi tác vụ', 'red: below 0.5 · BL-M ranks sham above the fakes (0.981) · BL-M/sup has one score for every task')], 22, 28, 60)[0];
    return s;
  };

  /* ---------- 7d · tổng kết điểm yếu và gap analysis ---------- */
  D.s7d = () => {
    let s = '';
    s += MTX(0, 34, MT('Điểm yếu của baseline trên part 1', 'Baseline weaknesses on part 1'), { size: 30, w: 700 });
    const rows = [
      ['BL-V · LIPINC-V2', MT('hình giả', 'fake visuals'), 'blue', MT('visual 0,603, partial 0,497: gần ngẫu nhiên, kể cả generator đã thấy (0,602)', 'visual 0.603, partial 0.497: near chance, even on seen generators (0.602)')],
      ['BL-A · XLS-R + AASIST', MT('giọng giả', 'fake voice'), 'orange', MT('audio 0,514: không học ở mọi ô (val 0,46–0,54 suốt 23 epoch)', 'audio 0.514: does not learn in any cell (val 0.46–0.54 over 23 epochs)')],
      ['BL-M · AVH-Align', MT('lệch tiếng-môi', 'audio-lip mismatch'), 'green', MT('báo nhầm sham 98 % (AUC 0,981): AI? chỉ 0,416, dưới ngẫu nhiên', 'flags 98% of sham (AUC 0.981): AI? only 0.416, below chance')],
      ['BL-M/sup', 'AI?', 'green', MT('AI? 0,843 nhưng mismatch 0,221: một điểm cho mọi tác vụ', 'AI? 0.843 but mismatch 0.221: one score for every task')],
      ['BL-Ens = max(BL-V, BL-A)', 'AI?', 'grey', MT('AI? 0,564: yếu theo hai thành phần, không có độ khớp tiếng-môi', 'AI? 0.564: weak through both parts, no audio-lip sync')],
    ];
    rows.forEach((r, i) => {
      const y = 56 + i * 140;
      s += box(0, y, 960, 124, r[2], { sw: 2.5 }) + MTX(22, y + 46, r[0], { size: 28, w: 700 }) + MTX(22, y + 90, MT('trả lời: ', 'answers: ') + r[1], { size: 24, it: 1, fill: MUTE });
      mwrap(r[3], 38).forEach((ln, k) => { s += MTX(440, y + 48 + k * 34, ln, { size: 25 }); });
    });
    s += MTX(1010, 34, MT('Gap và cách M1 / M2 nhắm tới', 'Gaps and how M1 / M2 address them'), { size: 30, w: 700 });
    const gaps = [
      [MT('Gộp "lệch tiếng" vào "AI"', 'Merging "out of sync" into "AI"'), MT('đầu mismatch riêng, sham lúc train', 'separate mismatch head, sham in training'), 'green', MT('đã chứng minh', 'shown'), MT('sham: M1 0,543 so với BL-M 0,981', 'sham: M1 0.543 vs. BL-M 0.981')],
      [MT('Học thuộc dấu vết pixel, sụp khi nén', 'Memorising pixel traces, collapsing under compression'), MT('nhánh trace (NPR ở miệng)', 'trace branch (NPR on the mouth)'), 'red', MT('chưa chứng minh', 'not shown'), MT('cổng 6b trượt (CI chứa 0)', 'gate 6b failed (CI contains 0)')],
      [MT('Giọng giả không tổng quát', 'Fake voices do not generalize'), MT('nhánh audio: XLS-R 3 nhóm lớp', 'audio branch: XLS-R, 3 layer groups'), 'yellow', MT('một phần', 'partial'), MT('giọng chưa thấy 0,889, nhưng BL-A không học nên chưa so sạch', 'unseen voices 0.889, but BL-A does not learn so no clean comparison')],
      [MT('Điểm nền lệch theo người', 'Per-person score offset'), MT('FiLM với 3 clip tham chiếu', 'FiLM with 3 reference clips'), 'red', MT('chưa chứng minh', 'not shown'), MT('cổng 5 trượt (−0,001)', 'gate 5 failed (−0.001)')],
      [MT('Định vị đoạn giả', 'Localizing the fake segment'), MT('điểm theo từng khung, gộp top-5', 'per-frame scores, top-5 pooling'), 'yellow', MT('một phần', 'partial'), MT('ô cao nhất trong đoạn 0,90 nhưng AP@0,5 ≈ 0,02', 'top cell inside the segment 0.90 but AP@0.5 ≈ 0.02')],
    ];
    gaps.forEach((g, i) => {
      const y = 56 + i * 140;
      s += box(1010, y, 750, 124, g[2], { sw: 2.5 }) + MTX(1030, y + 34, mwrap(g[0], 40), { size: 24, w: 700, lh: 28 }) +
        MTX(1030, y + 88, g[1], { size: 22 }) + MTX(1030, y + 114, g[4], { size: 20, it: 1, fill: MUTE });
      s += pill(1560, y + 10, 180, 36, g[2], g[3], { size: 21, w: 700 });
    });
    return s;
  };

  /* hộp "điểm đặc biệt": vòng số đen + tiêu đề + mô tả; số trùng với vòng số đen trên sơ đồ */
  const mnb = (x, y, n) => `<circle cx="${x}" cy="${y}" r="14" fill="#111"/>` + MTX(x, y + 7, String(n), { size: 19, a: 'middle', w: 700, fill: '#fff', raw: 1 });
  const mspecial = (x, y, w, h, n, title, text) => {
    let s = box(x, y, w, h, 'yellow', { fill: '#FFFBEA', stroke: '#D2AE40', sw: 3.5, r: 16 }) + mnb(x + 30, y + 34, n) + MTX(x + 56, y + 42, title, { size: 24, w: 700 });
    mwrap(text, 42).forEach((ln, k) => { s += MTX(x + 22, y + 74 + k * 26, ln, { size: 21 }); });
    return s;
  };

  /* ---------- 8n · M1 (TriHead-v2) ---------- */
  D.s8n = () => {
    const bw = 110, bp = 128, bx = 138, ry = [84, 280, 476], bh = 84;
    let s = box(0, 0, 1190, 760, 'blue', { fill: '#F2F7FD', sw: 2 }) + MTX(22, 40, MT('Kiến trúc', 'Architecture'), { size: 28, w: 700 }) +
      pill(930, 10, 240, 38, 'blue', MT('1,94 M tham số học', '1.94 M params'), { size: 22, w: 700 });
    const rows = [
      [MT('Nhánh sync · 0,98 M', 'Sync branch · 0.98 M'), 'green', ['AV-HuBERT', [MT('hình + tiếng', 'visual + audio')], 'grey'], [
        [MT('Chiếu', 'Project'), [MT('hình, tiếng', 'visual, audio'), '1024 → 256', '+ LayerNorm']], ['Cost volume', [MT('31 độ lệch', '31 lags'), MT('2 kênh:', '2 channels:'), MT('tích ÷16, cos', 'dot ÷16, cos')]],
        ['CNN 2D', [MT('3 conv 32', '3 conv 32'), 'dilation', '1 · 2 · 4']], ['Soft argmin', [MT('lệch · đỉnh ·', 'lag · peak ·'), 'entropy', '→ 67-d']],
        ['Mix', ['67 + 128', '→ 128', 'LN + GELU']], ['TCN', ['3 Conv1d', 'dilation', '1 · 2 · 4']]]],
      [MT('Nhánh trace · 0,29 M', 'Trace branch · 0.29 M'), 'blue', [MT('Crop miệng', 'Mouth crop'), ['96×96', '+ landmark'], 'grey'], [
        [MT('Ba luồng', 'Three streams'), [MT('ảnh · NPR ·', 'image · NPR ·'), 'residual', MT('thời gian', 'in time')]], ['Conv3D', ['3→24→48→64', 'k 3, stride', '1 · 2 · 2']],
        ['Pool', ['mean + max', '→ 128']], [MT('Động học', 'Motion'), [MT('môi 60 +', 'lips 60 +'), MT('đầu 6 →', 'head 6 →'), 'Linear 64']],
        ['Mix', ['192 → 128', 'LN + GELU']], ['TCN', ['3 Conv1d', 'dilation', '1 · 2 · 4']]]],
      [MT('Nhánh audio · 0,40 M', 'Audio branch · 0.40 M'), 'orange', [MT('Tiếng', 'Audio'), ['16 kHz'], 'grey'], [
        ['XLS-R', [MT('đóng băng', 'frozen'), MT('3 nhóm lớp', '3 layer groups')]], [MT('Trộn', 'Mix'), ['softmax', MT('học được', 'learned'), MT('3 trọng số', '3 weights')]],
        ['Linear', ['1024 → 128', 'LN + GELU']], ['Attention', [MT('2 lớp', '2 layers'), '4 head', 'FFN 256']]]],
    ];
    rows.forEach((r, i) => {
      const y = ry[i];
      s += MTX(bx + 140, y - 12, r[0], { size: 21, it: 1, fill: MUTE }) + mblk(16, y, 106, bh, 'grey', r[2][0], r[2][1], 19) + arrow(`M${124} ${y + bh / 2} H${bx - 2}`, { sw: 2 });
      s += mrow(bx, y, bw, bh, bp, r[3].map((b) => [b[0], b[1], r[1]]), 21);
      const last = bx + (r[3].length - 1) * bp + bw;
      s += arrow(`M${last + 2} ${y + bh / 2} H898`, { sw: 2 }) + arrow(`M${984} ${y + bh / 2} H1002`, { sw: 2 });
    });
    /* FiLM và đầu ra */
    s += box(900, 84, 84, 476, 'purple', { fill: '#fff', r: 14, sw: 2.5 }) + MTX(942, 130, 'FiLM', { size: 22, w: 700, a: 'middle' }) +
      MTX(942, 170, [MT('γ, β từ', 'γ, β'), MT('3 clip', '3 real'), MT('real', 'clips,'), MT('cùng', 'same'), MT('người', 'person'), '', MT('khởi tạo', 'init'), '= 0', '', '0,10 M'.replace(',', EN ? '.' : ',')], { size: 20, a: 'middle', lh: 26, fill: '#333' });
    s += box(1004, 84, 170, 476, 'blue', { fill: '#fff', r: 14, sw: 2.5 }) + MTX(1089, 124, MT('Ba đầu', 'Three heads'), { size: 22, w: 700, a: 'middle' });
    let hy = 168;
    [[MT('visual ← trace + sync', 'visual ← trace + sync')], [MT('audio ← audio', 'audio ← audio')], [MT('mismatch ← sync + audio', 'mismatch ← sync + audio')]].forEach((t) => {
      mwrap(t[0], 14).forEach((ln) => { s += MTX(1018, hy, ln, { size: 20 }); hy += 25; }); hy += 18;
    });
    s += MTX(1018, hy + 6, ['AI? =', 'max(visual,', 'audio)'], { size: 21, w: 700, lh: 26 }) + MTX(1089, 536, MT('0,16 M', '0.16 M'), { size: 20, a: 'middle', fill: MUTE });
    /* vòng số đen khớp hộp bên phải */
    s += mnb(982, 84, 1) + mnb(122, 84, 2) + mnb(bx + 4 * bp + 100, ry[1] - 2, 3) + mnb(bx + 3 * bp + 100, ry[2] - 2, 3) + mnb(bx + 100, ry[1] - 2, 4) + mnb(1170, 84, 5);
    s += mhl(16, 652, 1158, [MT('visual ← trace + sync · audio ← audio · mismatch ← sync + audio · AI? = max(visual, audio)', 'visual ← trace + sync · audio ← audio · mismatch ← sync + audio · AI? = max(visual, audio)'),
      MT('AdamW lr 3e-4, wd 1e-4 · batch 16 · ≤ 30 epoch, dừng sớm 5 · 1,94 M tham số học', 'AdamW lr 3e-4, wd 1e-4 · batch 16 · ≤ 30 epochs, early stop 5 · 1.94 M trainable parameters')]);
    /* phải: điểm đặc biệt */
    const sp = [
      [1, MT('Tham chiếu người (FiLM)', 'Person reference (FiLM)'), MT('γ, β từ 3 clip real của cùng người; ra [h·(1+γ)+β ‖ h − ref]; khởi tạo γ = β = 0', 'γ, β from 3 real clips of the same person; outputs [h·(1+γ)+β ‖ h − ref]; initialised at γ = β = 0')],
      [2, MT('Pseudo-fake khi huấn luyện', 'Pseudo-fakes in training'), MT('thay đoạn tiếng với p = 0,25; nhãn mismatch = 1, AI = 0', 'audio segment swapped with p = 0.25; label mismatch = 1, AI = 0')],
      [3, MT('Xoá thông tin người nói', 'Removing speaker information'), MT('loss gây nhầm lẫn bị chặn, λ tăng 0 → 0,3; thay gradient reversal vì GRL làm M1 vỡ ở epoch 3', 'bounded confusion loss, λ ramps 0 → 0.3; replaces gradient reversal, which broke M1 at epoch 3')],
      [4, MT('NPR ở vùng miệng', 'NPR on the mouth'), MT('x − pixel tham chiếu của ô 2×2, crop 96×96 độ phân giải gốc, thêm residual thời gian', 'x − reference pixel of each 2×2 cell, 96×96 crop at native resolution, plus temporal residual')],
      [5, MT('Gộp điểm và đầu ra', 'Score pooling and outputs'), MT('điểm video = trung bình top-5 khung (đoạn giả ngắn nhất 0,3 s ≈ 7 khung)', 'video score = mean of the top-5 frames (shortest fake segment 0.3 s ≈ 7 frames)')],
    ];
    sp.forEach((p, i) => { s += mspecial(1214, 4 + i * 150, 546, 138, p[0], p[1], p[2]); });
    return s;
  };

  /* ---------- 9n · M2 (AVH-Align+) ---------- */
  D.s9n = () => {
    const bw = 120, bp = 150, bx = 140, bh = 86;
    let s = box(0, 0, 1190, 760, 'green', { fill: '#EFF8ED', sw: 2 }) + MTX(22, 40, MT('Kiến trúc', 'Architecture'), { size: 28, w: 700 }) +
      pill(930, 10, 240, 38, 'green', MT('1,92 M tham số học', '1.92 M params'), { size: 22, w: 700 });
    s += MTX(22, 72, MT('Lag volume từ Φ', 'Lag volume from Φ'), { size: 21, it: 1, fill: MUTE });
    const y1 = 86;
    s += mblk(16, y1, 108, bh, 'grey', 'AV-HuBERT', [MT('hình + tiếng', 'visual + audio')], 18) + arrow(`M126 ${y1 + bh / 2} H${bx - 2}`, { sw: 2 });
    s += mrow(bx, y1, bw, bh, bp, [['L2', [MT('chuẩn hoá', 'normalize')], 'green'], ['Φ', ['AlignMLP', '1,74 M', MT('khởi tạo từ', 'initialised from'), 'checkpoint'.replace('checkpoint', MT('checkpoint', 'checkpoint'))], 'green'],
      ['Lag volume', [MT('31 độ lệch', '31 lags'), MT('+ kênh vị trí', '+ position channel'), MT('→ 2 kênh', '→ 2 channels')], 'green'], ['CNN 2D', [MT('3 conv 32', '3 conv 32'), 'dilation 1·2·4', '0,02 M'], 'green'],
      ['Soft argmin', [MT('lệch · đỉnh ·', 'lag · peak ·'), 'entropy', '→ 67-d'], 'green']], 21);
    s += MTX(22, 290, MT('Chuyển động và đầu ra', 'Motion and outputs'), { size: 21, it: 1, fill: MUTE });
    const y2 = 304;
    s += mblk(16, y2, 108, bh, 'blue', MT('Chuyển động', 'Motion'), [MT('môi 20', 'lips 20'), MT('đầu 6', 'head 6')], 19) + arrow(`M126 ${y2 + bh / 2} H${bx - 2}`, { sw: 2 });
    s += mrow(bx, y2, bw, bh, bp, [['Linear', ['26 → 32', 'GELU'], 'blue'], ['Mix', ['67 + 32 → 128', 'LN + GELU', '0,013 M'], 'green'], ['TCN', ['3 Conv1d', 'dilation 1·2·4', '0,148 M'], 'green'], ['Linear', ['128 → 2'], 'grey'],
      [MT('Hai đầu', 'Two heads'), ['ai', 'mismatch'], 'grey']], 21);
    /* soft argmin đổ vào Mix */
    const sx = bx + 4 * bp + bw;
    s += rarr([[sx + 2, y1 + bh / 2], [sx + 24, y1 + bh / 2], [sx + 24, 278], [bx + bp + bw / 2, 278], [bx + bp + bw / 2, y2 - 2]], { sw: 2.5 });
    s += mnb(bx + bp + 108, y1 - 2, 1) + mnb(bx + 2 * bp + 108, y1 - 2, 2) + mnb(bx + 3 * bp + 108, y1 - 2, 3) + mnb(16 + 108, y2 - 2, 4);
    s += mhl(16, 500, 1158, [MT('Φ lr 1e-5, phần mới lr 3e-4 · AdamW, wd 1e-4 · batch 16 · ≤ 30 epoch, dừng sớm 5', 'Φ lr 1e-5, new parts lr 3e-4 · AdamW, wd 1e-4 · batch 16 · ≤ 30 epochs, early stop 5'),
      MT('điểm video: trung bình top-5 khung · hai đầu ra ai và mismatch · 1,92 M tham số học', 'video score: mean of top-5 frames · two outputs ai and mismatch · 1.92 M trainable parameters')]);
    /* phép tính tham số */
    s += box(16, 610, 1158, 134, 'green', { fill: '#fff', r: 16, sw: 2.5 }) + MTX(38, 648, MT('Tham số học, đếm từ code', 'Trainable parameters, counted from the code'), { size: 24, w: 700 });
    [['Φ', '1,74 M'], ['CNN 2D', '0,019 M'], ['Mix', '0,013 M'], ['TCN', '0,148 M'], [MT('Chuyển động + đầu ra', 'Motion + output'), '0,001 M']].forEach((p, i) => {
      s += MTX(38 + i * 224, 690, p[0], { size: 22, fill: MUTE }) + MTX(38 + i * 224, 722, EN ? p[1].replace(',', '.') : p[1], { size: 26, w: 700 });
    });
    const sp = [
      [1, MT('Φ khởi tạo từ checkpoint công bố', 'Φ from the published checkpoint'), MT('AVH-Align_AV1M.pt (45 k video real AV-1M), học tiếp với lr 1e-5', 'AVH-Align_AV1M.pt (45 k real AV-1M videos), trained further at lr 1e-5')],
      [2, MT('Cost volume thay log-sum-exp', 'Cost volume instead of log-sum-exp'), MT('CNN 2D + soft-argmin trên 31 độ lệch: lấy độ lệch, đỉnh và entropy', '2D CNN + soft-argmin over 31 lags: takes lag, peak and entropy')],
      [3, MT('Chỉ 0,18 M tham số mới', 'Only 0.18 M new parameters'), MT('Φ 1,74 M giữ nguyên cấu trúc; thêm CNN, mix, TCN và nhánh chuyển động', 'Φ (1.74 M) keeps its structure; adds the CNN, mix, TCN and motion stream')],
      [4, MT('Pseudo-fake và luồng môi-đầu', 'Pseudo-fakes and the lip-head stream'), MT('thay đoạn tiếng p = 0,25 (mismatch = 1, AI = 0); vận tốc môi + tư thế đầu', 'audio segment swapped with p = 0.25 (mismatch = 1, AI = 0); lip velocity + head pose')],
      [5, MT('Khác BL-M/sup', 'Differs from BL-M/sup'), MT('cùng Φ, dữ liệu, đặc trưng; M2 khởi tạo từ checkpoint công bố và có thêm cost volume, luồng môi-đầu', 'same Φ, data and features; M2 starts from the published checkpoint and adds the cost volume and lip-head stream')],
    ];
    sp.forEach((p, i) => { s += mspecial(1214, 4 + i * 150, 546, 138, p[0], p[1], p[2]); });
    return s;
  };

  /* ---------- 10t · cách huấn luyện ---------- */
  D.s10t = () => {
    const cards = [
      ['blue', '#F2F7FD', MT('Đặc trưng tính sẵn', 'Pre-computed features'), [MT('landmarks: dlib 68 điểm · CPU · 8,74 giờ', 'landmarks: dlib 68 points · CPU · 8.74 h'), MT('crop miệng 96×96 + tư thế đầu, 8 crop LIPINC, sóng 16 kHz · CPU · 1,48 giờ', 'mouth crop 96×96 + head pose, 8 LIPINC crops, 16 kHz wave · CPU · 1.48 h'),
        MT('AV-HuBERT Large 25 Hz và XLS-R 300M (3 nhóm lớp) · T4 × 2 · 1,38 giờ', 'AV-HuBERT Large 25 Hz and XLS-R 300M (3 layer groups) · T4 × 2 · 1.38 h'), MT('train 4.234 · val 1.052 · test 2.336 mẫu (24 / 6 / 10 người)', 'train 4,234 · val 1,052 · test 2,336 samples (24 / 6 / 10 people)')]],
      ['orange', '#FFF6EC', MT('Công thức huấn luyện', 'Training recipe'), [MT('baseline: đúng code gốc (BL-V Adam 1e-3 · BL-A 1e-6 · BL-M 1e-5 · BL-M/sup 1e-3)', 'baselines: exactly the original code (BL-V Adam 1e-3 · BL-A 1e-6 · BL-M 1e-5 · BL-M/sup 1e-3)'),
        MT('M1, M2: AdamW lr 3e-4, wd 1e-4, batch 16, ≤ 30 epoch, dừng sớm 5', 'M1, M2: AdamW lr 3e-4, wd 1e-4, batch 16, ≤ 30 epochs, early stop 5'), MT('M2: Φ lr 1e-5, phần mới lr 3e-4', 'M2: Φ lr 1e-5, new parts lr 3e-4'),
        MT('cân lớp: pos_weight = số nhãn 0 / số nhãn 1, kẹp trong 0,2–5', 'class balance: pos_weight = #label 0 / #label 1, clamped to 0.2–5')]],
      ['green', '#EFF8ED', MT('Nhãn và tăng cường', 'Labels and augmentation'), [MT('nhãn theo khung 0,04 s cho mọi đầu ra', 'labels per 0.04 s frame for every output'), MT('lấy mẫu train theo 1 / số clip của người đó', 'train sampling weighted by 1 / number of clips of that person'),
        MT('trượt tiếng k ∈ [−1, +2] khung, nhãn giữ nguyên (trừ BL-M)', 'audio shifted by k ∈ [−1, +2] frames, labels kept (except BL-M)'), MT('pseudo-fake thay đoạn tiếng, p = 0,25 (M1, M2)', 'pseudo-fake audio swap, p = 0.25 (M1, M2)')]],
      ['purple', '#F6F1FB', MT('Chạy và kiểm soát', 'Running and control'), [MT('Kaggle 2 × T4; mỗi GPU một tiến trình (LANES)', 'Kaggle 2 × T4; one process per GPU (LANES)'), MT('MAX_HOURS 11: dừng sau epoch, phiên sau train tiếp từ last.pt', 'MAX_HOURS 11: stop after an epoch, next session resumes from last.pt'),
        MT('chọn checkpoint theo val loss; AUC 4 tác vụ mỗi epoch; 1 seed (42)', 'checkpoint by val loss; 4-task AUC every epoch; 1 seed (42)'), MT('test khoá một lần (test-lock) · log W&B', 'test locked to one run (test-lock) · W&B logging')]],
    ];
    let s = '';
    cards.forEach((c, i) => {
      const x = (i % 2) * 900, y = Math.floor(i / 2) * 380;
      s += box(x, y, 860, 360, c[0], { fill: c[1], sw: 2.5 }) + MTX(x + 26, y + 52, c[2], { size: 32, w: 700 });
      s += mbul(x + 26, y + 104, c[3], 25, 34, 60)[0];
    });
    return s;
  };

  /* ---------- 10r · kết quả huấn luyện ---------- */
  D.s10r = () => {
    const V = {"avh_align_plus": {"n": 12, "ai": [0.8796, 0.9063, 0.921, 0.9373, 0.9381, 0.943, 0.9462, 0.9414, 0.939, 0.937, 0.9452, 0.9451], "val_loss": [1.252, 1.093, 1.042, 0.944, 0.895, 0.854, 0.82, 0.887, 0.908, 1.21, 0.996, 0.988], "stop": "early_stop (patience 5)", "best": 0.8196650111176669}, "avh_align": {"n": 27, "ai": [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null], "val_loss": [1.602, 1.454, 1.396, 1.344, 1.306, 1.258, 1.241, 1.231, 1.213, 1.177, 1.174, 1.164, 1.173, 1.155, 1.168, 1.159, 1.146, 1.168, 1.176, 1.187, 1.199, 1.172, 1.179, 1.192, 1.194, 1.194, 1.195], "stop": "early_stop (patience 10)", "best": 1.1455010374387105}, "avh_align_sup": {"n": 32, "ai": [0.8191, 0.8255, 0.8508, 0.8607, 0.8617, 0.8526, 0.8446, 0.8779, 0.871, 0.8709, 0.8675, 0.8723, 0.8726, 0.87, 0.8795, 0.8803, 0.8659, 0.8838, 0.8666, 0.8782, 0.8796, 0.8791, 0.8837, 0.8848, 0.8839, 0.8909, 0.8783, 0.8873, 0.8851, 0.8764, 0.8828, 0.882], "val_loss": [0.602, 0.542, 0.446, 0.436, 0.44, 0.511, 0.463, 0.44, 0.439, 0.435, 0.434, 0.562, 0.431, 0.466, 0.437, 0.449, 0.459, 0.437, 0.511, 0.483, 0.468, 0.423, 0.436, 0.492, 0.505, 0.434, 0.514, 0.524, 0.515, 0.564, 0.595, 0.506], "stop": "early_stop (patience 10)", "best": 0.42318935863594814}, "lipinc_v2": {"n": 29, "ai": [0.4887, 0.5237, 0.5372, 0.5545, 0.5512, 0.5595, 0.5653, 0.5633, 0.5649, 0.5654, 0.5669, 0.5654, 0.5668, 0.5714, 0.5712, 0.5681, 0.5679, 0.5724, 0.5629, 0.5728, 0.5702, 0.5777, 0.5681, 0.5737, 0.5775, 0.5836, 0.5857, 0.5885, 0.5796], "val_loss": [5.988, 5.608, 5.457, 5.351, 5.293, 5.257, 5.218, 5.353, 5.175, 5.174, 5.288, 5.16, 5.128, 5.138, 5.136, 5.232, 5.1, 5.056, 5.042, 5.24, 5.79, 5.152, 5.185, 5.09, 7.617, 5.097, 5.078, 5.055, 5.537], "stop": "early_stop (patience 10)", "best": 5.04165608620009}, "ssl_aasist": {"n": 23, "ai": [0.467, 0.4831, 0.4718, 0.4613, 0.4891, 0.5011, 0.5139, 0.4955, 0.5153, 0.4938, 0.4839, 0.4851, 0.5058, 0.5032, 0.5348, 0.4728, 0.4916, 0.5032, 0.4775, 0.4981, 0.5196, 0.504, 0.4935], "val_loss": [0.835, 0.8, 0.772, 0.751, 0.727, 0.718, 0.703, 0.703, 0.704, 0.7, 0.697, 0.695, 0.69, 0.707, 0.725, 0.708, 0.706, 0.715, 0.721, 0.73, 0.728, 0.754, 0.763], "stop": "early_stop (patience 10)", "best": 0.6904374123072896}, "trihead_v2_no_ref": {"n": 13, "ai": [0.9632, 0.9592, 0.9498, 0.9666, 0.9791, 0.9664, 0.9694, 0.9815, 0.929, 0.9759, 0.9818, 0.9758, 0.979], "val_loss": [1.84, 1.701, 1.803, 1.995, 1.269, 1.703, 1.378, 1.023, 3.199, 1.096, 1.03, 1.27, 1.409], "stop": "early_stop (patience 5)", "best": 1.0227631443806928}, "trihead_v2_no_sync": {"n": 10, "ai": [0.9212, 0.9333, 0.9631, 0.9772, 0.977, 0.971, 0.9759, 0.9568, 0.9673, 0.9755], "val_loss": [2.662, 2.396, 2.207, 2.061, 1.936, 2.03, 1.951, 2.414, 2.039, 2.118], "stop": "early_stop (patience 5)", "best": 1.9358087569588491}, "trihead_v2_no_trace": {"n": 12, "ai": [0.9476, 0.9686, 0.9689, 0.9764, 0.9814, 0.9755, 0.9804, 0.9706, 0.976, 0.9794, 0.977, 0.9787], "val_loss": [1.801, 1.263, 1.254, 1.118, 1.011, 1.123, 1.002, 1.338, 1.12, 1.274, 1.003, 1.079], "stop": "early_stop (patience 5)", "best": 1.0018305112200545}, "trihead_v2": {"n": 15, "ai": [0.9687, 0.9798, 0.9765, 0.9771, 0.9803, 0.9805, 0.9826, 0.9776, 0.9848, 0.9863, 0.9852, 0.9853, 0.9828, 0.9806, 0.9856], "val_loss": [1.504, 1.088, 1.192, 1.094, 1.104, 1.01, 0.93, 1.23, 0.957, 0.904, 0.907, 0.917, 1.173, 1.154, 0.989], "stop": "early_stop (patience 5)", "best": 0.9037014776309633}};
    const cx0 = 76, cy0 = 66, cw = 880, ch = 520, lo = 0.4, hi = 1.0;
    const X = (e) => cx0 + ((e - 1) / 31) * cw, Y = (v) => cy0 + (1 - (v - lo) / (hi - lo)) * ch;
    let s = box(0, 0, 1000, 760, 'grey', { fill: '#FAFAFA', stroke: '#D5D5D5', sw: 2 }) + MTX(24, 30, MT('val AUC (AI?) theo epoch', 'val AUC (AI?) per epoch'), { size: 24, w: 700 });
    for (let v = 0.4; v <= 1.001; v += 0.1) {
      s += line(cx0, Y(v), cx0 + cw, Y(v), { col: v === 0.5 ? '#999' : '#E5E5E5', dash: v === 0.5 }) + MTX(cx0 - 10, Y(v) + 7, mf3(v).slice(0, 3), { size: 20, a: 'end', fill: MUTE });
    }
    [1, 5, 10, 15, 20, 25, 30].forEach((e) => { s += MTX(X(e), cy0 + ch + 28, String(e), { size: 20, a: 'middle', fill: MUTE }); });
    s += MTX(cx0 + cw / 2, cy0 + ch + 56, 'epoch', { size: 21, a: 'middle', fill: MUTE });
    const ser = [
      ['trihead_v2', 'M1', '#2F5FA8', 4, 0, 10], ['avh_align_plus', 'M2', '#2E9E8F', 3.5, 0, 7], ['avh_align_sup', 'BL-M/sup', '#E08A3C', 3, 0, 22], ['lipinc_v2', 'BL-V', '#8A8A8A', 3, 0, 19], ['ssl_aasist', 'BL-A', '#9A6FC0', 3, 0, 13],
      ['trihead_v2_no_sync', 'M1 −sync', '#6F9FD8', 2, 1, 5], ['trihead_v2_no_trace', 'M1 −trace', '#4FB3D9', 2, 1, 7], ['trihead_v2_no_ref', 'M1 −ref', '#8E7CC3', 2, 1, 8],
    ];
    ser.forEach((r, k) => {
      const v = V[r[0]].ai;
      let d = '';
      v.forEach((a, i) => { if (a !== null) d += (d ? ' L' : 'M') + X(i + 1).toFixed(1) + ' ' + Y(a).toFixed(1); });
      s += `<path d="${d}" fill="none" stroke="${r[2]}" stroke-width="${r[3]}" stroke-linejoin="round"${r[4] ? ' stroke-dasharray="7 5"' : ''}/>`;
      const a = v[r[5] - 1];
      if (a !== null) s += `<circle cx="${X(r[5]).toFixed(1)}" cy="${Y(a).toFixed(1)}" r="${r[4] ? 5 : 7}" fill="#fff" stroke="${r[2]}" stroke-width="3"/>`;
      const lx = 90 + (k % 4) * 232, ly = 662 + Math.floor(k / 4) * 36;
      s += `<line x1="${lx}" y1="${ly - 7}" x2="${lx + 34}" y2="${ly - 7}" stroke="${r[2]}" stroke-width="${r[3]}"${r[4] ? ' stroke-dasharray="7 5"' : ''}/>` + MTX(lx + 44, ly, r[1], { size: 22 });
    });
    s += MTX(24, 744, MT('vòng tròn = epoch được chọn · BL-M không có đường vì val chỉ có real', 'circle = chosen epoch · BL-M has no curve because val has real clips only'), { size: 20, it: 1, fill: MUTE });
    /* phải: bảng */
    const rx = 1030;
    s += box(rx, 0, 730, 760, 'blue', { fill: '#F2F7FD', sw: 2 });
    const cols = [rx + 22, rx + 214, rx + 372, rx + 480];
    [MT('Model', 'Model'), 'epoch', MT('giờ', 'hours'), 'val → test'].forEach((h, i) => { s += MTX(cols[i], 40, h, { size: 22, w: 700, fill: MUTE }); });
    const tb = [['M1', '10 / 15', '4,09', '0,986 → 0,947', 1], ['M2', '7 / 12', '0,25', '0,946 → 0,908', 1], ['BL-M/sup', '22 / 32', '1,12', '0,879 → 0,843', 0], ['BL-V', '19 / 29', '0,47', '0,563 → 0,568', 0],
      ['BL-A', '13 / 23', '3,34', '0,506 → 0,512', 0], ['BL-M', '17 / 27', '0,08', MT('chỉ real → 0,416', 'real only → 0.416'), 0], ['M1 −sync', '5 / 10', '1,83', '0,977 → 0,922', 0], ['M1 −trace', '7 / 12', '1,56', '0,980 → 0,948', 0], ['M1 −ref', '8 / 13', '0,94', '0,982 → 0,949', 0]];
    tb.forEach((r, i) => {
      const y = 94 + i * 58;
      if (r[4]) s += `<rect x="${rx + 10}" y="${y - 34}" width="710" height="50" rx="10" fill="#E4EEFA"/>`;
      r.slice(0, 4).forEach((t, k) => { const tt = EN ? String(t).replace(/(\d),(\d)/g, '$1.$2') : t; s += MTX(cols[k], y, tt, { size: 24, w: k === 0 ? 700 : 400 }); });
    });
    s += mbul(rx + 22, 640, [MT('epoch: chọn / chạy · mọi model dừng sớm, không model nào chạm MAX_HOURS', 'epoch: chosen / run · every model stopped early, none hit MAX_HOURS')], 21, 28, 62)[0];
    s += mbul(rx + 22, 700, [MT('val → test giảm ~0,04: người và phương pháp chưa thấy chỉ có ở test', 'val → test drops ~0.04: unseen people and methods exist only in test')], 23, 30, 54)[0];
    return s;
  };

  /* ---------- 10 · AUC ---------- */
  D.s10 = () => {
    const rows = [['M1', 0.947, 1], ['M2', 0.908, 2], ['BL-M/sup', 0.843, 0], ['BL-V', 0.568, 0], ['BL-Ens', 0.564, 0], ['BL-A', 0.512, 0], ['BL-M', 0.416, 0]];
    const x0 = 300, W = 860, f = (v) => String(v).replace('.', ',');
    let s = line(x0 + W / 2, 30, x0 + W / 2, 700, { dash: true }) + txt(x0 + W / 2, 22, 'ngẫu nhiên (0,5)', { size: 26, it: 1, a: 'middle', fill: MUTE });
    rows.forEach((r, i) => {
      const y = 50 + i * 95, w = r[1] * W;
      const fill = r[2] === 1 ? '#8DB6E8' : r[2] === 2 ? '#BCD3F1' : '#E4E4E4', st = r[2] ? '#4F85C6' : '#A0A0A0';
      s += txt(0, y + 46, r[0], { size: 38, w: r[2] === 1 ? 700 : 400 }) +
        `<rect x="${x0}" y="${y}" width="${w}" height="64" rx="10" fill="${fill}" stroke="${st}" stroke-width="2.5"/>` +
        txt(x0 + w + 16, y + 48, f(r[1].toFixed(3)), { size: 42, w: 700, halo: 1 });
    });
    s += box(1330, 50, 430, 300, 'blue') + txt(1360, 100, 'M1 − BL-M/sup', { size: 32, w: 700 }) +
      txt(1360, 205, '+0,104', { size: 100, w: 700 }) + txt(1360, 255, 'CI 95 % [0,080; 0,125]', { size: 28, fill: MUTE }) +
      txt(1360, 305, 'cùng dữ liệu, cùng đầu vào', { size: 26, it: 1, fill: MUTE });
    s += box(1330, 380, 430, 280, 'blue', { fill: '#F0F5FC' }) + txt(1360, 430, 'M2 − BL-M/sup', { size: 32, w: 700 }) +
      txt(1360, 530, '+0,065', { size: 100, w: 700 }) + txt(1360, 580, 'CI 95 % [0,043; 0,085]', { size: 28, fill: MUTE }) +
      txt(1360, 630, 'cùng nền Φ', { size: 26, it: 1, fill: MUTE });
    return s;
  };

  /* ---------- 11 · ablation + sham ---------- */
  D.s11 = () => {
    let s = txt(0, 45, 'Bỏ từng nhánh của M1', { size: 38, w: 700 });
    const rows = [
      ['heat', 'Nhánh khớp', 'tác vụ: lệch tiếng-môi', '0,989 → 0,690', 'red', 'mất 0,30'],
      ['pix', 'Nhánh dấu vết', 'tác vụ: hình giả', '0,981 → 0,978', 'grey', 'không đổi'],
      ['users', 'Tham chiếu người', 'tác vụ: có AI?', '0,947 → 0,949', 'grey', 'không đổi'],
    ];
    rows.forEach((r, i) => {
      const y = 85 + i * 230;
      s += box(0, y, 860, 205, r[4] === 'red' ? 'red' : 'grey') + icon(r[0], 28, y + 28, 64) + txt(115, y + 62, r[1], { size: 38, w: 700 }) +
        txt(115, y + 100, r[2], { size: 26, it: 1, fill: MUTE }) + txt(28, y + 175, r[3], { size: 58, w: 700 }) +
        pill(560, y + 128, 270, 52, r[4], r[5], { size: 30, w: 700 });
    });
    s += txt(920, 45, 'Clip thật lệch tiếng bị báo giả', { size: 38, w: 700 }) +
      txt(920, 88, 'AUC sham so với real · 0,5 = không nhầm', { size: 28, it: 1, fill: MUTE });
    const bars = [['BL-M', 0.981, '#F3C5C3', '#C05A5A'], ['M2', 0.792, '#E4E4E4', '#A0A0A0'], ['M1', 0.543, '#8DB6E8', '#4F85C6']];
    const bx = 1130, BW = 520;
    s += line(bx, 130, bx, 700, { col: '#444', sw: 3 });
    bars.forEach((b, i) => {
      const y = 150 + i * 185, w = (b[1] - 0.5) / 0.5 * BW;
      s += txt(920, y + 76, b[0], { size: 40, w: 700 }) +
        `<rect x="${bx}" y="${y}" width="${w}" height="110" rx="10" fill="${b[2]}" stroke="${b[3]}" stroke-width="2.5"/>` +
        txt(bx + w + 18, y + 76, String(b[1].toFixed(3)).replace('.', ','), { size: 48, w: 700 });
    });
    s += txt(bx, 735, '0,5', { size: 26, a: 'middle', fill: MUTE }) + txt(bx + BW, 735, '1,0', { size: 26, a: 'middle', fill: MUTE });
    return s;
  };

  /* ---------- 12 · đã thấy / chưa thấy ---------- */
  D.s12 = () => {
    let s = txt(0, 45, 'Chưa thấy → AUC giảm', { size: 38, w: 700 });
    const base = 690, sc = 900;
    s += line(0, base, 860, base, { col: '#444', sw: 3 }) + txt(0, base + 34, '0,5', { size: 26, fill: MUTE });
    const bars = [[90, 0.995, 'đã thấy', 'blue'], [270, 0.942, 'chưa thấy', 'orange'], [510, 0.990, 'đã thấy', 'blue'], [690, 0.889, 'chưa thấy', 'orange']];
    bars.forEach((b) => {
      const h = (b[1] - 0.5) * sc, k = COL[b[3]];
      s += `<rect x="${b[0]}" y="${base - h}" width="150" height="${h}" rx="10" fill="${k.f}" stroke="${k.s}" stroke-width="3"/>` +
        txt(b[0] + 75, base - h - 14, String(b[1].toFixed(3)).replace('.', ','), { size: 40, w: 700, a: 'middle' }) +
        txt(b[0] + 75, base + 36, b[2], { size: 26, a: 'middle', it: 1 });
    });
    s += txt(255, 778, 'Generator', { size: 38, w: 700, a: 'middle' }) + txt(675, 778, 'Giọng', { size: 38, w: 700, a: 'middle' });
    s += txt(960, 45, 'Khó nhất với M1', { size: 38, w: 700 });
    const hard = [
      ['bolt', 'LatentSync 1.5', 'generator · họ diffusion', '0,902'],
      ['speaker', 'F5 inpainting', 'giọng · sửa một đoạn', '0,856'],
      ['speaker', 'VoxCPM2', 'giọng · chỉ có ở test', '0,848'],
    ];
    hard.forEach((h, i) => {
      const y = 85 + i * 190;
      s += card(960, y, 800, 170, 'red', h[0], h[1], h[2], { fill: '#fff', ts: 42, ss: 28, isz: 80, tx: 130 }) +
        txt(1730, y + 108, h[3], { size: 70, w: 700, a: 'end' });
    });
    s += box(960, 660, 800, 100, 'grey') + txt(1360, 722, 'Giả cả clip 0,971 · giả một đoạn 0,941', { size: 34, a: 'middle' });
    return s;
  };

  /* ---------- 14 · phụ lục: ngưỡng ---------- */
  D.s14 = () => {
    const cs = [['M1', '79 %', '2,9 %', 'blue'], ['M2', '53 %', '0,9 %', 'blue'], ['BL-M/sup', '47 %', '1,0 %', 'grey']];
    return cs.map((c, i) => {
      const x = i * 600;
      return box(x, 0, 560, 750, c[3]) + txt(x + 280, 85, c[0], { size: 52, w: 700, a: 'middle' }) +
        icon('target', x + 40, 150, 56) + txt(x + 115, 190, 'bắt được clip giả', { size: 32 }) +
        txt(x + 280, 340, c[1], { size: 130, w: 700, a: 'middle' }) +
        icon('warn', x + 40, 440, 56) + txt(x + 115, 480, 'báo nhầm clip thật', { size: 32 }) +
        txt(x + 280, 620, c[2], { size: 100, w: 700, a: 'middle' }) +
        txt(x + 280, 690, 'ở test', { size: 28, it: 1, a: 'middle', fill: MUTE });
    }).join('');
  };

  /* ---------- vẽ + điều hướng ---------- */
  function init() {
    document.querySelectorAll('svg[data-d]').forEach((el) => { el.innerHTML = D[el.dataset.d](); });
    /* kiểm tra bản dịch: chuỗi tiếng Việt chưa có trong EN_D */
    document.body.dataset.miss = JSON.stringify([...miss]);
    const lang = document.querySelector('a.lang');
    if (lang) lang.href += location.search;
    const btn = document.getElementById('tn');
    const toggle = () => {
      const hid = document.body.classList.toggle('hide-notes');
      btn.textContent = tr(hid ? 'Ghi chú: tắt (N)' : 'Ghi chú: bật (N)');
    };
    btn.addEventListener('click', toggle);
    document.addEventListener('keydown', (e) => { if (e.key === 'n' || e.key === 'N') toggle(); });
    nav();
  }

  function nav() {
    const secs = Array.from(document.querySelectorAll('main > section'));
    const counter = document.createElement('div');
    counter.className = 'counter';
    document.body.appendChild(counter);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (i) => Math.max(0, Math.min(secs.length - 1, i));
    const nearest = () => {
      const y = window.scrollY + window.innerHeight / 2;
      let best = 0;
      secs.forEach((s, i) => { if (s.offsetTop <= y) best = i; });
      return best;
    };
    const show = () => { counter.textContent = `${nearest() + 1} / ${secs.length}`; };
    let anim = 0, animating = false, target = 0;
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    function goTo(i) {
      i = clamp(i);
      target = i;
      const from = window.scrollY, to = secs[i].offsetTop;
      const dist = Math.abs(to - from);
      cancelAnimationFrame(anim);
      if (reduce || dist < 2) { window.scrollTo(0, to); animating = false; show(); return; }
      const dur = Math.min(900, 520 + dist / 6);
      const t0 = performance.now();
      animating = true;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        window.scrollTo(0, from + (to - from) * ease(p));
        if (p < 1) anim = requestAnimationFrame(step);
        else { animating = false; show(); }
      };
      anim = requestAnimationFrame(step);
    }
    const next = (d) => goTo((animating ? target : nearest()) + d);

    window.addEventListener('scroll', show, { passive: true });
    let lockUntil = 0;
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = performance.now();
      if (now < lockUntil) { lockUntil = Math.max(lockUntil, now + 90); return; }
      if (Math.abs(e.deltaY) < 4) return;
      next(e.deltaY > 0 ? 1 : -1);
      lockUntil = now + 700;
    }, { passive: false });
    let y0 = null;
    window.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (y0 === null) return;
      const dy = y0 - e.changedTouches[0].clientY;
      y0 = null;
      if (Math.abs(dy) > 50) next(dy > 0 ? 1 : -1);
    }, { passive: true });
    let idle = 0;
    window.addEventListener('scroll', () => {
      if (animating) return;
      clearTimeout(idle);
      idle = setTimeout(() => { if (!animating) goTo(nearest()); }, 160);
    }, { passive: true });
    window.addEventListener('resize', () => { window.scrollTo(0, secs[nearest()].offsetTop); show(); });
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || k === 'ArrowRight' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); next(1); }
      else if (k === 'ArrowUp' || k === 'PageUp' || k === 'ArrowLeft' || (k === ' ' && e.shiftKey)) { e.preventDefault(); next(-1); }
      else if (k === 'Home') { e.preventDefault(); goTo(0); }
      else if (k === 'End') { e.preventDefault(); goTo(secs.length - 1); }
    });
    /* ?s=N nhảy thẳng tới trang N (dùng khi chụp màn hình kiểm tra) */
    const q = /[?&]s=(\d+)/.exec(location.search);
    if (q) window.scrollTo(0, secs[clamp(parseInt(q[1], 10) - 1)].offsetTop);
    /* ?only=N chỉ hiện trang N (chụp headless không cuộn được) */
    const o = /[?&]only=(\d+)/.exec(location.search);
    if (o) secs.forEach((s, i) => { if (i !== parseInt(o[1], 10) - 1) s.style.display = 'none'; });
    show();
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init); else window.addEventListener('load', init);
})();
