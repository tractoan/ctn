// SƠ ĐỒ KHUÔN VIÊN – cơ sở 234A đường Lương Ngọc Quyến, phường Quang Trung, TP Thái Nguyên
// (trường học tại đây giai đoạn 1995–2019: nhà A là nhà hiệu bộ, nhà B, C, D là các dãy lớp học).
//
// Toạ độ tính bằng "pixel thế giới", hướng Bắc ở trên, cổng trường mở ra đường Lương Ngọc Quyến ở phía dưới.
// Vị trí, kích thước các dãy nhà là ƯỚC LƯỢNG – sửa trực tiếp các con số trong file này cho khớp thực tế,
// mọi thứ khác (va chạm, tìm đường, nhãn, bản đồ thu nhỏ) tự cập nhật theo.

export const WORLD = { w: 2000, h: 1720 };

export const SPAWN = { x: 1000, y: 1325 };

// Mặt đất: vẽ theo thứ tự (sau đè trước)
export const GROUNDS = [
  { kind: 'road', x: 0, y: 1550, w: 2000, h: 170, label: 'ĐƯỜNG LƯƠNG NGỌC QUYẾN' },
  { kind: 'sidewalk', x: 0, y: 1510, w: 2000, h: 40 },
  { kind: 'grass', x: 40, y: 40, w: 1920, h: 1460 },
  { kind: 'paving', x: 560, y: 660, w: 880, h: 660, label: 'SÂN TRƯỜNG' },
  { kind: 'paving', x: 930, y: 1320, w: 140, h: 190 },
  { kind: 'paving', x: 520, y: 620, w: 960, h: 40 },
  { kind: 'paving', x: 540, y: 340, w: 920, h: 130 },
  { kind: 'paving', x: 330, y: 160, w: 50, h: 1160 },
  { kind: 'paving', x: 1620, y: 160, w: 60, h: 1160 },
  { kind: 'paving', x: 380, y: 1300, w: 1240, h: 40 },
  { kind: 'field', x: 1690, y: 160, w: 240, h: 640, label: 'SÂN BÓNG' },
  { kind: 'garden', x: 80, y: 820, w: 240, h: 460, label: 'VƯỜN TRƯỜNG' },
];

// Toà nhà: vật cản + nhãn. floors chỉ dùng để vẽ số tầng.
export const BUILDINGS = [
  { id: 'A', name: 'Nhà A · Hiệu bộ', short: 'NHÀ A', x: 680, y: 470, w: 640, h: 150, floors: 4, wall: '#F6E7C8', roof: '#B5452F' },
  { id: 'B', name: 'Nhà B · Lớp học', short: 'NHÀ B', x: 380, y: 500, w: 140, h: 800, floors: 3, wall: '#F3E3C0', roof: '#A8432E', vertical: true },
  { id: 'C', name: 'Nhà C · Lớp học', short: 'NHÀ C', x: 1480, y: 500, w: 140, h: 800, floors: 3, wall: '#F3E3C0', roof: '#A8432E', vertical: true },
  { id: 'D', name: 'Nhà D · Lớp học', short: 'NHÀ D', x: 620, y: 200, w: 760, h: 140, floors: 3, wall: '#F3E3C0', roof: '#A8432E' },
  { id: 'DN', name: 'Nhà đa năng', short: 'NHÀ ĐA NĂNG', x: 80, y: 160, w: 250, h: 320, floors: 1, wall: '#DCE9F5', roof: '#2F6FB5' },
  { id: 'CT', name: 'Căng tin', short: 'CĂNG TIN', x: 80, y: 560, w: 250, h: 200, floors: 1, wall: '#FFF1D6', roof: '#E08A1E' },
  { id: 'KTX', name: 'Ký túc xá', short: 'KÝ TÚC XÁ', x: 1700, y: 880, w: 220, h: 400, floors: 4, wall: '#EDE6F7', roof: '#6E56A8', vertical: true },
  { id: 'XE1', name: 'Nhà xe học sinh', short: 'NHÀ XE HS', x: 560, y: 1360, w: 300, h: 110, floors: 0, wall: '#E7EBF0', roof: '#7C8A9A', shed: true },
  { id: 'XE2', name: 'Nhà xe giáo viên', short: 'NHÀ XE GV', x: 1240, y: 1360, w: 200, h: 110, floors: 0, wall: '#E7EBF0', roof: '#7C8A9A', shed: true },
  { id: 'BV', name: 'Phòng bảo vệ', short: 'BẢO VỆ', x: 1180, y: 1430, w: 60, h: 50, floors: 1, wall: '#FFF', roof: '#1B2A4E' },
];

// Tường rào (vật cản mỏng). Chừa khoảng trống cổng chính x 900–1100.
export const WALLS = [
  { x: 30, y: 30, w: 1940, h: 12 },
  { x: 30, y: 30, w: 12, h: 1480 },
  { x: 1958, y: 30, w: 12, h: 1480 },
  { x: 30, y: 1498, w: 870, h: 12 },
  { x: 1100, y: 1498, w: 870, h: 12 },
];

export const GATE = { x: 900, y: 1498, w: 200, sign: 'TRƯỜNG THPT CHUYÊN THÁI NGUYÊN' };

// Lớp chuyên theo dãy nhà (sắp xếp minh hoạ – đổi tuỳ ý)
export const CLASS_DOORS = [
  // Nhà B: cửa quay sang phía Đông (ra sân trường)
  ...['Toán', 'Tin', 'Lý', 'Hóa', 'Sinh'].map((lop, i) => ({ lop, b: 'B', x: 545, y: 560 + i * 140, side: 'e' })),
  // Nhà C: cửa quay sang phía Tây
  ...['Văn', 'Sử', 'Địa'].map((lop, i) => ({ lop, b: 'C', x: 1455, y: 560 + i * 140, side: 'w' })),
  // Nhà D: cửa quay xuống phía Nam
  ...['Anh', 'Nga', 'Pháp', 'Trung'].map((lop, i) => ({ lop, b: 'D', x: 720 + i * 185, y: 365, side: 's' })),
];

// Điểm tương tác: chạm nhãn → nhân vật đi tới (x, y) → mở bảng `panel`.
export const HOTSPOTS = [
  { id: 'gate', x: 1000, y: 1535, icon: '🚪', label: 'Cổng trường', map: 'Cổng', panel: 'gate' },
  { id: 'parking', x: 710, y: 1335, icon: '🛵', label: 'Gửi xe · điểm danh', map: 'Gửi xe', panel: 'parking' },
  { id: 'guard', x: 1110, y: 1345, icon: '👮', label: 'Bác bảo vệ', map: 'Bảo vệ', panel: 'guard' },
  { id: 'flag', x: 1000, y: 880, icon: '🇻🇳', label: 'Cột cờ · Bảng thi đua', map: 'Cột cờ', panel: 'board' },
  { id: 'office', x: 1000, y: 645, icon: '🏛️', label: 'Nhà A · Hiệu bộ', map: 'Hiệu bộ', panel: 'office' },
  { id: 'teachers', x: 790, y: 645, icon: '👩‍🏫', label: 'Phòng giáo viên', map: 'P. giáo viên', panel: 'teachers' },
  { id: 'history', x: 1210, y: 645, icon: '📸', label: 'Phòng truyền thống', map: 'Truyền thống', panel: 'history' },
  { id: 'clubs', x: 205, y: 505, icon: '🎭', label: 'Nhà đa năng · CLB', map: 'Đa năng', panel: 'clubs' },
  { id: 'canteen', x: 205, y: 785, icon: '🍜', label: 'Căng tin', panel: 'canteen' },
  { id: 'football', x: 1650, y: 480, icon: '⚽', label: 'Sân bóng · Đá cầu', map: 'Sân bóng', panel: 'football' },
  { id: 'dorm', x: 1650, y: 1080, icon: '🛏️', label: 'Ký túc xá', map: 'KTX', panel: 'dorm' },
  { id: 'wc', x: 450, y: 1325, icon: '🪞', label: 'WC · Gương', map: 'WC', panel: 'mirror' },
  { id: 'wish', x: 300, y: 1470, icon: '🌠', label: 'Tường "Ước mơ vào Chuyên"', map: 'Ước mơ', panel: 'wish' },
  { id: 'garden', x: 200, y: 1050, icon: '🌳', label: 'Vườn trường', map: 'Vườn', panel: 'garden' },
  ...CLASS_DOORS.map((d) => ({ id: 'lop-' + d.lop, x: d.x, y: d.y, icon: '🚪', label: 'Lớp ' + d.lop, panel: 'class', lop: d.lop, small: true })),
];

// Cây cối & đồ trang trí (chỉ để vẽ; cây có gốc là vật cản nhỏ)
const trees = [];
// Hàng phượng quanh sân trường
for (let x = 600; x <= 1400; x += 100) if (x < 900 || x > 1100) trees.push({ x, y: 1290, kind: 'phuong' });
for (let y = 640; y <= 1200; y += 140) { trees.push({ x: 590, y, kind: 'phuong' }); trees.push({ x: 1410, y, kind: 'phuong' }); }
// Bàng, xà cừ dọc tường rào
for (let x = 90; x <= 1900; x += 150) if (x < 860 || x > 1140) trees.push({ x, y: 1480, kind: 'bang' });
for (let x = 420; x <= 1600; x += 160) trees.push({ x, y: 90, kind: 'xacu' });
// Vườn trường
for (const [x, y] of [[120, 870], [270, 900], [160, 1000], [280, 1080], [120, 1160], [250, 1220], [190, 1260]]) trees.push({ x, y, kind: 'bang' });
export const TREES = trees;

export const BENCHES = [
  { x: 650, y: 760 }, { x: 650, y: 1020 }, { x: 1300, y: 760 }, { x: 1300, y: 1020 },
  { x: 160, y: 950 }, { x: 230, y: 1140 }, { x: 760, y: 1220 }, { x: 1180, y: 1220 },
];

export const FLAG = { x: 1000, y: 840 };
export const BOARD = { x: 1110, y: 860 };
export const STAGE = { x: 860, y: 680, w: 280, h: 60, label: 'SÂN KHẤU' };

// Danh sách địa điểm cho nút "Bản đồ"
export const PLACES = HOTSPOTS.filter((h) => !h.small);

export function solids() {
  const s = [...BUILDINGS.map(({ x, y, w, h }) => ({ x, y, w, h })), ...WALLS];
  for (const t of TREES) s.push({ x: t.x - 6, y: t.y - 4, w: 12, h: 8 });
  s.push({ x: FLAG.x - 18, y: FLAG.y - 18, w: 36, h: 36 });
  s.push({ x: BOARD.x - 40, y: BOARD.y - 6, w: 80, h: 12 });
  return s;
}
