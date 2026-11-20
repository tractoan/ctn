import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, isBreakTime } from '../public/js/logic.js';

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
  assert.equal(isBreakTime(Date.UTC(2026, 0, 5, 2, 20)), true); // 9:20 VN
  assert.equal(isBreakTime(Date.UTC(2026, 0, 5, 2, 40)), false);
});

test('thiếu lớp chuyên / khóa sai bị từ chối', async () => {
  const s = memStore();
  assert.equal((await call(s, 'register', { name: 'A', role: 'hs', khoa: 'K30' })).status, 400);
  assert.equal((await call(s, 'register', { name: 'A', role: 'hs', khoa: 'abc', lop: 'Tin' })).status, 400);
  assert.equal((await call(s, 'register', { name: 'Cô Lan', role: 'gv' })).status, 200);
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
