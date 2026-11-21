// Các phòng bên trong (giống trang mẫu): thư viện, phòng máy, phòng thí nghiệm, nhà hiệu bộ, căng tin,
// nhà đa năng (CLB). Mỗi phòng là một cảnh riêng có vật cản, chỗ ngồi, điểm tương tác; cửa ra ở giữa tường dưới.
// Người đang ở cùng một phòng nhìn thấy nhau. Vào phòng: ROOMS[id]() rồi world.setScene().
import { rr, label } from './world.js';
import { MENU } from './logic.js';

export const CLUBS = [
  { id: 'vannghe', icon: '🎤', name: 'CLB Văn nghệ', desc: 'Hát, múa, nhảy – sân khấu các đêm 20/11, 26/3.', color: '#E06C9F' },
  { id: 'bongda', icon: '⚽', name: 'CLB Bóng đá', desc: 'Giải bóng đá giữa các lớp chuyên.', color: '#3E8E4A' },
  { id: 'english', icon: '🇬🇧', name: 'CLB Tiếng Anh', desc: 'Nói tiếng Anh, debate, hùng biện.', color: '#2F6FB5' },
  { id: 'khoahoc', icon: '🔬', name: 'CLB Khoa học – STEM', desc: 'Nghiên cứu khoa học kĩ thuật, robot.', color: '#8E6BBF' },
  { id: 'truyenthong', icon: '📷', name: 'CLB Truyền thông', desc: 'Chụp ảnh, quay phim, viết báo tường.', color: '#F2B84B' },
  { id: 'tinhnguyen', icon: '🤲', name: 'CLB Tình nguyện', desc: 'Mùa hè xanh, quyên góp vùng cao.', color: '#E9967A' },
];

const TOP = 96; // chân tường trên
const box = (ctx, color, x, y, w, h, r = 4) => { ctx.fillStyle = color; rr(ctx, x, y, w, h, r); ctx.fill(); };
const circ = (ctx, color, x, y, r) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
const shadow = (ctx, x, y, w, h) => box(ctx, 'rgba(20,30,50,.10)', x + 3, y + h - 8, w, 12, 5);
const txt = (ctx, s, x, y, size, color, weight = 700, align = 'center') => {
  ctx.font = `${weight} ${size}px "Be Vietnam Pro", system-ui, sans-serif`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y);
};
const BOOK = ['#E8483F', '#2F6FB5', '#F2B84B', '#3E8E7E', '#8E6BBF', '#F28C38'];

// Khung phòng: sàn, tường trên có biển tên, hai tường bên có cửa sổ, tường dưới có cửa ra ở giữa.
function room({ id, name, w, h, floor = '#EAD7B0', line = 'rgba(150,115,70,.14)', wall = '#FBF3DC', title, zone, windows = [] }) {
  const sc = {
    id, name, w, h, bgColor: '#2B3348', fit: true, fitMin: 0.6, zone,
    solids: [{ x: 0, y: 0, w, h: TOP }, { x: 0, y: TOP, w: 10, h: h - TOP }, { x: w - 10, y: TOP, w: 10, h: h - TOP },
      { x: 0, y: h - 16, w: w / 2 - 46, h: 16 }, { x: w / 2 + 46, y: h - 16, w: w / 2 - 46, h: 16 }],
    seats: [], hotspots: [], items: [], bg: [],
    spawn: { x: w / 2, y: h - 66 }, spots: {},
  };
  sc.hotspots.push({ id: id + '-exit', x: w / 2, y: h - 38, icon: '🚪', label: 'Ra sân trường', panel: 'exitRoom', rect: { x: w / 2 - 46, y: h - 22, w: 92, h: 22 } });
  sc.drawBg = (ctx) => {
    ctx.fillStyle = floor; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = line; ctx.lineWidth = 1;
    for (let y = TOP + 30; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let x = 30; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, TOP); ctx.lineTo(x, h); ctx.stroke(); }
    // tường trên
    ctx.fillStyle = wall; ctx.fillRect(0, 0, w, TOP);
    ctx.fillStyle = 'rgba(120,90,50,.18)'; ctx.fillRect(0, TOP - 8, w, 8);
    ctx.fillStyle = 'rgba(20,30,50,.10)'; ctx.fillRect(0, TOP, w, 6);
    // tường bên + cửa sổ
    ctx.fillStyle = '#F3EDE0'; ctx.fillRect(0, TOP, 10, h - TOP); ctx.fillRect(w - 10, TOP, 10, h - TOP);
    for (const y of windows) for (const x of [0, w - 10]) {
      box(ctx, '#8FB8D8', x + 1, y, 8, 90, 2);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + 3, y + 6, 2, 40);
    }
    // tường dưới + thảm cửa
    ctx.fillStyle = wall; ctx.fillRect(0, h - 16, w / 2 - 46, 16); ctx.fillRect(w / 2 + 46, h - 16, w / 2 - 46, 16);
    box(ctx, '#C9A26B', w / 2 - 40, h - 26, 80, 22, 6);
    txt(ctx, '🚪 RA SÂN', w / 2, h - 15, 9, '#5A3E1E', 800);
    for (const f of sc.bg) f(ctx);
    if (title) { box(ctx, '#FFFFFF', w / 2 - 92, 4, 184, 20, 10); txt(ctx, title, w / 2, 14.5, 11, '#1B2A4E', 800); }
  };
  sc.statics = (ctx) => sc.items.map((it) => ({ y: it.y, draw: () => it.draw(ctx) }));
  return sc;
}
// vật thể có vật cản; vẽ theo thứ tự y = đáy vật thể
function thing(sc, x, y, w, h, draw, solid = true) {
  if (solid) sc.solids.push({ x, y, w, h });
  sc.items.push({ y: y + h, draw });
}
function hot(sc, o) { sc.hotspots.push({ small: true, ...o }); }

function plant(sc, x, y) {
  thing(sc, x - 13, y - 10, 26, 14, (ctx) => {
    box(ctx, '#C8794A', x - 13, y - 8, 26, 14, 4);
    circ(ctx, '#5A9A48', x + 5, y - 12, 7); circ(ctx, '#6FB35A', x - 2, y - 16, 10);
    circ(ctx, '#FF8FB1', x - 6, y - 20, 3); circ(ctx, '#FFD45E', x + 4, y - 22, 2.5);
  });
}
function chair(ctx, x, y, color = '#8FA3BF') {
  box(ctx, color, x - 12, y - 13, 24, 10, 4);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x - 10, y - 4, 3, 5); ctx.fillRect(x + 7, y - 4, 3, 5);
}
function stool(ctx, x, y) { circ(ctx, 'rgba(20,30,50,.12)', x + 2, y + 2, 9); circ(ctx, '#8FA3BF', x, y - 2, 9); circ(ctx, '#A9BAD2', x - 2, y - 4, 4); }
function bookRows(ctx, x, y, w, rows = 2, rowH = 24) {
  box(ctx, '#8A6A48', x, y, w, rows * rowH + 6, 3);
  for (let r = 0; r < rows; r++) {
    ctx.fillStyle = '#6E5236'; ctx.fillRect(x + 3, y + 3 + r * rowH + rowH - 3, w - 6, 3);
    for (let bx = x + 5, i = 0; bx < x + w - 9; bx += 8 + (i % 3), i++) {
      const hh = rowH - 6 - (i * 7 % 5);
      box(ctx, BOOK[(i + r * 2) % BOOK.length], bx, y + 3 + r * rowH + (rowH - 3 - hh), 6 + (i % 2), hh, 1);
    }
  }
}
function desk(ctx, x, y, w, h, top = '#C9955C') {
  shadow(ctx, x, y, w, h);
  box(ctx, top, x, y, w, h - 4, 5);
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + 4, y + 4, w - 8, 4);
  box(ctx, 'rgba(0,0,0,.14)', x, y + h - 10, w, 8, 3);
}
// bàn có ghế hai phía: ghế phía trên nhìn ra người xem, ghế phía dưới quay lưng
function tableWithSeats(sc, x, y, w, h, n, { top = true, bottom = true, drawTop } = {}) {
  const xs = Array.from({ length: n }, (_, i) => x + (w / n) * (i + 0.5));
  if (top) for (const sx of xs) { sc.seats.push({ x: sx, y: y - 2, dir: 1, back: false }); sc.items.push({ y: y - 3, draw: (ctx) => chair(ctx, sx, y + 6) }); }
  thing(sc, x, y, w, h, (ctx) => { desk(ctx, x, y, w, h); drawTop?.(ctx, xs); });
  if (bottom) for (const sx of xs) { sc.seats.push({ x: sx, y: y + h + 16, dir: 1, back: true }); sc.items.push({ y: y + h + 15, draw: (ctx) => chair(ctx, sx, y + h + 16) }); }
}

// ======================= 📚 Thư viện =======================
function thuvien() {
  const W = 640, H = 660;
  const sc = room({ id: 'p:thuvien', name: '📚 Thư viện', w: W, h: H, floor: '#E9DCC3', title: '📚 THƯ VIỆN', zone: 'library', windows: [180, 380] });
  sc.bg.push((ctx) => {
    bookRows(ctx, 18, 30, 268, 2, 28);
    bookRows(ctx, 354, 30, 268, 2, 28);
    box(ctx, '#FFFFFF', 296, 34, 48, 56, 6);
    txt(ctx, 'GIỜ', 320, 46, 7, '#5B6577', 700); txt(ctx, 'MỞ CỬA', 320, 56, 7, '#5B6577', 700); txt(ctx, '7h–17h', 320, 72, 8.5, '#C8343A', 800);
  });
  // giá sách hai bên tường
  for (const x of [12, W - 46]) thing(sc, x, 140, 34, 300, (ctx) => {
    box(ctx, '#8A6A48', x, 140, 34, 300, 3);
    for (let y = 146, i = 0; y < 430; y += 22, i++) for (let k = 0; k < 3; k++) box(ctx, BOOK[(i + k) % BOOK.length], x + 4 + k * 9, y, 7, 18, 1);
  });
  // bàn đọc
  for (const [x, y] of [[110, 210], [380, 210], [110, 340], [380, 340]]) tableWithSeats(sc, x, y, 150, 40, 2, {
    drawTop: (ctx, xs) => { box(ctx, '#F7F3E8', xs[0] - 12, y + 8, 24, 16, 2); box(ctx, '#2F6FB5', xs[1] - 9, y + 9, 18, 14, 2); circ(ctx, '#3E8E4A', x + 75, y + 15, 5); },
  });
  // bàn thủ thư
  thing(sc, 70, 482, 180, 40, (ctx) => {
    desk(ctx, 70, 482, 180, 40, '#A9744A');
    box(ctx, '#2A2F3A', 86, 486, 34, 22, 2); box(ctx, '#5DA9E9', 89, 489, 28, 16, 1);
    for (let i = 0; i < 5; i++) box(ctx, BOOK[i], 140 + i * 9, 488 - (i % 2) * 2, 7, 18, 1);
    circ(ctx, '#F2D27A', 228, 494, 6);
    txt(ctx, 'Mượn – trả sách', 160, 514, 7.5, '#4A3018', 700);
  });
  hot(sc, { id: 'tv-sach', x: 160, y: 548, icon: '📖', label: 'Giới thiệu sách hay', panel: 'library', rect: { x: 70, y: 482, w: 180, h: 40 } });
  // giá báo
  thing(sc, 400, 490, 150, 30, (ctx) => {
    desk(ctx, 400, 490, 150, 30, '#8A6A48');
    ['#F7F3E8', '#FFE0E6', '#E3F0FF', '#FFF3C4'].forEach((c, i) => { box(ctx, c, 408 + i * 35, 484, 30, 20, 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(412 + i * 35, 488, 20, 2); ctx.fillRect(412 + i * 35, 493, 14, 2); });
    txt(ctx, 'Hoa học trò · Mực tím · Toán tuổi thơ', 475, 513, 6.5, '#FFF3C4', 700);
  });
  hot(sc, { id: 'tv-bao', x: 475, y: 548, icon: '📰', label: 'Giá báo', panel: 'newsRack', rect: { x: 400, y: 484, w: 150, h: 36 } });
  plant(sc, 40, 600); plant(sc, W - 40, 600);
  sc.spots.library = { x: W / 2, y: H - 70 };
  return sc;
}

// ======================= 💻 Phòng máy =======================
function pc(ctx, x, y, on) {
  box(ctx, '#D9D2C3', x - 15, y - 2, 30, 24, 3); // màn hình CRT
  box(ctx, on ? '#2F6FB5' : '#3A4152', x - 12, y + 1, 24, 16, 2);
  if (on) { ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fillRect(x - 9, y + 4, 10, 2); ctx.fillRect(x - 9, y + 8, 14, 2); ctx.fillRect(x - 9, y + 12, 7, 2); }
  box(ctx, '#BDB5A5', x - 6, y + 22, 12, 4, 1);
  box(ctx, '#ECE7DC', x - 13, y + 27, 26, 6, 2); // bàn phím
}
function phongmay() {
  const W = 640, H = 660;
  const sc = room({ id: 'p:phongmay', name: '💻 Phòng máy', w: W, h: H, floor: '#E4E9EE', line: 'rgba(80,100,120,.10)', wall: '#F4F8FD', title: '💻 PHÒNG MÁY', zone: 'computer', windows: [220, 420] });
  sc.bg.push((ctx) => {
    // màn chiếu
    box(ctx, '#B9C1CC', 200, 28, 240, 62, 4); box(ctx, '#FFFFFF', 204, 31, 232, 54, 3);
    txt(ctx, 'Tin học 11 · Bài 7: Lập trình Pascal', 320, 42, 8.5, '#1B2A4E', 800);
    ctx.font = '600 7.5px ui-monospace, Menlo, monospace'; ctx.fillStyle = '#2F6FB5'; ctx.textAlign = 'left';
    ['program XinChao;', 'begin', "  writeln('Chuyen Thai Nguyen');", 'end.'].forEach((l, i) => ctx.fillText(l, 222, 54 + i * 8.5));
    // nội quy phòng máy
    box(ctx, '#FFE7E7', 30, 30, 140, 56, 6);
    txt(ctx, '⚠️ NỘI QUY PHÒNG MÁY', 100, 42, 7.5, '#C8343A', 800);
    ['Không ăn uống', 'Không tự cài phần mềm', 'Tắt máy khi ra về'].forEach((l, i) => txt(ctx, '• ' + l, 40, 55 + i * 10, 7, '#5B3A3A', 600, 'left'));
    // điều hoà
    box(ctx, '#FFFFFF', 480, 34, 130, 30, 8); ctx.fillStyle = '#C9D3E0'; ctx.fillRect(490, 54, 110, 3); circ(ctx, '#3E8E4A', 598, 42, 2);
  });
  // bàn giáo viên
  thing(sc, 460, 120, 150, 38, (ctx) => { desk(ctx, 460, 120, 150, 38, '#A9744A'); pc(ctx, 500, 116, true); box(ctx, '#F7F3E8', 540, 126, 40, 16, 2); });
  // 3 dãy × 2 bàn máy, mỗi bàn 3 máy
  for (const y of [210, 320, 430]) for (const x of [50, 350]) {
    const xs = [x + 40, x + 120, x + 200];
    thing(sc, x, y, 240, 40, (ctx) => { desk(ctx, x, y, 240, 40, '#B9BDC6'); xs.forEach((px, i) => pc(ctx, px, y + 2, (i + y / 10) % 3 !== 0)); });
    for (const sx of xs) { sc.seats.push({ x: sx, y: y + 56, dir: 1, back: true }); sc.items.push({ y: y + 55, draw: (ctx) => chair(ctx, sx, y + 56, '#5B6B8A') }); }
  }
  hot(sc, { id: 'pm-domin', x: 170, y: 168, icon: '💣', label: 'Dò mìn', panel: 'domin' });
  hot(sc, { id: 'pm-kyniem', x: 320, y: 560, icon: '✍️', label: 'Kỷ niệm phòng máy', panel: 'computer' });
  plant(sc, 40, 600); plant(sc, W - 40, 600);
  sc.spots.computer = { x: W / 2, y: H - 70 };
  return sc;
}

// ======================= 🧪 Phòng thí nghiệm =======================
function flask(ctx, x, y, color) {
  ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.moveTo(x - 2, y - 12); ctx.lineTo(x + 2, y - 12); ctx.lineTo(x + 6, y); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x - 4, y - 5); ctx.lineTo(x + 4, y - 5); ctx.lineTo(x + 6, y); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.fill();
}
function phongtn() {
  const W = 640, H = 660;
  const sc = room({ id: 'p:phongtn', name: '🧪 Phòng thí nghiệm', w: W, h: H, floor: '#E6ECEA', line: 'rgba(80,110,100,.10)', wall: '#F2F8F6', title: '🧪 PHÒNG THÍ NGHIỆM', zone: 'lab', windows: [220, 420] });
  sc.bg.push((ctx) => {
    // tủ hoá chất
    box(ctx, '#8A6A48', 20, 28, 160, 62, 3); box(ctx, '#CFE8F7', 24, 32, 152, 26, 2); box(ctx, '#CFE8F7', 24, 60, 152, 26, 2);
    const cols = ['#E8483F', '#F2B84B', '#3E8E7E', '#8E6BBF', '#2F6FB5', '#F28C38'];
    for (let i = 0; i < 9; i++) { box(ctx, cols[i % 6], 30 + i * 16, 38, 9, 16, 2); box(ctx, cols[(i + 3) % 6], 30 + i * 16, 66, 9, 16, 2); }
    // bảng tuần hoàn
    box(ctx, '#FFFFFF', 200, 28, 240, 62, 4);
    txt(ctx, 'BẢNG TUẦN HOÀN CÁC NGUYÊN TỐ HOÁ HỌC', 320, 37, 6.5, '#1B2A4E', 800);
    const pc = ['#F7C6C6', '#FCE2B0', '#CDE8C4', '#C9DDF5', '#E6D6F2'];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 18; c++) {
      if ((r === 0 && c > 0 && c < 17) || (r < 3 && c > 1 && c < 12)) continue;
      ctx.fillStyle = pc[(c < 2 ? 0 : c > 11 ? 2 + (c > 15) : 1) + (r === 5 ? 0 : 0)]; ctx.fillRect(206 + c * 12.6, 43 + r * 7.4, 11, 6.4);
    }
    // tủ hút khí độc
    box(ctx, '#C9D3E0', 460, 26, 160, 64, 4); box(ctx, '#E9F2F8', 466, 32, 148, 40, 3); txt(ctx, 'TỦ HÚT KHÍ ĐỘC', 540, 82, 7, '#3A4152', 800);
    flask(ctx, 500, 68, '#5DA9E9'); flask(ctx, 540, 68, '#F2B84B'); flask(ctx, 580, 68, '#E06C9F');
  });
  // bàn thí nghiệm của thầy
  thing(sc, 200, 118, 240, 40, (ctx) => {
    desk(ctx, 200, 118, 240, 40, '#3E4655');
    flask(ctx, 240, 132, '#5DA9E9'); flask(ctx, 268, 132, '#8BC34A'); circ(ctx, '#E8483F', 300, 128, 4);
    box(ctx, '#9AA3B2', 380, 120, 40, 14, 3); txt(ctx, 'Bàn của thầy', 320, 150, 7, '#E9EDF3', 700);
  });
  hot(sc, { id: 'tn-phache', x: 320, y: 186, icon: '🧪', label: 'Pha chế hóa học', panel: 'hoahoc', rect: { x: 200, y: 112, w: 240, h: 46 } });
  // 2 × 2 bàn thí nghiệm có bồn rửa
  for (const [x, y] of [[60, 250], [370, 250], [60, 390], [370, 390]]) {
    const xs = [x + 45, x + 165];
    thing(sc, x, y, 210, 44, (ctx) => {
      desk(ctx, x, y, 210, 44, '#3E4655');
      box(ctx, '#C9D3E0', x + 92, y + 6, 26, 18, 3); box(ctx, '#9AA3B2', x + 96, y + 9, 18, 12, 2);
      flask(ctx, x + 30, y + 22, '#5DA9E9'); flask(ctx, x + 55, y + 22, '#F2B84B'); flask(ctx, x + 150, y + 22, '#E06C9F'); flask(ctx, x + 178, y + 22, '#8BC34A');
    });
    for (const sx of xs) { sc.seats.push({ x: sx, y: y + 60, dir: 1, back: true }); sc.items.push({ y: y + 59, draw: (ctx) => stool(ctx, sx, y + 58) }); }
  }
  hot(sc, { id: 'tn-kyniem', x: 140, y: 560, icon: '✍️', label: 'Kỷ niệm phòng thí nghiệm', panel: 'lab' });
  // vòi rửa mắt khẩn cấp
  thing(sc, W - 60, 540, 34, 30, (ctx) => { box(ctx, '#3E8E4A', W - 60, 540, 34, 26, 4); txt(ctx, '👁️💧', W - 43, 553, 9, '#fff'); });
  sc.spots.lab = { x: W / 2, y: H - 70 };
  return sc;
}

// ======================= 🏛️ Nhà hiệu bộ =======================
function booth(sc, x, y, w, color, text) {
  thing(sc, x, y, w, 44, (ctx) => { shadow(ctx, x, y, w, 44); box(ctx, color, x, y, w, 40, 8); box(ctx, 'rgba(255,255,255,.22)', x, y, w, 10, 6); txt(ctx, text, x + w / 2, y + 22, 11, '#fff', 800); });
}
function hieubo() {
  const W = 640, H = 760;
  const sc = room({ id: 'p:hieubo', name: '🏛️ Nhà hiệu bộ', w: W, h: H, floor: '#E6E0D4', line: 'rgba(110,100,80,.12)', wall: '#F4F8FD', title: '🏛️ NHÀ HIỆU BỘ', zone: 'HB', windows: [240, 480] });
  sc.bg.push((ctx) => {
    box(ctx, '#8A6A48', 24, 28, 230, 62, 6); box(ctx, '#3E8E7E', 30, 33, 218, 52, 3);
    txt(ctx, 'THÔNG BÁO HỌP LỚP', 139, 43, 10, '#fff', 800);
    ['#FFF3B0', '#FFD6D6', '#D6ECFF', '#DFF5D6'].forEach((c, i) => { box(ctx, c, 40 + i * 52, 54, 42, 26, 2); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(45 + i * 52, 61, 30, 2); ctx.fillRect(45 + i * 52, 67, 22, 2); circ(ctx, '#C8343A', 61 + i * 52, 55, 2); });
    txt(ctx, 'PHÒNG TRUYỀN THỐNG', 500, 34, 9, '#1B2A4E', 800);
    for (let i = 0; i < 4; i++) { box(ctx, '#8A6A48', 392 + i * 56, 42, 48, 46, 3); box(ctx, ['#BFE0F5', '#F6D8B8', '#D8EBC8', '#E8D5F2'][i], 396 + i * 56, 46, 40, 38, 2); circ(ctx, 'rgba(255,255,255,.7)', 416 + i * 56, 60, 6); }
  });
  hot(sc, { id: 'hb-events', x: 139, y: 128, icon: '📅', label: 'Họp lớp, hội khóa', panel: 'office', tab: 0, rect: { x: 24, y: 28, w: 230, h: 62 } });
  hot(sc, { id: 'hb-history', x: 500, y: 128, icon: '🖼️', label: 'Phòng truyền thống', panel: 'history', rect: { x: 388, y: 28, w: 232, h: 62 } });
  // tủ cúp – bảng vàng đội tuyển
  thing(sc, 420, 200, 180, 44, (ctx) => {
    desk(ctx, 420, 200, 180, 44, '#8A6A48'); box(ctx, '#F4C430', 426, 204, 168, 18, 3);
    txt(ctx, '★ BẢNG VÀNG ĐỘI TUYỂN ★', 510, 213, 8, '#7A4A00', 800);
    txt(ctx, '🏆 🥇 🏅 🥈 🏆', 510, 232, 11, '#1D2433', 400);
  });
  hot(sc, { id: 'hb-vang', x: 510, y: 270, icon: '🏅', label: 'Bảng vàng đội tuyển', panel: 'honor', rect: { x: 420, y: 200, w: 180, h: 44 } });
  // bàn tiếp khách
  thing(sc, 60, 210, 170, 40, (ctx) => { desk(ctx, 60, 210, 170, 40, '#B8865A'); circ(ctx, '#FFFFFF', 110, 226, 6); circ(ctx, '#FFFFFF', 140, 226, 6); box(ctx, '#3E8E4A', 175, 218, 20, 14, 3); });
  booth(sc, 50, 380, 200, '#E06C9F', '💐 Tri ân thầy cô');
  hot(sc, { id: 'hb-trian', x: 150, y: 450, icon: '💐', label: 'Tri ân thầy cô', panel: 'office', tab: 1, nolabel: true, rect: { x: 50, y: 380, w: 200, h: 44 } });
  booth(sc, 390, 380, 200, '#8E6BBF', '☕ Phòng giáo viên');
  hot(sc, { id: 'hb-gv', x: 490, y: 450, icon: '☕', label: 'Phòng giáo viên', panel: 'teachers', nolabel: true, rect: { x: 390, y: 380, w: 200, h: 44 } });
  booth(sc, 220, 540, 200, '#C8553D', '🎓 Phòng cấp bằng');
  hot(sc, { id: 'hb-bang', x: 320, y: 610, icon: '🎓', label: 'Nhận bằng tốt nghiệp', panel: 'office', tab: 2, nolabel: true, rect: { x: 220, y: 540, w: 200, h: 44 } });
  plant(sc, 40, 690); plant(sc, W - 40, 690); plant(sc, 40, 330); plant(sc, W - 40, 330);
  sc.spots = { events: { x: 139, y: 160 }, history: { x: 500, y: 160 }, teachers: { x: 490, y: 480 }, office: { x: W / 2, y: H - 70 } };
  return sc;
}

// ======================= 🍜 Căng tin =======================
function cangtin() {
  const W = 560, H = 720;
  const sc = room({ id: 'p:cangtin', name: '🍜 Căng tin', w: W, h: H, floor: '#F3E6CF', line: 'rgba(170,130,70,.12)', wall: '#FFF3DC', zone: 'CT', windows: [300, 480] });
  sc.bg.push((ctx) => {
    // bảng thực đơn
    box(ctx, '#8A6A48', 10, 4, W - 20, 86, 5); box(ctx, '#2F3B2F', 14, 8, W - 28, 78, 3);
    txt(ctx, 'THỰC ĐƠN CĂNG TIN', W / 2, 18, 10, '#FFD45E', 800);
    MENU.forEach((m, i) => {
      const x = 28 + (i % 2) * 262, y = 33 + Math.floor(i / 2) * 13;
      txt(ctx, `${m.emoji} ${m.name}`, x, y, 8.6, '#F4F1E6', 600, 'left');
      txt(ctx, (m.price / 1000) + 'k', x + 232, y, 8.6, '#FFD45E', 700, 'right');
    });
  });
  // quầy
  thing(sc, 50, 112, 460, 46, (ctx) => {
    shadow(ctx, 50, 112, 460, 46); box(ctx, '#F26A21', 50, 112, 460, 42, 8); box(ctx, '#FFD9B8', 50, 112, 460, 10, 6);
    txt(ctx, 'QUẦY CĂNG TIN', 280, 138, 13, '#fff', 800);
    ['🥖', '🍙', '🧊', '🍵', '🍢'].forEach((e, i) => txt(ctx, e, 84 + i * 26, 132, 13, '#1D2433', 400));
    ['🍦', '🍜', '🥟'].forEach((e, i) => txt(ctx, e, 420 + i * 28, 132, 13, '#1D2433', 400));
  });
  hot(sc, { id: 'ct-mua', x: 280, y: 196, icon: '🛒', label: 'Mua đồ ăn vặt · Đãi bạn', panel: 'canteen', rect: { x: 50, y: 112, w: 460, h: 46 } });
  // bàn tròn + ghế đẩu
  for (const [x, y] of [[140, 320], [420, 320], [280, 420], [140, 520], [420, 520]]) {
    for (const d of [-1, 1]) { const sx = x + d * 46; sc.seats.push({ x: sx, y: y + 4, dir: -d, back: false }); sc.items.push({ y: y + 3, draw: (ctx) => stool(ctx, sx, y + 6) }); }
    thing(sc, x - 30, y - 22, 60, 36, (ctx) => {
      ctx.fillStyle = 'rgba(20,30,50,.10)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 10, 34, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFDF7'; ctx.beginPath(); ctx.ellipse(x, y - 4, 34, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#E3D6BD'; ctx.lineWidth = 2; ctx.stroke();
      txt(ctx, '🧊', x - 8, y - 6, 10, '#000', 400); txt(ctx, '🥖', x + 9, y - 3, 10, '#000', 400);
    });
  }
  // tủ lạnh nước
  thing(sc, W - 70, 200, 52, 70, (ctx) => {
    box(ctx, '#C9D3E0', W - 70, 200, 52, 66, 5); box(ctx, '#E9F6FC', W - 65, 205, 42, 50, 3);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) box(ctx, ['#E8483F', '#3E8E4A', '#F2B84B'][k], W - 60 + k * 13, 210 + i * 15, 8, 12, 2);
  });
  sc.bg.push((ctx) => { box(ctx, '#FFFFFF', 16, 200, 92, 40, 8); txt(ctx, '⏰ Giờ ra chơi', 62, 212, 8, '#C8343A', 800); txt(ctx, 'giảm 20%', 62, 228, 9, '#C8343A', 800); });
  plant(sc, 40, 640); plant(sc, W - 40, 640);
  sc.spots.canteen = { x: W / 2, y: H - 70 };
  return sc;
}

// ======================= 🏀 Nhà đa năng · CLB =======================
function dana() {
  const W = 640, H = 860;
  const sc = room({ id: 'p:dana', name: '🏀 Nhà đa năng · CLB', w: W, h: H, floor: '#E2B77A', line: 'rgba(120,70,20,.10)', wall: '#E9F0F7', title: '🏀 NHÀ ĐA NĂNG · CLB', zone: 'DN', windows: [200, 420, 640] });
  sc.bg.push((ctx) => {
    // bảng tỉ số
    box(ctx, '#22252E', 40, 34, 120, 50, 6); txt(ctx, 'NHÀ  ·  KHÁCH', 100, 46, 7, '#9AA3B2', 700); txt(ctx, '24 : 21', 100, 66, 16, '#FFD45E', 800);
    box(ctx, '#C8343A', 480, 34, 130, 50, 6); txt(ctx, 'CHUYÊN', 545, 50, 10, '#fff', 800); txt(ctx, 'THÁI NGUYÊN', 545, 66, 10, '#FFE08A', 800);
    // nửa sân bóng rổ
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3;
    ctx.strokeRect(120, TOP + 6, 400, 230);
    ctx.beginPath(); ctx.rect(250, TOP + 6, 140, 120); ctx.stroke();
    ctx.beginPath(); ctx.arc(320, TOP + 126, 50, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(320, TOP + 20, 170, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(200,52,58,.18)'; ctx.fillRect(250, TOP + 6, 140, 120);
    // rổ
    box(ctx, '#FFFFFF', 280, 50, 80, 44, 3); ctx.strokeStyle = '#C8343A'; ctx.lineWidth = 2; ctx.strokeRect(306, 66, 28, 20);
  });
  thing(sc, 296, 92, 48, 10, (ctx) => {
    ctx.strokeStyle = '#F26A21'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(320, 104, 16, 6, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; for (let i = -12; i <= 12; i += 6) { ctx.beginPath(); ctx.moveTo(320 + i, 108); ctx.lineTo(320 + i * 0.6, 120); ctx.stroke(); }
  }, false);
  sc.solids.push({ x: 300, y: 96, w: 40, h: 10 });
  hot(sc, { id: 'dn-bongro', x: 320, y: 262, icon: '🏀', label: 'Ném bóng rổ', panel: 'bongro' });
  // các gian CLB: 2 cột × 3 hàng
  CLUBS.forEach((c, i) => {
    const left = i % 2 === 0, x = left ? 30 : 410, y = 380 + Math.floor(i / 2) * 130;
    thing(sc, x, y, 200, 64, (ctx) => {
      shadow(ctx, x, y, 200, 64); box(ctx, '#FFF8EC', x, y, 200, 60, 8); box(ctx, c.color, x, y, 200, 22, 8); ctx.fillStyle = c.color; ctx.fillRect(x, y + 12, 200, 10);
      txt(ctx, c.name, x + 100, y + 11, 10, '#fff', 800);
      txt(ctx, c.icon, x + 100, y + 42, 20, '#1D2433', 400);
    });
    hot(sc, { id: 'dn-' + c.id, x: left ? x + 230 : x - 30, y: y + 40, icon: c.icon, label: c.name, panel: 'club', club: c.id, nolabel: true, rect: { x, y, w: 200, h: 64 } });
  });
  sc.spots.clubs = { x: W / 2, y: H - 70 };
  return sc;
}

export const ROOMS = { thuvien, phongmay, phongtn, hieubo, cangtin, dana };
