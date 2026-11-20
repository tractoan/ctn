// SƠ ĐỒ KHUÔN VIÊN – cơ sở 234A đường Lương Ngọc Quyến, TP Thái Nguyên (1995–2019)
// Dựng theo sơ đồ do cựu học sinh vẽ lại (docs/so-do-goc.jpg): hệ số 1,6 px thế giới / 1 px sơ đồ gốc.
//
// Hướng Bắc ở trên, cổng chính mở ra đường Lương Ngọc Quyến ở phía dưới.
// Sửa các con số trong file này là va chạm, tìm đường, nhãn, bản đồ toàn cảnh tự cập nhật theo.

export const WORLD = { w: 2000, h: 1400 };

export const SPAWN = { x: 910, y: 1035 };

// Sân trường cao hơn mặt đất, lên/xuống bằng bậc thang ở cạnh trái.
export const YARD = { x: 592, y: 192, w: 880, h: 570 };
export const STAIRS = [
  { x: 592, y: 200, w: 46, h: 168, label: 'Bậc thang xuống sân đá cầu', dir: 'w' },
  { x: 592, y: 595, w: 66, h: 163, label: 'Bậc thang chính lên sân', dir: 'w' },
];

// Mặt đất: vẽ theo thứ tự (sau đè trước)
export const GROUNDS = [
  { kind: 'road', x: 0, y: 1232, w: 2000, h: 168, label: 'ĐƯỜNG LƯƠNG NGỌC QUYẾN' },
  { kind: 'sidewalk', x: 0, y: 1196, w: 2000, h: 36 },
  { kind: 'concrete', x: 0, y: 0, w: 2000, h: 1196 },
  { kind: 'grass', x: 1699, y: 8, w: 216, h: 301, label: 'CHỖ TRỐN HỌC ĐÁ BÓNG', wild: true },
  { kind: 'grass', x: 1610, y: 800, w: 380, h: 390 },
  { kind: 'grass', x: 8, y: 1000, w: 330, h: 190 },
  { kind: 'court', x: 270, y: 232, w: 294, h: 312, label: 'SÂN ĐÁ CẦU' },
  { kind: 'yard', ...YARD, label: 'SÂN TRƯỜNG' },
];

// Toà nhà = vật cản. Nhà hình chữ L tách thành nhiều khối cùng `id`; chỉ khối có `short` mới vẽ tên.
export const BUILDINGS = [
  { id: 'D4', name: 'Dãy nhà 4 tầng', short: 'DÃY NHÀ 4 TẦNG', x: 8, y: 8, w: 784, h: 168, floors: 4, wall: '#F4E2A6', roof: '#E9D9A6', trim: '#9C2F2B' },
  { id: 'D4', name: 'Dãy nhà 4 tầng', x: 8, y: 160, w: 240, h: 200, floors: 4, wall: '#F4E2A6', roof: '#E9D9A6', trim: '#9C2F2B' },
  { id: 'D3', name: 'Dãy nhà 3 tầng', short: 'DÃY NHÀ 3 TẦNG', x: 797, y: 8, w: 891, h: 168, floors: 3, wall: '#F4E2A6', roof: '#EADCAE' },
  { id: 'D3', name: 'Dãy nhà 3 tầng', x: 1507, y: 160, w: 181, h: 149, floors: 3, wall: '#F4E2A6', roof: '#EADCAE' },
  { id: 'HB', name: 'Nhà hiệu bộ', short: 'NHÀ HIỆU BỘ', x: 6, y: 600, w: 363, h: 392, floors: 4, wall: '#F2EEE4', roof: '#DCD6C8', bands: '#3E8E4A' },
  { id: 'D5', name: 'Dãy nhà 5 tầng', short: 'DÃY NHÀ 5 TẦNG', x: 578, y: 830, w: 1019, h: 160, floors: 5, wall: '#F4E2A6', roof: '#EADCAE' },
  { id: 'DN', name: 'Nhà đa năng', short: 'NHÀ ĐA NĂNG', x: 1501, y: 339, w: 328, h: 426, floors: 1, wall: '#EFE6C8', roof: '#C9C3AE', hall: true },
  { id: 'CT', name: 'Căng tin', short: 'CĂNG TIN', x: 1835, y: 373, w: 98, h: 320, floors: 1, wall: '#EFE6C8', roof: '#C9C3AE', vertical: true },
];

// Tường rào. Chừa cổng chính (x 693–1130) và cổng phụ bên trái (y 414–564).
export const WALLS = [
  { x: 0, y: 0, w: 2000, h: 6 },
  { x: 0, y: 0, w: 6, h: 414 },
  { x: 0, y: 564, w: 6, h: 640 },
  { x: 1992, y: 0, w: 8, h: 1204 },
  { x: 0, y: 1190, w: 693, h: 10 },
  { x: 1130, y: 1190, w: 870, h: 10 },
];

export const GATE = { x: 693, y: 1190, w: 437, sign: 'TRƯỜNG THPT CHUYÊN THÁI NGUYÊN' };
export const SIDE_GATE = { x: 0, y: 414, w: 10, h: 150 };

// Mép sân trường (tường chắn) – vật cản, chừa chỗ bậc thang.
export const EDGES = [
  { x: 586, y: 368, w: 8, h: 227 },
  { x: 658, y: 756, w: 814, h: 8 },
];

// Lớp chuyên theo dãy nhà (theo trí nhớ của cựu học sinh). side: phía cửa quay ra.
export const CLASS_DOORS = [
  // Dãy 4 tầng, trái → phải: Toán ở chân chữ L, các lớp còn lại dọc thân dãy (cửa nằm giữa các cây cau)
  { lop: 'Toán', b: 'D4', x: 128, y: 386, side: 's' },
  ...['Lý', 'Hóa', 'Sinh', 'Văn', 'Trung'].map((lop, i) => ({ lop, b: 'D4', x: 300 + i * 110, y: 202, side: 's' })),
  // Dãy 3 tầng, trái → phải
  { lop: 'Anh', b: 'D3', x: 840, y: 202, side: 's' },
  { lop: 'Sử', b: 'D3', x: 940, y: 202, side: 's' },
  { lop: 'Địa', b: 'D3', x: 1400, y: 202, side: 's' },
  // Dãy 5 tầng, phải → trái; cửa ở mặt trong (quay vào sân trường), đi theo hành lang dưới chân tường sân
  { lop: 'Tin', b: 'D5', x: 1450, y: 800, side: 'n' },
  { lop: 'Nga', b: 'D5', x: 1200, y: 800, side: 'n' },
  { lop: 'Pháp', b: 'D5', x: 950, y: 800, side: 'n' },
];

// Điểm tương tác: chạm nhãn → nhân vật đi tới (x, y) → mở bảng `panel`. `map`: nhãn ngắn trên bản đồ.
export const HOTSPOTS = [
  { id: 'gate', x: 910, y: 1215, icon: '🚪', label: 'Cổng trường', map: 'Cổng', panel: 'gate' },
  { id: 'guard', x: 1185, y: 1160, icon: '👮', label: 'Bác bảo vệ', map: 'Bảo vệ', panel: 'guard' },
  { id: 'parking', x: 560, y: 1150, icon: '🛵', label: 'Gửi xe · điểm danh', map: 'Gửi xe', panel: 'parking' },
  { id: 'sidegate', x: 40, y: 489, icon: '🚧', label: 'Cổng phụ', panel: 'sidegate' },
  { id: 'office', x: 396, y: 800, icon: '🏛️', label: 'Nhà hiệu bộ', map: 'Hiệu bộ', panel: 'office' },
  { id: 'teachers', x: 396, y: 680, icon: '👩‍🏫', label: 'Phòng giáo viên', map: 'P. GV', panel: 'teachers' },
  { id: 'history', x: 396, y: 930, icon: '📸', label: 'Phòng truyền thống', map: 'Truyền thống', panel: 'history' },
  { id: 'entry', x: 470, y: 1060, icon: '➡️', label: 'Lối vào', panel: 'entry', small: true },
  { id: 'board', x: 690, y: 461, icon: '📋', label: 'Bảng tin · Thi đua', map: 'Bảng tin', panel: 'board' },
  { id: 'stage', x: 1151, y: 300, icon: '🎤', label: 'Sân khấu · Chào cờ', map: 'Sân khấu', panel: 'stage' },
  { id: 'yard', x: 1040, y: 560, icon: '🌳', label: 'Sân trường · Ghế đá', map: 'Sân trường', panel: 'garden' },
  { id: 'dacau', x: 417, y: 400, icon: '🏸', label: 'Sân đá cầu', map: 'Đá cầu', panel: 'football' },
  { id: 'clubs', x: 1665, y: 792, icon: '🎭', label: 'Nhà đa năng · CLB', map: 'Đa năng', panel: 'clubs' },
  { id: 'canteen', x: 1884, y: 718, icon: '🍜', label: 'Căng tin', panel: 'canteen' },
  { id: 'tronhoc', x: 1805, y: 150, icon: '⚽', label: 'Chỗ trốn học đá bóng', map: 'Trốn học', panel: 'tronhoc' },
  { id: 'drum', x: 1087, y: 790, icon: '🥁', label: 'Trống trường', map: 'Trống', panel: 'drum' },
  { id: 'wish', x: 1400, y: 1150, icon: '🌠', label: 'Tường "Ước mơ vào Chuyên"', map: 'Ước mơ', panel: 'wish' },
  ...CLASS_DOORS.map((d) => ({ id: 'lop-' + d.lop, x: d.x, y: d.y, icon: '🚪', label: 'Lớp ' + d.lop, panel: 'class', lop: d.lop, small: true })),
];

// Cây cối (gốc cây là vật cản nhỏ). kind: palm (cau vua), bonsai (chậu cảnh), tree (bàng, xà cừ)
const trees = [];
// Hàng cau vua trước dãy 4 tầng và dọc mép trái sân trường
// cau vua đứng xen giữa các cửa lớp
for (const x of [355, 465, 575]) trees.push({ x, y: 222, kind: 'palm' });
for (const y of [260, 340, 560, 700]) trees.push({ x: 675, y, kind: 'palm' });
// Cau vua phía phải sân trường
for (const y of [240, 360, 480, 620]) trees.push({ x: 1440, y, kind: 'palm' });
// Hàng chậu cảnh dưới sân
for (let x = 760; x <= 1380; x += 90) trees.push({ x, y: 715, kind: 'bonsai' });
// Cây to quanh cổng, góc vườn
for (const [x, y] of [[60, 1070], [170, 1120], [280, 1060], [1660, 860], [1780, 940], [1900, 880], [1700, 1080], [1880, 1110], [1600, 1150]]) trees.push({ x, y, kind: 'tree' });
// Chỗ trốn học
for (const [x, y] of [[1730, 60], [1880, 90], [1750, 250], [1890, 260]]) trees.push({ x, y, kind: 'tree' });
// Bờ cây trước dãy 5 tầng
for (let x = 640; x <= 1560; x += 120) if (x < 860 || x > 960) trees.push({ x, y: 1070, kind: 'bonsai' });
export const TREES = trees;

export const LAMPS = [{ x: 960, y: 470 }, { x: 1180, y: 470 }];
export const BENCHES = [{ x: 860, y: 600 }, { x: 1230, y: 600 }, { x: 900, y: 360 }, { x: 1380, y: 380 }];

// Cột cờ ở giữa sân khấu
export const FLAG = { x: 1151, y: 250 };
// Trống trường: giữa dãy 5 tầng, phía sát sân trường
export const DRUM = { x: 1087, y: 806 };
export const BOARD = { x: 603, y: 395, w: 40, h: 133 };
export const STAGE = { x: 987, y: 195, w: 328, h: 72, label: 'HIỀN TÀI LÀ NGUYÊN KHÍ CỦA QUỐC GIA' };

// Danh sách địa điểm cho bản đồ toàn cảnh
export const PLACES = HOTSPOTS.filter((h) => !h.small);

export function solids() {
  const s = [...BUILDINGS.map(({ x, y, w, h }) => ({ x, y, w, h })), ...WALLS, ...EDGES];
  for (const t of TREES) s.push({ x: t.x - 6, y: t.y - 4, w: 12, h: 8 });
  s.push({ x: BOARD.x, y: BOARD.y, w: BOARD.w, h: BOARD.h });
  s.push({ x: STAGE.x, y: STAGE.y, w: STAGE.w, h: STAGE.h - 20 });
  return s;
}
