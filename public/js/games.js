// Trò chơi nhỏ: đá cầu (sân bóng) và đố vui theo môn chuyên (trong lớp học).

// ---------- Đá cầu: chạm vào quả cầu để tâng, rơi xuống đất là hết lượt ----------
export function startDaCau(canvas, onEnd) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  const s = { x: W / 2, y: H * 0.3, vx: 0, vy: 0, rot: 0 };
  let score = 0, alive = true, started = false, raf = 0, last = performance.now(), flash = 0;
  const G = 900;

  function kick(px, py) {
    if (!alive) return;
    const d = Math.hypot(px - s.x, py - s.y);
    if (d > 54) return;
    started = true;
    score++;
    const spd = 520 + Math.min(score * 12, 260);
    s.vy = -spd;
    s.vx = (s.x - px) * 6 + (Math.random() - 0.5) * (120 + score * 8);
    flash = 1;
  }
  const onDown = (e) => { const r = canvas.getBoundingClientRect(); kick(e.clientX - r.left, e.clientY - r.top); };
  canvas.addEventListener('pointerdown', onDown);

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (started && alive) {
      s.vy += G * dt * 0.55; // cầu lông vũ rơi chậm
      s.vy = Math.min(s.vy, 420);
      s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vx * dt * 0.02;
      if (s.x < 20) { s.x = 20; s.vx = Math.abs(s.vx); }
      if (s.x > W - 20) { s.x = W - 20; s.vx = -Math.abs(s.vx); }
      if (s.y < 20) { s.y = 20; s.vy = Math.abs(s.vy) * 0.3; }
      if (s.y > H - 30) { alive = false; onEnd(score); }
    }
    flash = Math.max(0, flash - dt * 4);
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#CFE8FF'); g.addColorStop(1, '#EAF6E3');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5FAE55'; ctx.fillRect(0, H - 30, W, 30);
    // cầu
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate((s.vy < 0 ? Math.PI : 0) + Math.sin(s.rot) * 0.3);
    ctx.fillStyle = '#F2F2F2';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(i * 6 - 4, -26); ctx.lineTo(i * 6 + 4, -26); ctx.fill(); }
    ctx.fillStyle = '#D8343A'; ctx.beginPath(); ctx.arc(0, 2, 8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (flash) { ctx.strokeStyle = `rgba(242,106,33,${flash})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y, 30 + (1 - flash) * 20, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#1B2A4E'; ctx.font = '800 40px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center';
    ctx.fillText(String(score), W / 2, 56);
    if (!started) { ctx.font = '600 14px "Be Vietnam Pro", system-ui'; ctx.fillText('Chạm vào quả cầu để tâng!', W / 2, H * 0.3 + 60); }
    if (!alive) { ctx.font = '700 18px "Be Vietnam Pro", system-ui'; ctx.fillText('Rơi mất rồi! Được ' + score + ' quả', W / 2, H / 2); }
    if (alive) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onDown); };
}

// ---------- Đố vui theo môn ----------
// Mỗi câu: [câu hỏi, [đáp án...], chỉ số đáp án đúng]
export const QUIZ = {
  'Toán': [
    ['Tổng các góc trong của một ngũ giác là?', ['360°', '540°', '720°', '450°'], 1],
    ['Số nguyên tố chẵn duy nhất là?', ['0', '2', '4', 'Không có'], 1],
    ['Đạo hàm của sin x là?', ['cos x', '−cos x', '−sin x', 'tan x'], 0],
  ],
  'Tin': [
    ['1 byte bằng bao nhiêu bit?', ['4', '8', '16', '10'], 1],
    ['Độ phức tạp của tìm kiếm nhị phân là?', ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'], 2],
    ['Ngôn ngữ thường dùng ở kỳ thi HSG Tin những năm 2000?', ['Pascal', 'Swift', 'Kotlin', 'Rust'], 0],
  ],
  'Lý': [
    ['Đơn vị của điện trở là?', ['Vôn', 'Ampe', 'Ôm', 'Oát'], 2],
    ['Vận tốc ánh sáng trong chân không xấp xỉ?', ['3·10⁵ km/s', '3·10⁸ km/s', '340 m/s', '3·10⁶ m/s'], 0],
    ['Gia tốc rơi tự do gần mặt đất xấp xỉ?', ['9,8 m/s²', '8,9 m/s²', '10,8 m/s²', '1,6 m/s²'], 0],
  ],
  'Hóa': [
    ['Kí hiệu hoá học của sắt là?', ['Fe', 'Sa', 'Ir', 'F'], 0],
    ['pH của nước nguyên chất ở 25°C là?', ['0', '7', '14', '1'], 1],
    ['Khí chiếm tỉ lệ lớn nhất trong không khí?', ['O₂', 'CO₂', 'N₂', 'Ar'], 2],
  ],
  'Sinh': [
    ['Bào quan thực hiện quang hợp?', ['Ti thể', 'Lục lạp', 'Ribôxôm', 'Nhân'], 1],
    ['ADN có cấu trúc?', ['Mạch đơn', 'Xoắn kép', 'Ba mạch', 'Vòng đơn'], 1],
    ['Người có bao nhiêu nhiễm sắc thể trong tế bào sinh dưỡng?', ['23', '44', '46', '48'], 2],
  ],
  'Văn': [
    ['"Truyện Kiều" là tác phẩm của?', ['Nguyễn Trãi', 'Nguyễn Du', 'Hồ Xuân Hương', 'Nguyễn Khuyến'], 1],
    ['Bài thơ "Tây Tiến" của tác giả nào?', ['Quang Dũng', 'Tố Hữu', 'Chính Hữu', 'Huy Cận'], 0],
    ['"Vợ chồng A Phủ" của nhà văn?', ['Kim Lân', 'Tô Hoài', 'Nam Cao', 'Nguyễn Tuân'], 1],
  ],
  'Sử': [
    ['Chiến thắng Điện Biên Phủ diễn ra năm?', ['1945', '1954', '1968', '1975'], 1],
    ['Cuộc khởi nghĩa Thái Nguyên do Đội Cấn lãnh đạo nổ ra năm?', ['1917', '1930', '1908', '1945'], 0],
    ['ATK Định Hóa thuộc tỉnh nào?', ['Tuyên Quang', 'Thái Nguyên', 'Bắc Kạn', 'Lạng Sơn'], 1],
  ],
  'Địa': [
    ['Sông Cầu chảy qua thành phố nào?', ['Thái Nguyên', 'Hải Phòng', 'Vinh', 'Huế'], 0],
    ['Hồ Núi Cốc thuộc tỉnh?', ['Phú Thọ', 'Thái Nguyên', 'Hòa Bình', 'Yên Bái'], 1],
    ['Đặc sản chè nổi tiếng của Thái Nguyên là chè?', ['Shan Tuyết', 'Tân Cương', 'Ô Long', 'Bảo Lộc'], 1],
  ],
  'Anh': [
    ['Past tense of "go"?', ['goed', 'gone', 'went', 'going'], 2],
    ['"Gifted school" nghĩa là?', ['Trường quốc tế', 'Trường chuyên', 'Trường nghề', 'Trường tư'], 1],
    ['Choose the synonym of "happy":', ['sad', 'glad', 'angry', 'tired'], 1],
  ],
  'Nga': [
    ['"Спасибо" nghĩa là?', ['Xin chào', 'Cảm ơn', 'Tạm biệt', 'Xin lỗi'], 1],
    ['Thủ đô của Liên bang Nga?', ['Saint Petersburg', 'Kazan', 'Moskva', 'Novosibirsk'], 2],
    ['"Здравствуйте" dùng để?', ['Chào hỏi', 'Cảm ơn', 'Chúc ngủ ngon', 'Hỏi đường'], 0],
  ],
  'Pháp': [
    ['"Merci" nghĩa là?', ['Cảm ơn', 'Xin chào', 'Vâng', 'Không'], 0],
    ['"École" nghĩa là?', ['Bệnh viện', 'Trường học', 'Thư viện', 'Nhà ga'], 1],
    ['Thủ đô của Pháp?', ['Lyon', 'Marseille', 'Paris', 'Nice'], 2],
  ],
  'Trung': [
    ['"你好" đọc là?', ['Xièxie', 'Nǐ hǎo', 'Zàijiàn', 'Duìbuqǐ'], 1],
    ['"学校" nghĩa là?', ['Trường học', 'Học sinh', 'Thầy giáo', 'Sách vở'], 0],
    ['"谢谢" nghĩa là?', ['Tạm biệt', 'Xin lỗi', 'Cảm ơn', 'Không sao'], 2],
  ],
};
