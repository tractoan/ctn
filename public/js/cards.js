// Thiệp, giấy chứng nhận dạng ảnh (vẽ bằng canvas) + chia sẻ / tải về.
const LOGO = Object.assign(new Image(), { src: 'logo.jpg' });
const F = (w, size, fam = '"Be Vietnam Pro", system-ui, sans-serif') => `${w} ${size}px ${fam}`;
const HAND = 'Pangolin, "Be Vietnam Pro", cursive';

function wrap(x, text, maxW) {
  const words = String(text).split(/\s+/), lines = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
async function logoReady() { await LOGO.decode().catch(() => {}); return LOGO.naturalWidth > 0; }
function drawLogo(x, cx, cy, r) { x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip(); x.drawImage(LOGO, cx - r, cy - r, r * 2, r * 2); x.restore(); }

export const DIPLOMA_QUOTES = {
  hs: [
    'Đã đi qua những năm tháng áo trắng dưới mái trường, mang theo tình thầy trò, tình bạn và những mùa phượng đỏ.',
    'Đã hoàn thành hành trình ba năm Chuyên với bao giờ học, bao kỳ thi và những người bạn đáng nhớ nhất.',
    'Đã lớn lên cùng sân trường, ghế đá, tiếng trống và lời dạy của thầy cô.',
    'Một lần là học trò Chuyên Thái Nguyên, mãi mãi là một phần của ngôi trường này.',
  ],
  gv: [
    'Với lòng biết ơn các thế hệ học trò gửi tới người đã đứng trên bục giảng của trường.',
    'Tri ân người đã thắp lửa đam mê và dẫn đường cho bao lớp học trò Chuyên.',
    'Mỗi thành công của học trò hôm nay đều có dấu ấn của thầy cô.',
  ],
  khach: [
    'Đã ghé thăm sân trường, để lại dấu chân và lời chúc cho các thế hệ học sinh.',
    'Ước mơ vào Chuyên bắt đầu từ chính chuyến thăm hôm nay.',
    'Sân trường luôn rộng cửa chào đón những người bạn mới.',
  ],
};

export async function drawDiploma(me, quoteIdx = 0) {
  await logoReady();
  const kind = me.role === 'gv' ? 'gv' : me.role === 'khach' || me.role === 'em' ? 'khach' : 'hs';
  const title = { hs: 'GIẤY CHỨNG NHẬN TỐT NGHIỆP', gv: 'GIẤY CHỨNG NHẬN NHÀ GIÁO', khach: 'GIẤY CHỨNG NHẬN THAM QUAN' }[kind];
  const quotes = DIPLOMA_QUOTES[kind];
  const W = 900, H = 640;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#FFFBEF'; x.fillRect(0, 0, W, H);
  // viền hoa văn
  x.strokeStyle = '#B8862B'; x.lineWidth = 10; x.strokeRect(18, 18, W - 36, H - 36);
  x.strokeStyle = '#D8343A'; x.lineWidth = 2; x.strokeRect(34, 34, W - 68, H - 68);
  x.fillStyle = '#B8862B';
  for (const [cx, cy] of [[34, 34], [W - 34, 34], [34, H - 34], [W - 34, H - 34]]) { x.beginPath(); x.arc(cx, cy, 12, 0, Math.PI * 2); x.fill(); }
  x.textAlign = 'center';
  x.fillStyle = '#C62828'; x.font = F(700, 15); x.fillText('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', W / 2, 74);
  x.fillStyle = '#1D2433'; x.font = F(600, 13); x.fillText('Độc lập – Tự do – Hạnh phúc', W / 2, 94);
  if (LOGO.naturalWidth) drawLogo(x, 110, 110, 46);
  x.fillStyle = '#1B2A4E'; x.font = F(700, 14); x.fillText('TRƯỜNG THPT CHUYÊN THÁI NGUYÊN · HỌP LỚP ONLINE', W / 2, 136);
  x.fillStyle = '#C62828'; x.font = F(800, 38); x.fillText(title, W / 2, 196);
  x.fillStyle = '#5B6577'; x.font = F(600, 16); x.fillText('Bản kỷ niệm trao cho', W / 2, 240);
  x.fillStyle = '#1B2A4E'; x.font = F(400, 52, HAND); x.fillText(me.name, W / 2, 300);
  const sub = kind === 'hs' ? `Khóa ${String(me.khoa || '').replace(/^K/, '')} · Lớp chuyên ${me.lop || ''}` : kind === 'gv' ? 'Nhà giáo của trường' : (me.school || 'Người bạn ghé thăm trường');
  x.fillStyle = '#B8862B'; x.font = F(700, 18); x.fillText(sub, W / 2, 334);
  x.fillStyle = '#1D2433'; x.font = F(400, 22, HAND);
  wrap(x, quotes[quoteIdx % quotes.length], 640).forEach((ln, i) => x.fillText(ln, W / 2, 384 + i * 32));
  const d = new Date();
  x.textAlign = 'right'; x.fillStyle = '#5B6577'; x.font = F(600, 15);
  x.fillText(`Thái Nguyên, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`, W - 90, 486);
  // con dấu
  x.save(); x.translate(W - 210, 548); x.rotate(-0.18);
  x.strokeStyle = 'rgba(216,52,58,.85)'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 44, 0, Math.PI * 2); x.stroke();
  x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, 36, 0, Math.PI * 2); x.stroke();
  x.fillStyle = 'rgba(216,52,58,.85)'; x.textAlign = 'center'; x.font = F(800, 15); x.fillText('CHUYÊN', 0, -2); x.fillText('THÁI NGUYÊN', 0, 16);
  x.restore();
  x.textAlign = 'center'; x.fillStyle = '#9AA0A6'; x.font = F(600, 12);
  x.fillText('Bản kỷ niệm – không có giá trị pháp lý', W / 2, H - 48);
  return c;
}

export async function drawThanksCard({ to, message, from, label }) {
  await logoReady();
  const W = 720, H = 900;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFF1F2'); g.addColorStop(1, '#FFF8EC');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // hoa viền
  const flower = (cx, cy, r, col) => {
    x.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; x.beginPath(); x.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.8, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#F2B233'; x.beginPath(); x.arc(cx, cy, r * 0.6, 0, Math.PI * 2); x.fill();
  };
  const cols = ['#F06292', '#E5382F', '#F48FB1', '#BA68C8', '#FF8A65'];
  for (let i = 0; i < 14; i++) { flower(40 + i * 50, 36 + (i % 2) * 14, 11, cols[i % 5]); flower(40 + i * 50, H - 40 - (i % 2) * 14, 11, cols[(i + 2) % 5]); }
  x.fillStyle = '#5D8F45'; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(65 + i * 50, 62, 12, 5, 0.6, 0, Math.PI * 2); x.fill(); }
  x.textAlign = 'center';
  if (LOGO.naturalWidth) drawLogo(x, W / 2, 150, 54);
  x.fillStyle = '#C62828'; x.font = F(800, 40); x.fillText('Thiệp tri ân thầy cô', W / 2, 260);
  x.fillStyle = '#B8862B'; x.font = F(700, 16); x.fillText('TRƯỜNG THPT CHUYÊN THÁI NGUYÊN', W / 2, 292);
  x.textAlign = 'left'; x.fillStyle = '#25407A'; x.font = F(400, 34, HAND); x.fillText(`Kính gửi ${to || 'thầy cô'},`, 70, 370);
  x.font = F(400, 28, HAND);
  wrap(x, message || 'Em cảm ơn thầy cô vì đã dạy dỗ, dìu dắt em trong những năm tháng ở mái trường Chuyên.', W - 140).slice(0, 9).forEach((ln, i) => x.fillText(ln, 70, 430 + i * 42));
  x.textAlign = 'right'; x.font = F(400, 28, HAND); x.fillText(`Từ ${from || 'một học trò'}`, W - 70, H - 150);
  if (label) { x.fillStyle = '#5B6577'; x.font = F(600, 16); x.fillText(label, W - 70, H - 120); }
  return c;
}

// Chia sẻ (điện thoại) hoặc trả về link tải (máy tính)
export async function shareCanvas(canvas, filename, text) {
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9));
  try {
    const file = new File([blob], filename, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  return 'download';
}

// Thiệp mời vào trường (in ra hoặc gửi ảnh): tên người mời, mã QR to dẫn tới link mời
export async function drawInviteCard({ name, sub, link }) {
  await logoReady();
  const { qrMatrix } = await import('./qr.js');
  const W = 720, H = 1040;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFFDF6'); g.addColorStop(1, '#FFF3E4');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // viền xanh đồng phục + chùm phượng ở các góc
  x.strokeStyle = '#1E2E6B'; x.lineWidth = 10; x.strokeRect(18, 18, W - 36, H - 36);
  x.strokeStyle = '#5DBDEB'; x.lineWidth = 3; x.strokeRect(34, 34, W - 68, H - 68);
  const petal = (cx, cy, r, col) => {
    x.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; x.beginPath(); x.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.85, r * 0.6, a, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#FFD54F'; x.beginPath(); x.arc(cx, cy, r * 0.35, 0, Math.PI * 2); x.fill();
  };
  const cluster = (cx, cy, dx, dy) => {
    x.fillStyle = '#4E8B3A';
    for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(cx + dx * i * 16, cy + dy * (i % 3) * 14, 16, 6, dx * dy * 0.7, 0, Math.PI * 2); x.fill(); }
    [[0, 0], [26, 14], [8, 34], [44, 4], [30, 44]].forEach(([a, b], i) => petal(cx + dx * a, cy + dy * b, 11 - (i % 2) * 2, i % 2 ? '#F4511E' : '#E53935'));
  };
  cluster(60, 60, 1, 1); cluster(W - 60, 60, -1, 1); cluster(60, H - 60, 1, -1); cluster(W - 60, H - 60, -1, -1);
  x.textAlign = 'center';
  if (LOGO.naturalWidth) drawLogo(x, W / 2, 120, 48);
  x.fillStyle = '#1E2E6B'; x.font = F(800, 19); x.fillText('TRƯỜNG THPT CHUYÊN THÁI NGUYÊN', W / 2, 200);
  x.fillStyle = '#C62828'; x.font = F(800, 46); x.fillText('Thiệp mời họp lớp', W / 2, 262);
  x.fillStyle = '#5B6577'; x.font = F(600, 18); x.fillText('Về thăm sân trường xưa · 234A Lương Ngọc Quyến (1995–2019)', W / 2, 296);
  x.fillStyle = '#25407A'; x.font = F(400, 32, HAND);
  wrap(x, `${name || 'Bạn cũ'}${sub ? ' (' + sub + ')' : ''} mời bạn ghé chơi!`, W - 140).slice(0, 2).forEach((ln, i) => x.fillText(ln, W / 2, 356 + i * 40));
  // mã QR
  const m = qrMatrix(link), n = m.length, box = 400, px = Math.floor(box / (n + 8)), size = px * (n + 8);
  const qx = (W - size) / 2, qy = 430;
  x.fillStyle = '#FFFFFF'; x.fillRect(qx, qy, size, size);
  x.strokeStyle = '#D8DEE9'; x.lineWidth = 2; x.strokeRect(qx, qy, size, size);
  x.fillStyle = '#1B2A4E';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (m[r][k]) x.fillRect(qx + (k + 4) * px, qy + (r + 4) * px, px, px);
  x.fillStyle = '#1E2E6B'; x.font = F(700, 20); x.fillText('Quét mã để vào trường, tạo nhân vật của bạn', W / 2, qy + size + 44);
  x.fillStyle = '#5B6577'; x.font = F(500, 16);
  const shown = link.replace(/^https?:\/\//, '');
  wrap(x, shown.replace(/([/?=&])/g, '$1 '), W - 160).slice(0, 2).forEach((ln, i) => x.fillText(ln.replace(/([/?=&]) /g, '$1'), W / 2, qy + size + 76 + i * 22));
  x.fillStyle = '#B8862B'; x.font = F(400, 24, HAND);
  wrap(x, 'Một lần là học trò Chuyên, mãi mãi là một phần của ngôi trường này', W - 200).slice(0, 2).forEach((ln, i) => x.fillText(ln, W / 2, H - 122 + i * 30));
  return c;
}
