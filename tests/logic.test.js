import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, isBreakTime, periodOf } from '../public/js/logic.js';

function memStore() {
  const m = new Map();
  const key = (t, k) => t + '\u0000' + k;
  return {
    async get(t, k) { const v = m.get(key(t, k)); return v === undefined ? null : structuredClone(v); },
    async put(t, k, v) { m.set(key(t, k), structuredClone(v)); },
    async del(t, k) { m.delete(key(t, k)); },
    async list(t, prefix, limit = 500) {
      const head = key(t, prefix);
      return [...m.keys()].filter((k) => k.startsWith(head)).sort().reverse().slice(0, limit)
        .map((k) => ({ k: k.slice(t.length + 1), v: structuredClone(m.get(k)) }));
    },
  };
}

async function call(store, action, body, token = '', now = Date.now()) {
  return handle(action, { store, token, now }, body);
}

test('đăng ký, khôi phục, điểm danh, mua đồ', async () => {
  const s = memStore();
  const r = await call(s, 'register', { name: 'Minh Anh', role: 'cuuhs', khoa: '20', lop: 'Toán' });
  assert.equal(r.status, 200);
  const { token, user } = r.body;
  assert.equal(user.khoa, 'K20');
  assert.match(user.code, /^CTN-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  const rec = await call(s, 'recover', { code: user.code.toLowerCase() });
  assert.equal(rec.body.token, token);

  const noMoney = await call(s, 'buy', { item: 'banhmi' }, token);
  assert.equal(noMoney.status, 400);

  const c1 = await call(s, 'checkin', {}, token);
  assert.equal(c1.body.user.wallet, 20000);
  const c2 = await call(s, 'checkin', {}, token);
  assert.equal(c2.body.already, true);
  assert.equal(c2.body.user.wallet, 20000);

  // 03:00 UTC = 10:00 giờ VN, không phải giờ ra chơi
  const now = Date.UTC(2026, 0, 5, 3, 0);
  const b = await call(s, 'buy', { item: 'banhmi', forName: 'Hùng' }, token, now);
  assert.equal(b.body.user.wallet, 5000);
});

test('giờ ra chơi giảm 20%', () => {
  assert.equal(isBreakTime(Date.UTC(2026, 0, 5, 2, 30)), true); // 9:30 VN
  assert.equal(isBreakTime(Date.UTC(2026, 0, 5, 9, 0)), true); // 16:00 VN
  assert.equal(isBreakTime(Date.UTC(2026, 0, 5, 2, 50)), false);
  assert.equal(periodOf(Date.UTC(2026, 0, 5, 7, 3)).label, 'Tiết 1 chiều'); // 14:03 VN
});

test('thiếu lớp chuyên / khóa sai bị từ chối', async () => {
  const s = memStore();
  assert.equal((await call(s, 'register', { name: 'A', role: 'hs', khoa: 'K30' })).status, 400);
  assert.equal((await call(s, 'register', { name: 'A', role: 'hs', khoa: 'abc', lop: 'Tin' })).status, 400);
  assert.equal((await call(s, 'register', { name: 'Cô Lan', role: 'gv' })).status, 200);
  const em = await call(s, 'register', { name: 'Bé Na', role: 'em', school: 'THCS Nha Trang' });
  assert.equal(em.status, 200);
  assert.equal(em.body.user.lop, '');
});

test('lưu bút, sổ đầu bài, bảng thi đua', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'cuuhs', khoa: 'K15', lop: 'Lý' })).body;
  const b = (await call(s, 'register', { name: 'Bình', role: 'cuuhs', khoa: 'K16', lop: 'Lý' })).body;
  const room = 'lop:Lý:K15';
  assert.equal((await call(s, 'sign', { room, body: '' }, a.token)).status, 400);
  await call(s, 'sign', { room, body: 'Nhớ lớp quá!' }, a.token, 1000);
  await call(s, 'sign', { room, body: 'Họp lớp nhé' }, a.token, 2000);
  const gb = (await call(s, 'guestbook', { room })).body.items;
  assert.deepEqual(gb.map((x) => x.body), ['Họp lớp nhé', 'Nhớ lớp quá!']);
  const roster = (await call(s, 'roster', { room })).body.items;
  assert.equal(roster.length, 1);
  await call(s, 'checkin', {}, b.token);
  const board = (await call(s, 'khoaBoard', {})).body;
  assert.equal(board.khoa[0].khoa, 'K15');
  assert.equal(board.khoa[0].points, 10);
  assert.equal(board.lop[0].lop, 'Lý');
  assert.equal(board.lop[0].points, 12);
});

test('presence trả về người khác, bỏ người đã rời đi', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'gv' })).body;
  const b = (await call(s, 'register', { name: 'Bình', role: 'gv' })).body;
  await call(s, 'presence', { x: 10, y: 20, say: 'Chào' }, a.token, 1000);
  const r = (await call(s, 'presence', { x: 50, y: 60 }, b.token, 2000)).body;
  assert.equal(r.others.length, 1);
  assert.equal(r.others[0].name, 'An');
  assert.equal(r.others[0].say, 'Chào');
  assert.equal((await call(s, 'online', {}, '', 2500)).body.others.length, 2);
  await call(s, 'presence', { x: 10, y: 20, throw: { x: 50, y: 60, target: b.user.id } }, a.token, 3000);
  const seen = (await call(s, 'presence', { x: 50, y: 60 }, b.token, 4000)).body.others[0];
  assert.deepEqual(seen.throw, { x: 50, y: 60, target: b.user.id, at: 3000 });
  await call(s, 'presence', { x: 10, y: 20 }, a.token, 5000);
  assert.equal((await call(s, 'presence', { x: 50, y: 60 }, b.token, 5500)).body.others[0].throw.at, 3000);
  await call(s, 'presence', { x: 10, y: 20 }, a.token, 10000);
  assert.equal((await call(s, 'presence', { x: 50, y: 60 }, b.token, 10500)).body.others[0].throw, undefined);
  const later = (await call(s, 'presence', { x: 50, y: 60 }, b.token, 60000)).body;
  assert.equal(later.others.length, 0);
});

test('họp lớp: tạo, đăng ký, huỷ', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'cuuhs', khoa: 'K20', lop: 'Hóa' })).body;
  const b = (await call(s, 'register', { name: 'Bình', role: 'cuuhs', khoa: 'K20', lop: 'Hóa' })).body;
  assert.equal((await call(s, 'createEvent', { title: 'Họp lớp', date: '20-11-2026' }, a.token)).status, 400);
  const ev = (await call(s, 'createEvent', { title: 'Họp lớp 10 năm', date: '2026-12-20', place: 'TP Thái Nguyên' }, a.token)).body.item;
  assert.equal(ev.joins.length, 1);
  assert.equal((await call(s, 'joinEvent', { id: ev.id }, b.token)).body.item.joins.length, 2);
  assert.equal((await call(s, 'joinEvent', { id: ev.id }, b.token)).body.joined, false);
  assert.equal((await call(s, 'events', {})).body.items.length, 1);
});

test('đố vui giới hạn 10 điểm/ngày, chức năng lạ trả 404, chưa đăng nhập 401', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'hs', khoa: 'K40', lop: 'Tin' })).body;
  const now = Date.UTC(2026, 5, 1, 5);
  assert.equal((await call(s, 'quiz', { correct: 3 }, a.token, now)).body.award, 3);
  for (let i = 0; i < 3; i++) await call(s, 'quiz', { correct: 3 }, a.token, now);
  assert.equal((await call(s, 'quiz', { correct: 3 }, a.token, now)).body.award, 0);
  assert.equal((await call(s, 'hack', {})).status, 404);
  assert.equal((await call(s, 'toString', {})).status, 404);
  assert.equal((await call(s, 'me', {})).status, 401);
});

test('album kỷ yếu: đăng, giới hạn 5 ảnh/ngày, xem ảnh lớn', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'cuuhs', khoa: 'K20', lop: 'Toán' })).body;
  const img = 'data:image/jpeg;base64,' + 'A'.repeat(100);
  assert.equal((await call(s, 'albumPost', { full: 'data:image/png;base64,AA', thumb: img }, a.token)).status, 400);
  assert.equal((await call(s, 'albumPost', { full: img, thumb: img }, '')).status, 401);
  const now = Date.UTC(2026, 5, 1, 5);
  const r = await call(s, 'albumPost', { full: img, thumb: img, caption: 'Họp lớp', people: ['An', 'Bình'] }, a.token, now);
  assert.equal(r.status, 200);
  for (let i = 1; i < 5; i++) assert.equal((await call(s, 'albumPost', { full: img, thumb: img }, a.token, now + i)).status, 200);
  assert.equal((await call(s, 'albumPost', { full: img, thumb: img }, a.token, now + 9)).status, 400);
  const al = (await call(s, 'album', {})).body.items;
  assert.equal(al.length, 5);
  assert.equal(al[4].caption, 'Họp lớp');
  assert.deepEqual(al[4].people, ['An', 'Bình']);
  assert.equal(al[0].full, undefined);
  assert.equal((await call(s, 'photo', { id: r.body.item.id })).body.full, img);
});

test('presence mang cảnh (sân/lớp) và trạng thái ngồi', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'gv' })).body;
  const b = (await call(s, 'register', { name: 'Bình', role: 'gv' })).body;
  await call(s, 'presence', { x: 100, y: 300, scene: 'lop:Toán', sit: true, sitBack: true, dir: -1 }, a.token, 1000);
  const o = (await call(s, 'presence', { x: 1, y: 1 }, b.token, 1500)).body.others[0];
  assert.equal(o.scene, 'lop:Toán');
  assert.equal(o.sit, true);
  assert.equal(o.sitBack, true);
  assert.equal(o.dir, -1);
  await call(s, 'presence', { x: 100, y: 300 }, a.token, 2000);
  const o2 = (await call(s, 'presence', { x: 1, y: 1 }, b.token, 2500)).body.others[0];
  assert.equal(o2.scene, 'campus');
  assert.equal(o2.sit, false);
});

test('điểm danh: chuỗi ngày, phương tiện, thưởng 5 ngày liền, lịch sử ví', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'cuuhs', khoa: 'K20', lop: 'Toán' })).body;
  const day0 = Date.UTC(2026, 5, 1, 3); // 10h sáng VN
  let r;
  for (let i = 0; i < 5; i++) r = (await call(s, 'checkin', { transport: 'bus' }, a.token, day0 + i * 86400e3)).body;
  assert.equal(r.streak, 5);
  assert.equal(r.bonus, 10000);
  assert.equal(r.transport, 'bus');
  assert.equal(r.user.wallet, 5 * 20000 + 10000);
  const w = (await call(s, 'wallet', {}, a.token, day0 + 4 * 86400e3)).body;
  assert.equal(w.ledger[0].amount, 10000);
  assert.match(w.ledger[0].text, /đi học đều 5 ngày/);
  // nghỉ một ngày thì chuỗi về 1
  r = (await call(s, 'checkin', {}, a.token, day0 + 7 * 86400e3)).body;
  assert.equal(r.streak, 1);
});

test('nhiệm vụ ngày và thành tựu: làm, nhận thưởng, không nhận hai lần', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'cuuhs', khoa: 'K20', lop: 'Toán' })).body;
  const now = Date.UTC(2026, 5, 1, 3);
  await call(s, 'checkin', {}, a.token, now);
  await call(s, 'sign', { room: 'lop:Toán:K20', body: 'Nhớ lớp' }, a.token, now);
  assert.equal((await call(s, 'act', { kind: 'classSit', value: 'Văn' }, a.token, now)).body.ok, false);
  const sit = (await call(s, 'act', { kind: 'classSit', value: 'Toán' }, a.token, now)).body;
  assert.match(sit.msg, /điểm danh có mặt/);
  for (const z of ['san', 'D4', 'CT']) await call(s, 'act', { kind: 'zone', value: z }, a.token, now);
  const q = (await call(s, 'quests', {}, a.token, now)).body;
  const done = q.daily.filter((x) => x.done).map((x) => x.id).sort();
  assert.deepEqual(done, ['checkin', 'class', 'gb', 'zones']);
  assert.ok(q.user.badge >= 4);
  const before = q.user.wallet;
  const c = (await call(s, 'claim', { kind: 'daily', id: 'gb' }, a.token, now)).body;
  assert.equal(c.user.wallet, before + 5000);
  assert.equal((await call(s, 'claim', { kind: 'daily', id: 'gb' }, a.token, now)).status, 400);
  assert.equal((await call(s, 'claim', { kind: 'daily', id: 'buy' }, a.token, now)).status, 400);
  // thành tựu cấp 1 mở sẵn; cấp 2 còn khoá
  assert.equal((await call(s, 'claim', { kind: 'ach', id: 'gb1' }, a.token, now)).status, 200);
  assert.equal((await call(s, 'claim', { kind: 'ach', id: 'checkin7' }, a.token, now)).status, 400);
  // sang ngày mới (sau 5 giờ sáng) nhiệm vụ làm lại từ đầu
  const q2 = (await call(s, 'quests', {}, a.token, now + 86400e3)).body;
  assert.equal(q2.daily.filter((x) => x.done).length, 0);
});

test('đãi bạn và tỏ tình đi qua hộp thư', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'cuuhs', khoa: 'K20', lop: 'Toán' })).body;
  const b = (await call(s, 'register', { name: 'Bình', role: 'cuuhs', khoa: 'K20', lop: 'Toán' })).body;
  const now = Date.UTC(2026, 5, 1, 3);
  await call(s, 'checkin', {}, a.token, now);
  const buy = await call(s, 'buy', { item: 'trada', forUid: b.user.id }, a.token, now);
  assert.equal(buy.status, 200);
  assert.equal(buy.body.item.forName, 'Bình');
  await call(s, 'love', { to: b.user.id, line: 2 }, a.token, now + 1);
  const inbox = (await call(s, 'presence', { x: 1, y: 1 }, b.token, now + 2)).body.inbox;
  assert.deepEqual(inbox.map((x) => x.kind), ['gift', 'love']);
  assert.equal(inbox[0].fromName, 'An');
  assert.equal((await call(s, 'presence', { x: 1, y: 1 }, b.token, now + 3)).body.inbox.length, 0);
  assert.equal((await call(s, 'loveReply', { id: inbox[1].id, ans: 0 }, b.token, now + 4)).status, 200);
  assert.equal((await call(s, 'loveReply', { id: inbox[1].id, ans: 0 }, b.token, now + 5)).status, 400);
  const back = (await call(s, 'presence', { x: 1, y: 1 }, a.token, now + 6)).body.inbox;
  assert.equal(back[0].kind, 'loveReply');
  assert.equal(back[0].ans, 0);
  const q = (await call(s, 'quests', {}, a.token, now + 7)).body;
  assert.equal(q.achievements.find((x) => x.id === 'love1').progress, 1);
  assert.equal(q.daily.find((x) => x.id === 'treat').done, true);
});

test('chào cờ chỉ sáng thứ Hai, tặng hoa mỗi ngày một bó', async () => {
  const s = memStore();
  const a = (await call(s, 'register', { name: 'An', role: 'gv' })).body;
  const b = (await call(s, 'register', { name: 'Bình', role: 'gv' })).body;
  const monday = Date.UTC(2026, 10, 23, 1); // 8h sáng thứ Hai 23/11/2026 giờ VN
  const tuesday = monday + 86400e3;
  assert.equal((await call(s, 'flag', {}, a.token, tuesday)).status, 400);
  assert.equal((await call(s, 'flag', {}, a.token, monday)).body.fresh, true);
  assert.equal((await call(s, 'flag', {}, a.token, monday + 60e3)).body.fresh, false);
  assert.equal((await call(s, 'flower', { to: 'Cô Lan' }, a.token, monday)).body.today, 1);
  assert.equal((await call(s, 'flower', {}, a.token, monday + 1)).body.fresh, false);
  assert.equal((await call(s, 'flower', {}, b.token, monday + 2)).body.today, 2);
  const f = (await call(s, 'flowers', {}, '', monday + 3)).body;
  assert.equal(f.today, 2);
  assert.equal(f.recent[f.recent.length - 1].to, 'Cô Lan');
});
