// Trang trí theo mùa và thời tiết trên sân trường (theo giờ Việt Nam):
// Tết hoa đào, đèn lồng đỏ; Trung thu đèn lồng, đèn ông sao; 20/11 băng rôn tri ân thầy cô; tháng 5–6 phượng nở rộ, cánh
// phượng rơi; tháng 2–3 có ngày mưa phùn; sáng sớm mùa đông có ngày sương mù.
// Xem trước bằng tham số ?mua=tet | trungthu | 2011 | phuong | mua | suong | thuong (có thể ghép: ?mua=tet,mua).

// Ngày mùng 1 Tết và rằm tháng Tám (dương lịch) các năm
const TET = { 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19', 2035: '02-08' };
const TRUNG_THU = { 2025: '10-06', 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12', 2031: '10-01', 2032: '09-19', 2033: '09-08', 2034: '09-27', 2035: '09-16' };
const CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'];
const CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];
export const canChi = (y) => `${CAN[y % 10]} ${CHI[y % 12]}`;

const DAY = 86400e3;
// số ngày (theo giờ VN) kể từ 1/1/1970
const vnDay = (t) => Math.floor((t + 7 * 3600e3) / DAY);
const dayOf = (y, md) => md ? vnDay(Date.UTC(y, Number(md.slice(0, 2)) - 1, Number(md.slice(3)), 0) - 7 * 3600e3) : null;
// số giả ngẫu nhiên ổn định cho mỗi ngày (cùng ngày thì mọi người thấy cùng thời tiết)
const dayRand = (d, salt) => { const x = Math.sin(d * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); };

export function seasonOf(now = Date.now(), force = '') {
  const v = new Date(now + 7 * 3600e3);
  const y = v.getUTCFullYear(), mo = v.getUTCMonth() + 1, day = v.getUTCDate(), min = v.getUTCHours() * 60 + v.getUTCMinutes();
  const d = vnDay(now);
  const f = new Set(String(force || '').toLowerCase().split(/[,\s]+/).filter(Boolean));
  const forced = f.size > 0;
  const out = { fest: null, year: y, rain: false, fog: 0, bloom: {}, gate: null, stage: null, greet: null };

  // ---- Lễ, Tết ----
  const tet = dayOf(y, TET[y]), tt = dayOf(y, TRUNG_THU[y]);
  if (f.has('tet') || (!forced && tet !== null && d >= tet - 14 && d <= tet + 10)) out.fest = 'tet';
  else if (f.has('trungthu') || (!forced && tt !== null && d >= tt - 10 && d <= tt + 2)) out.fest = 'trungthu';
  else if (f.has('2011') || (!forced && mo === 11 && day >= 10 && day <= 21)) out.fest = '2011';
  if (out.fest === 'tet') {
    out.canChi = canChi(y);
    out.gate = { text: `CHÚC MỪNG NĂM MỚI – XUÂN ${out.canChi.toUpperCase()} ${y}`, bg: '#C62828', fg: '#FFE08A' };
    out.stage = `MỪNG XUÂN ${out.canChi.toUpperCase()}`;
    out.greet = `🧧 Chúc mừng năm mới Xuân ${out.canChi} ${y}! An khang thịnh vượng, vạn sự như ý!`;
  } else if (out.fest === 'trungthu') {
    out.gate = { text: `VUI TẾT TRUNG THU ${y} – RƯỚC ĐÈN ĐÊM TRĂNG RẰM`, bg: '#E65100', fg: '#FFF3C4' };
    out.stage = 'ĐÊM HỘI TRĂNG RẰM';
    out.greet = '🏮 Vui Tết Trung thu! Tối nay ra sân trường ngắm đèn lồng, đèn ông sao nhé!';
  } else if (out.fest === '2011') {
    out.gate = { text: 'CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM 20-11', bg: '#AD1457', fg: '#FFFFFF' };
    out.stage = 'TRI ÂN THẦY CÔ 20-11';
    out.greet = '💐 Chúc mừng ngày Nhà giáo Việt Nam 20-11! Ghé phòng giáo viên gửi lời tri ân thầy cô nhé.';
  }

  // ---- Mùa hoa: 0 = lác đác, 1 = có hoa, 2 = nở rộ ----
  const pick = (full, some) => (full.includes(mo) ? 2 : some.includes(mo) ? 1 : 0);
  out.bloom = {
    phuong: f.has('phuong') ? 2 : forced ? 1 : pick([5, 6], [4, 7]),
    banglang: forced ? 1 : pick([5, 6, 7], [4, 8]),
    hoasua: forced ? 1 : pick([10, 11], [9, 12]),
  };
  if (out.bloom.phuong === 2 && !out.greet) out.greet = '🌺 Mùa phượng nở đỏ sân trường – mùa thi, mùa chia tay…';

  // ---- Thời tiết ----
  out.rain = f.has('mua') || (!forced && (mo === 2 || mo === 3) && dayRand(d, 1) < 0.6);
  if (f.has('suong')) out.fog = 1;
  else if (!forced && [11, 12, 1, 2, 3].includes(mo) && dayRand(d, 2) < 0.5 && min >= 300 && min < 510) {
    out.fog = min < 450 ? 1 : (510 - min) / 60; // dày đến 7:30, tan dần tới 8:30
  }
  return out;
}
