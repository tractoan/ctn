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

const POINTS = { checkin: 2, guestbook: 5, event: 3, join: 3, quiz: 1, game: 1, classSit: 10, flag: 20, treat: 3, flower: 5, ach: 20, submit: 10, notebook: 5 };

// ---------- Tiến trình: nhiệm vụ ngày, thành tựu, ví ----------
export const TRANSPORTS = {
  xedap: { icon: '🚲', name: 'Xe đạp' }, xemay: { icon: '🛵', name: 'Xe máy điện' }, oto: { icon: '🚗', name: 'Ô tô (bố mẹ đưa)' },
  bus: { icon: '🚌', name: 'Xe bus' }, dibo: { icon: '🚶', name: 'Đi bộ' },
};
export const GAMES = {
  dacau: { name: 'Đá cầu', icon: '🏸', unit: 'quả', sport: true, high: 20 },
  penalty: { name: 'Sút penalty', icon: '⚽', unit: 'điểm', sport: true, high: 80 },
  bongro: { name: 'Bóng rổ', icon: '🏀', unit: 'điểm', sport: true, high: 80 },
  hoahoc: { name: 'Pha chế hóa học', icon: '🧪', unit: 'điểm', high: 80 },
  domin: { name: 'Dò mìn', icon: '💣', unit: 'điểm', high: 80 },
  dovui: { name: 'Đố vui', icon: '❓', unit: 'câu' },
  baicu: { name: 'Kiểm tra bài cũ', icon: '👩‍🏫', unit: 'điểm' },
};
export const ZONE_IDS = ['san', 'dacau', 'tronhoc', 'cong', 'khuon', 'D3', 'D4', 'D5', 'HB', 'DN', 'CT', 'lop', 'lab', 'library', 'computer'];

export const DAILY_QUESTS = [
  { id: 'checkin', icon: '🛵', title: 'Điểm danh vào trường', desc: 'Gửi xe hoặc đi bus vào trường hôm nay.', reward: 5000, done: (t) => t.checkin },
  { id: 'class', icon: '🪑', title: 'Ngồi vào lớp mình', desc: 'Vào lớp của mình (thầy cô, khách: lớp bất kỳ) và ngồi vào ghế.', reward: 5000, done: (t) => t.classSit },
  { id: 'buy', icon: '🍜', title: 'Ghé căng tin', desc: 'Mua 1 món ở căng tin.', reward: 3000, done: (t) => t.buy },
  { id: 'game', icon: '🎮', title: 'Chơi một trò', desc: 'Chơi xong 1 trò bất kỳ: đá cầu, penalty, bóng rổ, pha chế, dò mìn, đố vui.', reward: 5000, done: (t) => t.game },
  { id: 'zones', icon: '🗺️', title: 'Dạo quanh trường', desc: 'Ghé 3 khu khác nhau (sân, lớp, căng tin, nhà đa năng…).', reward: 3000, done: (t) => (t.zones || []).length >= 3 },
  { id: 'gb', icon: '✍️', title: 'Viết lưu bút', desc: 'Viết 1 dòng lưu bút ở bất kỳ sổ nào.', reward: 5000, done: (t) => t.gb },
  { id: 'treat', icon: '🤝', title: 'Đãi bạn', desc: 'Mời một bạn đang online 1 món ở căng tin.', reward: 5000, done: (t) => t.treat },
  { id: 'hit', icon: '🎈', title: 'Ném trúng bóng nước', desc: 'Ném trúng một bạn bằng bóng nước.', reward: 3000, done: (t) => t.hit },
];
export const ALL_DAILY_BONUS = { id: 'all', icon: '🏅', title: 'Chăm chỉ cả ngày', desc: 'Nhận thưởng 6 nhiệm vụ ngày khác.', reward: 10000, need: 6 };

export const TIERS = ['Lớp 10', 'Lớp 11', 'Lớp 12', 'Ôn thi', 'Tốt nghiệp', 'Niềm tự hào', 'Huyền thoại'];
const A = (tier, id, title, desc, stat, n) => ({ tier, id, title, desc, stat, n, reward: 10000 * (tier + 1) });
export const ACHIEVEMENTS = [
  A(0, 'gb1', 'Dòng lưu bút đầu tiên', 'Viết 1 dòng lưu bút.', 'gb', 1),
  A(0, 'checkin3', 'Học sinh mới', 'Điểm danh 3 ngày.', 'checkins', 3),
  A(0, 'zones5', 'Làm quen trường mới', 'Ghé 5 khu khác nhau.', 'zones', 5),
  A(0, 'treat1', 'Mời bạn lần đầu', 'Đãi bạn 1 món.', 'treats', 1),
  A(0, 'class1', 'Buổi học đầu tiên', 'Ngồi vào lớp mình 1 ngày.', 'classDays', 1),
  A(0, 'flag1', 'Buổi chào cờ đầu tiên', 'Có mặt chào cờ sáng thứ Hai.', 'flagWeeks', 1),
  A(1, 'checkin7', 'Một tuần chăm chỉ', 'Điểm danh 7 ngày.', 'checkins', 7),
  A(1, 'games10', 'Ham chơi', 'Chơi 10 lượt trò chơi.', 'games', 10),
  A(1, 'buys10', 'Khách quen căng tin', 'Mua 10 món.', 'buys', 10),
  A(1, 'kinds5', 'Thử hết các trò', 'Chơi 5 trò khác nhau.', 'gameKinds', 5),
  A(1, 'love1', 'Lời tỏ tình đầu tiên', 'Tỏ tình thành công 1 lần.', 'loveYes', 1),
  A(1, 'photo1', 'Người giữ kỷ niệm', 'Đăng 1 ảnh vào album kỷ yếu.', 'photos', 1),
  A(2, 'streak5', 'Đi học đều', 'Đi học 5 ngày liền.', 'bestStreak', 5),
  A(2, 'gb5', 'Cây bút lưu bút', 'Viết 5 dòng lưu bút.', 'gb', 5),
  A(2, 'sports5', 'Năng khiếu thể thao', 'Đạt điểm cao trò thể thao 5 lần.', 'sports80', 5),
  A(2, 'perfect10', 'Cây đố vui', 'Trả lời đúng hết 10 lượt đố.', 'perfect', 10),
  A(2, 'hits10', 'Tay ném bóng nước', 'Ném trúng bóng nước 10 lần.', 'hits', 10),
  A(2, 'points500', 'Thi đua khởi động', 'Đạt 500 điểm thi đua.', 'points', 500),
  A(3, 'checkin14', 'Hai tuần đều đặn', 'Điểm danh 14 ngày.', 'checkins', 14),
  A(3, 'class10', 'Chuyên cần', 'Ngồi vào lớp mình 10 ngày.', 'classDays', 10),
  A(3, 'treats10', 'Hào phóng', 'Đãi bạn 10 lần.', 'treats', 10),
  A(3, 'games30', 'Game thủ tập sự', 'Chơi 30 lượt trò chơi.', 'games', 30),
  A(3, 'events1', 'Hẹn họp lớp', 'Đăng ký tham dự 1 buổi họp lớp.', 'events', 1),
  A(3, 'diploma', 'Nhận bằng kỷ niệm', 'Nhận giấy chứng nhận kỷ niệm ở phòng cấp bằng.', 'diploma', 1),
  A(4, 'checkin30', 'Một tháng chuyên cần', 'Điểm danh 30 ngày.', 'checkins', 30),
  A(4, 'streak10', 'Mười ngày không nghỉ', 'Đi học 10 ngày liền.', 'bestStreak', 10),
  A(4, 'gb15', 'Văn hay chữ tốt', 'Viết 15 dòng lưu bút.', 'gb', 15),
  A(4, 'perfect25', 'Thủ khoa đố vui', 'Trả lời đúng hết 25 lượt đố.', 'perfect', 25),
  A(4, 'hits50', 'Xạ thủ bóng nước', 'Ném trúng bóng nước 50 lần.', 'hits', 50),
  A(4, 'points1000', 'Học sinh tiên tiến', 'Đạt 1.000 điểm thi đua.', 'points', 1000),
  A(5, 'checkin100', 'Một trăm ngày', 'Điểm danh 100 ngày.', 'checkins', 100),
  A(5, 'class30', 'Không bỏ tiết', 'Ngồi vào lớp mình 30 ngày.', 'classDays', 30),
  A(5, 'love5', 'Trái tim chuyên', 'Tỏ tình thành công 5 lần.', 'loveYes', 5),
  A(5, 'buys50', 'Sành ăn', 'Mua 50 món.', 'buys', 50),
  A(5, 'flag10', 'Mười buổi chào cờ', 'Chào cờ 10 tuần.', 'flagWeeks', 10),
  A(5, 'points5000', 'Học bổng toàn phần', 'Đạt 5.000 điểm thi đua.', 'points', 5000),
];
ACHIEVEMENTS.push({ tier: 6, id: 'legend', title: 'Huyền thoại Chuyên Thái Nguyên', desc: `Nhận đủ ${ACHIEVEMENTS.length} thành tựu khác.`, stat: 'achCount', n: ACHIEVEMENTS.length, reward: 200000 });

export const CLASS_RULES = [
  'Đi học đúng giờ, ra vào lớp xin phép thầy cô.',
  'Mặc đồng phục, đeo thẻ học sinh.',
  'Giữ trật tự, muốn phát biểu thì giơ tay.',
  'Giữ gìn vệ sinh, không viết vẽ lên bàn ghế.',
  'Không ném bóng nước trong giờ học.',
  'Đoàn kết, giúp đỡ bạn bè, lễ phép với thầy cô.',
];
export const BAC_HO = [
  'Yêu Tổ quốc, yêu đồng bào.',
  'Học tập tốt, lao động tốt.',
  'Đoàn kết tốt, kỷ luật tốt.',
  'Giữ gìn vệ sinh thật tốt.',
  'Khiêm tốn, thật thà, dũng cảm.',
];

export const LOVE_LINES = [
  'Cậu là crush của mình đó, biết không?',
  'Cuối tuần đi trà sữa với mình nhé? 🧋',
  'Làm người thương của mình nhé? 💕',
  'Ngồi ghế đá với mình một lát được không?',
  'Cảm ơn cậu đã luôn ở bên mình suốt những năm cấp 3 ❤️',
];
export const LOVE_REPLIES = ['💕 Đồng ý', '🤔 Để mình suy nghĩ', '🤝 Mình coi cậu là bạn thôi'];

// Ngày nhiệm vụ đổi lúc 5 giờ sáng giờ Việt Nam
function questDay(now) { return vnDate(now - 5 * 3600e3); }
function vnWeekday(now) { return new Date(now + 7 * 3600e3).getUTCDay(); }

function ensure(u, now) {
  const st = (u.stats ||= {});
  for (const k of ['checkins', 'streak', 'bestStreak', 'classDays', 'buys', 'treats', 'gb', 'games', 'sports80', 'perfect', 'hits', 'photos', 'flagWeeks', 'loveYes', 'events', 'diploma', 'flowers']) st[k] ||= 0;
  st.gameKinds ||= []; st.zones ||= [];
  const day = questDay(now);
  if (!u.today || u.today.day !== day) u.today = { day, zones: [] };
  if (!u.claimed || u.claimed.day !== day) u.claimed = { day, list: [] };
  u.achClaimed ||= []; u.ledger ||= [];
}
function statValue(u, stat) {
  const st = u.stats;
  if (stat === 'points') return u.points || 0;
  if (stat === 'achCount') return u.achClaimed.filter((x) => x !== 'legend').length;
  if (stat === 'gameKinds' || stat === 'zones') return st[stat].length;
  return st[stat] || 0;
}
function tierState(u) {
  // Mở cấp sau khi đã nhận ít nhất (số thành tựu của cấp − 1) ở cấp hiện tại
  const out = [];
  let unlocked = true;
  for (let t = 0; t < TIERS.length; t++) {
    const list = ACHIEVEMENTS.filter((a) => a.tier === t);
    const got = list.filter((a) => u.achClaimed.includes(a.id)).length;
    out.push({ name: TIERS[t], unlocked, got, total: list.length, need: Math.max(1, list.length - 1) });
    if (got < Math.max(1, list.length - 1)) unlocked = false;
  }
  return out;
}
function badgeCount(u) {
  if (!u.stats) return 0;
  let n = DAILY_QUESTS.filter((q) => q.done(u.today) && !u.claimed.list.includes(q.id)).length;
  const claimedDaily = u.claimed.list.filter((x) => x !== 'all').length;
  if (claimedDaily >= ALL_DAILY_BONUS.need && !u.claimed.list.includes('all')) n++;
  const tiers = tierState(u);
  n += ACHIEVEMENTS.filter((a) => tiers[a.tier].unlocked && !u.achClaimed.includes(a.id) && statValue(u, a.stat) >= a.n).length;
  return n;
}
function credit(u, amount, text, now) {
  u.wallet = (u.wallet || 0) + amount;
  u.ledger.unshift({ at: now, amount, text });
  if (u.ledger.length > 30) u.ledger.length = 30;
}
async function sendInbox(ctx, toId, item) {
  await ctx.store.put('inbox', `${toId}|${String(ctx.now).padStart(15, '0')}-${item.id}`, item);
}

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
    hair: num(l.hair, 0, 8, 0) | 0,
    hairColor: num(l.hairColor, 0, 4, 0) | 0,
    bottom: l.bottom === 'vay' ? 'vay' : 'quan',
    bag: num(l.bag, 0, 3, 0) | 0,
    outfit: ['somi', 'aodai', 'khoac', 'aolop', 'vest', 'phong'].includes(l.outfit) ? l.outfit : 'somi',
    color: num(l.color, 0, 4, 0) | 0,
    scarf: !!l.scarf,
  };
}

function publicUser(u) {
  return { id: u.id, name: u.name, role: u.role, khoa: u.khoa, lop: u.lop, school: u.school || '', look: u.look, points: u.points || 0 };
}
function privateUser(u) {
  return {
    ...publicUser(u), wallet: u.wallet, lastCheckin: u.lastCheckin || null, code: u.code, quizToday: u.quizCount || 0,
    streak: u.stats?.streak || 0, transport: u.transport || '', badge: badgeCount(u),
  };
}

async function auth(ctx) {
  if (!ctx.token) throw new ApiError(401, 'Chưa tạo nhân vật');
  const id = await ctx.store.get('tok', ctx.token);
  if (!id) throw new ApiError(401, 'Phiên không hợp lệ');
  const u = await ctx.store.get('user', id);
  if (!u) throw new ApiError(401, 'Không tìm thấy nhân vật');
  ensure(u, ctx.now);
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

// ---------- Sổ đầu bài: theo lớp chuyên, theo ngày (đổi ngày lúc 5 giờ sáng) ----------
// Bảng `clog`, khóa `${lop}|${ngày}|${loại}|${id}`: p = có mặt, n = ghi chú buổi học, o = điểm miệng,
// s = nộp sổ (một bản ghi mỗi ngày), w = ghi tên vi phạm. Bảng `clogday` liệt kê các ngày có ghi chép.
function personLabel(u) {
  if (u.role === 'gv') return 'Thầy cô';
  if (u.role === 'khach' || u.role === 'em') return 'Khách';
  return [u.khoa, u.lop].filter(Boolean).join(' · ');
}
async function clogPut(ctx, lop, day, kind, id, v) {
  await ctx.store.put('clog', `${lop}|${day}|${kind}|${id}`, v);
  if (!(await ctx.store.get('clogday', `${lop}|${day}`))) await ctx.store.put('clogday', `${lop}|${day}`, { day });
}
async function tokenUser(ctx) { try { return ctx.token ? await auth(ctx) : null; } catch { return null; } }
function lopParam(b) {
  const lop = str(b.lop, 10, true, 'lớp');
  if (!LOPS.includes(lop)) throw new ApiError(400, 'Lớp không hợp lệ');
  return lop;
}
function canWriteLog(u, lop) { return NO_CLASS.includes(u.role) || u.lop === lop; }
function isLessonTime(now) { return periodOf(now).label.startsWith('Tiết'); }

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
      noBalloon: !!b.noBalloon,
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
    // hộp thư: quà được đãi, lời tỏ tình, câu trả lời – lấy ra là xoá
    const inbox = [];
    for (const { k, v } of await ctx.store.list('inbox', u.id + '|', 20)) { inbox.push(v); await ctx.store.del('inbox', k); }
    return { others, inbox: inbox.reverse(), now: ctx.now };
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
    u.stats.gb++; u.today.gb = true;
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

  // Xem sổ đầu bài một ngày của một lớp
  async classlog(ctx, b) {
    const lop = lopParam(b);
    const today = questDay(ctx.now);
    const day = /^\d{4}-\d{2}-\d{2}$/.test(b.day || '') ? b.day : today;
    const me = await tokenUser(ctx);
    const rows = (await ctx.store.list('clog', `${lop}|${day}|`, 500)).map((r) => ({ kind: r.k.split('|')[2], id: r.k.split('|')[3], v: r.v }));
    const of = (k) => rows.filter((r) => r.kind === k).sort((a, c) => a.v.at - c.v.at);
    const days = (await ctx.store.list('clogday', `${lop}|`, 400)).map((r) => r.v.day).sort().reverse().slice(0, 30);
    const sub = of('s')[0];
    return {
      lop, day, today, days,
      present: of('p').map(({ id, v }) => ({ id, name: v.name, label: v.label, at: v.at, mine: !!me && me.id === id })),
      notes: of('n').map(({ id, v }) => ({ name: v.name, text: v.text, at: v.at, mine: !!me && me.id === id })),
      orals: of('o').map(({ v }) => ({ name: v.name, grade: v.grade })),
      submit: sub ? { name: sub.v.name, at: sub.v.at } : null,
      writeups: of('w').map(({ v }) => ({ name: v.name, label: v.label, reason: v.reason, by: v.by, at: v.at, mine: !!me && me.id === v.uid })),
      canWrite: !!me && canWriteLog(me, lop), isTeacher: !!me && me.role === 'gv',
    };
  },

  // Ghi sổ đầu bài: ghi chú buổi học, nộp sổ, cô kiểm tra vở ghi, thầy cô ghi tên vi phạm
  async classlogAct(ctx, b) {
    const u = await auth(ctx);
    const lop = lopParam(b);
    const kind = str(b.kind, 12);
    const day = questDay(ctx.now);
    if (kind === 'note') {
      if (!canWriteLog(u, lop)) throw new ApiError(403, `Chỉ học sinh lớp chuyên ${lop} mới ghi được sổ đầu bài lớp này`);
      const t = text(b.text, 200, 'Ghi chú');
      await clogPut(ctx, lop, day, 'n', u.id, { name: u.name, text: t, at: ctx.now });
      u.notes = [{ lop, day, text: t }, ...(u.notes || []).filter((x) => !(x.lop === lop && x.day === day))].slice(0, 10);
      await ctx.store.put('user', u.id, u);
      return { ok: true, user: privateUser(u) };
    }
    if (kind === 'submit') {
      if (!canWriteLog(u, lop)) throw new ApiError(403, `Chỉ học sinh lớp chuyên ${lop} mới nộp được sổ lớp này`);
      const cur = await ctx.store.get('clog', `${lop}|${day}|s|0`);
      if (cur) return { fresh: false, by: cur.name, at: cur.at, user: privateUser(u) };
      await clogPut(ctx, lop, day, 's', '0', { name: u.name, at: ctx.now });
      await addPoints(ctx, u, 'submit');
      return { fresh: true, user: privateUser(u) };
    }
    if (kind === 'notebook') {
      const notes = (u.notes || []).filter((x) => x.lop === lop);
      const has = notes.some((x) => x.day === day);
      let fresh = false;
      if (has && u.today.notebook !== lop) { u.today.notebook = lop; fresh = true; await addPoints(ctx, u, 'notebook'); }
      return { today: has, fresh, notes, user: privateUser(u) };
    }
    if (kind === 'writeup') {
      if (u.role !== 'gv') throw new ApiError(403, 'Chỉ thầy cô mới được ghi tên học sinh');
      const target = await ctx.store.get('user', str(b.target, 20, true, 'học sinh'));
      if (!target) throw new ApiError(400, 'Không tìm thấy học sinh');
      const reason = text(b.reason, 120, 'Lý do');
      await clogPut(ctx, lop, day, 'w', target.id, { uid: target.id, name: target.name, label: personLabel(target), reason, by: u.name, at: ctx.now });
      target.writeupDay = day;
      await ctx.store.put('user', target.id, target);
      return { ok: true };
    }
    throw new ApiError(400, 'Thao tác không hợp lệ');
  },

  async checkin(ctx, b) {
    const u = await auth(ctx);
    const today = questDay(ctx.now);
    if (u.lastCheckin === today) return { already: true, user: privateUser(u) };
    const yesterday = questDay(ctx.now - 86400e3);
    const st = u.stats;
    st.streak = u.lastCheckin === yesterday ? st.streak + 1 : 1;
    st.bestStreak = Math.max(st.bestStreak, st.streak);
    st.checkins++;
    u.lastCheckin = today;
    u.transport = TRANSPORTS[b.transport] ? b.transport : 'xedap';
    u.today.checkin = true;
    const punished = u.writeupDay === yesterday;
    if (!punished) credit(u, DAILY_ALLOWANCE, '👪 Bố mẹ cho tiền ăn vặt', ctx.now);
    let bonus = 0;
    if (st.streak % 5 === 0) { bonus = 10000; credit(u, bonus, `🔥 Thưởng đi học đều ${st.streak} ngày`, ctx.now); }
    await addPoints(ctx, u, 'checkin');
    return { already: false, gained: punished ? 0 : DAILY_ALLOWANCE, punished, bonus, streak: st.streak, transport: u.transport, user: privateUser(u) };
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
    // đãi bạn: người được đãi phải là người đã ghi danh
    let friend = null;
    if (b.forUid) {
      friend = await ctx.store.get('user', str(b.forUid, 20));
      if (!friend || friend.id === u.id) throw new ApiError(400, 'Không tìm thấy bạn này');
    }
    credit(u, -price, `${m.emoji} ${friend ? 'Đãi ' + friend.name + ' ' : 'Mua '}${m.name}`, ctx.now);
    u.stats.buys++; u.today.buy = true;
    if (friend) { u.stats.treats++; u.today.treat = true; u.points = (u.points || 0) + POINTS.treat; }
    await ctx.store.put('user', u.id, u);
    const forName = friend ? friend.name : str(b.forName, 40);
    const rec = { id: randId(8), uid: u.id, name: u.name, item: m.name, emoji: m.emoji, price, forName, at: ctx.now };
    await ctx.store.put('buy', `${String(ctx.now).padStart(15, '0')}-${rec.id}`, rec);
    if (friend) await sendInbox(ctx, friend.id, { id: rec.id, kind: 'gift', from: u.id, fromName: u.name, icon: m.emoji, item: m.name, at: ctx.now });
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
    u.stats.photos++;
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
    else { ev.joins.push({ id: u.id, name: u.name }); u.stats.events++; await addPoints(ctx, u, 'join'); }
    await ctx.store.put('event', ev.id, ev);
    return { item: ev, joined: i < 0, user: privateUser(u) };
  },

  async quiz(ctx, b) {
    const u = await auth(ctx);
    const today = vnDate(ctx.now);
    if (u.quizDay !== today) { u.quizDay = today; u.quizCount = 0; }
    const correct = num(b.correct, 0, 10, 0) | 0;
    const total = num(b.total, 1, 10, 3) | 0;
    if (correct >= total) u.stats.perfect++;
    u.stats.games++; u.today.game = true;
    if (!u.stats.gameKinds.includes('dovui')) u.stats.gameKinds.push('dovui');
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
    if (game === 'baicu' && LOPS.includes(b.lop)) {
      const day = questDay(ctx.now);
      await clogPut(ctx, b.lop, day, 'o', u.id, { name: u.name, label: personLabel(u), grade: Math.round(score / 10), at: ctx.now });
    }
    const g = GAMES[game];
    u.stats.games++; u.today.game = true;
    if (g && !u.stats.gameKinds.includes(game)) u.stats.gameKinds.push(game);
    if (g && g.sport && score >= g.high) u.stats.sports80++;
    if (g && game !== 'dacau' && score >= 100) u.stats.perfect++;
    await addPoints(ctx, u, 'game', g && g.high && score >= g.high ? 3 : 1);
    return { best, user: privateUser(u) };
  },

  // Sự kiện ghi nhận từ máy khách: ghé khu, ngồi vào lớp, ném trúng bóng nước, nhận bằng
  async act(ctx, b) {
    const u = await auth(ctx);
    const kind = str(b.kind, 20);
    const t = u.today, st = u.stats;
    let msg = '';
    if (kind === 'zone') {
      const z = str(b.value, 20);
      if (!ZONE_IDS.includes(z)) throw new ApiError(400, 'Khu không hợp lệ');
      if (!t.zones.includes(z)) t.zones.push(z);
      if (!st.zones.includes(z)) st.zones.push(z);
    } else if (kind === 'classSit') {
      const lop = str(b.value, 10);
      const ok = NO_CLASS.includes(u.role) ? LOPS.includes(lop) : lop === u.lop;
      if (!ok) return { ok: false, user: privateUser(u) };
      const day = questDay(ctx.now);
      if (!(await ctx.store.get('clog', `${lop}|${day}|p|${u.id}`))) await clogPut(ctx, lop, day, 'p', u.id, { name: u.name, label: personLabel(u), at: ctx.now });
      if (!t.classSit) {
        t.classSit = true; st.classDays++;
        u.points = (u.points || 0) + POINTS.classSit;
        msg = `✍️ Đã điểm danh có mặt ở lớp ${lop}, tên bạn đã vào sổ đầu bài. +${POINTS.classSit} điểm`;
      }
    } else if (kind === 'hit') {
      t.hitCount = (t.hitCount || 0) + 1;
      if (t.hitCount <= 40) { st.hits++; t.hit = true; }
      // ném bóng nước trong lớp giữa giờ học: tự động bị ghi tên vào sổ đầu bài
      const scene = str(b.scene, 20);
      const lop = scene.startsWith('lop:') ? scene.slice(4) : '';
      if (LOPS.includes(lop) && isLessonTime(ctx.now)) {
        const day = questDay(ctx.now);
        await clogPut(ctx, lop, day, 'w', u.id, { uid: u.id, name: u.name, label: personLabel(u), reason: 'Ném bóng nước trong giờ học', by: '', at: ctx.now });
        u.writeupDay = day;
        msg = '📛 Ném bóng nước trong giờ học: bị ghi tên vào sổ đầu bài! Mai bố mẹ không cho tiền ăn vặt.';
      }
    } else if (kind === 'diploma') {
      st.diploma = 1;
    } else throw new ApiError(400, 'Sự kiện không hợp lệ');
    await ctx.store.put('user', u.id, u);
    return { ok: true, msg, user: privateUser(u) };
  },

  async quests(ctx) {
    const u = await auth(ctx);
    const tiers = tierState(u);
    return {
      day: u.today.day,
      daily: DAILY_QUESTS.map((q) => ({ id: q.id, icon: q.icon, title: q.title, desc: q.desc, reward: q.reward, done: !!q.done(u.today), claimed: u.claimed.list.includes(q.id) })),
      bonus: { ...ALL_DAILY_BONUS, got: u.claimed.list.filter((x) => x !== 'all').length, claimed: u.claimed.list.includes('all') },
      tiers,
      achievements: ACHIEVEMENTS.map((a) => ({ id: a.id, tier: a.tier, title: a.title, desc: a.desc, reward: a.reward, n: a.n, progress: Math.min(a.n, statValue(u, a.stat)), claimed: u.achClaimed.includes(a.id), unlocked: tiers[a.tier].unlocked })),
      user: privateUser(u),
    };
  },

  async claim(ctx, b) {
    const u = await auth(ctx);
    const id = str(b.id, 20, true, 'nhiệm vụ');
    if (b.kind === 'daily') {
      if (u.claimed.list.includes(id)) throw new ApiError(400, 'Đã nhận thưởng rồi');
      if (id === 'all') {
        if (u.claimed.list.filter((x) => x !== 'all').length < ALL_DAILY_BONUS.need) throw new ApiError(400, 'Chưa đủ nhiệm vụ');
        credit(u, ALL_DAILY_BONUS.reward, `🏅 ${ALL_DAILY_BONUS.title}`, ctx.now);
      } else {
        const q = DAILY_QUESTS.find((x) => x.id === id);
        if (!q) throw new ApiError(404, 'Không có nhiệm vụ này');
        if (!q.done(u.today)) throw new ApiError(400, 'Chưa xong nhiệm vụ');
        credit(u, q.reward, `📜 Nhiệm vụ: ${q.title}`, ctx.now);
      }
      u.claimed.list.push(id);
    } else {
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (!a) throw new ApiError(404, 'Không có thành tựu này');
      if (u.achClaimed.includes(id)) throw new ApiError(400, 'Đã nhận rồi');
      if (!tierState(u)[a.tier].unlocked) throw new ApiError(400, 'Cấp này chưa mở');
      if (statValue(u, a.stat) < a.n) throw new ApiError(400, 'Chưa đạt thành tựu');
      u.achClaimed.push(id);
      credit(u, a.reward, `🏆 Thành tựu: ${a.title}`, ctx.now);
      u.points = (u.points || 0) + POINTS.ach;
    }
    await ctx.store.put('user', u.id, u);
    return { user: privateUser(u) };
  },

  async wallet(ctx) {
    const u = await auth(ctx);
    return { wallet: u.wallet || 0, streak: u.stats.streak, ledger: u.ledger, user: privateUser(u) };
  },

  // Chào cờ sáng thứ Hai (trước 12 giờ trưa, giờ Việt Nam), mỗi tuần một lần
  async flag(ctx) {
    const u = await auth(ctx);
    if (vnWeekday(ctx.now) !== 1 || vnMinutes(ctx.now) >= 12 * 60) throw new ApiError(400, 'Chào cờ vào sáng thứ Hai (trước 12 giờ trưa). Hẹn bạn thứ Hai nhé!');
    const week = vnDate(ctx.now);
    if (u.lastFlag === week) return { fresh: false, user: privateUser(u) };
    u.lastFlag = week; u.stats.flagWeeks++;
    credit(u, 10000, '🇻🇳 Có mặt chào cờ thứ Hai', ctx.now);
    await addPoints(ctx, u, 'flag');
    return { fresh: true, user: privateUser(u) };
  },

  // Tặng hoa tri ân thầy cô: mỗi người một bó mỗi ngày; đếm số bó cả trường trong ngày
  async flower(ctx, b) {
    const u = await auth(ctx);
    const day = vnDate(ctx.now);
    const key = 'flower|' + day;
    const c = (await ctx.store.get('counter', key)) || { n: 0 };
    if (u.today.flower) return { fresh: false, today: c.n, user: privateUser(u) };
    u.today.flower = true; u.stats.flowers++;
    c.n += 1;
    await ctx.store.put('counter', key, c);
    const to = str(b.to, 60);
    await ctx.store.put('flowerlog', `${String(ctx.now).padStart(15, '0')}-${randId(6)}`, { name: u.name, khoa: u.khoa, lop: u.lop, to, at: ctx.now });
    await addPoints(ctx, u, 'flower');
    return { fresh: true, today: c.n, user: privateUser(u) };
  },

  async flowers(ctx) {
    const c = (await ctx.store.get('counter', 'flower|' + vnDate(ctx.now))) || { n: 0 };
    const rows = await ctx.store.list('flowerlog', '', 12);
    return { today: c.n, recent: rows.map((r) => r.v) };
  },

  // Tỏ tình: gửi một trong các câu có sẵn, người nhận chọn 1 trong 3 câu trả lời
  async love(ctx, b) {
    const u = await auth(ctx);
    const to = await ctx.store.get('user', str(b.to, 20, true, 'người nhận'));
    if (!to || to.id === u.id) throw new ApiError(400, 'Không tìm thấy bạn này');
    const line = num(b.line, 0, LOVE_LINES.length - 1, 0) | 0;
    u.today.loves = (u.today.loves || 0) + 1;
    if (u.today.loves > 10) throw new ApiError(400, 'Hôm nay tỏ tình nhiều quá rồi, mai nhé!');
    const id = randId(10);
    await ctx.store.put('love', id, { id, from: u.id, fromName: u.name, to: to.id, toName: to.name, line, at: ctx.now });
    await sendInbox(ctx, to.id, { id, kind: 'love', from: u.id, fromName: u.name, line, at: ctx.now });
    await ctx.store.put('user', u.id, u);
    return { ok: true };
  },

  async loveReply(ctx, b) {
    const u = await auth(ctx);
    const rec = await ctx.store.get('love', str(b.id, 20, true, 'lời tỏ tình'));
    if (!rec || rec.to !== u.id || rec.ans !== undefined) throw new ApiError(400, 'Lời tỏ tình không còn');
    const ans = num(b.ans, 0, LOVE_REPLIES.length - 1, 1) | 0;
    rec.ans = ans;
    await ctx.store.put('love', rec.id, rec);
    if (ans === 0) {
      const from = await ctx.store.get('user', rec.from);
      if (from) { ensure(from, ctx.now); from.stats.loveYes++; await ctx.store.put('user', from.id, from); }
    }
    await sendInbox(ctx, rec.from, { id: rec.id + 'r', kind: 'loveReply', from: u.id, fromName: u.name, line: rec.line, ans, at: ctx.now });
    return { ok: true };
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
    const people = rows.map(({ v }) => ({ name: v.name, khoa: v.khoa, lop: v.lop, role: v.role, points: v.points || 0 }))
      .sort((a, c) => c.points - a.points).slice(0, 20);
    return {
      people,
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
