// Nghiệp vụ dùng chung cho cả server (Cloudflare Worker + D1) và chế độ offline (localStorage).
// Mọi hàm nhận ctx = { store, token, now } và tham số đầu vào, trả về object JSON.
// store: get(t,k) · put(t,k,v) · del(t,k) · list(t,prefix,limit) — tất cả đều async.

export const LOPS = ['Toán', 'Tin', 'Lý', 'Hóa', 'Sinh', 'Văn', 'Sử', 'Địa', 'Anh', 'Nga', 'Pháp', 'Trung'];
export const ROLES = {
  cuuhs: 'Cựu học sinh',
  hs: 'Học sinh',
  gv: 'Thầy cô',
  khach: 'Bạn trường khác',
  em: 'Em cấp 2',
};

// Thời khoá biểu (giờ Việt Nam, phút tính từ 0:00): [bắt đầu, kết thúc, nhãn]
export const SCHEDULE = [
  [7 * 60, 7 * 60 + 45, 'Tiết 1 sáng'], [7 * 60 + 50, 8 * 60 + 35, 'Tiết 2 sáng'], [8 * 60 + 40, 9 * 60 + 25, 'Tiết 3 sáng'],
  [9 * 60 + 25, 9 * 60 + 45, 'Ra chơi', true], [9 * 60 + 45, 10 * 60 + 30, 'Tiết 4 sáng'], [10 * 60 + 35, 11 * 60 + 20, 'Tiết 5 sáng'],
  [13 * 60 + 30, 14 * 60 + 15, 'Tiết 1 chiều'], [14 * 60 + 20, 15 * 60 + 5, 'Tiết 2 chiều'], [15 * 60 + 10, 15 * 60 + 55, 'Tiết 3 chiều'],
  [15 * 60 + 55, 16 * 60 + 15, 'Ra chơi', true], [16 * 60 + 15, 17 * 60, 'Tiết 4 chiều'], [17 * 60 + 5, 17 * 60 + 50, 'Tiết 5 chiều'],
];
export const BREAK_TEXT = '9:25–9:45 và 15:55–16:15';

export const MENU = [
  { id: 'banhmi', name: 'Bánh mì pate', price: 15000, emoji: '🥖' },
  { id: 'xoi', name: 'Xôi xéo', price: 15000, emoji: '🍙' },
  { id: 'banhcuon', name: 'Bánh cuốn Thái Nguyên', price: 25000, emoji: '🥟' },
  { id: 'trada', name: 'Trà đá', price: 3000, emoji: '🧊' },
  { id: 'chetan', name: 'Chè Tân Cương nóng', price: 5000, emoji: '🍵' },
  { id: 'nemchua', name: 'Nem chua rán', price: 20000, emoji: '🍢' },
  { id: 'kem', name: 'Kem que', price: 5000, emoji: '🍦' },
  { id: 'mitom', name: 'Mì tôm trứng', price: 20000, emoji: '🍜' },
];

export const DAILY_ALLOWANCE = 20000;
const PRESENCE_TTL = 20000;

const POINTS = { checkin: 2, guestbook: 5, event: 3, join: 3, quiz: 1, game: 1 };

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function str(v, max, required = false, field = 'dữ liệu') {
  const s = typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '';
  if (required && !s) throw new ApiError(400, `Thiếu ${field}`);
  return s.slice(0, max);
}
function text(v, max, field) {
  const s = typeof v === 'string' ? v.trim().replace(/\r/g, '').replace(/\n{3,}/g, '\n\n') : '';
  if (!s) throw new ApiError(400, `Thiếu ${field}`);
  if (s.length > max) throw new ApiError(400, `${field} tối đa ${max} ký tự`);
  return s;
}
function num(v, min, max, def = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}
function randId(n = 10) {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  for (const b of buf) s += a[b % a.length];
  return s;
}
function recoveryCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  const c = [...buf].map((b) => a[b % a.length]).join('');
  return `CTN-${c.slice(0, 4)}-${c.slice(4)}`;
}
// Ngày/giờ theo múi giờ Việt Nam (UTC+7)
function vnDate(now) { return new Date(now + 7 * 3600e3).toISOString().slice(0, 10); }
function vnMinutes(now) { const d = new Date(now + 7 * 3600e3); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
export function periodOf(now) {
  const m = vnMinutes(now);
  for (const [a, b, label, brk] of SCHEDULE) if (m >= a && m < b) return { label, isBreak: !!brk };
  if (m < 7 * 60) return { label: m < 5 * 60 ? 'Đêm khuya' : 'Sắp vào học', isBreak: false };
  if (m < 13 * 60 + 30) return { label: 'Nghỉ trưa', isBreak: false };
  if (m < 22 * 60) return { label: 'Tan học', isBreak: false };
  return { label: 'Đêm khuya', isBreak: false };
}
export function vnClock(now) { const m = vnMinutes(now); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
export function isBreakTime(now) { return periodOf(now).isBreak; }

function sanitizeLook(l) {
  l = l && typeof l === 'object' ? l : {};
  return {
    gender: l.gender === 'nu' ? 'nu' : 'nam',
    skin: num(l.skin, 0, 4, 1) | 0,
    hair: num(l.hair, 0, 5, 0) | 0,
    hairColor: num(l.hairColor, 0, 4, 0) | 0,
    bottom: l.bottom === 'vay' ? 'vay' : 'quan',
    bag: num(l.bag, 0, 3, 0) | 0,
  };
}

function publicUser(u) {
  return { id: u.id, name: u.name, role: u.role, khoa: u.khoa, lop: u.lop, school: u.school || '', look: u.look, points: u.points || 0 };
}
function privateUser(u) {
  return { ...publicUser(u), wallet: u.wallet, lastCheckin: u.lastCheckin || null, code: u.code, quizToday: u.quizCount || 0 };
}

async function auth(ctx) {
  if (!ctx.token) throw new ApiError(401, 'Chưa tạo nhân vật');
  const id = await ctx.store.get('tok', ctx.token);
  if (!id) throw new ApiError(401, 'Phiên không hợp lệ');
  const u = await ctx.store.get('user', id);
  if (!u) throw new ApiError(401, 'Không tìm thấy nhân vật');
  return u;
}
async function addPoints(ctx, u, kind, mult = 1) {
  u.points = (u.points || 0) + (POINTS[kind] || 0) * mult;
  await ctx.store.put('user', u.id, u);
}

const NO_CLASS = ['gv', 'khach', 'em'];
function normKhoa(v, role) {
  if (NO_CLASS.includes(role)) return '';
  const s = str(String(v ?? ''), 12).toUpperCase().replace(/^K?/, 'K');
  if (!/^K\d{1,2}$/.test(s)) throw new ApiError(400, 'Khóa dạng K1, K2… K40');
  return s;
}

const handlers = {
  async ping() { return { ok: true, school: 'THPT Chuyên Thái Nguyên' }; },

  async register(ctx, b) {
    const role = ROLES[b.role] ? b.role : 'cuuhs';
    const name = str(b.name, 40, true, 'tên');
    const khoa = normKhoa(b.khoa, role);
    const lop = NO_CLASS.includes(role) ? '' : LOPS.includes(b.lop) ? b.lop : '';
    if ((role === 'cuuhs' || role === 'hs') && !lop) throw new ApiError(400, 'Chọn lớp chuyên');
    const school = role === 'khach' || role === 'em' ? str(b.school, 60) : '';
    const id = randId(10);
    const token = randId(24);
    const code = recoveryCode();
    const u = {
      id, token, code, name, role, khoa, lop, school,
      look: sanitizeLook(b.look), wallet: 0, points: 0, createdAt: ctx.now,
    };
    await ctx.store.put('user', id, u);
    await ctx.store.put('tok', token, id);
    await ctx.store.put('code', code, id);
    return { token, user: privateUser(u) };
  },

  async me(ctx) { return { user: privateUser(await auth(ctx)) }; },

  async look(ctx, b) {
    const u = await auth(ctx);
    u.look = sanitizeLook(b.look);
    if (b.name) u.name = str(b.name, 40, true, 'tên');
    await ctx.store.put('user', u.id, u);
    return { user: privateUser(u) };
  },

  async recover(ctx, b) {
    const code = str(b.code, 20, true, 'mã khôi phục').toUpperCase();
    const id = await ctx.store.get('code', code);
    if (!id) throw new ApiError(404, 'Mã khôi phục không đúng');
    const u = await ctx.store.get('user', id);
    if (!u) throw new ApiError(404, 'Mã khôi phục không đúng');
    return { token: u.token, user: privateUser(u) };
  },

  async presence(ctx, b) {
    const u = await auth(ctx);
    const p = {
      id: u.id, name: u.name, role: u.role, khoa: u.khoa, lop: u.lop, school: u.school || '', look: u.look,
      x: num(b.x, 0, 4000), y: num(b.y, 0, 4000), zone: str(b.zone, 40), at: ctx.now,
      // cảnh đang đứng: 'campus' (sân trường) hoặc 'lop:<Lớp>' (trong lớp học)
      scene: str(b.scene, 40) || 'campus', sit: !!b.sit, sitBack: !!b.sitBack, dir: b.dir === -1 ? -1 : 1,
    };
    const old = await ctx.store.get('presence', u.id);
    if (typeof b.say === 'string' && b.say.trim()) { p.say = str(b.say, 80); p.sayAt = ctx.now; }
    else if (old && old.say && ctx.now - old.sayAt < 6000) { p.say = old.say; p.sayAt = old.sayAt; }
    // Ném bóng nước: lưu cú ném gần nhất 6 giây để người khác kịp thấy
    if (b.throw && typeof b.throw === 'object') {
      p.throw = { x: num(b.throw.x, 0, 4000), y: num(b.throw.y, 0, 4000), target: str(b.throw.target, 20), at: ctx.now };
    } else if (old && old.throw && ctx.now - old.throw.at < 6000) p.throw = old.throw;
    await ctx.store.put('presence', u.id, p);
    const all = await ctx.store.list('presence', '', 500);
    const others = [];
    for (const { k, v } of all) {
      if (ctx.now - v.at > PRESENCE_TTL) { if (ctx.now - v.at > 600e3) await ctx.store.del('presence', k); continue; }
      if (v.id !== u.id) others.push(v);
    }
    return { others, now: ctx.now };
  },

  // Khách chưa ghi danh: chỉ xem ai đang online, không hiện mình
  async online(ctx) {
    const all = await ctx.store.list('presence', '', 500);
    return { others: all.map((r) => r.v).filter((v) => ctx.now - v.at <= PRESENCE_TTL), now: ctx.now };
  },

  async guestbook(ctx, b) {
    const room = str(b.room, 40, true, 'phòng');
    const rows = await ctx.store.list('gb', room + '|', 200);
    const items = rows.map((r) => r.v).sort((a, c) => c.at - a.at).slice(0, 100);
    return { items };
  },

  async sign(ctx, b) {
    const u = await auth(ctx);
    const room = str(b.room, 40, true, 'phòng');
    const body = text(b.body, 600, 'Lời nhắn');
    const item = { id: randId(8), room, uid: u.id, name: u.name, role: u.role, khoa: u.khoa, lop: u.lop, body, at: ctx.now };
    const key = `${room}|${String(ctx.now).padStart(15, '0')}-${item.id}`;
    await ctx.store.put('gb', key, item);
    // Ghi danh vào "sổ đầu bài" của lớp
    if (room.startsWith('lop:')) await ctx.store.put('roster', `${room}|${u.id}`, { id: u.id, name: u.name, khoa: u.khoa, at: ctx.now });
    await addPoints(ctx, u, 'guestbook');
    return { item, user: privateUser(u) };
  },

  async roster(ctx, b) {
    const room = str(b.room, 40, true, 'phòng');
    const rows = await ctx.store.list('roster', room + '|', 300);
    return { items: rows.map((r) => r.v).sort((a, c) => a.at - c.at) };
  },

  async attend(ctx, b) {
    const u = await auth(ctx);
    const room = str(b.room, 40, true, 'phòng');
    if (!room.startsWith('lop:')) throw new ApiError(400, 'Chỉ điểm danh trong lớp');
    await ctx.store.put('roster', `${room}|${u.id}`, { id: u.id, name: u.name, khoa: u.khoa, at: ctx.now });
    return { ok: true };
  },

  async checkin(ctx) {
    const u = await auth(ctx);
    const today = vnDate(ctx.now);
    if (u.lastCheckin === today) return { already: true, user: privateUser(u) };
    u.lastCheckin = today;
    u.wallet = (u.wallet || 0) + DAILY_ALLOWANCE;
    await addPoints(ctx, u, 'checkin');
    return { already: false, gained: DAILY_ALLOWANCE, user: privateUser(u) };
  },

  async menu(ctx) {
    const sale = isBreakTime(ctx.now);
    return { sale, items: MENU.map((m) => ({ ...m, final: sale ? Math.round(m.price * 0.8 / 500) * 500 : m.price })) };
  },

  async buy(ctx, b) {
    const u = await auth(ctx);
    const m = MENU.find((x) => x.id === b.item);
    if (!m) throw new ApiError(400, 'Món không có trong thực đơn');
    const sale = isBreakTime(ctx.now);
    const price = sale ? Math.round(m.price * 0.8 / 500) * 500 : m.price;
    if ((u.wallet || 0) < price) throw new ApiError(400, 'Không đủ tiền. Gửi xe ở cổng để nhận 20k mỗi ngày!');
    u.wallet -= price;
    await ctx.store.put('user', u.id, u);
    const forName = str(b.forName, 40);
    const rec = { id: randId(8), uid: u.id, name: u.name, item: m.name, emoji: m.emoji, price, forName, at: ctx.now };
    await ctx.store.put('buy', `${String(ctx.now).padStart(15, '0')}-${rec.id}`, rec);
    return { item: rec, user: privateUser(u) };
  },

  // ---------- Album ảnh kỷ yếu ----------
  // Ảnh lớn lưu riêng ('photofull'), danh sách chỉ trả ảnh nhỏ để nhẹ.
  async albumPost(ctx, b) {
    const u = await auth(ctx);
    const isJpeg = (d, max) => typeof d === 'string' && d.startsWith('data:image/jpeg;base64,') && d.length <= max;
    if (!isJpeg(b.thumb, 40000) || !isJpeg(b.full, 300000)) throw new ApiError(400, 'Ảnh không hợp lệ hoặc quá lớn');
    const today = vnDate(ctx.now);
    if (u.photoDay !== today) { u.photoDay = today; u.photoCount = 0; }
    if (u.photoCount >= 5) throw new ApiError(400, 'Mỗi ngày đăng tối đa 5 ảnh kỷ yếu');
    u.photoCount += 1;
    await ctx.store.put('user', u.id, u);
    const id = randId(8);
    const meta = {
      id, uid: u.id, by: u.name, khoa: u.khoa, lop: u.lop, caption: str(b.caption, 120),
      people: Array.isArray(b.people) ? b.people.slice(0, 12).map((x) => str(String(x), 40)).filter(Boolean) : [],
      thumb: b.thumb, at: ctx.now,
    };
    await ctx.store.put('photo', `${String(ctx.now).padStart(15, '0')}-${id}`, meta);
    await ctx.store.put('photofull', id, { id, full: b.full });
    return { item: meta, user: privateUser(u) };
  },

  async album(ctx) {
    const rows = await ctx.store.list('photo', '', 60);
    return { items: rows.map((r) => r.v).sort((a, c) => c.at - a.at).slice(0, 60) };
  },

  async photo(ctx, b) {
    const p = await ctx.store.get('photofull', str(b.id, 20, true, 'mã ảnh'));
    if (!p) throw new ApiError(404, 'Không tìm thấy ảnh');
    return p;
  },

  async purchases(ctx) {
    const rows = await ctx.store.list('buy', '', 300);
    return { items: rows.map((r) => r.v).sort((a, c) => c.at - a.at).slice(0, 20) };
  },

  async events(ctx) {
    const rows = await ctx.store.list('event', '', 300);
    const items = rows.map((r) => r.v).sort((a, c) => (a.date < c.date ? -1 : a.date > c.date ? 1 : 0));
    return { items };
  },

  async createEvent(ctx, b) {
    const u = await auth(ctx);
    const title = str(b.title, 80, true, 'tên buổi họp lớp');
    const date = str(b.date, 10, true, 'ngày');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'Ngày không hợp lệ');
    const ev = {
      id: randId(8), title, date, time: str(b.time, 5), place: str(b.place, 120), note: str(b.note, 300),
      khoa: u.khoa, lop: u.lop, by: u.name, byId: u.id, joins: [{ id: u.id, name: u.name }], at: ctx.now,
    };
    await ctx.store.put('event', ev.id, ev);
    await addPoints(ctx, u, 'event');
    return { item: ev, user: privateUser(u) };
  },

  async joinEvent(ctx, b) {
    const u = await auth(ctx);
    const ev = await ctx.store.get('event', str(b.id, 20, true, 'mã sự kiện'));
    if (!ev) throw new ApiError(404, 'Không tìm thấy buổi họp lớp');
    const i = ev.joins.findIndex((j) => j.id === u.id);
    if (i >= 0) ev.joins.splice(i, 1);
    else { ev.joins.push({ id: u.id, name: u.name }); await addPoints(ctx, u, 'join'); }
    await ctx.store.put('event', ev.id, ev);
    return { item: ev, joined: i < 0, user: privateUser(u) };
  },

  async quiz(ctx, b) {
    const u = await auth(ctx);
    const today = vnDate(ctx.now);
    if (u.quizDay !== today) { u.quizDay = today; u.quizCount = 0; }
    const correct = num(b.correct, 0, 10, 0) | 0;
    const award = Math.max(0, Math.min(correct, 10 - u.quizCount));
    u.quizCount += award;
    await addPoints(ctx, u, 'quiz', award);
    return { award, user: privateUser(u) };
  },

  async score(ctx, b) {
    const u = await auth(ctx);
    const game = str(b.game, 20, true, 'trò chơi');
    const score = num(b.score, 0, 9999, 0) | 0;
    const key = `${game}|${u.id}`;
    const old = await ctx.store.get('score', key);
    let best = old ? old.score : 0;
    if (score > best) {
      best = score;
      await ctx.store.put('score', key, { id: u.id, name: u.name, khoa: u.khoa, lop: u.lop, score, at: ctx.now });
    }
    if (score >= 5) await addPoints(ctx, u, 'game');
    return { best, user: privateUser(u) };
  },

  async leaderboard(ctx, b) {
    const game = str(b.game, 20, true, 'trò chơi');
    const rows = await ctx.store.list('score', game + '|', 1000);
    return { items: rows.map((r) => r.v).sort((a, c) => c.score - a.score).slice(0, 20) };
  },

  async khoaBoard(ctx) {
    const rows = await ctx.store.list('user', '', 5000);
    const by = new Map();
    for (const { v } of rows) {
      if (!v.khoa) continue;
      const e = by.get(v.khoa) || { khoa: v.khoa, points: 0, members: 0 };
      e.points += v.points || 0;
      e.members += 1;
      by.set(v.khoa, e);
    }
    const lopBy = new Map();
    for (const { v } of rows) {
      if (!v.lop) continue;
      const e = lopBy.get(v.lop) || { lop: v.lop, points: 0, members: 0 };
      e.points += v.points || 0;
      e.members += 1;
      lopBy.set(v.lop, e);
    }
    return {
      khoa: [...by.values()].sort((a, c) => c.points - a.points).slice(0, 30),
      lop: [...lopBy.values()].sort((a, c) => c.points - a.points),
    };
  },
};

export async function handle(action, ctx, body) {
  const h = Object.prototype.hasOwnProperty.call(handlers, action) ? handlers[action] : null;
  if (!h) return { status: 404, body: { error: 'Không có chức năng này' } };
  try {
    return { status: 200, body: await h(ctx, body || {}) };
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, body: { error: e.message } };
    console.error(e);
    return { status: 500, body: { error: 'Lỗi máy chủ' } };
  }
}
