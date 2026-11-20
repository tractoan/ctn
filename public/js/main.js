import { api, getToken, setToken, getMode } from './api.js';
import { LOPS, ROLES } from './logic.js';
import { World } from './world.js';
import { SPAWN, HOTSPOTS, PLACES } from './campus.js';
import { avatarCanvas, SKINS, HAIR_COLORS, HAIR_NAMES, BAG_COLORS } from './avatar.js';
import { h, openSheet, closeSheet, toast, money, ago, tabs } from './ui.js';
import { startDaCau, QUIZ } from './games.js';

const app = document.getElementById('app');
let me = null;
let world = null;

const POS_KEY = 'ctn.pos';
function savePos() { try { if (world?.me) localStorage.setItem(POS_KEY, JSON.stringify({ x: world.me.x, y: world.me.y })); } catch { /* */ } }
function loadPos() { try { const p = JSON.parse(localStorage.getItem(POS_KEY)); if (p && p.x > 0 && p.y > 0 && p.y < 1700) return p; } catch { /* */ } return SPAWN; }

function describe(u) {
  if (u.role === 'gv') return 'Thầy cô';
  if (u.role === 'khach') return 'Khách';
  return `${u.lop || ''} ${u.khoa || ''}`.trim();
}

// ======================= Khởi động =======================
async function boot() {
  if (getToken()) {
    try { me = (await api('me')).user; } catch (e) { if (e.status === 401) setToken(''); }
  }
  if (me) enterSchool(); else showWelcome();
}

// ======================= Màn chào & tạo nhân vật =======================
function showWelcome() {
  app.replaceChildren(
    h('div', { class: 'welcome' },
      h('div', { class: 'welcome-card' },
        h('div', { class: 'crest' }, 'CTN'),
        h('p', { class: 'eyebrow' }, 'Họp lớp online'),
        h('h1', {}, 'Trường THPT Chuyên Thái Nguyên'),
        h('p', { class: 'lead' }, 'Về lại sân trường 234A Lương Ngọc Quyến: dạo quanh nhà A, nhà B, C, D, ghé lớp cũ, viết lưu bút và hẹn nhau họp lớp.'),
        h('button', { class: 'btn primary big', onclick: () => createFlow() }, 'Vào sân trường'),
        h('button', { class: 'btn ghost', onclick: () => recoverFlow() }, 'Tôi đã có mã khôi phục'),
        h('p', { class: 'fine' }, 'Trang cộng đồng của cựu học sinh, không phải website chính thức của nhà trường. ',
          h('a', { href: '/pages/gioi-thieu.html' }, 'Giới thiệu')),
      ),
    ),
  );
}

function recoverFlow() {
  openSheet('Khôi phục nhân vật', (b) => {
    const inp = h('input', { class: 'input', placeholder: 'CTN-XXXX-XXXX', autocapitalize: 'characters', 'aria-label': 'Mã khôi phục' });
    const err = h('p', { class: 'err' });
    b.append(
      h('p', {}, 'Nhập mã khôi phục bạn đã lưu khi tạo nhân vật.'), inp, err,
      h('button', { class: 'btn primary', onclick: async () => {
        try { const r = await api('recover', { code: inp.value }); setToken(r.token); me = r.user; closeSheet(); enterSchool(); }
        catch (e) { err.textContent = e.message; }
      } }, 'Khôi phục'),
    );
    setTimeout(() => inp.focus(), 50);
  });
}

function createFlow() {
  const draft = { role: 'cuuhs', name: '', khoa: '', lop: 'Toán', school: '', look: { gender: 'nam', skin: 1, hair: 0, hairColor: 0, bottom: 'quan', bag: 0 } };
  openSheet('Bạn là ai?', (b, { setTitle }) => {
    const step1 = () => {
      setTitle('Bạn là ai?');
      b.replaceChildren(
        h('div', { class: 'choice-grid' },
          ...Object.entries(ROLES).map(([k, v]) => h('button', { class: 'choice' + (draft.role === k ? ' on' : ''), onclick: () => { draft.role = k; step2(); } },
            h('span', { class: 'choice-ico' }, { cuuhs: '🎓', hs: '🎒', gv: '👩‍🏫', khach: '🤝' }[k]), v))),
      );
    };
    const step2 = () => {
      setTitle('Thông tin của bạn');
      const err = h('p', { class: 'err' });
      const name = h('input', { class: 'input', placeholder: 'Tên hiển thị (vd: Minh Anh)', maxlength: 40, value: draft.name, 'aria-label': 'Tên' });
      const needClass = draft.role === 'cuuhs' || draft.role === 'hs';
      const khoa = h('input', { class: 'input', placeholder: 'Khóa (vd: K20)', maxlength: 4, value: draft.khoa, 'aria-label': 'Khóa' });
      const lop = h('select', { class: 'input', 'aria-label': 'Lớp chuyên' }, ...LOPS.map((l) => h('option', { value: l, selected: draft.lop === l }, 'Chuyên ' + l)));
      const school = h('input', { class: 'input', placeholder: 'Trường của bạn (không bắt buộc)', maxlength: 60, value: draft.school });
      b.replaceChildren(h('div', {},
        h('label', { class: 'lbl' }, 'Tên'), name,
        needClass ? [h('div', { class: 'row2' }, h('div', {}, h('label', { class: 'lbl' }, 'Khóa'), khoa), h('div', {}, h('label', { class: 'lbl' }, 'Lớp'), lop))] : null,
        draft.role === 'khach' ? [h('label', { class: 'lbl' }, 'Trường'), school] : null,
        err,
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn ghost', onclick: step1 }, '← Quay lại'),
          h('button', { class: 'btn primary', onclick: () => {
            draft.name = name.value.trim(); draft.khoa = khoa.value.trim(); draft.lop = lop.value; draft.school = school.value;
            if (!draft.name) { err.textContent = 'Nhập tên của bạn'; return; }
            if (needClass && !/^k?\d{1,2}$/i.test(draft.khoa)) { err.textContent = 'Khóa dạng K1, K2… (số khóa của bạn)'; return; }
            step3();
          } }, 'Tiếp →'))),
      );
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
            try {
              const r = await api('register', draft);
              setToken(r.token); me = r.user;
              step4();
            } catch (ex) { err.textContent = ex.message; e.target.disabled = false; }
          } }, 'Vào trường!')),
      );
    };
    const step4 = () => {
      setTitle('Lưu mã khôi phục');
      b.replaceChildren(
        h('p', {}, 'Đây là mã để lần sau (kể cả khi đổi máy) bạn vẫn là nhân vật này. Hãy chụp màn hình hoặc sao chép lại:'),
        h('div', { class: 'code-box' }, me.code),
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn ghost', onclick: () => { navigator.clipboard?.writeText(me.code).then(() => toast('Đã sao chép mã')); } }, 'Sao chép'),
          h('button', { class: 'btn primary', onclick: () => { closeSheet(); enterSchool(); } }, 'Đã lưu, vào sân trường')),
      );
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
function enterSchool() {
  const canvas = h('canvas', { id: 'world', 'aria-label': 'Sơ đồ sân trường. Chạm để di chuyển, chạm nhãn để mở.' });
  const wallet = h('span', { class: 'chip' });
  const online = h('span', { class: 'chip' });
  const modeChip = h('span', { class: 'chip warn', hidden: true }, 'Ngoại tuyến');
  const mini = h('canvas', { class: 'minimap', width: 160, height: 138, title: 'Bản đồ', onclick: () => placesSheet() });
  const updateHud = () => { wallet.textContent = '💰 ' + money(me.wallet); };

  app.replaceChildren(
    canvas,
    h('header', { class: 'hud' },
      h('div', { class: 'brand' }, h('span', { class: 'crest sm' }, 'CTN'), h('div', {}, h('b', {}, 'Chuyên Thái Nguyên'), h('small', {}, '234A Lương Ngọc Quyến'))),
      h('div', { class: 'hud-right' }, modeChip, online, wallet)),
    mini,
    h('div', { class: 'zoom' },
      h('button', { class: 'icon-btn', 'aria-label': 'Phóng to', onclick: () => world.zoomBy(1.2) }, '+'),
      h('button', { class: 'icon-btn', 'aria-label': 'Thu nhỏ', onclick: () => world.zoomBy(1 / 1.2) }, '−')),
    h('nav', { class: 'dock' },
      h('button', { onclick: () => placesSheet() }, h('span', {}, '🗺️'), 'Địa điểm'),
      h('button', { onclick: () => sayPrompt() }, h('span', {}, '💬'), 'Nói'),
      h('button', { onclick: () => panels.mirror() }, h('span', {}, '👕'), 'Nhân vật'),
      h('button', { onclick: () => moreSheet() }, h('span', {}, '☰'), 'Thêm')),
  );

  world = new World(canvas);
  world.setMe({ ...loadPos(), look: me.look, name: me.name });
  world.npcs = makeNpcs();
  world.onArrive = (hs) => openHotspot(hs);
  world.onTapPlayer = (p) => playerCard(p);
  world.start();
  updateHud();
  hud.update = updateHud;

  if (getMode() === 'offline') modeChip.hidden = false;

  // vòng cập nhật vị trí với máy chủ
  let pendingSay = null;
  sayPrompt.send = (t) => { pendingSay = t; world.say('me', t); };
  let lastSent = '';
  const tick = async () => {
    const pos = { x: Math.round(world.me.x), y: Math.round(world.me.y) };
    const body = { ...pos, zone: world.zoneOf(pos.x, pos.y) };
    if (pendingSay) { body.say = pendingSay; pendingSay = null; }
    const sig = JSON.stringify(body);
    try {
      const r = await api('presence', body);
      world.updateOthers(r.others);
      online.textContent = '👥 ' + (r.others.length + 1) + ' online';
    } catch { /* thử lại lượt sau */ }
    lastSent = sig;
    savePos();
  };
  tick();
  setInterval(tick, 2500);
  setInterval(() => world.drawMinimap(mini), 500);
  window.addEventListener('beforeunload', savePos);

  if (!sessionStorageGet('ctn.greeted')) {
    sessionStorageSet('ctn.greeted', '1');
    setTimeout(() => toast(`Chào ${me.name}! Chạm vào sân để đi, chạm nhãn để vào lớp, căng tin…`), 600);
  }
}
const hud = { update() {} };
function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* */ } }

function makeNpcs() {
  const guard = { name: 'Bác bảo vệ', x: 1080, y: 1405, look: { gender: 'nam', skin: 2, hair: 4, hairColor: 4, bottom: 'quan', bag: 0 }, dir: -1, moving: false };
  const cook = { name: 'Cô căng tin', x: 250, y: 790, look: { gender: 'nu', skin: 1, hair: 2, hairColor: 1, bottom: 'vay', bag: 3 }, dir: 1, moving: false };
  // Cô căng tin đi qua đi lại trước cửa
  cook.update = (dt, now) => { const nx = 200 + Math.sin(now / 3000) * 60; cook.moving = Math.abs(nx - cook.x) > 0.05; cook.dir = nx > cook.x ? 1 : -1; cook.x = nx; };
  return [guard, cook];
}

function placesSheet() {
  openSheet('Địa điểm trong trường', (b) => {
    b.append(h('p', { class: 'muted' }, 'Sơ đồ cơ sở 234A đường Lương Ngọc Quyến (1995–2019). Chọn để đi tới.'));
    b.append(h('div', { class: 'place-list' }, ...PLACES.map((p) => h('button', { class: 'place', onclick: () => { closeSheet(); world.goToHotspot(p); } }, h('span', {}, p.icon), p.label))));
    b.append(h('h3', {}, 'Các lớp chuyên'));
    b.append(h('div', { class: 'place-list small' }, ...HOTSPOTS.filter((x) => x.panel === 'class').map((p) => h('button', { class: 'place', onclick: () => { closeSheet(); world.goToHotspot(p); } }, h('span', {}, '🚪'), p.label))));
  });
}

function sayPrompt() {
  openSheet('Nói gì đó', (b) => {
    const inp = h('input', { class: 'input', maxlength: 80, placeholder: 'Chào cả lớp!', 'aria-label': 'Lời nói' });
    const send = (t) => { if (!t.trim()) return; sayPrompt.send?.(t.trim()); closeSheet(); };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(inp.value); });
    b.append(inp,
      h('div', { class: 'quick' }, ...['👋 Chào cả nhà!', 'Lâu quá không gặp!', 'Họp lớp đi mọi người 🎉', 'Nhớ trường quá 🥲', 'Ra căng tin không?'].map((q) => h('button', { class: 'pill', onclick: () => send(q) }, q))),
      h('button', { class: 'btn primary', onclick: () => send(inp.value) }, 'Nói'));
    setTimeout(() => inp.focus(), 50);
  });
}

function moreSheet() {
  openSheet('Thêm', (b) => {
    b.append(h('div', {},
      h('div', { class: 'me-card' }, avatarCanvas(me.look, 72), h('div', {}, h('b', {}, me.name), h('div', { class: 'muted' }, ROLES[me.role] + (describe(me) ? ' · ' + describe(me) : '')), h('div', { class: 'muted' }, '⭐ ' + me.points + ' điểm thi đua'))),
      h('label', { class: 'lbl' }, 'Mã khôi phục'), h('div', { class: 'code-box sm' }, me.code),
      getMode() === 'offline' ? h('p', { class: 'note' }, 'Đang ở chế độ ngoại tuyến: dữ liệu chỉ lưu trên trình duyệt này, không thấy bạn bè online. Triển khai lên Cloudflare (xem README) để dùng chung.') : null,
      h('div', { class: 'stack' },
        h('a', { class: 'btn ghost', href: '/pages/gioi-thieu.html' }, 'Giới thiệu trang'),
        h('button', { class: 'btn ghost', onclick: () => { world.teleport(SPAWN.x, SPAWN.y); closeSheet(); } }, 'Về cổng trường'),
        h('button', { class: 'btn danger', onclick: () => { if (confirm('Thoát nhân vật trên máy này? Hãy chắc chắn bạn đã lưu mã khôi phục.')) { setToken(''); location.reload(); } } }, 'Thoát nhân vật'))),
    );
  });
}

function playerCard(p) {
  openSheet(p.name, (b) => {
    b.append(h('div', { class: 'me-card' }, avatarCanvas(p.look, 72), h('div', {}, h('b', {}, p.name), h('div', { class: 'muted' }, ROLES[p.role] + (describe(p) ? ' · ' + describe(p) : '')))),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', onclick: () => { sayPrompt.send(`👋 Chào ${p.name}!`); closeSheet(); } }, '👋 Vẫy tay'),
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
      const { items } = await api('guestbook', { room });
      list.replaceChildren(...(items.length ? items.map(gbItem) : [h('p', { class: 'muted' }, empty)]));
    } catch (e) { list.replaceChildren(h('p', { class: 'err' }, e.message)); }
  };
  const btn = h('button', { class: 'btn primary', onclick: async () => {
    err.textContent = '';
    btn.disabled = true;
    try { const r = await api('sign', { room, body: ta.value }); me = r.user; hud.update(); ta.value = ''; toast('Đã ghi lưu bút · +5 điểm thi đua'); load(); }
    catch (e) { err.textContent = e.message; }
    btn.disabled = false;
  } }, 'Gửi');
  container.append(h('div', { class: 'gb-form' }, ta, err, btn), list);
  load();
}
function gbItem(it) {
  return h('article', { class: 'gb-item' },
    h('header', {}, h('b', {}, it.name), h('span', { class: 'tag' }, it.role === 'gv' ? 'Thầy cô' : it.role === 'khach' ? 'Khách' : `${it.lop} ${it.khoa}`.trim()), h('time', {}, ago(it.at))),
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
      const out = h('div', {});
      b.append(out);
      try {
        const r = await api('checkin');
        me = r.user; hud.update();
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
          const r = await api('khoaBoard');
          c.replaceChildren(rankList(r.khoa.map((x) => ({ name: x.khoa, sub: x.members + ' người', val: x.points })), 'Chưa có khóa nào. Mời bạn cùng khóa vào chơi!'));
        } },
        { label: 'Theo lớp chuyên', render: async (c) => {
          const r = await api('khoaBoard');
          c.append(rankList(r.lop.map((x) => ({ name: 'Chuyên ' + x.lop, sub: x.members + ' người', val: x.points })), 'Chưa có dữ liệu.'));
        } },
        { label: 'Đá cầu', render: async (c) => {
          const r = await api('leaderboard', { game: 'dacau' });
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
        const r = await api('purchases');
        feed.replaceChildren(...(r.items.length ? r.items.map((x) => h('div', { class: 'feed-item' }, `${x.emoji} ${x.name} mua ${x.item}${x.forName ? ' đãi ' + x.forName : ''} · ${ago(x.at)}`)) : [h('p', { class: 'muted' }, 'Chưa ai mua gì.')]));
      };
      const r = await api('menu');
      head.replaceChildren(h('p', {}, 'Trong ví: ', h('b', {}, money(me.wallet))), r.sale ? h('p', { class: 'ok' }, '🎉 Đang giờ ra chơi (9:15–9:35): giảm 20%!') : h('p', { class: 'muted' }, 'Đúng giờ ra chơi thật (9:15–9:35) được giảm 20%.'));
      list.append(...r.items.map((m) => h('button', { class: 'menu-item', onclick: async () => {
        try {
          const x = await api('buy', { item: m.id, forName: forInp.value });
          me = x.user; hud.update();
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
        const r = await api('leaderboard', { game: 'dacau' });
        board.replaceChildren(rankList(r.items.map((x) => ({ name: x.name, sub: `${x.lop || ''} ${x.khoa || ''}`, val: x.score + ' quả' })), 'Chưa ai chơi.'));
      };
      const play = () => {
        again.hidden = true;
        stop?.();
        stop = startDaCau(cv, async (score) => {
          again.hidden = false;
          try { const r = await api('score', { game: 'dacau', score }); me = r.user; info.textContent = `Lượt này: ${score} quả · Kỷ lục của bạn: ${r.best} quả`; loadBoard(); } catch { /* */ }
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
    openSheet('Soi gương · Đổi kiểu', (b) => {
      const look = { ...me.look };
      const name = h('input', { class: 'input', value: me.name, maxlength: 40, 'aria-label': 'Tên' });
      b.append(h('label', { class: 'lbl' }, 'Tên hiển thị'), name, avatarEditor(look),
        h('button', { class: 'btn primary', onclick: async () => {
          try { const r = await api('look', { look, name: name.value }); me = r.user; world.me.look = me.look; world.me.name = me.name; closeSheet(); toast('Đã đổi kiểu!'); }
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
        if (me.lop === lop && me.khoa === khoa) api('attend', { room }).catch(() => {});
        content.replaceChildren(tabs([
          { label: '📒 Lưu bút', render: (c) => guestbook(c, room, { placeholder: `Lưu bút lớp ${lop} ${khoa}…`, empty: `Lớp ${lop} ${khoa} chưa có lưu bút nào.` }) },
          { label: '📋 Sổ đầu bài', render: async (c) => {
            const r = await api('roster', { room });
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
    const r = await api('events');
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
          h('button', { class: 'btn sm ' + (joined ? 'ghost' : 'primary'), onclick: async () => { try { const x = await api('joinEvent', { id: ev.id }); me = x.user; toast(x.joined ? 'Đã đăng ký tham gia!' : 'Đã huỷ đăng ký'); load(); } catch (e) { toast(e.message, 'bad'); } } }, joined ? 'Huỷ đăng ký' : 'Đăng ký tham gia')));
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
          try { const r = await api('createEvent', { title: title.value || title.placeholder, date: date.value, time: time.value, place: place.value, note: note.value }); me = r.user; toast('Đã tạo buổi họp lớp'); formWrap.replaceChildren(addBtn); load(); }
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
      api('quiz', { correct }).then((r) => { me = r.user; box.append(h('p', { class: 'muted' }, r.award ? `+${r.award} điểm thi đua cho khóa ${me.khoa || ''}` : 'Hôm nay bạn đã nhận đủ điểm đố vui (10 điểm/ngày).')); }).catch(() => {});
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
