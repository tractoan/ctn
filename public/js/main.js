import { api, getToken, setToken, getMode } from './api.js';
import { LOPS, ROLES, BREAK_TEXT, periodOf, vnClock } from './logic.js';
import { World } from './world.js';
import { SPAWN, HOTSPOTS, PLACES } from './campus.js';
import { avatarCanvas, SKINS, HAIR_COLORS, HAIR_NAMES, BAG_COLORS } from './avatar.js';
import { h, openSheet, closeSheet, toast, money, ago, tabs } from './ui.js';
import { startDaCau, QUIZ } from './games.js';

const app = document.getElementById('app');
// Khách chưa ghi danh vẫn dạo được sân trường, chỉ không viết/mua/điểm danh được.
const GUEST = { guest: true, id: '', name: 'Khách', role: 'khach', khoa: '', lop: '', school: '', wallet: 0, points: 0, code: '', look: { gender: 'nam', skin: 1, hair: 0, hairColor: 0, bottom: 'quan', bag: 3 } };
let me = GUEST;
let world = null;

const ROLE_INFO = {
  cuuhs: { icon: '🎓', sub: 'Đã ra trường' },
  hs: { icon: '📚', sub: 'Đang học tại trường' },
  gv: { icon: '👩‍🏫', sub: 'Đang hoặc đã công tác tại trường' },
  khach: { icon: '🤝', sub: 'Học sinh THPT khác tới chơi' },
  em: { icon: '🌟', sub: 'Học sinh THCS tới tham quan' },
};
const QUICK = ['Xin chào! 👋', 'Lâu quá không gặp!', 'Bạn khóa nào đấy?', 'Trường mình đẹp quá!', 'Ra căng tin không?', 'Em chào thầy cô ạ!', 'Hẹn gặp ở họp lớp nhé!', 'Đá cầu không?'];
const EMOJI = ['😂', '❤️', '👍'];
const ZONES = { A: 'Nhà A · Hiệu bộ', B: 'Nhà B', C: 'Nhà C', D: 'Nhà D', DN: 'Nhà đa năng', CT: 'Căng tin', KTX: 'Ký túc xá', XE1: 'Nhà xe', XE2: 'Nhà xe', BV: 'Cổng trường', san: 'Sân trường', duong: 'Đường Lương Ngọc Quyến' };

const POS_KEY = 'ctn.pos';
function savePos() { try { if (world?.me) localStorage.setItem(POS_KEY, JSON.stringify({ x: world.me.x, y: world.me.y })); } catch { /* */ } }
function loadPos() { try { const p = JSON.parse(localStorage.getItem(POS_KEY)); if (p && p.x > 0 && p.y > 0 && p.y < 1700) return p; } catch { /* */ } return { x: SPAWN.x + Math.round((Math.random() - 0.5) * 160), y: SPAWN.y + Math.round((Math.random() - 0.5) * 20) }; }
function sessionGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* */ } }

function describe(u) {
  if (u.role === 'gv') return 'Thầy cô';
  if (u.role === 'em') return 'Em cấp 2';
  if (u.role === 'khach') return u.school || 'Bạn trường khác';
  return `${u.lop || ''} ${u.khoa || ''}`.trim();
}

// Gọi API; nếu chức năng cần ghi danh thì mời ghi danh.
async function call(action, body) {
  try { return await api(action, body); }
  catch (e) {
    if (e.status === 401) { closeSheet(); toast('Ghi danh để dùng chức năng này nhé!'); setTimeout(() => createFlow(), 350); }
    throw e;
  }
}
function needMe() {
  if (!me.guest) return true;
  createFlow();
  return false;
}

// ======================= Khởi động =======================
async function boot() {
  if (getToken()) {
    try { me = (await api('me')).user; } catch (e) { if (e.status === 401) setToken(''); }
  }
  enterSchool();
  if (me.guest && !sessionGet('ctn.skipWelcome')) createFlow();
}

// ======================= Ghi danh / tạo nhân vật =======================
function recoverFlow() {
  openSheet('Tôi đã có nhân vật', (b) => {
    const inp = h('input', { class: 'input', placeholder: 'CTN-XXXX-XXXX', autocapitalize: 'characters', 'aria-label': 'Mã khôi phục' });
    const err = h('p', { class: 'err' });
    b.append(
      h('p', {}, 'Nhập mã khôi phục bạn đã lưu khi tạo nhân vật.'), inp, err,
      h('button', { class: 'btn primary', onclick: async () => {
        try { const r = await api('recover', { code: inp.value }); setToken(r.token); setMe(r.user); closeSheet(); toast(`Chào mừng ${me.name} trở lại!`); }
        catch (e) { err.textContent = e.message; }
      } }, 'Vào trường'),
      h('button', { class: 'btn ghost', onclick: () => createFlow() }, '← Quay lại'));
    setTimeout(() => inp.focus(), 50);
  });
}

function setMe(u) {
  me = u;
  if (world) { world.me.look = me.look; world.me.name = me.name; world.me.sub = world.subOf(me); }
  hud.update();
}

function createFlow() {
  const draft = { role: 'cuuhs', name: '', khoa: '', lop: 'Toán', school: '', look: { gender: 'nam', skin: 1, hair: 0, hairColor: 0, bottom: 'quan', bag: 0 } };
  openSheet('', (b, { setTitle }) => {
    const step1 = () => {
      setTitle('');
      const trio = h('div', { class: 'trio' },
        avatarCanvas({ gender: 'nu', hair: 2, hairColor: 0, bottom: 'vay', skin: 0, bag: 0 }, 64),
        avatarCanvas({ gender: 'nam', hair: 0, hairColor: 1, bottom: 'quan', skin: 2, bag: 1 }, 64),
        avatarCanvas({ gender: 'nu', hair: 3, hairColor: 0, bottom: 'vay', skin: 1, bag: 2 }, 64));
      b.replaceChildren(h('div', { class: 'welcome-in' },
        trio,
        h('h1', { class: 'welcome-title' }, 'Chào mừng bạn về Trường THPT Chuyên Thái Nguyên!'),
        h('p', { class: 'lead' }, 'Tạo nhân vật một lần, lần sau vào vẫn là bạn. Bạn là ai?'),
        h('div', { class: 'role-list' },
          ...Object.entries(ROLES).map(([k, v]) => h('button', { class: 'role', onclick: () => { draft.role = k; step2(); } },
            h('span', { class: 'role-ico' }, ROLE_INFO[k].icon), h('span', {}, h('b', {}, v), h('small', {}, ROLE_INFO[k].sub))))),
        h('button', { class: 'btn link', onclick: () => recoverFlow() }, 'Tôi đã có nhân vật'),
        h('button', { class: 'btn link muted', onclick: () => { sessionSet('ctn.skipWelcome', '1'); closeSheet(); toast('Chạm vào sân để đi bộ. Bấm 🗺️ để xem bản đồ trường.'); } }, 'Vào xem với tư cách khách')));
    };
    const step2 = () => {
      setTitle(ROLES[draft.role]);
      const err = h('p', { class: 'err' });
      const name = h('input', { class: 'input', placeholder: 'Tên hiển thị (vd: Minh Anh)', maxlength: 40, value: draft.name, 'aria-label': 'Tên' });
      const needClass = draft.role === 'cuuhs' || draft.role === 'hs';
      const khoa = h('input', { class: 'input', placeholder: 'Khóa (vd: K20)', maxlength: 4, value: draft.khoa, 'aria-label': 'Khóa' });
      const lop = h('select', { class: 'input', 'aria-label': 'Lớp chuyên' }, ...LOPS.map((l) => h('option', { value: l, selected: draft.lop === l }, 'Chuyên ' + l)));
      const school = h('input', { class: 'input', placeholder: draft.role === 'em' ? 'Trường THCS của em (không bắt buộc)' : 'Trường của bạn (không bắt buộc)', maxlength: 60, value: draft.school, 'aria-label': 'Trường' });
      b.replaceChildren(h('div', {},
        h('label', { class: 'lbl' }, 'Tên'), name,
        needClass ? h('div', { class: 'row2' }, h('div', {}, h('label', { class: 'lbl' }, 'Khóa'), khoa), h('div', {}, h('label', { class: 'lbl' }, 'Lớp'), lop)) : null,
        draft.role === 'khach' || draft.role === 'em' ? h('div', {}, h('label', { class: 'lbl' }, 'Trường'), school) : null,
        err,
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn ghost', onclick: step1 }, '← Quay lại'),
          h('button', { class: 'btn primary', onclick: () => {
            draft.name = name.value.trim(); draft.khoa = khoa.value.trim(); draft.lop = lop.value; draft.school = school.value;
            if (!draft.name) { err.textContent = 'Nhập tên của bạn'; return; }
            if (needClass && !/^k?\d{1,2}$/i.test(draft.khoa)) { err.textContent = 'Khóa dạng K1, K2… (số khóa của bạn)'; return; }
            step3();
          } }, 'Tiếp →'))));
      setTimeout(() => name.focus(), 50);
    };
    const step3 = () => {
      setTitle('Mặc đồng phục');
      const err = h('p', { class: 'err' });
      b.replaceChildren(avatarEditor(draft.look), err,
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn ghost', onclick: step2 }, '← Quay lại'),
          h('button', { class: 'btn primary', onclick: async (e) => {
            e.target.disabled = true;
            try { const r = await api('register', draft); setToken(r.token); setMe(r.user); step4(); }
            catch (ex) { err.textContent = ex.message; e.target.disabled = false; }
          } }, 'Vào trường!')));
    };
    const step4 = () => {
      setTitle('Lưu mã khôi phục');
      b.replaceChildren(
        h('p', {}, 'Đây là mã để lần sau (kể cả khi đổi máy) bạn vẫn là nhân vật này. Hãy chụp màn hình hoặc sao chép lại:'),
        h('div', { class: 'code-box' }, me.code),
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn ghost', onclick: () => { navigator.clipboard?.writeText(me.code).then(() => toast('Đã sao chép mã')); } }, 'Sao chép'),
          h('button', { class: 'btn primary', onclick: () => { closeSheet(); toast(`Chào ${me.name}! Chạm vào sân để đi, chạm nhãn để vào lớp, căng tin…`); } }, 'Đã lưu, vào sân trường')));
    };
    step1();
  });
}

function avatarEditor(look, onChange = () => {}) {
  const preview = h('div', { class: 'avatar-preview' });
  const redraw = () => { preview.replaceChildren(avatarCanvas(look, 120)); onChange(look); };
  const row = (title, opts, key) => h('div', { class: 'opt-row' },
    h('span', { class: 'lbl' }, title),
    h('div', { class: 'opts' }, ...opts.map(([val, content, isColor]) => {
      const btn = h('button', { class: 'opt' + (look[key] === val ? ' on' : ''), 'aria-label': title + ' ' + (isColor ? val : content), style: isColor ? { background: content } : null, onclick: () => {
        look[key] = val; btn.parentNode.querySelectorAll('.opt').forEach((x) => x.classList.remove('on')); btn.classList.add('on'); redraw();
      } }, isColor ? '' : content);
      return btn;
    })));
  const el = h('div', { class: 'editor' }, preview,
    h('div', { class: 'opt-list' },
      row('Dáng', [['nam', 'Nam'], ['nu', 'Nữ']], 'gender'),
      row('Đồng phục', [['quan', 'Quần âu'], ['vay', 'Chân váy']], 'bottom'),
      row('Kiểu tóc', HAIR_NAMES.map((n, i) => [i, n]), 'hair'),
      row('Màu tóc', HAIR_COLORS.map((c, i) => [i, c, true]), 'hairColor'),
      row('Màu da', SKINS.map((c, i) => [i, c, true]), 'skin'),
      row('Cặp sách', BAG_COLORS.map((c, i) => [i, c, true]), 'bag'),
    ));
  redraw();
  return el;
}

// ======================= Sân trường =======================
const hud = { update() {} };

function enterSchool() {
  const canvas = h('canvas', { id: 'world', 'aria-label': 'Sơ đồ sân trường. Chạm để di chuyển, chạm nhãn để mở.' });
  const zoneEl = h('b', {}, 'Sân trường');
  const clockEl = h('small', {});
  const online = h('span', { class: 'online-pill', title: 'Đang online' }, h('i', {}), h('span', {}, '1'));
  const right = h('div', { class: 'hud-right' });
  const chatInput = h('input', { class: 'chat-input', maxlength: 80, 'aria-label': 'Trò chuyện' });
  const sendBtn = h('button', { class: 'chat-send', 'aria-label': 'Gửi' }, '➤');

  const updateClock = () => { const now = Date.now(); clockEl.replaceChildren(h('span', { class: 'clock' }, vnClock(now)), ' · ' + periodOf(now).label); };
  hud.update = () => {
    right.replaceChildren(...[online,
      getMode() === 'offline' ? h('span', { class: 'chip warn', title: 'Dữ liệu chỉ lưu trên máy này' }, 'Ngoại tuyến') : null,
      me.guest
        ? h('button', { class: 'hud-btn', onclick: () => createFlow() }, 'Ghi danh')
        : [h('span', { class: 'chip' }, '💰 ' + money(me.wallet)), h('button', { class: 'hud-avatar', 'aria-label': 'Nhân vật của tôi', onclick: () => moreSheet() }, avatarCanvas(me.look, 34))]].flat().filter(Boolean));
    chatInput.placeholder = me.guest ? 'Ghi danh để trò chuyện tự do' : 'Nhắn gì đó…';
  };

  const send = (t) => {
    t = (t || '').trim();
    if (!t) return;
    if (me.guest && !QUICK.includes(t) && !EMOJI.includes(t)) { createFlow(); return; }
    sayPrompt.send(t);
    chatInput.value = '';
  };
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(chatInput.value); });
  chatInput.addEventListener('focus', () => { if (me.guest) { chatInput.blur(); createFlow(); } });
  sendBtn.onclick = () => send(chatInput.value);

  app.replaceChildren(
    canvas,
    h('header', { class: 'hud' },
      h('div', { class: 'brand' }, h('span', { class: 'crest sm' }, 'CTN'), h('div', {}, zoneEl, clockEl)),
      right),
    h('div', { class: 'fabs' },
      h('button', { class: 'fab', 'aria-label': 'Phóng to', onclick: () => world.zoomBy(1.2) }, '+'),
      h('button', { class: 'fab', 'aria-label': 'Thu nhỏ', onclick: () => world.zoomBy(1 / 1.2) }, '−')),
    h('footer', { class: 'chatbar' },
      h('div', { class: 'quick-row' },
        ...QUICK.map((q) => h('button', { class: 'pill', onclick: () => send(q) }, q)),
        ...EMOJI.map((q) => h('button', { class: 'pill emoji', 'aria-label': q, onclick: () => send(q) }, q))),
      h('div', { class: 'chat-row' },
        h('button', { class: 'map-btn', 'aria-label': 'Bản đồ trường', onclick: () => mapSheet() }, '🗺️'),
        chatInput, sendBtn)),
  );

  world = new World(canvas);
  world.setMe({ ...loadPos(), look: me.look, name: me.name, sub: '' });
  world.me.sub = world.subOf(me);
  world.npcs = makeNpcs();
  world.onArrive = (hs) => openHotspot(hs);
  world.onTapPlayer = (p) => playerCard(p);
  world.start();
  hud.update();
  updateClock();
  setInterval(updateClock, 15000);

  let lastZone = '';
  let pendingSay = null;
  sayPrompt.send = (t) => { pendingSay = t; world.say('me', t); };
  const tick = async () => {
    const pos = { x: Math.round(world.me.x), y: Math.round(world.me.y) };
    const zone = world.zoneOf(pos.x, pos.y);
    if (zone !== lastZone) { lastZone = zone; zoneEl.textContent = ZONES[zone] || 'Sân trường'; }
    try {
      let r;
      if (me.guest) r = await api('online');
      else {
        const body = { ...pos, zone };
        if (pendingSay) { body.say = pendingSay; pendingSay = null; }
        r = await api('presence', body);
      }
      world.updateOthers(r.others);
      online.lastChild.textContent = String(r.others.length + (me.guest ? 0 : 1));
      if (!tick.done) { tick.done = true; hud.update(); }
    } catch { /* thử lại lượt sau */ }
    savePos();
  };
  tick();
  setInterval(tick, 2500);
  setInterval(() => { const z = world.zoneOf(world.me.x, world.me.y); if (z !== lastZone) { lastZone = z; zoneEl.textContent = ZONES[z] || 'Sân trường'; } }, 400);
  window.addEventListener('beforeunload', savePos);
}

function makeNpcs() {
  const guard = { tag: false, name: 'Bác bảo vệ', sub: 'Cổng trường', x: 1080, y: 1345, look: { gender: 'nam', skin: 2, hair: 4, hairColor: 4, bottom: 'quan', bag: 0 }, dir: -1, moving: false };
  const cook = { name: 'Cô căng tin', sub: 'Căng tin', x: 250, y: 790, look: { gender: 'nu', skin: 1, hair: 2, hairColor: 1, bottom: 'vay', bag: 3 }, dir: 1, moving: false };
  cook.update = (dt, now) => { const nx = 200 + Math.sin(now / 3000) * 60; cook.moving = Math.abs(nx - cook.x) > 0.05; cook.dir = nx > cook.x ? 1 : -1; cook.x = nx; };
  return [guard, cook];
}

function mapSheet() {
  openSheet('Bản đồ trường', (b, { onCleanup }) => {
    const cv = h('canvas', { class: 'overview' });
    b.append(h('p', { class: 'muted' }, 'Chạm vào chỗ muốn tới, nhân vật sẽ tự đi bộ tới.'), cv,
      h('h3', {}, 'Các lớp chuyên'),
      h('div', { class: 'place-list small' }, ...HOTSPOTS.filter((x) => x.panel === 'class').map((p) => h('button', { class: 'place', onclick: () => { closeSheet(); world.goToHotspot(p); } }, h('span', {}, '🚪'), p.label))));
    let pick = null;
    const draw = () => { pick = world.drawOverview(cv, PLACES); };
    requestAnimationFrame(draw);
    const t = setInterval(draw, 1500);
    onCleanup(() => clearInterval(t));
    cv.addEventListener('click', (e) => {
      if (!pick) return;
      const r = cv.getBoundingClientRect();
      const res = pick(e.clientX - r.left, e.clientY - r.top);
      closeSheet();
      if (res.hotspot) world.goToHotspot(res.hotspot); else world.walkTo(res.x, res.y);
    });
  }, { wide: true });
}

function sayPrompt() {}

function moreSheet() {
  openSheet('Nhân vật của tôi', (b) => {
    b.append(h('div', {},
      h('div', { class: 'me-card' }, avatarCanvas(me.look, 72), h('div', {}, h('b', {}, me.name), h('div', { class: 'muted' }, ROLES[me.role] + (describe(me) ? ' · ' + describe(me) : '')), h('div', { class: 'muted' }, '⭐ ' + me.points + ' điểm thi đua · 💰 ' + money(me.wallet)))),
      h('label', { class: 'lbl' }, 'Mã khôi phục'), h('div', { class: 'code-box sm' }, me.code),
      getMode() === 'offline' ? h('p', { class: 'note' }, 'Đang ở chế độ ngoại tuyến: dữ liệu chỉ lưu trên trình duyệt này, không thấy bạn bè online. Triển khai lên Cloudflare (xem README) để dùng chung.') : null,
      h('div', { class: 'stack' },
        h('button', { class: 'btn primary', onclick: () => panels.mirror() }, '👕 Đổi kiểu tóc, đồng phục'),
        h('a', { class: 'btn ghost', href: '/pages/gioi-thieu.html' }, 'Giới thiệu trang'),
        h('button', { class: 'btn ghost', onclick: () => { world.teleport(SPAWN.x, SPAWN.y); closeSheet(); } }, 'Về cổng trường'),
        h('button', { class: 'btn danger', onclick: () => { if (confirm('Thoát nhân vật trên máy này? Hãy chắc chắn bạn đã lưu mã khôi phục.')) { setToken(''); location.reload(); } } }, 'Thoát nhân vật'))));
  });
}

function playerCard(p) {
  openSheet(p.name, (b) => {
    b.append(h('div', { class: 'me-card' }, avatarCanvas(p.look, 72), h('div', {}, h('b', {}, p.name), h('div', { class: 'muted' }, ROLES[p.role] + (describe(p) ? ' · ' + describe(p) : '')))),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', onclick: () => { if (!needMe()) return; sayPrompt.send(`👋 Chào ${p.name}!`); closeSheet(); } }, '👋 Vẫy tay'),
        h('button', { class: 'btn primary', onclick: () => { closeSheet(); world.walkTo(p.x + 30, p.y); } }, 'Đi tới')));
  });
}

// ======================= Bảng chức năng theo địa điểm =======================
function openHotspot(hs) {
  const fn = panels[hs.panel];
  if (fn) fn(hs);
}

function guestbook(container, room, { placeholder = 'Viết lưu bút…', empty = 'Chưa có ai viết. Hãy là người đầu tiên!' } = {}) {
  const list = h('div', { class: 'gb-list' }, h('p', { class: 'muted' }, 'Đang tải…'));
  const ta = h('textarea', { class: 'input', rows: 3, maxlength: 600, placeholder, 'aria-label': 'Nội dung' });
  const err = h('p', { class: 'err' });
  const load = async () => {
    try {
      const { items } = await call('guestbook', { room });
      list.replaceChildren(...(items.length ? items.map(gbItem) : [h('p', { class: 'muted' }, empty)]));
    } catch (e) { list.replaceChildren(h('p', { class: 'err' }, e.message)); }
  };
  const btn = h('button', { class: 'btn primary', onclick: async () => {
    err.textContent = '';
    btn.disabled = true;
    try { const r = await call('sign', { room, body: ta.value }); setMe(r.user); ta.value = ''; toast('Đã ghi lưu bút · +5 điểm thi đua'); load(); }
    catch (e) { err.textContent = e.message; }
    btn.disabled = false;
  } }, 'Gửi');
  container.append(h('div', { class: 'gb-form' }, ta, err, btn), list);
  load();
}
function gbItem(it) {
  return h('article', { class: 'gb-item' },
    h('header', {}, h('b', {}, it.name), h('span', { class: 'tag' }, describe(it)), h('time', {}, ago(it.at))),
    h('p', {}, it.body));
}

const CLUBS = [
  { id: 'vannghe', icon: '🎤', name: 'CLB Văn nghệ', desc: 'Hát, múa, nhảy – sân khấu các đêm 20/11, 26/3.' },
  { id: 'bongda', icon: '⚽', name: 'CLB Bóng đá', desc: 'Giải bóng đá giữa các lớp chuyên.' },
  { id: 'english', icon: '🇬🇧', name: 'CLB Tiếng Anh', desc: 'Nói tiếng Anh, debate, hùng biện.' },
  { id: 'khoahoc', icon: '🔬', name: 'CLB Khoa học – STEM', desc: 'Nghiên cứu khoa học kĩ thuật, robot.' },
  { id: 'truyenthong', icon: '📷', name: 'CLB Truyền thông', desc: 'Chụp ảnh, quay phim, viết báo tường.' },
  { id: 'tinhnguyen', icon: '🤲', name: 'CLB Tình nguyện', desc: 'Mùa hè xanh, quyên góp vùng cao.' },
];

const panels = {
  gate() {
    openSheet('Cổng trường', (b) => {
      b.append(
        h('div', { class: 'hero-sign' }, 'TRƯỜNG THPT CHUYÊN THÁI NGUYÊN'),
        h('p', {}, 'Cổng chính mở ra đường Lương Ngọc Quyến. Đây là cơ sở 234A Lương Ngọc Quyến, phường Quang Trung, nơi trường học từ năm 1995 đến 2019 trước khi chuyển về cơ sở mới.'),
        h('ul', { class: 'bullets' },
          h('li', {}, '🛵 Gửi xe ở nhà xe bên trái cổng để điểm danh và nhận 20k ăn vặt mỗi ngày.'),
          h('li', {}, '🏛️ Đi thẳng là sân trường, cột cờ và nhà A (hiệu bộ).'),
          h('li', {}, '🚪 Nhà B, C, D là các dãy lớp học: mỗi lớp chuyên một cửa.')),
        h('a', { class: 'btn ghost', href: '/pages/gioi-thieu.html' }, 'Giới thiệu trang'),
      );
    });
  },

  guard() {
    const lines = [
      `Cháu ${me.name} đấy à? Lâu lắm mới thấy về thăm trường!`,
      'Đi học muộn là bác ghi tên đấy nhé, haha.',
      'Nhớ khóa cổ xe cẩn thận, dạo này nhà xe đông lắm.',
      'Ngày xưa các cháu hay trèo tường ra quán nước, bác biết hết đấy!',
      'Ra căng tin đúng giờ ra chơi được giảm giá 20% đấy cháu.',
    ];
    openSheet('Bác bảo vệ', (b) => {
      const p = h('p', { class: 'speech' }, lines[Math.floor(Math.random() * lines.length)]);
      b.append(p, h('button', { class: 'btn ghost', onclick: () => { p.textContent = lines[Math.floor(Math.random() * lines.length)]; } }, 'Hỏi chuyện tiếp'));
    });
  },

  async parking() {
    openSheet('Nhà xe học sinh', async (b) => {
      b.append(h('p', {}, 'Mỗi ngày gửi xe là một lần điểm danh. Bố mẹ cho 20k ăn vặt!'));
      if (me.guest) { b.append(h('button', { class: 'btn primary', onclick: () => createFlow() }, 'Ghi danh để điểm danh')); return; }
      const out = h('div', {});
      b.append(out);
      try {
        const r = await call('checkin');
        setMe(r.user);
        out.append(r.already
          ? h('p', { class: 'ok' }, 'Hôm nay bạn đã điểm danh rồi. Mai quay lại nhé!')
          : h('p', { class: 'ok big' }, `✅ Đã điểm danh · +${money(r.gained)} · +2 điểm thi đua`));
        out.append(h('p', { class: 'muted' }, 'Trong ví: ' + money(me.wallet)));
      } catch (e) { out.append(h('p', { class: 'err' }, e.message)); }
    });
  },

  board() {
    openSheet('Bảng thi đua', (b) => {
      b.append(h('p', { class: 'muted' }, 'Điểm thi đua: điểm danh +2, viết lưu bút +5, tạo/đăng ký họp lớp +3, đố vui đúng +1.'));
      b.append(tabs([
        { label: 'Theo khóa', render: async (c) => {
          c.append(h('p', { class: 'muted' }, 'Đang tải…'));
          const r = await call('khoaBoard');
          c.replaceChildren(rankList(r.khoa.map((x) => ({ name: x.khoa, sub: x.members + ' người', val: x.points })), 'Chưa có khóa nào. Mời bạn cùng khóa vào chơi!'));
        } },
        { label: 'Theo lớp chuyên', render: async (c) => {
          const r = await call('khoaBoard');
          c.append(rankList(r.lop.map((x) => ({ name: 'Chuyên ' + x.lop, sub: x.members + ' người', val: x.points })), 'Chưa có dữ liệu.'));
        } },
        { label: 'Đá cầu', render: async (c) => {
          const r = await call('leaderboard', { game: 'dacau' });
          c.append(rankList(r.items.map((x) => ({ name: x.name, sub: `${x.lop || ''} ${x.khoa || ''}`, val: x.score + ' quả' })), 'Chưa ai đá cầu.'));
        } },
      ]));
    });
  },

  office() {
    openSheet('Nhà A · Hiệu bộ', (b) => {
      b.append(tabs([
        { label: '📅 Lịch họp lớp', render: (c) => eventsView(c) },
        { label: '💌 Tri ân thầy cô', render: (c) => { c.append(h('p', { class: 'muted' }, 'Gửi lời tri ân tới thầy cô đã dạy mình.')); guestbook(c, 'trian', { placeholder: 'Em gửi lời cảm ơn thầy/cô…' }); } },
      ]));
    }, { wide: true });
  },

  teachers() {
    openSheet('Phòng giáo viên', (b) => {
      b.append(h('p', { class: 'muted' }, me.role === 'gv' ? 'Thầy cô nhắn gửi học trò các khóa.' : 'Nơi thầy cô nhắn gửi học trò. Học trò cũng có thể để lại lời chào.'));
      guestbook(b, 'gv', { placeholder: me.role === 'gv' ? 'Nhắn gửi các em…' : 'Em chào thầy cô…' });
    });
  },

  history() {
    openSheet('Phòng truyền thống', (b) => {
      b.append(
        h('div', { class: 'timeline' },
          h('div', {}, h('b', {}, '1995 – 2019'), h('p', {}, 'Trường học tại cơ sở 234A đường Lương Ngọc Quyến, phường Quang Trung: nhà A là nhà hiệu bộ, nhà B, C, D là ba dãy lớp học.')),
          h('div', {}, h('b', {}, '2019'), h('p', {}, 'Trường chuyển về cơ sở mới, khang trang hơn với nhà đa năng, bể bơi, sân bóng và ký túc xá.')),
          h('div', {}, h('b', {}, 'Hôm nay'), h('p', {}, 'Sân trường ảo này dựng lại cơ sở cũ để các thế hệ học sinh cùng về thăm.'))),
        h('h3', {}, 'Góc kỷ niệm'),
      );
      guestbook(b, 'kyniem', { placeholder: 'Kể một kỷ niệm ở trường cũ…' });
    });
  },

  clubs() {
    openSheet('Nhà đa năng · CLB', (b) => {
      const listEl = h('div', { class: 'place-list' });
      const show = (club) => {
        b.replaceChildren(h('button', { class: 'btn ghost sm', onclick: () => { b.replaceChildren(intro, listEl); } }, '← Các CLB'),
          h('h3', {}, club.icon + ' ' + club.name), h('p', { class: 'muted' }, club.desc));
        guestbook(b, 'clb:' + club.id, { placeholder: 'Nhắn gì đó cho CLB…' });
      };
      const intro = h('p', { class: 'muted' }, 'Mỗi CLB một gian. Chọn để vào gian CLB.');
      listEl.append(...CLUBS.map((c) => h('button', { class: 'place', onclick: () => show(c) }, h('span', {}, c.icon), c.name)));
      b.append(intro, listEl);
    });
  },

  canteen() {
    openSheet('Căng tin', async (b) => {
      const head = h('div', {});
      const list = h('div', { class: 'menu' });
      const forInp = h('input', { class: 'input', placeholder: 'Đãi bạn nào? (không bắt buộc)', maxlength: 40, 'aria-label': 'Đãi bạn' });
      const feed = h('div', { class: 'feed' });
      b.append(head, forInp, list, h('h3', {}, 'Vừa mua'), feed);
      const loadFeed = async () => {
        const r = await call('purchases');
        feed.replaceChildren(...(r.items.length ? r.items.map((x) => h('div', { class: 'feed-item' }, `${x.emoji} ${x.name} mua ${x.item}${x.forName ? ' đãi ' + x.forName : ''} · ${ago(x.at)}`)) : [h('p', { class: 'muted' }, 'Chưa ai mua gì.')]));
      };
      const r = await call('menu');
      head.replaceChildren(h('p', {}, 'Trong ví: ', h('b', {}, money(me.wallet))), r.sale ? h('p', { class: 'ok' }, '🎉 Đang giờ ra chơi: giảm 20%!') : h('p', { class: 'muted' }, `Đúng giờ ra chơi thật (${BREAK_TEXT}) được giảm 20%.`));
      list.append(...r.items.map((m) => h('button', { class: 'menu-item', onclick: async () => {
        try {
          const x = await call('buy', { item: m.id, forName: forInp.value });
          setMe(x.user);
          head.querySelector('b').textContent = money(me.wallet);
          toast(`${m.emoji} Đã mua ${m.name}${forInp.value ? ' đãi ' + forInp.value : ''}`);
          sayPrompt.send?.(`${m.emoji} ${forInp.value ? 'Đãi ' + forInp.value + ' ' : 'Ăn '}${m.name.toLowerCase()}!`);
          loadFeed();
        } catch (e) { toast(e.message, 'bad'); }
      } }, h('span', { class: 'emoji' }, m.emoji), h('span', {}, m.name), h('b', {}, money(m.final), m.final !== m.price ? h('s', {}, money(m.price)) : null))));
      loadFeed();
    });
  },

  football() {
    openSheet('Sân bóng · Đá cầu', (b, { onCleanup }) => {
      const cv = h('canvas', { class: 'game' });
      const info = h('p', { class: 'muted' }, 'Chạm vào quả cầu để tâng. Đừng để rơi!');
      const again = h('button', { class: 'btn primary', hidden: true }, 'Chơi lại');
      const board = h('div', {});
      b.append(info, cv, again, h('h3', {}, 'Bảng xếp hạng'), board);
      let stop = null;
      const loadBoard = async () => {
        const r = await call('leaderboard', { game: 'dacau' });
        board.replaceChildren(rankList(r.items.map((x) => ({ name: x.name, sub: `${x.lop || ''} ${x.khoa || ''}`, val: x.score + ' quả' })), 'Chưa ai chơi.'));
      };
      const play = () => {
        again.hidden = true;
        stop?.();
        stop = startDaCau(cv, async (score) => {
          again.hidden = false;
          if (me.guest) { info.textContent = `Lượt này: ${score} quả · Ghi danh để lưu kỷ lục lên bảng xếp hạng.`; return; }
          try { const r = await call('score', { game: 'dacau', score }); setMe(r.user); info.textContent = `Lượt này: ${score} quả · Kỷ lục của bạn: ${r.best} quả`; loadBoard(); } catch { /* */ }
        });
      };
      again.onclick = play;
      requestAnimationFrame(play);
      loadBoard();
      onCleanup(() => stop?.());
    });
  },

  dorm() {
    openSheet('Ký túc xá', (b) => {
      b.append(h('p', { class: 'muted' }, 'Những đêm ôn thi, nồi mì tôm chung, tiếng kẻng báo thức… Kể lại chuyện ở nội trú nhé.'));
      guestbook(b, 'ktx', { placeholder: 'Kỷ niệm ở ký túc xá…' });
    });
  },

  garden() {
    openSheet('Vườn trường · Ghế đá', (b) => {
      b.append(h('p', { class: 'muted' }, 'Ghế đá dưới gốc bàng – nơi tâm sự giờ ra chơi.'));
      guestbook(b, 'ghe-da', { placeholder: 'Tâm sự một chút…' });
    });
  },

  wish() {
    openSheet('Tường "Ước mơ vào Chuyên"', (b) => {
      b.append(h('p', { class: 'muted' }, 'Các em cấp 2 viết ước mơ đỗ vào Chuyên; anh chị khóa trên để lại lời động viên.'));
      guestbook(b, 'uocmo', { placeholder: 'Ước mơ / lời động viên của bạn…' });
    });
  },

  mirror() {
    if (!needMe()) return;
    openSheet('Soi gương · Đổi kiểu', (b) => {
      const look = { ...me.look };
      const name = h('input', { class: 'input', value: me.name, maxlength: 40, 'aria-label': 'Tên' });
      b.append(h('label', { class: 'lbl' }, 'Tên hiển thị'), name, avatarEditor(look),
        h('button', { class: 'btn primary', onclick: async () => {
          try { const r = await call('look', { look, name: name.value }); setMe(r.user); closeSheet(); toast('Đã đổi kiểu!'); }
          catch (e) { toast(e.message, 'bad'); }
        } }, 'Lưu'));
    });
  },

  class(hs) {
    const lop = hs.lop;
    let khoa = me.lop === lop && me.khoa ? me.khoa : me.khoa || 'K1';
    openSheet('Lớp chuyên ' + lop, (b) => {
      const khoaInp = h('input', { class: 'input sm', value: khoa, maxlength: 4, 'aria-label': 'Khóa' });
      const content = h('div', {});
      const render = () => {
        khoa = khoaInp.value.trim().toUpperCase().replace(/^K?/, 'K');
        if (!/^K\d{1,2}$/.test(khoa)) { content.replaceChildren(h('p', { class: 'err' }, 'Khóa dạng K1, K2…')); return; }
        const room = `lop:${lop}:${khoa}`;
        if (me.lop === lop && me.khoa === khoa) call('attend', { room }).catch(() => {});
        content.replaceChildren(tabs([
          { label: '📒 Lưu bút', render: (c) => guestbook(c, room, { placeholder: `Lưu bút lớp ${lop} ${khoa}…`, empty: `Lớp ${lop} ${khoa} chưa có lưu bút nào.` }) },
          { label: '📋 Sổ đầu bài', render: async (c) => {
            const r = await call('roster', { room });
            c.append(h('p', { class: 'muted' }, `Những bạn đã về lớp ${lop} ${khoa}:`),
              r.items.length ? h('ol', { class: 'roster' }, ...r.items.map((x) => h('li', {}, x.name, h('span', { class: 'muted' }, ' · ' + ago(x.at))))) : h('p', { class: 'muted' }, 'Chưa có ai điểm danh.'));
          } },
          { label: '❓ Đố vui', render: (c) => quizView(c, lop) },
        ]));
      };
      khoaInp.addEventListener('change', render);
      b.append(h('div', { class: 'row-inline' }, h('span', {}, 'Khóa:'), khoaInp, h('button', { class: 'btn ghost sm', onclick: render }, 'Xem')), content);
      render();
    }, { wide: true });
  },
};

function rankList(rows, empty) {
  if (!rows.length) return h('p', { class: 'muted' }, empty);
  return h('ol', { class: 'rank' }, ...rows.map((r, i) => h('li', {}, h('span', { class: 'medal' }, ['🥇', '🥈', '🥉'][i] || String(i + 1)), h('span', { class: 'rn' }, r.name, h('small', {}, r.sub)), h('b', {}, String(r.val)))));
}

async function eventsView(c) {
  const list = h('div', { class: 'events' }, h('p', { class: 'muted' }, 'Đang tải…'));
  const formWrap = h('div', {});
  const load = async () => {
    const r = await call('events');
    const today = new Date().toISOString().slice(0, 10);
    const up = r.items.filter((e) => e.date >= today), past = r.items.filter((e) => e.date < today).reverse();
    const card = (ev) => {
      const joined = ev.joins.some((j) => j.id === me.id);
      return h('article', { class: 'event' },
        h('div', { class: 'date' }, h('b', {}, ev.date.slice(8, 10)), h('small', {}, 'Th' + Number(ev.date.slice(5, 7)) + '/' + ev.date.slice(0, 4))),
        h('div', { class: 'ev-body' },
          h('b', {}, ev.title),
          h('div', { class: 'muted' }, [ev.time, ev.place].filter(Boolean).join(' · ')),
          ev.note ? h('p', {}, ev.note) : null,
          h('div', { class: 'muted' }, `Tạo bởi ${ev.by}${ev.lop ? ` (${ev.lop} ${ev.khoa})` : ''} · ${ev.joins.length} người tham gia: ${ev.joins.slice(0, 8).map((j) => j.name).join(', ')}${ev.joins.length > 8 ? '…' : ''}`),
          h('button', { class: 'btn sm ' + (joined ? 'ghost' : 'primary'), onclick: async () => { try { const x = await call('joinEvent', { id: ev.id }); setMe(x.user); toast(x.joined ? 'Đã đăng ký tham gia!' : 'Đã huỷ đăng ký'); load(); } catch (e) { toast(e.message, 'bad'); } } }, joined ? 'Huỷ đăng ký' : 'Đăng ký tham gia')));
    };
    list.replaceChildren(
      ...(up.length ? up.map(card) : [h('p', { class: 'muted' }, 'Chưa có buổi họp lớp nào sắp tới. Tạo một buổi nhé!')]),
      ...(past.length ? [h('details', {}, h('summary', {}, `Đã diễn ra (${past.length})`), ...past.map(card))] : []),
    );
  };
  const showForm = () => {
    const title = h('input', { class: 'input', placeholder: `Họp lớp ${me.lop || ''} ${me.khoa || ''} – 10 năm ra trường`.replace(/\s+/g, ' '), maxlength: 80 });
    const date = h('input', { class: 'input', type: 'date' });
    const time = h('input', { class: 'input', type: 'time', value: '18:00' });
    const place = h('input', { class: 'input', placeholder: 'Địa điểm (vd: Nhà hàng…, TP Thái Nguyên)', maxlength: 120 });
    const note = h('textarea', { class: 'input', rows: 2, placeholder: 'Ghi chú: đóng góp, liên hệ…', maxlength: 300 });
    const err = h('p', { class: 'err' });
    formWrap.replaceChildren(h('div', { class: 'card' },
      h('h3', {}, 'Tạo buổi họp lớp'), title, h('div', { class: 'row2' }, date, time), place, note, err,
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', onclick: () => formWrap.replaceChildren(addBtn) }, 'Huỷ'),
        h('button', { class: 'btn primary', onclick: async () => {
          try { const r = await call('createEvent', { title: title.value || title.placeholder, date: date.value, time: time.value, place: place.value, note: note.value }); setMe(r.user); toast('Đã tạo buổi họp lớp'); formWrap.replaceChildren(addBtn); load(); }
          catch (e) { err.textContent = e.message; }
        } }, 'Tạo'))));
  };
  const addBtn = h('button', { class: 'btn primary', onclick: showForm }, '＋ Tạo buổi họp lớp');
  formWrap.append(addBtn);
  c.append(formWrap, list);
  load().catch((e) => list.replaceChildren(h('p', { class: 'err' }, e.message)));
}

function quizView(c, lop) {
  const qs = QUIZ[lop] || [];
  let i = 0, correct = 0;
  const box = h('div', { class: 'quiz' });
  const show = () => {
    if (i >= qs.length) {
      box.replaceChildren(h('p', { class: 'ok big' }, `Đúng ${correct}/${qs.length} câu!`));
      (me.guest ? Promise.reject(new Error('khách')) : api('quiz', { correct })).then((r) => { setMe(r.user); box.append(h('p', { class: 'muted' }, r.award ? `+${r.award} điểm thi đua cho khóa ${me.khoa || ''}` : 'Hôm nay bạn đã nhận đủ điểm đố vui (10 điểm/ngày).')); }).catch(() => {});
      box.append(h('button', { class: 'btn ghost', onclick: () => { i = 0; correct = 0; show(); } }, 'Làm lại'));
      return;
    }
    const [q, ans, right] = qs[i];
    box.replaceChildren(h('p', { class: 'muted' }, `Câu ${i + 1}/${qs.length}`), h('p', { class: 'q' }, q),
      h('div', { class: 'answers' }, ...ans.map((a, k) => h('button', { class: 'answer', onclick: (e) => {
        box.querySelectorAll('.answer').forEach((x) => (x.disabled = true));
        e.currentTarget.classList.add(k === right ? 'right' : 'wrong');
        box.querySelectorAll('.answer')[right].classList.add('right');
        if (k === right) correct++;
        setTimeout(() => { i++; show(); }, 900);
      } }, a))));
  };
  show();
  c.append(box);
}

boot();
