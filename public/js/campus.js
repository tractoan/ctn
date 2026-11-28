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
  { x: 1052, y: 746, w: 70, h: 30, label: 'Bậc thang giữa xuống dãy 5 tầng', dir: 's' },
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
  { id: 'D4', name: 'Dãy nhà 4 tầng', short: 'DÃY NHÀ 4 TẦNG', x: 8, y: 8, w: 784, h: 168, floors: 4, wall: '#F4E2A6', roof: '#D9C9A0', trim: '#B5452F' },
  { id: 'D4', name: 'Dãy nhà 4 tầng', x: 8, y: 160, w: 240, h: 200, floors: 4, wall: '#F4E2A6', roof: '#D9C9A0', trim: '#B5452F' },
  { id: 'D3', name: 'Dãy nhà 3 tầng', short: 'DÃY NHÀ 3 TẦNG', x: 797, y: 8, w: 891, h: 168, floors: 3, wall: '#F4E2A6', roof: '#D9C9A0' },
  { id: 'D3', name: 'Dãy nhà 3 tầng', x: 1507, y: 160, w: 181, h: 149, floors: 3, wall: '#F4E2A6', roof: '#D9C9A0' },
  { id: 'HB', name: 'Nhà hiệu bộ', short: 'NHÀ HIỆU BỘ', x: 6, y: 600, w: 363, h: 392, floors: 4, wall: '#F2EEE4', roof: '#CFC9BD', bands: '#3E8E4A' },
  { id: 'D5', name: 'Dãy nhà 5 tầng', short: 'DÃY NHÀ 5 TẦNG', x: 578, y: 830, w: 1019, h: 160, floors: 5, wall: '#F4E2A6', roof: '#D9C9A0' },
  // cửa nhà đa năng ở mặt trái, quay ra sân trường (doorW = toạ độ y giữa cửa)
  // nhà đa năng và căng tin lùi xuống, chừa lối đi rộng giữa dãy 3 tầng và nhà đa năng (y 309–400) dẫn tới cửa căng tin
  { id: 'DN', name: 'Nhà đa năng', short: 'NHÀ ĐA NĂNG', x: 1501, y: 400, w: 328, h: 390, floors: 1, wall: '#EFE6C8', roof: '#8FA3BF', hall: true, doorW: 595 },
  { id: 'CT', name: 'Căng tin', short: 'CĂNG TIN', x: 1835, y: 430, w: 98, h: 320, floors: 1, wall: '#FFF1D6', roof: '#E08A4B', vertical: true, doorN: 1884 },
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
  { x: 658, y: 756, w: 394, h: 8 }, { x: 1122, y: 756, w: 350, h: 8 }, // chừa bậc thang giữa (giữa hai nửa bồn hoa)
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
  { lop: 'Tin', b: 'D5', x: 1480, y: 800, side: 'n' },
  { lop: 'Nga', b: 'D5', x: 1310, y: 800, side: 'n' },
  { lop: 'Pháp', b: 'D5', x: 950, y: 800, side: 'n' },
];

// Phòng chức năng (chưa có vị trí chính xác – đặt tạm, sửa tại đây)
export const ROOM_DOORS = [
  { id: 'lab', icon: '🧪', label: 'Phòng thí nghiệm', x: 1482, y: 262, side: 'w' },
  { id: 'computer', icon: '💻', label: 'Phòng máy', x: 700, y: 800, side: 'n' },
  { id: 'library', icon: '📚', label: 'Thư viện', x: 830, y: 800, side: 'n' },
];

// Điểm tương tác: chạm nhãn → nhân vật đi tới (x, y) → mở bảng `panel`. `map`: nhãn ngắn trên bản đồ.
export const HOTSPOTS = [
  { id: 'gate', x: 910, y: 1215, icon: '🚪', label: 'Cổng trường', map: 'Cổng', panel: 'gate' },
  { id: 'guard', x: 1212, y: 1160, icon: '👮', label: 'Bác bảo vệ', map: 'Bảo vệ', panel: 'guard' },
  { id: 'parking', x: 560, y: 1150, icon: '🛵', label: 'Gửi xe · điểm danh', map: 'Gửi xe', panel: 'parking' },
  { id: 'sidegate', x: 40, y: 489, icon: '🚧', label: 'Cổng phụ', panel: 'sidegate' },
  { id: 'office', x: 396, y: 800, icon: '🏛️', label: 'Nhà hiệu bộ', map: 'Hiệu bộ', panel: 'enterRoom', room: 'hieubo', spot: 'office' },
  { id: 'teachers', x: 396, y: 680, icon: '👩‍🏫', label: 'Phòng giáo viên', map: 'P. GV', panel: 'enterRoom', room: 'hieubo', spot: 'teachers' },
  { id: 'history', x: 396, y: 930, icon: '📸', label: 'Phòng truyền thống', map: 'Truyền thống', panel: 'enterRoom', room: 'hieubo', spot: 'history' },
  { id: 'entry', x: 470, y: 1060, icon: '➡️', label: 'Lối vào', panel: 'entry', small: true },
  { id: 'board', x: 690, y: 461, icon: '📋', label: 'Bảng tin · Thi đua', map: 'Bảng tin', panel: 'board' },
  { id: 'stage', x: 1151, y: 290, icon: '🎤', label: 'Sân khấu · Chào cờ', map: 'Sân khấu', panel: 'stage' },
  { id: 'yard', x: 1040, y: 590, icon: '🌳', label: 'Sân trường · Ghế đá', map: 'Sân trường', panel: 'garden' },
  { id: 'schoolbook', x: 735, y: 650, icon: '✍️', label: 'Sổ lưu bút', map: 'Sổ lưu bút', panel: 'schoolbook' },
  { id: 'dacau', x: 417, y: 400, icon: '🏸', label: 'Sân đá cầu', map: 'Đá cầu', panel: 'football' },
  { id: 'clubs', x: 1482, y: 595, icon: '🎭', label: 'Nhà đa năng · CLB', map: 'Đa năng', panel: 'enterRoom', room: 'dana', spot: 'clubs' },
  { id: 'canteen', x: 1884, y: 412, icon: '🍜', label: 'Căng tin', panel: 'enterRoom', room: 'cangtin', spot: 'canteen' },
  { id: 'tronhoc', x: 1805, y: 150, icon: '⚽', label: 'Chỗ trốn học đá bóng', map: 'Trốn học', panel: 'tronhoc' },
  { id: 'photo', x: 1370, y: 300, icon: '📸', label: 'Chụp ảnh kỷ yếu', map: 'Chụp ảnh', panel: 'photo' },
  { id: 'drum', x: 1172, y: 790, icon: '🥁', label: 'Trống trường', map: 'Trống', panel: 'drum' },
  { id: 'wish', x: 1400, y: 1150, icon: '🌠', label: 'Tường "Ước mơ vào Chuyên"', map: 'Ước mơ', panel: 'wish' },
  // phòng chức năng: đi vào trong phòng (rooms.js)
  ...ROOM_DOORS.map((d) => ({ id: d.id, x: d.x, y: d.y, icon: d.icon, label: d.label, panel: 'enterRoom', room: { lab: 'phongtn', computer: 'phongmay', library: 'thuvien' }[d.id], spot: d.id, small: true })),
  ...CLASS_DOORS.map((d) => ({ id: 'lop-' + d.lop, x: d.x, y: d.y, icon: '🚪', label: 'Lớp ' + d.lop, panel: 'enterClass', lop: d.lop, small: true,
    // vùng chạm: cánh cửa + biển tên trên mặt tiền (cửa mặt trong dãy 5 tầng: phía trên lối đi)
    rect: d.side === 's' ? { x: d.x - 24, y: d.y - 70, w: 48, h: 50 } : { x: d.x - 24, y: d.y + 8, w: 48, h: 26 } })),
];

// Cây cối (gốc cây là vật cản nhỏ). kind: tree (cây tán tròn), bonsai (bụi hoa), palm (cau vua – còn hỗ trợ vẽ)
// bloom: cây đang ra hoa – phượng đỏ, bằng lăng tím, hoa sữa trắng; planter: có bồn quanh gốc (trên nền gạch)
const trees = [];
const yardTree = (x, y, bloom) => trees.push({ x, y, kind: 'tree', bloom, planter: true });
// Hàng cây trước dãy 4 tầng, đứng xen giữa các cửa lớp
for (const [x, bloom] of [[355, 'phuong'], [465, 'banglang'], [575, 'phuong']]) yardTree(x, 222, bloom);
// Hàng cây dọc mép trái sân trường
for (const [y, bloom] of [[260, 'phuong'], [340], [560, 'banglang'], [700, 'phuong']]) yardTree(675, y, bloom);
// Hàng cây phía phải sân trường
for (const [y, bloom] of [[240, 'phuong'], [360, 'hoasua'], [480, 'banglang'], [620, 'phuong']]) yardTree(1440, y, bloom);
// Hàng chậu cảnh dưới sân
for (let x = 760; x <= 1380; x += 90) if (Math.abs(x - 1087) > 70) trees.push({ x, y: 715, kind: 'bonsai' });
// Cây to quanh cổng, góc vườn
for (const [x, y, bloom] of [[60, 1070, 'phuong'], [170, 1120], [280, 1060, 'banglang'], [1660, 860, 'phuong'], [1780, 940], [1900, 880, 'banglang'], [1700, 1080, 'hoasua'], [1880, 1110, 'phuong'], [1600, 1150, 'phuong']]) trees.push({ x, y, kind: 'tree', bloom, planter: x < 1610 && y > 1000 && x > 1500 });
// Cây có bồn dọc lối vào (trên nền gạch)
trees.push({ x: 505, y: 690, kind: 'tree', bloom: 'phuong', planter: true }, { x: 505, y: 930, kind: 'tree', bloom: 'banglang', planter: true });
// Chỗ trốn học
for (const [x, y] of [[1730, 60], [1880, 90], [1750, 250], [1890, 260]]) trees.push({ x, y, kind: 'tree' });
// Bờ cây trước dãy 5 tầng
for (let x = 640; x <= 1560; x += 120) if (x < 860 || x > 960) trees.push({ x, y: 1070, kind: 'bonsai' });
export const TREES = trees;

export const LAMPS = [
  { x: 940, y: 560 }, { x: 1140, y: 560 }, { x: 760, y: 1110 }, { x: 1300, y: 1110 }, // giữa sân, trước cổng
  { x: 440, y: 760 }, { x: 440, y: 1000 }, // lối vào giữa nhà hiệu bộ và dãy 5 tầng
  { x: 262, y: 572 }, { x: 572, y: 572 }, // sân đá cầu
  { x: 760, y: 822 }, { x: 1395, y: 822 }, // hành lang mặt trong dãy 5 tầng
  { x: 1640, y: 388 }, { x: 1800, y: 388 }, // lối xuống căng tin
  { x: 1770, y: 1022 }, { x: 225, y: 1012 }, // vườn hai bên cổng
  { x: 150, y: 1226 }, { x: 520, y: 1226 }, { x: 1350, y: 1226 }, { x: 1750, y: 1226 }, // đèn đường Lương Ngọc Quyến
];
// Ghế đá – chạm vào để ngồi. Mỗi ghế có 2 chỗ.
export const BENCHES = [
  { x: 830, y: 640 }, { x: 1250, y: 640 },
  { x: 1700, y: 1000 }, { x: 1840, y: 1000 }, { x: 115, y: 1040 }, { x: 1500, y: 1150 },
];
// Hàng ghế nhựa chào cờ trước sân khấu: mỗi lớp chuyên một cụm 4 ghế, có biển tên lớp.
export const CHAIR_ROWS = (() => {
  const order = ['Toán', 'Tin', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Sử', 'Địa', 'Anh', 'Nga', 'Pháp', 'Trung'];
  return order.map((lop, i) => ({ lop, x: 780 + (i % 4) * 140, y: 345 + Math.floor(i / 4) * 70 }));
})();
export const SEATS = [
  ...BENCHES.flatMap((b) => [
    { x: b.x - 14, y: b.y + 8, dir: 1, back: false },
    { x: b.x + 14, y: b.y + 8, dir: -1, back: false },
  ]),
  ...CHAIR_ROWS.flatMap((g) => [0, 1, 2, 3].map((k) => ({ x: g.x + 30 + k * 24, y: g.y, dir: 1, back: true, chao: g.lop }))),
];

// Bồn hoa (là vật cản). round: bồn tròn bán kính r; còn lại hình chữ nhật.
export const FLOWERBEDS = [
  { round: true, x: 735, y: 560, r: 26 }, { round: true, x: 1375, y: 560, r: 26 }, { round: true, x: 1040, y: 655, r: 36 },
  // dải hoa mép sân chia đôi ở chỗ trống trường: lối đi giữa xuống hành lang dãy 5 tầng
  { x: 720, y: 728, w: 327, h: 18 }, { x: 1127, y: 728, w: 293, h: 18 },
  { x: 600, y: 1086, w: 250, h: 16 }, { x: 970, y: 1086, w: 600, h: 16 },
  { x: 1650, y: 1120, w: 200, h: 26, colors: ['#E5382F', '#F2B233', '#FFFFFF'] },
  { x: 200, y: 1150, w: 120, h: 24, colors: ['#F06292', '#BA68C8', '#FFFFFF'] },
  { round: true, x: 1790, y: 860, r: 26 },
];

// Cột cờ ở giữa sân khấu
export const FLAG = { x: 1151, y: 250 };
// Trống trường: giữa dãy 5 tầng, phía sát sân trường
export const DRUM = { x: 1172, y: 806 };
export const BOARD = { x: 603, y: 395, w: 40, h: 133 };
export const STAGE = { x: 987, y: 195, w: 328, h: 72, label: 'HIỀN TÀI LÀ NGUYÊN KHÍ CỦA QUỐC GIA' };

// Danh sách địa điểm cho bản đồ toàn cảnh
export const PLACES = HOTSPOTS.filter((h) => !h.small);

export function solids() {
  const s = [...BUILDINGS.map(({ x, y, w, h }) => ({ x, y, w, h })), ...WALLS, ...EDGES];
  for (const t of TREES) s.push({ x: t.x - 6, y: t.y - 4, w: 12, h: 8 });
  for (const f of FLOWERBEDS) s.push(f.round ? { x: f.x - f.r * 0.8, y: f.y - f.r * 0.8, w: f.r * 1.6, h: f.r * 1.6 } : { x: f.x, y: f.y, w: f.w, h: f.h });
  s.push({ x: BOARD.x, y: BOARD.y, w: BOARD.w, h: BOARD.h });
  for (const g of CHAIR_ROWS) s.push({ x: g.x + 2, y: g.y - 6, w: 6, h: 6 }); // cột biển tên lớp
  s.push({ x: STAGE.x, y: STAGE.y, w: STAGE.w, h: STAGE.h - 20 });
  return s;
}
