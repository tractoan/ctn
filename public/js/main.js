import { api, getToken, setToken, getMode, OFFLINE_ADMIN_CODE } from './api.js';
import { LOPS, ROLES, BREAK_TEXT, periodOf, vnClock, TRANSPORTS, GAMES, LOVE_LINES, LOVE_REPLIES, ZONE_IDS, CLASS_RULES, BAC_HO, ROOM_TEACHERS, OTHER_NPCS, NPC_SLOTS, NPC_TITLES } from './logic.js';
import { World, CAMPUS_SCENE } from './world.js';
import { classroomScene } from './classroom.js';
import { SPAWN, HOTSPOTS, PLACES } from './campus.js';
import { avatarCanvas, avatarStage, normLook, randomLook, outfitsFor, SKINS, HAIR_COLORS, HAIR_COLOR_NAMES, HAIR_SWATCH, HAIR_NAMES, GIRL_HAIR, outfitLabel, SHIRT_COLORS } from './avatar.js';
import { MINIGAMES, oldLesson } from './minigames.js';
import { drawDiploma, drawThanksCard, shareCanvas, DIPLOMA_QUOTES } from './cards.js';
import { sfx, settings as soundSettings, saveSettings } from './sound.js';
import { campusNpcs, classNpcs, roomNpcs } from './npcs.js';
import { ROOMS, CLUBS } from './rooms.js';
import { h, openSheet, closeSheet, toast, money, ago, tabs } from './ui.js';
import { startDaCau, QUIZ } from './games.js';

const app = document.getElementById('app');
// Khách chưa ghi danh vẫn dạo được sân trường, chỉ không viết/mua/điểm danh được.
const GUEST = { guest: true, id: '', name: 'Khách', role: 'khach', khoa: '', lop: '', school: '', wallet: 0, points: 0, code: '', look: { v: 2, gender: 'nam', skin: 1, hair: 10, hairColor: 0, bottom: 'quan', outfit: 'phong' } };
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
const ZONES = { D3: 'Dãy nhà 3 tầng', D4: 'Dãy nhà 4 tầng', D5: 'Dãy nhà 5 tầng', HB: 'Nhà hiệu bộ', DN: 'Nhà đa năng', CT: 'Căng tin', san: 'Sân trường', dacau: 'Sân đá cầu', tronhoc: 'Chỗ trốn học đá bóng', cong: 'Cổng trường', khuon: 'Khuôn viên trường', duong: 'Đường Lương Ngọc Quyến' };

const POS_KEY = 'ctn.pos';
function savePos() { try { if (world?.me) localStorage.setItem(POS_KEY, JSON.stringify({ x: world.me.x, y: world.me.y })); } catch { /* */ } }
function loadPos() { try { const p = JSON.parse(localStorage.getItem(POS_KEY)); if (p && p.x > 0 && p.y > 0 && p.y < 1700) return p; } catch { /* */ } return { x: SPAWN.x + Math.round((Math.random() - 0.5) * 80), y: SPAWN.y + Math.round((Math.random() - 0.5) * 10) }; }
function sessionGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* */ } }

function describe(u) {
  if (u.role === 'gv') return u.school || 'Thầy cô';
  if (u.role === 'em') return 'Em cấp 2';
  if (u.role === 'khach') return u.school || 'Bạn trường khác';
  return `${u.lop || ''} ${u.khoa || ''}`.trim();
}

// Gọi API; nếu chức năng cần ghi danh thì mời ghi danh.
async function call(action, body) {
  try { return await api(action, body); }
  catch (e) {
    if (e.status === 401) { closeSheet(); toast('Ghi danh để dùng chức năng này nhé!'); setTimeout(() => createFlow(), 350); }
    if (e.banned && !me.guest) bannedNotice(e.message);
    throw e;
  }
}
function needMe() {
  if (!me.guest) return true;
  createFlow();
  return false;
}

// ======================= Khởi động =======================
let bootBanned = '';
async function boot() {
  if (getToken()) {
    try { me = (await api('me')).user; } catch (e) { if (e.status === 401) setToken(''); if (e.banned) bootBanned = e.message; }
  }
  enterSchool();
  if (bootBanned) { bannedNotice(bootBanned); return; }
  // /?quantri: mở thẳng bảng quản trị (không cần nhân vật)
  if (new URLSearchParams(location.search).has('quantri')) adminSheet();
  else if (me.guest && !sessionGet('ctn.skipWelcome')) createFlow();
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
  if (world) { world.me.look = me.look; world.me.name = me.name; world.me.sub = world.subOf(me); world.myId = me.id || ''; }
  hud.update();
}

// Tạo nhân vật 4 bước như trang mẫu: bạn là ai → thông tin → chọn ngoại hình → tên hiển thị → lưu mã khôi phục
function createFlow() {
  const draft = { role: 'cuuhs', name: '', khoa: '', lop: '', school: '', title: 'Cô', dept: '', look: randomLook('cuuhs') };
  const btns = (onNext, onBack, nextText = 'Tiếp tục') => h('div', { class: 'ob-btns' },
    h('button', { class: 'btn primary big', onclick: onNext }, nextText),
    onBack ? h('button', { class: 'btn link muted', onclick: onBack }, 'Quay lại') : null);
  const chips = (items, isOn, pick, label) => h('div', { class: 'ob-chips', role: 'group', 'aria-label': label },
    ...items.map(([val, text]) => h('button', { class: 'ob-chip' + (isOn(val) ? ' on' : ''), onclick: (e) => {
      pick(val); e.currentTarget.parentNode.querySelectorAll('.ob-chip').forEach((x) => x.classList.remove('on')); e.currentTarget.classList.add('on');
    } }, text)));
  const summary = () => draft.role === 'cuuhs' || draft.role === 'hs' ? `${draft.khoa} · ${draft.lop}`
    : draft.role === 'gv' ? gvLabel() : draft.school || ROLES[draft.role];
  const gvLabel = () => [draft.title, draft.dept.trim()].filter(Boolean).join(' · ');
  openSheet('', (b, { setTitle }) => {
    const stepRole = () => {
      setTitle('');
      const hero = h('div', { class: 'trio' },
        avatarCanvas({ v: 2, gender: 'nu', hair: 4, hairColor: 0, bottom: 'vay', skin: 0, outfit: 'aodai' }, 64),
        avatarCanvas({ v: 2, gender: 'nam', hair: 6, hairColor: 0, bottom: 'quan', skin: 1, outfit: 'khoac' }, 64),
        avatarCanvas({ v: 2, gender: 'nu', hair: 3, hairColor: 1, bottom: 'vay', skin: 0, outfit: 'somi' }, 64));
      b.replaceChildren(h('div', { class: 'welcome-in' },
        h('img', { class: 'welcome-logo', src: 'logo.jpg', alt: 'Logo Trường THPT Chuyên Thái Nguyên' }),
        hero,
        h('h1', { class: 'welcome-title' }, 'Chào mừng bạn về Trường THPT Chuyên Thái Nguyên!'),
        h('p', { class: 'lead' }, 'Tạo nhân vật một lần, lần sau vào vẫn là bạn. Bạn là ai?'),
        h('div', { class: 'role-list' },
          ...Object.entries(ROLES).map(([k, v]) => h('button', { class: 'role', onclick: () => {
            draft.role = k;
            if (k === 'gv') { draft.look.gender = draft.title === 'Thầy' ? 'nam' : 'nu'; }
            draft.look.outfit = outfitsFor(k, draft.look)[0];
            stepInfo();
          } }, h('span', { class: 'role-ico' }, ROLE_INFO[k].icon), h('span', {}, h('b', {}, v), h('small', {}, ROLE_INFO[k].sub))))),
        h('button', { class: 'btn link', onclick: () => recoverFlow() }, 'Tôi đã có nhân vật'),
        h('button', { class: 'btn link muted', onclick: () => { sessionSet('ctn.skipWelcome', '1'); closeSheet(); toast('Chạm vào sân để đi bộ. Bấm 🗺️ để xem bản đồ trường.'); } }, 'Vào xem với tư cách khách')));
    };

    const stepInfo = () => {
      setTitle(`${ROLE_INFO[draft.role].icon} ${ROLES[draft.role]}`);
      const err = h('p', { class: 'err', role: 'alert' });
      const parts = [];
      if (draft.role === 'cuuhs' || draft.role === 'hs') {
        const sel = h('select', { class: 'input', id: 'ob-khoa', 'aria-label': 'Khóa', onchange: (e) => { draft.khoa = e.target.value; } },
          h('option', { value: '' }, '— Chọn khóa —'),
          ...Array.from({ length: 40 }, (_, i) => 40 - i).map((n) => h('option', { value: 'K' + n, selected: draft.khoa === 'K' + n }, `Khóa ${n} (K${n})`)));
        parts.push(h('label', { class: 'ob-lbl', for: 'ob-khoa' }, 'Khóa của bạn'), sel,
          h('label', { class: 'ob-lbl' }, 'Lớp chuyên'), chips(LOPS.map((l) => [l, l]), (v) => draft.lop === v, (v) => { draft.lop = v; }, 'Lớp chuyên'));
      } else if (draft.role === 'gv') {
        const dept = h('input', { class: 'input', id: 'ob-dept', maxlength: 30, value: draft.dept, placeholder: 'Ví dụ: Toán, Ngữ văn, Văn phòng', oninput: (e) => { draft.dept = e.target.value; } });
        parts.push(h('label', { class: 'ob-lbl' }, 'Danh xưng'), chips([['Thầy', '👨‍🏫 Thầy'], ['Cô', '👩‍🏫 Cô']], (v) => draft.title === v, (v) => {
          draft.title = v; draft.look.gender = v === 'Thầy' ? 'nam' : 'nu';
          if (draft.look.gender === 'nam') { draft.look.bottom = 'quan'; if (GIRL_HAIR.includes(draft.look.hair)) draft.look.hair = 0; }
          draft.look.outfit = outfitsFor('gv', draft.look)[0];
        }, 'Danh xưng'),
        h('label', { class: 'ob-lbl', for: 'ob-dept' }, 'Bộ môn hoặc phòng ban'), dept);
      } else {
        const em = draft.role === 'em';
        const sch = h('input', { class: 'input', id: 'ob-school', maxlength: 60, value: draft.school, 'aria-label': 'Trường',
          placeholder: em ? 'Ví dụ: THCS Nha Trang' : 'Ví dụ: THPT Gang Thép', oninput: (e) => { draft.school = e.target.value; } });
        parts.push(h('label', { class: 'ob-lbl', for: 'ob-school' }, em ? 'Tên trường của em' : 'Tên trường của bạn'), sch);
      }
      b.replaceChildren(h('div', { class: 'ob-step' }, ...parts, err, btns(() => {
        const needClass = draft.role === 'cuuhs' || draft.role === 'hs';
        if (needClass && !draft.khoa) { err.textContent = 'Bạn chọn khóa nhé'; return; }
        if (needClass && !draft.lop) { err.textContent = 'Bạn chọn lớp nhé'; return; }
        stepLook();
      }, stepRole)));
    };

    const stepLook = () => {
      setTitle('Chọn ngoại hình');
      b.replaceChildren(h('div', { class: 'ob-step' }, avatarEditor(draft.look, draft.role), btns(stepName, stepInfo)));
    };

    const stepName = () => {
      setTitle('Tên hiển thị');
      const err = h('p', { class: 'err', role: 'alert' });
      const go = h('button', { class: 'btn primary big', disabled: draft.name.trim().length < 2, onclick: async () => {
        go.disabled = true; go.textContent = 'Đang lưu…';
        const school = draft.role === 'gv' ? gvLabel() : draft.school.trim();
        try { const r = await api('register', { ...draft, name: draft.name.trim(), school }); setToken(r.token); setMe(r.user); stepCode(); }
        catch (ex) { err.textContent = ex.message; go.disabled = false; go.textContent = 'Vào sân trường'; }
      } }, 'Vào sân trường');
      const name = h('input', { class: 'input', id: 'ob-name', maxlength: 40, value: draft.name, placeholder: 'Ví dụ: Minh Anh', autocomplete: 'nickname', 'aria-label': 'Tên',
        oninput: (e) => { draft.name = e.target.value; go.disabled = draft.name.trim().length < 2; },
        onkeydown: (e) => { if (e.key === 'Enter' && !go.disabled) go.click(); } });
      b.replaceChildren(h('div', { class: 'ob-step' },
        h('div', { class: 'ob-center' }, avatarCanvas(draft.look, 110)),
        h('p', { class: 'ob-center muted' }, summary()),
        h('label', { class: 'ob-lbl', for: 'ob-name' }, 'Mọi người sẽ thấy tên này trên đầu nhân vật'), name, err,
        h('div', { class: 'ob-btns' }, go, h('button', { class: 'btn link muted', onclick: stepLook }, 'Quay lại'))));
      setTimeout(() => name.focus(), 50);
    };

    const stepCode = () => {
      setTitle('Lưu mã khôi phục');
      const copy = h('button', { class: 'btn ghost', onclick: () => { navigator.clipboard?.writeText(me.code).then(() => { copy.textContent = 'Đã sao chép ✓'; }); } }, 'Sao chép mã');
      b.replaceChildren(h('div', { class: 'ob-step' },
        h('p', {}, 'Nhân vật của bạn đã được lưu. Khi ', h('b', {}, 'đổi máy'), ' hoặc ', h('b', {}, 'xóa dữ liệu trình duyệt'), ', bạn nhập mã này để lấy lại đúng nhân vật.'),
        h('div', { class: 'code-box' }, me.code), copy,
        h('p', { class: 'warn-box' }, 'Không gửi mã này cho người khác: ai có mã sẽ vào được nhân vật của bạn.'),
        h('button', { class: 'btn primary big', onclick: () => { closeSheet(); toast(`Chào ${me.name}! Chạm vào sân để đi, chạm nhãn hoặc cửa lớp để vào lớp, căng tin…`); } }, 'Tôi đã lưu, vào sân trường')));
    };
    stepRole();
  });
}

// Bộ chọn ngoại hình (giống trang mẫu): xem trước động + Ngẫu nhiên, giới tính, màu da, kiểu tóc, màu tóc,
// kiểu dáng (nữ), trang phục theo vai, màu áo lớp. Sửa trực tiếp object `look`.
function avatarEditor(look, role = me.role, onChange = () => {}) {
  Object.assign(look, normLook(look));
  delete look.bag;
  if (!outfitsFor(role, look).includes(look.outfit)) look.outfit = outfitsFor(role, look)[0];
  const stage = avatarStage({ ...look }, 150);
  const root = h('div', { class: 'look' });
  const changed = () => { stage.set({ ...look }); onChange(look); render(); };
  const chips = (label, items, cur, pick) => [h('div', { class: 'ob-lbl' }, label), h('div', { class: 'ob-chips', role: 'group', 'aria-label': label },
    ...items.map(([val, text]) => h('button', { class: 'ob-chip' + (cur === val ? ' on' : ''), 'aria-pressed': String(cur === val), onclick: () => { pick(val); changed(); } }, text)))];
  const swatches = (label, items, cur, pick, names) => [h('div', { class: 'ob-lbl' }, label), h('div', { class: 'ob-chips', role: 'group', 'aria-label': label },
    ...items.map((bg, i) => h('button', { class: 'ob-sw' + (cur === i ? ' on' : ''), style: { background: bg }, 'aria-pressed': String(cur === i),
      'aria-label': `${label} ${names ? names[i] : i + 1}`, title: names ? names[i] : '', onclick: () => { pick(i); changed(); } })))];
  const render = () => {
    const outfits = outfitsFor(role, look);
    root.replaceChildren(
      h('div', { class: 'look-stage' }, stage.el, h('button', { class: 'btn ghost dice', onclick: () => {
        const keep = look.outfit; Object.assign(look, randomLook(role, look.gender)); if (outfitsFor(role, look).includes(keep)) look.outfit = keep; changed();
      } }, '🎲 Ngẫu nhiên')),
      ...chips('Giới tính', [['nam', '👦 Nam'], ['nu', '👧 Nữ']], look.gender, (g) => {
        const i = outfitsFor(role, look).indexOf(look.outfit);
        look.gender = g;
        if (g === 'nam') { look.bottom = 'quan'; if (GIRL_HAIR.includes(look.hair)) look.hair = 0; }
        const list = outfitsFor(role, look); look.outfit = list[i] || list[0];
      }),
      ...swatches('Màu da', SKINS, look.skin, (i) => { look.skin = i; }),
      ...chips('Kiểu tóc', HAIR_NAMES.map((n, i) => [i, n]), look.hair, (i) => { look.hair = i; }),
      ...swatches('Màu tóc', HAIR_COLORS.map((_, i) => HAIR_SWATCH(i)), look.hairColor, (i) => { look.hairColor = i; }, HAIR_COLOR_NAMES),
      ...(look.gender === 'nu' ? chips('Kiểu dáng', [['quan', 'Quần'], ['vay', 'Váy']], look.bottom, (v) => { look.bottom = v; }) : []),
      ...chips('Trang phục', outfits.map((o) => [o, outfitLabel(role, o)]), look.outfit, (o) => { look.outfit = o; }),
      ...(look.outfit === 'aolop' ? swatches('Màu áo lớp', SHIRT_COLORS, look.color ?? 0, (i) => { look.color = i; }) : []),
    );
  };
  render();
  return root;
}

// ======================= Nhạc nền: 3 bài phát lần lượt, hết bài cuối quay lại bài đầu =======================
// File nằm trong public/music/. Trình duyệt chỉ cho phát tiếng sau khi người dùng chạm/bấm lần đầu,
// nên nếu tự phát bị chặn thì nhạc bắt đầu ngay ở lần chạm đầu tiên.
const PLAYLIST = [
  { src: 'music/hanoi-n-u.mp3', title: 'Hanoi n U (beat)' },
  { src: 'music/thang-5-khong-tro-lai.mp3', title: 'Tháng 5 không trở lại' },
  { src: 'music/ngay-ay-ban-va-toi.mp3', title: 'Ngày ấy bạn và tôi' },
];
const music = {
  audio: null,
  i: 0,
  playing: false,
  onChange: null,
  button: h('button', { class: 'music-btn', 'aria-label': 'Âm thanh: nhạc nền và hiệu ứng', title: 'Âm thanh', onclick: () => soundSheet() }, '🎵'),
  el() {
    if (!this.audio) {
      const a = this.audio = new Audio();
      a.preload = 'auto';
      a.addEventListener('ended', () => this.next());
      a.addEventListener('play', () => { this.playing = true; this.sync(); });
      a.addEventListener('pause', () => { this.playing = false; this.sync(); });
      a.addEventListener('error', () => { if (this.playing) this.next(); });
    }
    return this.audio;
  },
  load(i) {
    this.i = (i + PLAYLIST.length) % PLAYLIST.length;
    const a = this.el();
    a.src = PLAYLIST[this.i].src;
    a.volume = soundSettings.music / 100;
    this.sync();
  },
  play() {
    const a = this.el();
    if (!a.src) this.load(this.i);
    a.volume = soundSettings.music / 100;
    return a.play().then(() => true, () => false);
  },
  pause() { this.audio?.pause(); },
  next() { this.load(this.i + 1); this.play(); },
  prev() { this.load(this.i - 1); this.play(); },
  pick(i) { this.load(i); this.play(); soundSettings.musicOn = true; saveSettings(); },
  toggle() {
    if (this.playing) { this.pause(); soundSettings.musicOn = false; } else { this.play(); soundSettings.musicOn = true; }
    saveSettings();
  },
  volume(v) { if (this.audio) this.audio.volume = v / 100; },
  // Tự phát khi vào trường (trừ khi người dùng đã tắt nhạc lần trước)
  autostart() {
    if (soundSettings.musicOn === false) return;
    this.play().then((ok) => {
      if (ok) return;
      const go = () => {
        window.removeEventListener('pointerdown', go, true); window.removeEventListener('keydown', go, true);
        if (!this.playing && soundSettings.musicOn !== false) this.play();
      };
      window.addEventListener('pointerdown', go, true); window.addEventListener('keydown', go, true);
    });
  },
  title() { return PLAYLIST[this.i].title; },
  sync() {
    this.button.classList.toggle('on', this.playing); this.button.setAttribute('aria-pressed', String(this.playing));
    this.button.title = this.playing ? '🎵 Đang phát: ' + this.title() : 'Âm thanh';
    this.onChange?.();
  },
};

// ======================= Sân trường =======================
const hud = { update() {} };

function enterSchool() {
  const canvas = h('canvas', { id: 'world', 'aria-label': 'Sơ đồ sân trường. Chạm để di chuyển, chạm nhãn để mở.' });
  const zoneEl = h('b', {}, 'Sân trường');
  const clockEl = h('small', {});
  const online = h('button', { class: 'online-pill', title: 'Ai đang online', onclick: () => onlineSheet() }, h('i', {}), h('span', {}, '1'));
  // Khung chat chung: tin nhắn của mọi người ở mọi khu, tên kèm khóa · lớp; thu gọn được (nhớ trên máy)
  const feedList = h('div', { class: 'chat-list', 'aria-live': 'polite' });
  const feedBadge = h('i', { class: 'chat-badge', hidden: true });
  const feedToggle = h('span', { class: 'chat-toggle', 'aria-hidden': 'true' });
  let unread = 0;
  const feed = h('section', { class: 'chat-feed', 'aria-label': 'Khung chat chung' });
  const setMin = (min) => {
    feed.classList.toggle('min', min); feedToggle.textContent = min ? '▴' : '▾';
    feedHead.setAttribute('aria-expanded', String(!min));
    if (!min) { unread = 0; feedBadge.hidden = true; feedList.scrollTop = feedList.scrollHeight; }
    try { localStorage.setItem('ctn.chatMin', min ? '1' : ''); } catch { /* */ }
  };
  const feedHead = h('button', { class: 'chat-head', onclick: () => setMin(!feed.classList.contains('min')) }, '💬 Trò chuyện chung', feedBadge, feedToggle);
  feed.append(feedHead, feedList);
  const ownPending = [];
  feedEl = feed;
  refreshAdminUi();
  // tin bị quản trị xoá: gỡ khỏi khung chat
  removeChatRows = (ids) => { for (const id of ids) feedList.querySelectorAll(`[data-id="${CSS.escape(id)}"]`).forEach((r) => r.remove()); };
  // tin của mình quay về từ máy chủ: gắn id cho dòng đã hiện lúc gửi
  matchOwn = (m) => { const i = ownPending.findIndex((p) => p.text === m.text); if (i >= 0) { ownPending[i].row.dataset.id = m.id; ownPending.splice(i, 1); } };
  addFeed = ({ id, uid, name, sub, text, mine = false }) => {
    const atBottom = feedList.scrollHeight - feedList.scrollTop - feedList.clientHeight < 30;
    const row = h('div', { class: 'feed-row' + (mine ? ' own' : ''), 'data-id': id || '' }, h('b', {}, name), sub ? h('small', {}, ' ' + sub) : null, ': ', text);
    // quản trị: nút xoá tin / khoá người nhắn ngay trên dòng tin
    if (uid) row.append(h('button', { class: 'feed-x', 'aria-label': 'Quản trị tin nhắn của ' + name, onclick: () => adminMsgSheet({ id: row.dataset.id, uid, name, text }) }, '⋯'));
    feedList.append(row);
    if (mine && !id) ownPending.push({ row, text });
    while (feedList.children.length > 50) feedList.firstChild.remove();
    if (atBottom || mine) feedList.scrollTop = feedList.scrollHeight;
    if (feed.classList.contains('min') && !mine) { unread++; feedBadge.textContent = String(unread); feedBadge.hidden = false; }
  };
  setMin((() => { try { return !!localStorage.getItem('ctn.chatMin'); } catch { return false; } })());
  const shieldBtn = h('button', { class: 'fab balloon shield', 'aria-label': 'Tạm không chơi bóng nước', 'aria-pressed': 'false', title: 'Bật khiên: không ai ném bóng nước trúng bạn', onclick: () => {
    world.shield = !world.shield;
    shieldBtn.classList.toggle('on', world.shield); shieldBtn.setAttribute('aria-pressed', String(world.shield));
    toast(world.shield ? '🛡️ Đã bật khiên: tạm không chơi bóng nước' : '🎈 Đã tắt khiên, sẵn sàng chơi bóng nước!');
  } }, '🛡️');
  const right = h('div', { class: 'hud-right' });
  const chatInput = h('input', { class: 'chat-input', maxlength: 80, 'aria-label': 'Trò chuyện' });
  const sendBtn = h('button', { class: 'chat-send', 'aria-label': 'Gửi' }, '➤');

  const updateClock = () => { const now = Date.now(); clockEl.replaceChildren(h('span', { class: 'clock' }, vnClock(now)), ' · ' + periodOf(now).label); };
  hud.update = () => {
    right.replaceChildren(...[online, music.button,
      getMode() === 'offline' ? h('span', { class: 'chip warn', title: 'Dữ liệu chỉ lưu trên máy này' }, 'Ngoại tuyến') : null,
      me.guest
        ? h('button', { class: 'hud-btn', onclick: () => createFlow() }, 'Ghi danh')
        : [
          h('button', { class: 'hud-icon', 'aria-label': `Nhiệm vụ${me.badge ? `: ${me.badge} phần thưởng chờ nhận` : ''}`, onclick: () => questSheet() }, '📜', me.badge ? h('i', { class: 'badge' }, String(me.badge)) : null),
          h('button', { class: 'chip wallet', 'aria-label': 'Ví ăn vặt: ' + money(me.wallet), onclick: () => walletSheet() }, '💰 ', h('span', { class: 'long' }, money(me.wallet)), h('span', { class: 'short' }, shortMoney(me.wallet))),
          h('button', { class: 'hud-avatar', 'aria-label': 'Nhân vật của bạn', onclick: () => moreSheet() }, avatarCanvas(me.look, 34))]].flat().filter(Boolean));
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
      h('div', { class: 'brand' }, h('img', { class: 'logo', src: 'logo.jpg', alt: 'Logo Trường THPT Chuyên Thái Nguyên' }), h('div', {}, zoneEl, clockEl)),
      right),
    h('div', { class: 'fabs' },
      h('button', { class: 'fab balloon', 'aria-label': 'Chụp ảnh kỷ yếu', title: 'Chụp ảnh kỷ yếu', onclick: () => panels.photo() }, '📸'),
      h('button', { class: 'fab balloon', 'aria-label': 'Ném bóng nước', title: 'Chọn bạn để ném bóng nước', onclick: () => balloonPicker() }, '🎈'),
      shieldBtn,
      h('button', { class: 'fab', 'aria-label': 'Phóng to', onclick: () => world.zoomBy(1.2) }, '+'),
      h('button', { class: 'fab', 'aria-label': 'Thu nhỏ', onclick: () => world.zoomBy(1 / 1.2) }, '−')),
    feed,
    h('div', { id: 'banner', class: 'banner', hidden: true }),
    h('footer', { class: 'chatbar' },
      h('div', { class: 'quick-row' },
        ...QUICK.map((q) => h('button', { class: 'pill', onclick: () => send(q) }, q)),
        ...EMOJI.map((q) => h('button', { class: 'pill emoji', 'aria-label': q, onclick: () => send(q) }, q))),
      h('div', { class: 'chat-row' },
        h('button', { class: 'map-btn', 'aria-label': 'Bản đồ trường', onclick: () => mapSheet() }, '🗺️'),
        chatInput, sendBtn)),
  );

  world = new World(canvas);
  const measure = () => {
    const hud = app.querySelector('.hud'), bar = app.querySelector('.chatbar'), r = canvas.getBoundingClientRect();
    world.insets = { top: hud ? Math.max(0, hud.getBoundingClientRect().bottom - r.top) : 56, bottom: bar ? Math.max(0, r.bottom - bar.getBoundingClientRect().top) : 0 };
  };
  requestAnimationFrame(measure);
  window.addEventListener('resize', measure);
  world.setMe({ ...loadPos(), look: me.look, name: me.name, sub: '' });
  world.me.sub = world.subOf(me);
  world.npcs = campusNpcs();
  loadNpcNames();
  world.onArrive = (hs) => openHotspot(hs);
  world.onTapPlayer = (p) => playerCard(p);
  world.onTapNpc = (n) => npcSheet(n);
  world.onSay = () => {}; // lời nói hiện thành bong bóng; khung chat lấy từ máy chủ (tin của mọi khu)
  world.onSit = (seat) => onSit(seat);
  world.onHitOther = (id) => {
    sfx.splash();
    if (!me.guest) call('act', { kind: 'hit', value: id, scene: world.scene.id }).then((r) => { setMe(r.user); if (r.msg) toast(r.msg, 'bad'); }).catch(() => {});
  };
  world.myId = me.id || '';
  world.onSceneChange = (scene) => {
    zoneEl.textContent = scene.id === 'campus' ? (ZONES[world.zoneOf(world.me.x, world.me.y)] || 'Sân trường') : scene.name;
    canvas.setAttribute('aria-label', scene.id === 'campus' ? 'Sơ đồ sân trường' : scene.name);
  };
  world.onWet = (fromName) => { sfx.splash(); toast(`💦 ${fromName || 'Ai đó'} vừa ném bóng nước trúng bạn!`); world.say('me', 'Ướt hết rồi! 💦'); };
  world.start();
  music.autostart();
  if (new URLSearchParams(location.search).has('debug')) { window.ctnWorld = world; window.ctnDebug = { panels, gameSheet, questSheet, walletSheet, onlineSheet, npcSheet, music, adminTeachersSheet, adminSheet }; } // dùng cho kiểm thử tự động
  hud.update();
  updateClock();
  setInterval(updateClock, 15000);

  let lastZone = '';
  let pendingSay = null;
  sayPrompt.send = (t) => { pendingSay = t; world.say('me', t); if (!me.guest) addFeed({ uid: me.id, name: me.name, sub: world.subOf(me), text: t, mine: true }); };
  let chatAfter = 0, chatDelAfter = 0;
  // tin mới từ máy chủ; tin của chính mình đã hiện ngay lúc gửi nên chỉ lấy ở lần tải lịch sử đầu tiên
  const takeChat = (list) => {
    const first = chatAfter === 0;
    for (const m of list || []) {
      if (m.uid !== me.id || first) addFeed({ id: m.id, uid: m.uid, name: m.name, sub: world.subOf(m), text: m.text, mine: m.uid === me.id });
      else matchOwn(m);
      chatAfter = Math.max(chatAfter, m.at);
    }
    if (chatAfter === 0) chatAfter = 1;
  };
  let pendingThrow = null;
  let lastThrow = 0;
  // Ném bóng nước vào người được chọn (targetId), hoặc ra phía trước nếu không chọn ai
  throwBalloon = (targetId = null) => {
    const now = performance.now();
    if (now - lastThrow < 1200) { toast('Từ từ đã, đang lấy bóng mới…'); return; }
    lastThrow = now;
    const m = world.me;
    const o = targetId ? world.others.get(targetId) : null;
    const t = o ? { x: Math.round(o.x), y: Math.round(o.y - 26), target: targetId }
      : { x: Math.round(m.x + (m.dir || 1) * 170), y: Math.round(m.y - 6), target: '' };
    m.sit = null;
    if (o) m.dir = o.x >= m.x ? 1 : -1;
    world.throwBalloon({ fx: m.x, fy: m.y, tx: t.x, ty: t.y, target: o ? targetId : null });
    sfx.whoosh();
    if (o) toast(`🎈 Ném vào ${o.data.name}!`);
    if (!me.guest) pendingThrow = t;
  };
  const tick = async () => {
    const pos = { x: Math.round(world.me.x), y: Math.round(world.me.y) };
    const zone = world.zoneOf(pos.x, pos.y);
    if (zone !== lastZone) { lastZone = zone; zoneEl.textContent = world.scene.id === 'campus' ? ZONES[zone] || 'Sân trường' : world.scene.name; }
    visitZone(zone.startsWith('lop:') ? 'lop' : zone);
    try {
      let r;
      if (me.guest) r = await api('online', { chatAfter, chatDelAfter });
      else {
        const sit = world.me.sit;
        const body = { ...pos, zone, scene: world.scene.id, sit: !!sit, sitBack: !!(sit && sit.back), dir: world.me.dir || 1, noBalloon: world.shield, chatAfter, chatDelAfter };
        if (pendingSay) { body.say = pendingSay; pendingSay = null; }
        if (pendingThrow) { body.throw = pendingThrow; pendingThrow = null; }
        r = await api('presence', body);
      }
      // chỉ hiện những người cùng cảnh (cùng sân trường, hoặc cùng trong một lớp)
      world.updateOthers(r.others.filter((p) => (p.scene || 'campus') === world.scene.id));
      lastOnline = r.others;
      const here = r.others.filter((p) => (p.scene || 'campus') === world.scene.id).length + (me.guest ? 0 : 1);
      online.lastChild.textContent = String(here);
      online.title = `${here} người ở khu này · ${r.others.length + (me.guest ? 0 : 1)} người cả trường. Bấm để xem`;
      for (const it of r.inbox || []) handleInbox(it);
      takeChat(r.chat);
      if (r.chatDel) { removeChatRows(r.chatDel); chatDelAfter = r.chatDelAt; }
      if (!tick.done) { tick.done = true; hud.update(); }
    } catch (e) { if (e.banned) bannedNotice(e.message); /* lỗi khác: thử lại lượt sau */ }
    if (world.scene.id === 'campus') savePos();
  };
  tick();
  setInterval(tick, 2500);
  setInterval(checkBell, 20000);
  checkBell(true);
  setInterval(() => { if (world.scene.id !== 'campus') return; const z = world.zoneOf(world.me.x, world.me.y); if (z !== lastZone) { lastZone = z; zoneEl.textContent = ZONES[z] || 'Sân trường'; } }, 400);
  window.addEventListener('beforeunload', () => { if (world.scene.id === 'campus') savePos(); });
}

// Đang trong lớp thì ra sân trước, đứng ở cửa lớp
function backToCampus() {
  if (world.scene.id === 'campus') return;
  world.setScene(CAMPUS_SCENE, classReturn || SPAWN);
}
let classReturn = null;
let canteenFriend = null;

function mapSheet() {
  openSheet('Bản đồ trường', (b, { onCleanup }) => {
    const cv = h('canvas', { class: 'overview' });
    b.append(h('p', { class: 'muted' }, 'Chạm vào chỗ muốn tới, nhân vật sẽ tự đi bộ tới.'), cv,
      h('h3', {}, 'Các lớp chuyên'),
      h('div', { class: 'place-list small' }, ...HOTSPOTS.filter((x) => x.panel === 'enterClass').map((p) => h('button', { class: 'place', onclick: () => { closeSheet(); backToCampus(); world.goToHotspot(p); } }, h('span', {}, '🚪'), p.label))));
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
      backToCampus();
      if (res.hotspot) world.goToHotspot(res.hotspot); else world.walkTo(res.x, res.y);
    });
  }, { wide: true });
}

function shortMoney(v) { v = v || 0; return v >= 1e6 ? (v / 1e6).toFixed(1).replace('.0', '') + 'tr' : v >= 1000 ? Math.floor(v / 1000) + 'k' : v + 'đ'; }
function sayPrompt() {}
let throwBalloon = () => {};

function moreSheet() {
  openSheet('Nhân vật của tôi', (b) => {
    b.append(h('div', {},
      h('div', { class: 'me-card' }, avatarCanvas(me.look, 72), h('div', {}, h('b', {}, me.name), h('div', { class: 'muted' }, ROLES[me.role] + (describe(me) ? ' · ' + describe(me) : '')), h('div', { class: 'muted' }, '⭐ ' + me.points + ' điểm thi đua · 💰 ' + money(me.wallet)))),
      h('label', { class: 'lbl' }, 'Mã khôi phục'), h('div', { class: 'code-box sm' }, me.code),
      getMode() === 'offline' ? h('p', { class: 'note' }, 'Đang ở chế độ ngoại tuyến: dữ liệu chỉ lưu trên trình duyệt này, không thấy bạn bè online. Triển khai lên Cloudflare (xem README) để dùng chung.') : null,
      h('div', { class: 'stack' },
        h('button', { class: 'btn primary', onclick: () => panels.mirror() }, '👕 Đổi kiểu tóc, đồng phục'),
        h('button', { class: 'btn ghost', onclick: () => bookSheet({ id: me.id, name: me.name }) }, '📖 Sổ lưu bút của tôi'),
        h('button', { class: 'btn ghost', onclick: () => albumSheet() }, '🖼️ Album kỷ yếu'),
        h('button', { class: 'btn ghost', onclick: () => adminTeachersSheet() }, '🔑 Quản trị (tên thầy cô, tin nhắn, thành viên)'),
        h('a', { class: 'btn ghost', href: 'pages/gioi-thieu.html' }, 'Giới thiệu trang'),
        h('button', { class: 'btn ghost', onclick: () => { backToCampus(); world.teleport(SPAWN.x, SPAWN.y); closeSheet(); } }, 'Về cổng trường'),
        h('button', { class: 'btn danger', onclick: () => { if (confirm('Thoát nhân vật trên máy này? Hãy chắc chắn bạn đã lưu mã khôi phục.')) { setToken(''); location.reload(); } } }, 'Thoát nhân vật'))));
  });
}

function playerCard(p) {
  openSheet(p.name, (b) => {
    b.append(h('div', { class: 'me-card' }, avatarCanvas(p.look, 72), h('div', {}, h('b', {}, p.name), h('div', { class: 'muted' }, ROLES[p.role] + (describe(p) ? ' · ' + describe(p) : '')))),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', onclick: () => { if (!needMe()) return; sayPrompt.send(`👋 Chào ${p.name}!`); closeSheet(); } }, '👋 Vẫy tay'),
        h('button', { class: 'btn ghost', onclick: () => { closeSheet(); throwBalloon(p.id); } }, '🎈 Ném bóng nước')),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', onclick: () => bookSheet({ id: p.id, name: p.name }) }, '✍️ Viết sổ lưu bút'),
        h('button', { class: 'btn ghost', onclick: () => loveSheet(p) }, '💌 Tỏ tình')),
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', onclick: () => { if (!needMe()) return; canteenFriend = p.id; closeSheet(); panels.canteen(); } }, '🍜 Đãi bạn'),
        h('button', { class: 'btn primary', onclick: () => { closeSheet(); const o = world.others.get(p.id); world.walkTo((o ? o.x : p.x) + 30, o ? o.y : p.y); } }, 'Đi tới')));
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


const panels = {
  gate() {
    openSheet('Cổng trường', (b) => {
      b.append(
        h('div', { class: 'hero-sign' }, 'TRƯỜNG THPT CHUYÊN THÁI NGUYÊN'),
        h('p', {}, 'Cổng chính mở ra đường Lương Ngọc Quyến. Đây là cơ sở 234A Lương Ngọc Quyến, phường Quang Trung, nơi trường học từ năm 1995 đến 2019 trước khi chuyển về cơ sở mới.'),
        h('ul', { class: 'bullets' },
          h('li', {}, '🛵 Gửi xe phía trái cổng để điểm danh và nhận 20k ăn vặt mỗi ngày.'),
          h('li', {}, '🏫 Trước mặt là dãy nhà 5 tầng; bên trái là nhà hiệu bộ và lối vào, đi lên bậc thang chính là tới sân trường.'),
          h('li', {}, '🚪 Dãy 3, 4, 5 tầng là các dãy lớp học: mỗi lớp chuyên một cửa. Nhà đa năng và căng tin ở bên phải sân.')),
        h('a', { class: 'btn ghost', href: 'pages/gioi-thieu.html' }, 'Giới thiệu trang'),
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
    openSheet('🛵 Gửi xe · điểm danh', async (b) => {
      b.append(h('p', {}, 'Mỗi ngày đến trường là một lần điểm danh: bố mẹ cho 20k ăn vặt, đi học đều 5 ngày liền được thưởng thêm.'));
      if (me.guest) { b.append(h('button', { class: 'btn primary', onclick: () => createFlow() }, 'Ghi danh để điểm danh')); return; }
      const out = h('div', {});
      const ticket = (r) => h('div', { class: 'ticket' },
        h('div', { class: 'ticket-head' }, '🎫 VÉ XE HÔM NAY'),
        h('div', { class: 'ticket-body' }, h('span', { class: 'ticket-ico' }, TRANSPORTS[r.transport || me.transport]?.icon || '🚲'),
          h('div', {}, h('b', {}, me.name), h('small', {}, [TRANSPORTS[r.transport || me.transport]?.name, describe(me)].filter(Boolean).join(' · ')))),
        h('div', { class: 'ticket-foot' }, `🔥 Chuỗi đi học: ${r.streak ?? me.streak} ngày`));
      if (me.lastCheckin && me.lastCheckin === new Date(Date.now() + 2 * 3600e3).toISOString().slice(0, 10)) {
        out.append(ticket({}), h('p', { class: 'ok' }, 'Hôm nay bạn đã điểm danh rồi. Mai quay lại nhé!'));
        b.append(out); return;
      }
      b.append(h('h3', {}, 'Hôm nay bạn đến trường bằng gì?'),
        h('div', { class: 'transport' }, ...Object.entries(TRANSPORTS).map(([k, t]) => h('button', { class: 'place', onclick: async () => {
          try {
            const r = await call('checkin', { transport: k });
            setMe(r.user);
            if (r.already) { out.replaceChildren(ticket(r), h('p', { class: 'ok' }, 'Hôm nay bạn đã điểm danh rồi.')); return; }
            sfx.coin();
            out.replaceChildren(ticket(r),
              r.punished ? h('p', { class: 'err' }, '📛 Hôm qua bị ghi tên vào sổ đầu bài nên hôm nay bố mẹ không cho tiền ăn vặt!')
                : h('p', { class: 'ok big' }, `👪 Bố mẹ cho ${money(r.gained)} ăn vặt hôm nay!`),
              r.bonus ? h('p', { class: 'ok' }, `🔥 Đi học đều ${r.streak} ngày: thưởng thêm ${money(r.bonus)}!`) : null,
              h('p', { class: 'muted' }, k === 'bus' ? '🚌 Xe bus miễn phí! ' : k === 'dibo' ? '🚶 Đi bộ cho khỏe! ' : '', 'Trong ví: ' + money(me.wallet)));
            world.say('me', `${t.icon} Đến trường rồi!`);
          } catch (e) { out.replaceChildren(h('p', { class: 'err' }, e.message)); }
        } }, h('span', {}, t.icon), t.name))), out);
    });
  },

  board() {
    openSheet('🏆 Bảng thi đua', (b) => {
      b.append(h('p', { class: 'muted' }, 'Điểm thi đua: điểm danh, ngồi vào lớp mình, chào cờ, viết lưu bút, chơi trò chơi, đãi bạn, nhận thành tựu…' + (me.guest ? '' : ` Bạn đang có ${me.points} điểm.`)));
      const gameBoard = async (c, id) => {
        const r = await call('leaderboard', { game: id });
        return rankList(r.items.map((x) => ({ name: x.name, sub: `${x.lop || ''} ${x.khoa || ''}`, val: `${x.score} ${GAMES[id].unit}` })), 'Chưa ai chơi.');
      };
      b.append(tabs([
        { label: 'Cá nhân', render: async (c) => {
          const r = await call('khoaBoard');
          c.append(rankList(r.people.map((x) => ({ name: x.name, sub: x.khoa ? `${x.lop} ${x.khoa}` : ROLES[x.role], val: x.points })), 'Chưa có ai.'));
        } },
        { label: 'Theo khóa', render: async (c) => {
          const r = await call('khoaBoard');
          c.append(rankList(r.khoa.map((x) => ({ name: x.khoa, sub: x.members + ' người', val: x.points })), 'Chưa có khóa nào. Mời bạn cùng khóa vào chơi!'));
        } },
        { label: 'Lớp chuyên', render: async (c) => {
          const r = await call('khoaBoard');
          c.append(rankList(r.lop.map((x) => ({ name: 'Chuyên ' + x.lop, sub: x.members + ' người', val: x.points })), 'Chưa có dữ liệu.'));
        } },
        { label: 'Trò chơi', render: (c) => {
          const out = h('div', {});
          const ids = ['dacau', 'penalty', 'bongro', 'hoahoc', 'domin', 'baicu'];
          const chips = h('div', { class: 'quick' }, ...ids.map((id) => h('button', { class: 'pill', onclick: async (e) => {
            chips.querySelectorAll('.pill').forEach((x) => x.classList.remove('on')); e.currentTarget.classList.add('on');
            out.replaceChildren(await gameBoard(out, id));
          } }, GAMES[id].icon + ' ' + GAMES[id].name)));
          c.append(chips, out);
          chips.firstChild.click();
        } },
      ]));
    });
  },

  office(hs) {
    openSheet('🏛️ Nhà hiệu bộ', (b) => {
      b.append(tabs([
        { label: '📅 Họp lớp', render: (c) => eventsView(c) },
        { label: '💐 Tri ân', render: (c) => thanksView(c) },
        { label: '🎓 Phòng cấp bằng', render: (c) => diplomaView(c) },
      ], hs?.tab ?? (isTeachersDay() ? 1 : 0)));
    }, { wide: true });
  },

  // Đi vào một phòng (rooms.js): nhớ cửa để ra đúng chỗ, thêm nhân vật trong phòng, đếm "ghé khu"
  enterRoom(hs) {
    const make = ROOMS[hs.room];
    if (!make) return;
    const sc = make();
    classReturn = { x: hs.x, y: hs.y };
    world.npcs = [...world.npcs.filter((n) => n.scene === 'campus'), ...roomNpcs(sc.id)];
    world.setScene(sc, (hs.spot && sc.spots[hs.spot]) || sc.spawn);
    loadNpcNames();
    if (sc.zone) visitZone(sc.zone);
    sfx.click();
    toast(`${sc.name}: chạm vào đồ vật, nhãn hoặc nhân vật để dùng. Chạm "Ra sân" để ra.`);
  },
  exitRoom() { backToCampus(); },
  domin() { gameSheet('domin'); },
  hoahoc() { gameSheet('hoahoc'); },
  bongro() { gameSheet('bongro'); },
  honor() {
    openSheet('🏅 Bảng vàng đội tuyển', (b) => {
      b.append(h('p', { class: 'muted' }, 'Các thế hệ đội tuyển học sinh giỏi quốc gia, Olympic của trường. Ghi lại giải thưởng của bạn hoặc của lớp mình: môn, năm, giải.'));
      guestbook(b, 'doituyen', { placeholder: 'Vd: Giải Nhì HSG quốc gia môn Toán năm 2008…', empty: 'Bảng vàng còn trống. Bạn ghi danh đầu tiên nhé!' });
    });
  },
  newsRack() {
    const t = ['📰 Hoa học trò số mới: "Mùa thi, mùa phượng…"', '📰 Báo Mực tím có bài về lớp chuyên Văn!', '📰 Toán tuổi thơ: thử giải bài đố tuần này nào.', '📰 Báo tường 20/11 của các lớp được treo ở đây.'];
    toast(t[Math.floor(Math.random() * t.length)]);
    world.say('me', 'Đọc báo chút đã 📰');
  },
  club(hs) {
    const c = CLUBS.find((x) => x.id === hs.club);
    if (!c) return;
    openSheet(c.icon + ' ' + c.name, (b) => {
      b.append(h('p', { class: 'muted' }, c.desc));
      guestbook(b, 'clb:' + c.id, { placeholder: 'Nhắn gì đó cho CLB…' });
    });
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
          h('div', {}, h('b', {}, '1995 – 2019'), h('p', {}, 'Trường học tại cơ sở 234A đường Lương Ngọc Quyến: nhà hiệu bộ 4 tầng sơn xanh trắng, các dãy lớp 3, 4, 5 tầng quây quanh sân trường cao có bậc thang, sân đá cầu, nhà đa năng và căng tin.')),
          h('div', {}, h('b', {}, '2019'), h('p', {}, 'Trường chuyển về cơ sở mới, khang trang hơn với nhà đa năng, bể bơi, sân bóng và ký túc xá.')),
          h('div', {}, h('b', {}, 'Hôm nay'), h('p', {}, 'Sân trường ảo này dựng lại cơ sở cũ để các thế hệ học sinh cùng về thăm.'))),
        h('button', { class: 'btn ghost', onclick: () => albumSheet() }, '🖼️ Xem album ảnh kỷ yếu'),
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
      const intro = h('div', {}, h('button', { class: 'btn primary', onclick: () => gameSheet('bongro') }, '🏀 Ra sân bóng rổ trong nhà'), h('p', { class: 'muted' }, 'Mỗi CLB một gian. Chọn để vào gian CLB.'));
      listEl.append(...CLUBS.map((c) => h('button', { class: 'place', onclick: () => show(c) }, h('span', {}, c.icon), c.name)));
      b.append(intro, listEl);
    });
  },

  canteen() {
    openSheet('Căng tin', async (b) => {
      const head = h('div', {});
      const list = h('div', { class: 'menu' });
      const friends = friendsHere();
      const forInp = h('select', { class: 'input', 'aria-label': 'Đãi bạn' }, h('option', { value: '' }, 'Mua cho mình'),
        ...friends.map((f) => h('option', { value: f.id, selected: f.id === canteenFriend }, `🤝 Đãi ${f.name}${f.khoa ? ' (' + [f.lop, f.khoa].filter(Boolean).join(' ') + ')' : ''}`)));
      canteenFriend = null;
      if (!friends.length) forInp.disabled = true;
      const friendName = () => friends.find((f) => f.id === forInp.value)?.name || '';
      const feed = h('div', { class: 'feed' });
      b.append(head, h('label', { class: 'lbl' }, friends.length ? 'Đãi một bạn đang ở gần' : 'Đãi bạn: chưa có ai online ở gần'), forInp, list, h('h3', {}, 'Vừa mua'), feed);
      const loadFeed = async () => {
        const r = await call('purchases');
        feed.replaceChildren(...(r.items.length ? r.items.map((x) => h('div', { class: 'feed-item' }, `${x.emoji} ${x.name} mua ${x.item}${x.forName ? ' đãi ' + x.forName : ''} · ${ago(x.at)}`)) : [h('p', { class: 'muted' }, 'Chưa ai mua gì.')]));
      };
      const r = await call('menu');
      head.replaceChildren(h('p', {}, 'Trong ví: ', h('b', {}, money(me.wallet))), r.sale ? h('p', { class: 'ok' }, '🎉 Đang giờ ra chơi: giảm 20%!') : h('p', { class: 'muted' }, `Đúng giờ ra chơi thật (${BREAK_TEXT}) được giảm 20%.`));
      list.append(...r.items.map((m) => h('button', { class: 'menu-item', onclick: async () => {
        try {
          const fn = friendName();
          const x = await call('buy', { item: m.id, forUid: forInp.value || undefined });
          setMe(x.user); sfx.coin();
          head.querySelector('b').textContent = money(me.wallet);
          toast(fn ? `🤝 Đã đãi ${fn} ${m.emoji} ${m.name}!` : `${m.emoji} Bạn đã mua ${m.name}. Ngon quá!`);
          sayPrompt.send?.(`${m.emoji} ${fn ? 'Đãi ' + fn + ' ' : 'Ăn '}${m.name.toLowerCase()}!`);
          loadFeed();
        } catch (e) { toast(e.message, 'bad'); }
      } }, h('span', { class: 'emoji' }, m.emoji), h('span', {}, m.name), h('b', {}, money(m.final), m.final !== m.price ? h('s', {}, money(m.price)) : null))));
      loadFeed();
    });
  },

  football() {
    openSheet('🏸 Sân đá cầu', (b, { onCleanup }) => {
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
    openSheet('Sân trường · Ghế đá', (b) => {
      b.append(h('p', { class: 'muted' }, 'Hàng cau vua, chậu cảnh, ghế đá giữa sân – nơi tâm sự giờ ra chơi.'));
      guestbook(b, 'ghe-da', { placeholder: 'Tâm sự một chút…' });
    });
  },

  stage() {
    openSheet('🎤 Sân khấu · Chào cờ', (b) => {
      b.append(h('div', { class: 'hero-sign' }, 'HIỀN TÀI LÀ NGUYÊN KHÍ CỦA QUỐC GIA'));
      if (isTeachersDay()) {
        const years = new Date().getFullYear() - 1982;
        b.append(h('div', { class: 'card td' },
          h('h3', {}, `💐 Lễ kỷ niệm ${years} năm Ngày Nhà giáo Việt Nam 20/11`),
          h('p', { class: 'speech' }, 'Kính thưa các thầy cô giáo, các thế hệ học sinh thân mến! Hôm nay chúng ta cùng về mái trường Chuyên Thái Nguyên để tri ân những người lái đò thầm lặng…'),
          h('button', { class: 'btn primary', onclick: () => { closeSheet(); panels.office(); } }, '💐 Tặng hoa tri ân thầy cô')));
      }
      b.append(h('div', { class: 'card' },
        h('h3', {}, '🇻🇳 Chào cờ sáng thứ Hai'),
        h('p', { class: 'muted' }, 'Sáng thứ Hai (trước 12 giờ trưa), ngồi vào hàng ghế của lớp mình trước sân khấu để điểm danh chào cờ: +20 điểm thi đua, +10.000đ.'),
        h('button', { class: 'btn ghost', onclick: goToFlagSeat }, `🪑 Tới hàng ghế lớp ${LOPS.includes(me.lop) ? me.lop : 'Toán'}`)),
        h('h3', {}, '✍️ Kỷ niệm sân khấu'));
      guestbook(b, 'san-khau', { placeholder: 'Kỷ niệm trên sân khấu…' });
    });
  },

  tronhoc() {
    openSheet('Chỗ trốn học đá bóng', (b) => {
      b.append(h('p', { class: 'speech' }, 'Góc sau dãy 3 tầng, khuất tầm nhìn của thầy giám thị. Ai từng trốn tiết ra đây đá bóng thì tự thú đi!'),
        h('button', { class: 'btn primary', onclick: () => gameSheet('penalty') }, '⚽ Sút penalty 5 quả'), h('h3', {}, '✍️ Tự thú'));
      guestbook(b, 'tronhoc', { placeholder: 'Tự thú: tôi đã trốn tiết…' });
    });
  },

  drum() {
    openSheet('Trống trường', (b) => {
      const now = Date.now();
      b.append(
        h('p', { class: 'speech' }, `Bây giờ là ${vnClock(now)} · ${periodOf(now).label}. Ba hồi trống là vào học, một hồi là ra chơi – ai đi muộn là nghe thấy từ ngoài cổng.`),
        h('button', { class: 'btn primary big', onclick: () => {
          sfx.drum(3);
          if (!me.guest) sayPrompt.send?.('🥁 Tùng! Tùng! Tùng!'); else world.say('me', '🥁 Tùng! Tùng! Tùng!');
        } }, '🥁 Đánh trống'));
    });
  },

  sidegate() {
    openSheet('Cổng phụ', (b) => {
      b.append(h('p', { class: 'speech' }, 'Cổng phụ bên hông dãy 4 tầng – lối tắt quen thuộc mỗi khi đi muộn hay ra quán nước.'));
      guestbook(b, 'cong-phu', { placeholder: 'Chuyện ở cổng phụ…' });
    });
  },

  entry() {
    toast('Lối vào giữa nhà hiệu bộ và dãy 5 tầng – đi tiếp lên bậc thang chính để vào sân trường.');
  },

  wish() {
    openSheet('Tường "Ước mơ vào Chuyên"', (b) => {
      b.append(h('p', { class: 'muted' }, 'Các em cấp 2 viết ước mơ đỗ vào Chuyên; anh chị khóa trên để lại lời động viên.'));
      guestbook(b, 'uocmo', { placeholder: 'Ước mơ / lời động viên của bạn…' });
    });
  },

  lab() {
    openSheet('🧪 Phòng thí nghiệm', (b) => {
      b.append(h('p', { class: 'speech' }, 'Thầy Minh: "Đeo kính bảo hộ vào các em! Rót axit vào nước, không làm ngược lại!"'),
        h('button', { class: 'btn primary', onclick: () => gameSheet('hoahoc') }, '🧪 Pha chế hóa học 5 vòng'), h('h3', {}, '✍️ Kỷ niệm phòng thí nghiệm'));
      guestbook(b, 'phong-tn', { placeholder: 'Lần thí nghiệm nhớ đời…' });
    });
  },

  computer() {
    openSheet('💻 Phòng máy', (b) => {
      b.append(h('p', { class: 'muted' }, 'Những giờ Tin học với máy tính màn hình to, giờ ra chơi lén chơi dò mìn…'),
        h('button', { class: 'btn primary', onclick: () => gameSheet('domin') }, '💣 Dò mìn 5 vòng'), h('h3', {}, '✍️ Kỷ niệm phòng máy'));
      guestbook(b, 'phong-may', { placeholder: 'Kỷ niệm giờ Tin học…' });
    });
  },

  library() {
    openSheet('📚 Thư viện', (b) => {
      b.append(h('p', { class: 'muted' }, 'Góc giới thiệu sách hay: cuốn sách nào đã theo bạn suốt thời Chuyên?'));
      guestbook(b, 'thu-vien', { placeholder: 'Tên sách – vì sao bạn thích…', empty: 'Chưa ai giới thiệu sách. Bạn mở hàng nhé!' });
    });
  },

  schoolbook() { bookSheet({ id: 'truong', name: 'Trường THPT Chuyên Thái Nguyên' }); },

  mirror() {
    if (!needMe()) return;
    openSheet('Soi gương · Đổi kiểu', (b) => {
      const look = { ...me.look };
      const name = h('input', { class: 'input', value: me.name, maxlength: 40, 'aria-label': 'Tên' });
      b.append(h('label', { class: 'lbl' }, 'Tên hiển thị'), name, avatarEditor(look, me.role),
        h('button', { class: 'btn primary', onclick: async () => {
          try { const r = await call('look', { look, name: name.value }); setMe(r.user); closeSheet(); toast('Đã đổi kiểu!'); }
          catch (e) { toast(e.message, 'bad'); }
        } }, 'Lưu'));
    });
  },

  enterClass(hs) {
    classReturn = { x: hs.x, y: hs.y };
    world.npcs = [...world.npcs.filter((n) => n.scene === 'campus'), ...classNpcs(hs.lop)];
    const sc = classroomScene(hs.lop);
    world.setScene(sc, sc.spawn);
    loadTeacher(hs.lop);
    sfx.click();
    const mine = !me.guest && (me.lop === hs.lop || ['gv', 'khach', 'em'].includes(me.role));
    toast(mine ? `Vào lớp chuyên ${hs.lop}. Ngồi vào ghế để ký sổ đầu bài, chạm bảng lớp để xem lưu bút, đố vui…`
      : `Lớp chuyên ${hs.lop}. Chạm ghế để ngồi, chạm bảng lớp để xem lưu bút, sổ đầu bài, đố vui.`);
  },

  exitClass() { backToCampus(); },

  // Bảng lớp: menu giống bảng đen của lớp
  classBoard(hs) {
    const lop = hs.lop;
    openSheet('🖍️ Lớp chuyên ' + lop, (b) => {
      const msg = h('div', {});
      const notes = h('div', {});
      const need = () => { if (me.guest) { closeSheet(); createFlow(); return true; } return false; };
      const item = (icon, title, sub, fn) => h('button', { class: 'board-item', onclick: fn }, h('span', { class: 'bi-icon' }, icon), h('span', {}, h('b', {}, title), h('small', {}, sub)));
      b.append(h('div', { class: 'board-menu' },
        item('✍️', 'Lưu bút lớp', 'Viết vài dòng cho bạn cùng lớp', () => panels.class({ lop, tab: 0 })),
        item('📒', 'Sổ đầu bài', 'Sĩ số, ghi chú, điểm miệng, vi phạm hôm nay', () => classLogSheet(lop)),
        item('❓', 'Đố vui về lớp', 'Có bảng xếp hạng riêng', () => panels.class({ lop, tab: 2 })),
        item('👩‍🏫', 'Thầy cô chủ nhiệm', `${world.npcs.find((n) => n.id === 'npc-gvcn')?.name || 'Cô chủ nhiệm'} · chạm để sửa tên`, () => teacherEditSheet(lop)),
        item('🙋', 'Kiểm tra bài cũ', '2 câu hỏi nhanh, điểm miệng ghi vào sổ đầu bài', () => {
          const t = world.npcs.find((n) => n.id === 'npc-gvcn');
          oldLessonSheet({ name: t ? t.name : 'Cô chủ nhiệm', lop });
        }),
        item('📓', 'Kiểm tra vở ghi', 'Cô xem ghi chú buổi học hôm nay của bạn', async () => {
          if (need()) return;
          try {
            const r = await call('classlogAct', { lop, kind: 'notebook' });
            setMe(r.user);
            if (r.fresh) sfx.coin();
            msg.replaceChildren(h('div', { class: r.today ? 'ok-box' : 'warn-box' }, r.today
              ? (r.fresh ? '👩‍🏫 Cô khen: vở ghi hôm nay đầy đủ! +5 điểm thi đua.' : '👩‍🏫 Hôm nay cô kiểm tra vở của em rồi, vẫn đầy đủ nhé!')
              : '👩‍🏫 Hôm nay em chưa ghi bài! Mở Sổ đầu bài, viết "Ghi chú buổi học" rồi quay lại cho cô kiểm tra nhé.'));
            notes.replaceChildren(r.notes.length ? h('ul', { class: 'notes' }, ...r.notes.map((n) => h('li', {}, h('b', {}, dayText(n.day)), ': ', n.text))) : '');
          } catch (e) { toast(e.message, 'bad'); }
        }),
        item('📤', 'Nộp sổ đầu bài', 'Người đầu tiên nộp sổ hôm nay được +10 điểm', async () => {
          if (need()) return;
          try {
            const r = await call('classlogAct', { lop, kind: 'submit' });
            setMe(r.user);
            if (r.fresh) sfx.coin();
            msg.replaceChildren(h('div', { class: r.fresh ? 'ok-box' : 'warn-box' }, r.fresh ? '📤 Bạn đã nộp sổ đầu bài hôm nay. +10 điểm thi đua!'
              : `Sổ đầu bài hôm nay đã được ${r.by} nộp lúc ${clock(r.at)}.`));
          } catch (e) { msg.replaceChildren(h('div', { class: 'warn-box' }, e.message)); }
        })), msg, notes);
    });
  },

  classRules() { boardText('📋 Nội quy lớp học', CLASS_RULES, false, 'Ném bóng nước trong giờ học sẽ bị ghi tên vào sổ đầu bài, hôm sau bố mẹ không cho tiền ăn vặt.'); },
  classBacHo() { boardText('⭐ 5 điều Bác Hồ dạy', BAC_HO, true); },
  classLog(hs) { classLogSheet(hs.lop); },
  balcony() {
    sfx.whoosh();
    toast('🌤️ Ra ban công hóng gió, nhìn xuống sân trường.');
    world.say('me', ['Gió mát quá!', 'Nhìn xuống sân trường nhớ ghê…', 'Ngày xưa ra đây ngắm mưa đó!'][Math.floor(Math.random() * 3)]);
  },

  class(hs) {
    const lop = hs.lop;
    const initialTab = hs.tab || 0;
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
          { label: '👥 Cả lớp khóa này', render: async (c) => {
            const r = await call('roster', { room });
            c.append(h('p', { class: 'muted' }, `Những bạn đã về lớp ${lop} ${khoa}:`),
              r.items.length ? h('ol', { class: 'roster' }, ...r.items.map((x) => h('li', {}, x.name, h('span', { class: 'muted' }, ' · ' + ago(x.at))))) : h('p', { class: 'muted' }, 'Chưa có ai điểm danh.'));
          } },
          { label: '❓ Đố vui', render: (c) => quizView(c, lop) },
        ], initialTab));
      };
      khoaInp.addEventListener('change', render);
      b.append(h('div', { class: 'row-inline' }, h('span', {}, 'Khóa:'), khoaInp, h('button', { class: 'btn ghost sm', onclick: render }, 'Xem')), content);
      render();
    }, { wide: true });
  },
};

// ======================= Tên thầy cô và nhân vật phụ (cấu hình theo khóa) =======================
// Mỗi khóa đặt tên của mình; vào lớp/phòng/sân thấy tên của khóa mình, không có thì tên chung (thầy cô, quản trị đặt),
// không có nữa thì tên được đặt gần nhất, cuối cùng là tên mặc định. "slot" = tên lớp chuyên, mã phòng hoặc mã nhân vật.
const ROOM_TEACHER_NAMES = { thuvien: 'thư viện', phongmay: 'phòng máy', phongtn: 'phòng thí nghiệm', hieubo: 'văn phòng nhà hiệu bộ' };
const NPC_NAMES = { baove: 'Bác bảo vệ (cổng trường)', codo: 'Đội cờ đỏ (cổng trường)', hung: 'Bác Hùng (cựu HS, sân trường)', mai: 'Chị Mai (ghế đá vườn)', tuan: 'Anh Tuấn (sân đá cầu)', linh: 'Bạn Linh (trước dãy 5 tầng)', cangtin: 'Cô căng tin', dung: 'Anh Dũng (trong căng tin)', nam: 'Bạn Nam (nhà đa năng)' };
const isRoomSlot = (slot) => NPC_SLOTS.includes(slot); // không phải lớp chuyên: ai cũng sửa cho khóa mình
const isOtherNpc = (slot) => OTHER_NPCS.includes(slot);
const MALE_TITLES = ['Thầy', 'Chú', 'Anh', 'Ông'], FEMALE_TITLES = ['Cô', 'Chị', 'Bà'];
function pickTeacher(items, slot) {
  const mine = me.khoa && (isRoomSlot(slot) || me.lop === slot) ? items.find((x) => x.khoa === me.khoa) : null;
  return mine || items.find((x) => x.khoa === '*') || items[0] || null;
}
// Đổi dáng nhân vật theo danh xưng (Thầy/Chú/Anh/Ông → nam; Cô/Chị/Bà → nữ), danh xưng khác giữ nguyên
function lookForTitle(base, title) {
  const want = MALE_TITLES.includes(title) ? 'nam' : FEMALE_TITLES.includes(title) ? 'nu' : base.gender || 'nam';
  if ((base.gender || 'nam') === want) return base;
  return want === 'nam'
    ? { ...base, gender: 'nam', hair: 6, bottom: 'quan', outfit: String(base.outfit).startsWith('aodai') ? 'somitrang' : base.outfit }
    : { ...base, gender: 'nu', hair: 5, outfit: base.outfit === 'vest' ? 'aodaitim' : base.outfit };
}
function applyTeacher(slot, t) {
  for (const n of world.npcs.filter((x) => x.slot === slot)) {
    n.baseLook ||= n.look; n.baseName ||= n.name; n.baseSub ||= n.sub;
    if (!t) continue;
    if (isOtherNpc(slot)) {
      n.name = [t.title, t.name].filter(Boolean).join(' ');
      n.sub = t.sub || n.baseSub;
    } else {
      n.name = `${t.title} ${t.name}`;
      n.sub = `${t.title} · ${n.subject}${!isRoomSlot(slot) && t.khoa && t.khoa !== '*' ? ' ' + t.khoa : ''}`;
    }
    n.look = lookForTitle(n.baseLook, t.title);
  }
}
async function loadTeacher(slot) {
  try { const r = await call('classTeacher', { lop: slot }); applyTeacher(slot, pickTeacher(r.items, slot)); return r.items; } catch { return []; }
}
// Áp tên đã đặt cho mọi nhân vật đang có (một lần gọi cho cả trường)
async function loadNpcNames() {
  try {
    const { items } = await call('teachersAll');
    for (const slot of new Set(world.npcs.map((n) => n.slot).filter(Boolean))) applyTeacher(slot, pickTeacher(items.filter((x) => x.lop === slot).sort((a, c) => c.at - a.at), slot));
  } catch { /* giữ tên mặc định */ }
}
function teacherEditSheet(slot) {
  if (!needMe()) return;
  const room = isRoomSlot(slot), other = isOtherNpc(slot);
  const isGv = me.role === 'gv';
  const canEdit = isGv || ((me.role === 'cuuhs' || me.role === 'hs') && (room || me.lop === slot));
  const npc = world.npcs.find((x) => x.slot === slot);
  openSheet(other ? `🧑 ${NPC_NAMES[slot]}` : room ? `👩‍🏫 Thầy cô ${ROOM_TEACHER_NAMES[slot]}` : '👩‍🏫 Thầy cô chủ nhiệm · Lớp chuyên ' + slot, async (b) => {
    const listEl = h('div', {});
    const render = (items) => listEl.replaceChildren(items.length
      ? h('ul', { class: 'notes' }, ...items.map((x) => h('li', {}, h('b', {}, x.khoa === '*' ? 'Các khóa' : x.khoa), `: ${[x.title, x.name].filter(Boolean).join(' ')}${x.sub ? ' · ' + x.sub : ''} `, h('small', { class: 'muted' }, `(${x.by} sửa · ${ago(x.at)})`))))
      : h('p', { class: 'muted' }, `Chưa khóa nào đặt tên. Đang hiện tên mặc định${npc ? ': ' + npc.name : ''}.`));
    b.append(listEl);
    render(await loadTeacher(slot));
    b.append(h('button', { class: 'btn link muted', onclick: () => adminTeachersSheet() }, '🔑 Sửa tên hàng loạt (quản trị)'));
    if (!canEdit) {
      b.append(h('p', { class: 'muted small' }, room ? 'Chỉ học sinh, cựu học sinh (sửa cho khóa mình), thầy cô hoặc quản trị mới sửa được tên.' : `Chỉ học sinh lớp chuyên ${slot} (sửa cho khóa mình) hoặc thầy cô mới sửa được tên.`));
      return;
    }
    const titles = other ? [...NPC_TITLES.filter((t) => t !== 'Thầy'), ''] : ['Thầy', 'Cô'];
    let title = (npc && titles.find((t) => t && npc.name.startsWith(t + ' '))) || (other ? '' : 'Cô');
    const nameInp = h('input', { class: 'input', id: 'gvcn-name', maxlength: 30, placeholder: other ? 'Ví dụ: Tư, Nguyễn Văn Hùng' : 'Ví dụ: Nguyễn Thị Hoa', 'aria-label': 'Họ tên thầy cô' });
    const subInp = other ? h('input', { class: 'input', id: 'npc-sub', maxlength: 30, placeholder: 'Ví dụ: K1 · Toán, Bảo vệ 1995–2010', 'aria-label': 'Dòng phụ' }) : null;
    const khoaSel = isGv ? h('select', { class: 'input', 'aria-label': 'Khóa' }, h('option', { value: '' }, 'Tất cả các khóa'),
      ...Array.from({ length: 40 }, (_, i) => 40 - i).map((n) => h('option', { value: 'K' + n }, 'Khóa ' + n))) : null;
    const err = h('p', { class: 'err', role: 'alert' });
    b.append(h('h4', {}, '✏️ Sửa tên'),
      h('div', { class: 'ob-lbl' }, 'Danh xưng'),
      h('div', { class: 'ob-chips' }, ...titles.map((t) => h('button', { class: 'ob-chip' + (t === title ? ' on' : ''), onclick: (e) => {
        title = t; e.currentTarget.parentNode.querySelectorAll('.ob-chip').forEach((x) => x.classList.toggle('on', x === e.currentTarget));
      } }, t || 'Không'))),
      h('label', { class: 'ob-lbl', for: 'gvcn-name' }, other ? 'Tên' : 'Họ tên'), nameInp,
      ...(other ? [h('label', { class: 'ob-lbl', for: 'npc-sub' }, 'Dòng phụ dưới tên (không bắt buộc)'), subInp] : []),
      ...(isGv ? [h('label', { class: 'ob-lbl' }, room ? 'Công tác cùng khóa' : 'Chủ nhiệm khóa'), khoaSel] : []),
      h('p', { class: 'muted small' }, isGv ? 'Chọn khóa; "Tất cả các khóa" là tên dùng khi khóa đó chưa đặt.'
        : other ? `Tên này hiện cho các bạn khóa ${me.khoa}.` : room ? `Tên này hiện khi các bạn khóa ${me.khoa} vào ${ROOM_TEACHER_NAMES[slot]}.` : `Tên này hiện khi các bạn ${me.khoa} ${slot} vào lớp.`),
      err,
      h('button', { class: 'btn primary', onclick: async () => {
        try {
          await call('setClassTeacher', { lop: slot, title, name: nameInp.value, sub: subInp?.value, khoa: khoaSel?.value || undefined });
          sfx.coin(); toast(other ? 'Đã lưu tên nhân vật' : 'Đã lưu tên thầy cô'); nameInp.value = ''; if (subInp) subInp.value = ''; err.textContent = '';
          render(await loadTeacher(slot));
        } catch (e) { err.textContent = e.message; }
      } }, 'Lưu tên'));
  });
}

// ======================= Quản trị: sửa tên thầy cô hàng loạt =======================
// Cần mã quản trị (biến bí mật ADMIN_CODE trên Cloudflare). Mã chỉ giữ trong phiên trình duyệt hiện tại.
const ADMIN_KEY = 'ctn.admin';
const TEACHER_SLOTS = [...LOPS.map((l) => [l, 'Lớp chuyên ' + l]), ['thuvien', '📚 Thư viện'], ['phongmay', '💻 Phòng máy'], ['phongtn', '🧪 Phòng thí nghiệm'], ['hieubo', '🏛️ Văn phòng nhà hiệu bộ'],
  ...OTHER_NPCS.map((k) => [k, '🧑 ' + NPC_NAMES[k]])];
const SLOT_ALIASES = { 'thư viện': 'thuvien', 'phòng máy': 'phongmay', 'phòng thí nghiệm': 'phongtn', 'văn phòng': 'hieubo', 'nhà hiệu bộ': 'hieubo',
  'bảo vệ': 'baove', 'bác bảo vệ': 'baove', 'cờ đỏ': 'codo', 'đội cờ đỏ': 'codo', 'bác hùng': 'hung', 'chị mai': 'mai', 'anh tuấn': 'tuan', 'bạn linh': 'linh',
  'căng tin': 'cangtin', 'cô căng tin': 'cangtin', 'anh dũng': 'dung', 'bạn nam': 'nam' };
function slotOf(text) {
  const t = text.trim().toLowerCase().replace(/^(lớp\s+)?(chuyên\s+)?/, '');
  const lop = LOPS.find((l) => l.toLowerCase() === t);
  return lop || SLOT_ALIASES[t] || (NPC_SLOTS.includes(t) ? t : '');
}
// Lưu theo từng đợt (mỗi đợt ≤ batch tên)
async function adminSave(code, items, batch = 40) {
  const sum = { saved: 0, deleted: 0, errors: [] };
  for (let i = 0; i < items.length; i += batch) {
    const r = await call('adminTeachers', { code, items: items.slice(i, i + batch) });
    sum.saved += r.saved; sum.deleted += r.deleted; sum.errors.push(...r.errors.map((e) => e.replace(/Dòng (\d+)/, (_, n) => 'Dòng ' + (i + Number(n)))));
  }
  loadNpcNames();
  return sum;
}
function adminTeachersSheet() { adminSheet(0); }
// Bảng quản trị: tên thầy cô/nhân vật, tin nhắn, thành viên. Cần mã quản trị.
function adminSheet(initialTab = 0) {
  openSheet('🔑 Quản trị', (b) => {
    const unlock = () => {
      const inp = h('input', { class: 'input', type: 'password', autocomplete: 'off', 'aria-label': 'Mã quản trị', placeholder: 'Mã quản trị' });
      const err = h('p', { class: 'err', role: 'alert' });
      const go = async () => {
        try { await call('adminCheck', { code: inp.value }); sessionSet(ADMIN_KEY, inp.value.trim()); refreshAdminUi(); main(); }
        catch (e) { err.textContent = e.message; }
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      b.replaceChildren(
        h('p', { class: 'muted' }, 'Sửa tên thầy cô và nhân vật hàng loạt, xoá tin nhắn trong khung chat chung, khoá thành viên thô lỗ. Chỉ người có mã quản trị mới dùng được.'),
        getMode() === 'offline' ? h('p', { class: 'note' }, `Bản chạy thử ngoại tuyến (dữ liệu chỉ trên trình duyệt này): mã quản trị là ${OFFLINE_ADMIN_CODE}.`) : null,
        inp, err, h('button', { class: 'btn primary', onclick: go }, 'Mở khoá'));
      setTimeout(() => inp.focus(), 50);
    };
    const editor = async (c) => {
      const code = sessionGet(ADMIN_KEY) || '';
      c.replaceChildren(h('p', { class: 'muted' }, 'Đang tải…'));
      let all = [];
      try { all = (await call('teachersAll')).items; } catch (e) { c.replaceChildren(h('p', { class: 'err' }, e.message)); return; }
      const cur = new Map(all.map((x) => [`${x.lop}|${x.khoa}`, x]));
      let khoa = '*';
      const khoaSel = h('select', { class: 'input', 'aria-label': 'Áp dụng cho khóa', onchange: () => { khoa = khoaSel.value; renderTable(); } },
        h('option', { value: '*' }, 'Tất cả các khóa (tên mặc định)'),
        ...Array.from({ length: 40 }, (_, i) => 40 - i).map((n) => h('option', { value: 'K' + n }, `Khóa ${n} (K${n})`)));
      const result = h('div', {});
      const showResult = (sum) => {
        result.replaceChildren(h('div', { class: sum.errors.length ? 'warn-box' : 'ok-box' },
          `Đã lưu ${sum.saved} tên${sum.deleted ? `, xoá ${sum.deleted} tên` : ''}.`,
          ...sum.errors.map((e) => h('div', { class: 'small' }, '⚠️ ' + e))));
      };
      // Bảng: mỗi lớp/phòng một dòng
      const table = h('div', { class: 'admin-table' });
      let rows = [];
      const renderTable = () => {
        rows = TEACHER_SLOTS.map(([slot, label]) => {
          const old = cur.get(`${slot}|${khoa}`);
          const other = isOtherNpc(slot);
          const titles = other ? ['', ...NPC_TITLES.filter((t) => t !== 'Thầy')] : ['Cô', 'Thầy'];
          const title = h('select', { class: 'input sm', 'aria-label': 'Danh xưng ' + label }, ...titles.map((t) => h('option', { value: t, selected: (old?.title ?? (other ? '' : 'Cô')) === t }, t || '—')));
          const name = h('input', { class: 'input', maxlength: 30, value: old?.name || '', placeholder: other ? 'Tên' : 'Họ tên', 'aria-label': 'Họ tên thầy cô ' + label });
          const sub = other ? h('input', { class: 'input admin-sub', maxlength: 30, value: old?.sub || '', placeholder: 'Dòng phụ (vd K1 · Toán)', 'aria-label': 'Dòng phụ ' + label }) : null;
          return { slot, label, old, title, name, sub };
        });
        const head = (t) => h('div', { class: 'admin-head' }, t);
        table.replaceChildren(head('Thầy cô chủ nhiệm 12 lớp chuyên'),
          ...rows.map((r, i) => [i === LOPS.length ? head('Thầy cô phòng chức năng') : null, i === LOPS.length + ROOM_TEACHERS.length ? head('Nhân vật khác') : null,
            h('div', { class: 'admin-row' }, h('span', { class: 'admin-slot' }, r.label), r.title, r.name, r.sub)]).flat().filter(Boolean));
      };
      renderTable();
      // tải lại tên đã lưu rồi vẽ lại bảng (giữ thông báo kết quả)
      const refresh = async () => { const fresh = (await call('teachersAll')).items; cur.clear(); fresh.forEach((x) => cur.set(`${x.lop}|${x.khoa}`, x)); renderTable(); };
      const saveTable = h('button', { class: 'btn primary', onclick: async () => {
        const items = rows.filter((r) => r.name.value.trim() !== (r.old?.name || '') || (r.old && r.name.value.trim() && (r.title.value !== r.old.title || (r.sub && r.sub.value.trim() !== (r.old.sub || '')))))
          .map((r) => ({ lop: r.slot, khoa, title: r.title.value, name: r.name.value.trim(), sub: r.sub?.value.trim() }));
        if (!items.length) { toast('Chưa có thay đổi nào'); return; }
        saveTable.disabled = true;
        try { const sum = await adminSave(code, items); showResult(sum); sfx.coin(); await refresh(); toast(`Đã lưu ${sum.saved} tên`); }
        catch (e) { result.replaceChildren(h('div', { class: 'warn-box' }, e.message)); if (/mã/i.test(e.message)) sessionSet(ADMIN_KEY, ''); }
        saveTable.disabled = false;
      } }, 'Lưu tất cả');
      // Dán danh sách: "Toán | Cô | Nguyễn Thị Hoa | K20"
      const paste = h('textarea', { class: 'input', rows: 8, 'aria-label': 'Danh sách tên thầy cô',
        placeholder: 'Mỗi dòng: Lớp/nhân vật | Danh xưng | Tên | Khóa | Dòng phụ (hai cột cuối không bắt buộc)\nToán | Cô | Nguyễn Thị Hoa | K20\nLý | Thầy | Trần Văn Nam\nPhòng thí nghiệm | Thầy | Phạm Văn Hòa\nBảo vệ | Chú | Tư | * | Bảo vệ 1995–2010' });
      const parse = () => {
        const items = [], errors = [];
        paste.value.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line, i) => {
          const parts = line.split(/\s*[|\t;]\s*/);
          if (parts.length < 3) { errors.push(`Dòng ${i + 1}: cần ít nhất "Lớp | Thầy/Cô | Họ tên"`); return; }
          const slot = slotOf(parts[0]);
          if (!slot) { errors.push(`Dòng ${i + 1}: không nhận ra lớp/phòng "${parts[0]}"`); return; }
          const tw = parts[1].trim().toLowerCase();
          const found = NPC_TITLES.find((t) => t.toLowerCase() === tw) || '';
          const title = isOtherNpc(slot) ? found : found === 'Thầy' ? 'Thầy' : 'Cô';
          const k = (parts[3] || '').trim();
          items.push({ lop: slot, title, name: parts[2], sub: parts[4] || '', khoa: !k ? khoa : k === '*' ? '*' : k.toUpperCase().replace(/^K?/, 'K') });
        });
        return { items, errors };
      };
      const preview = h('p', { class: 'muted small' });
      paste.addEventListener('input', () => { const { items, errors } = parse(); preview.textContent = `Sẽ lưu ${items.length} tên${errors.length ? ` · ${errors.length} dòng lỗi: ${errors.join('; ')}` : ''}.`; });
      const savePaste = h('button', { class: 'btn primary', onclick: async () => {
        const { items, errors } = parse();
        if (!items.length) { toast(errors[0] || 'Chưa có dòng nào', 'bad'); return; }
        savePaste.disabled = true;
        try { const sum = await adminSave(code, items); sum.errors.unshift(...errors); showResult(sum); sfx.coin(); paste.value = ''; preview.textContent = ''; await refresh(); }
        catch (e) { result.replaceChildren(h('div', { class: 'warn-box' }, e.message)); }
        savePaste.disabled = false;
      } }, 'Lưu danh sách');
      c.replaceChildren(
        h('label', { class: 'ob-lbl' }, 'Áp dụng cho'), khoaSel,
        h('p', { class: 'muted small' }, '"Tất cả các khóa" là tên hiện cho mọi khóa chưa tự đặt tên. Xoá trắng ô tên rồi lưu để bỏ tên đã đặt.'),
        tabs([
          { label: '📋 Bảng', render: (c) => c.append(table, saveTable) },
          { label: '📝 Dán danh sách', render: (c) => c.append(h('p', { class: 'muted small' }, 'Dán từ Excel/Google Sheets (các cột cách nhau bằng tab) hoặc gõ, mỗi dòng một người. Cột đầu: lớp như trong game (Toán, Lý…), tên phòng (Thư viện, Phòng máy, Phòng thí nghiệm, Văn phòng) hoặc nhân vật (Bảo vệ, Cờ đỏ, Bác Hùng, Chị Mai, Anh Tuấn, Bạn Linh, Căng tin, Anh Dũng, Bạn Nam). Thầy cô chỉ Thầy/Cô; nhân vật khác có thể Bác, Chú, Anh, Chị, Bạn… hoặc để trống. Bỏ trống khóa thì dùng khóa đang chọn ở trên.'), paste, preview, savePaste) },
        ]),
        result);
    };
    const main = () => {
      b.replaceChildren(tabs([
        { label: '👩‍🏫 Tên thầy cô', render: (c) => editor(c) },
        { label: '💬 Tin nhắn', render: (c) => adminChatView(c) },
        { label: '🚫 Thành viên', render: (c) => adminUsersView(c) },
      ], initialTab), h('button', { class: 'btn link muted', onclick: () => { sessionSet(ADMIN_KEY, ''); refreshAdminUi(); unlock(); } }, '🔒 Khoá lại quyền quản trị'));
    };
    if (sessionGet(ADMIN_KEY)) main(); else unlock();
  }, { wide: true });
}

// Lỗi mã quản trị (đổi mã, hết phiên) → khoá lại để nhập lại
function adminFail(e, box) {
  if (e.status === 403 || e.status === 429 || e.status === 503) { sessionSet(ADMIN_KEY, ''); refreshAdminUi(); }
  box.replaceChildren(h('div', { class: 'warn-box' }, e.message));
}
const sceneName = (sc) => !sc || sc === 'campus' ? 'Sân trường' : sc.startsWith('lop:') ? 'Lớp ' + sc.slice(4) : ({ 'p:thuvien': 'Thư viện', 'p:phongmay': 'Phòng máy', 'p:phongtn': 'Phòng thí nghiệm', 'p:hieubo': 'Nhà hiệu bộ', 'p:cangtin': 'Căng tin', 'p:dana': 'Nhà đa năng' }[sc] || sc);

// Khoá một thành viên: lý do + tuỳ chọn xoá hết tin nhắn của người đó
function banForm(u, onDone) {
  const reason = h('input', { class: 'input', maxlength: 120, placeholder: 'Lý do (vd: nói tục, xúc phạm người khác)', 'aria-label': 'Lý do khoá' });
  const purge = h('input', { type: 'checkbox', checked: true });
  const msg = h('div', {});
  const go = h('button', { class: 'btn danger', onclick: async () => {
    const code = sessionGet(ADMIN_KEY) || '';
    go.disabled = true;
    try {
      await call('adminBan', { code, uid: u.id || u.uid, reason: reason.value });
      let deleted = 0;
      if (purge.checked) for (let i = 0; i < 10; i++) { const r = await call('adminPurgeChat', { code, uid: u.id || u.uid }); deleted += r.deleted; if (!r.remaining) break; }
      sfx.coin(); toast(`🚫 Đã khoá ${u.name}${deleted ? `, xoá ${deleted} tin nhắn` : ''}`);
      onDone?.();
    } catch (e) { adminFail(e, msg); go.disabled = false; }
  } }, '🚫 Khoá thành viên');
  return h('div', { class: 'ban-form' },
    h('p', { class: 'small' }, `Khoá ${u.name}: không vào được nhân vật, không nhắn tin, không hiện trên sân nữa. Mở khoá lại được ở mục Thành viên.`),
    reason, h('label', { class: 'check small' }, purge, ' Xoá luôn mọi tin nhắn của người này trong khung chat'), msg, go);
}

function adminChatView(c) {
  const code = sessionGet(ADMIN_KEY) || '';
  const box = h('div', { class: 'admin-msgs' }, h('p', { class: 'muted' }, 'Đang tải…'));
  const msg = h('div', {});
  const load = async () => {
    try {
      const { items } = await call('adminChat', { code });
      box.replaceChildren(...(items.length ? items.map((m) => {
        const row = h('div', { class: 'admin-msg' },
          h('div', {}, h('b', {}, m.name), h('small', { class: 'muted' }, ` ${world.subOf(m)} · ${sceneName(m.scene)} · ${ago(m.at)}`)),
          h('div', { class: 'admin-msg-text' }, m.text),
          h('div', { class: 'row-btns' },
            h('button', { class: 'btn ghost sm', onclick: async () => {
              try { await call('adminDeleteChat', { code, ids: [m.id] }); removeChatRows([m.id]); row.remove(); toast('Đã xoá tin nhắn'); } catch (e) { adminFail(e, msg); }
            } }, '🗑️ Xoá tin'),
            h('button', { class: 'btn ghost sm', onclick: () => { row.append(banForm({ id: m.uid, name: m.name }, load)); } }, '🚫 Khoá người này')));
        return row;
      }) : [h('p', { class: 'muted' }, 'Chưa có tin nhắn nào.')]));
    } catch (e) { adminFail(e, msg); box.replaceChildren(); }
  };
  c.append(h('p', { class: 'muted small' }, 'Khoảng 100 tin gần nhất của khung chat chung, mới nhất ở trên. Tin bị xoá biến mất khỏi khung chat của mọi người trong vài giây.'), msg, box,
    h('button', { class: 'btn ghost', onclick: load }, '🔄 Tải lại'));
  load();
}

function adminUsersView(c) {
  const code = sessionGet(ADMIN_KEY) || '';
  const q = h('input', { class: 'input', maxlength: 40, placeholder: 'Tìm theo tên (không cần dấu)', 'aria-label': 'Tìm thành viên' });
  const onlyBanned = h('input', { type: 'checkbox' });
  const list = h('div', { class: 'admin-msgs' });
  const msg = h('div', {});
  const load = async () => {
    list.replaceChildren(h('p', { class: 'muted' }, 'Đang tìm…'));
    try {
      const r = await call('adminUsers', { code, q: q.value, banned: onlyBanned.checked });
      list.replaceChildren(h('p', { class: 'muted small' }, `${r.total} người${r.total > r.items.length ? `, hiện ${r.items.length} người đầu` : ''}.`),
        ...r.items.map((u) => {
          const row = h('div', { class: 'admin-msg' + (u.banned ? ' banned' : '') },
            h('div', {}, h('b', {}, u.name), h('small', { class: 'muted' }, ` ${world.subOf(u) || ROLES[u.role]} · ${ROLES[u.role]}${u.at ? ' · tạo ' + ago(u.at) : ''}`)),
            u.banned ? h('div', { class: 'small err' }, `🚫 Đã khoá ${ago(u.banned.at)}${u.banned.reason ? ': ' + u.banned.reason : ''}`) : null,
            h('div', { class: 'row-btns' }, u.banned
              ? h('button', { class: 'btn ghost sm', onclick: async () => { try { await call('adminUnban', { code, uid: u.id }); toast('Đã mở khoá ' + u.name); load(); } catch (e) { adminFail(e, msg); } } }, '🔓 Mở khoá')
              : h('button', { class: 'btn ghost sm', onclick: () => row.append(banForm(u, load)) }, '🚫 Khoá')));
          return row;
        }));
    } catch (e) { adminFail(e, msg); list.replaceChildren(); }
  };
  let t = 0;
  q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(load, 350); });
  onlyBanned.addEventListener('change', load);
  c.append(q, h('label', { class: 'check small' }, onlyBanned, ' Chỉ hiện người đang bị khoá'), msg, list);
  load();
}

// ======================= Sổ đầu bài, nội quy =======================
const dayText = (d) => { const [y, m, dd] = d.split('-'); return `${+dd}/${+m}/${y}`; };
const clock = (t) => vnClock(t);

function boardText(title, lines, red, note) {
  openSheet(title, (b) => {
    b.append(h('ol', { class: 'board-text' + (red ? ' red' : '') }, ...lines.map((x) => h('li', {}, x))), note ? h('p', { class: 'muted small' }, note) : '');
  });
}

function classLogSheet(lop) {
  openSheet('📒 Sổ đầu bài · Lớp chuyên ' + lop, (b) => {
    let day = '';
    const body = h('div', { class: 'logbook' });
    const load = async () => {
      body.replaceChildren(h('p', { class: 'muted' }, 'Đang mở sổ…'));
      try {
        const r = await call('classlog', { lop, day });
        const isToday = r.day === r.today;
        const sel = h('select', { class: 'input sm', 'aria-label': 'Chọn ngày', onchange: (e) => { day = e.target.value; load(); } },
          ...[r.today, ...r.days.filter((d) => d !== r.today)].map((d) => h('option', { value: d, selected: d === r.day }, (d === r.today ? 'Hôm nay, ' : '') + dayText(d))));
        const parts = [
          h('div', { class: 'row-between' }, h('span', {}, '📅 ', sel), h('span', { class: 'muted small' }, 'Sĩ số: ', h('b', {}, String(r.present.length)), ' có mặt')),
          r.present.length ? h('table', { class: 'log' }, h('tbody', {}, ...r.present.map((x, i) => h('tr', { class: x.mine ? 'me' : '' },
            h('td', {}, String(i + 1)), h('td', {}, h('b', {}, x.name), ' ', h('small', {}, x.label)), h('td', {}, clock(x.at))))))
            : h('p', { class: 'muted small' }, 'Chưa ai ký sổ ngày này.'),
        ];
        if (r.notes.length) parts.push(h('h4', {}, '📝 Ghi chú buổi học'), h('ul', { class: 'notes' }, ...r.notes.map((n) => h('li', { class: n.mine ? 'me' : '' }, h('b', {}, n.name), ': ', n.text))));
        if (r.orals.length) parts.push(h('p', { class: 'small' }, '🙋 Kiểm tra miệng: ', r.orals.map((o) => `${o.name} ${o.grade}/10`).join(' · ')));
        if (r.submit) parts.push(h('p', { class: 'small ok' }, `📤 Đã nộp sổ: ${r.submit.name} lúc ${clock(r.submit.at)}`));
        if (r.writeups.length) parts.push(h('div', { class: 'writeups' }, h('b', {}, '📛 Ghi tên vi phạm'),
          ...r.writeups.map((w) => h('p', { class: w.mine ? 'me' : '' }, h('b', {}, w.name), ' ', h('small', {}, w.label), ': ', w.reason, ' ', h('small', {}, `(${w.by ? 'GV ' + w.by : 'tự động'})`))),
          h('p', { class: 'muted small' }, 'Bị ghi tên thì hôm sau bố mẹ không cho tiền ăn vặt.')));
        if (isToday && me.guest) parts.push(h('button', { class: 'btn primary', onclick: () => { closeSheet(); createFlow(); } }, 'Ghi danh rồi ngồi vào đúng lớp mình là tự ký có mặt'));
        else if (isToday && r.canWrite) {
          const note = h('textarea', { class: 'input', rows: 2, maxlength: 200, placeholder: 'Hôm nay lớp học gì? Ghi vài dòng…' });
          parts.push(h('h4', {}, '✏️ Ghi chú buổi học'), note, h('button', { class: 'btn primary', onclick: async () => {
            try { const x = await call('classlogAct', { lop, kind: 'note', text: note.value }); setMe(x.user); toast('Đã ghi vào sổ đầu bài'); load(); } catch (e) { toast(e.message, 'bad'); }
          } }, 'Ghi vào sổ'));
          if (r.isTeacher && r.present.length) {
            const who = h('select', { class: 'input' }, ...r.present.filter((x) => !x.mine).map((x) => h('option', { value: x.id }, `${x.name} · ${x.label}`)));
            const why = h('input', { class: 'input', maxlength: 120, placeholder: 'Lý do (nói chuyện riêng, đi muộn…)' });
            parts.push(h('h4', {}, '📛 Ghi tên học sinh'), who, why, h('button', { class: 'btn ghost', onclick: async () => {
              try { await call('classlogAct', { lop, kind: 'writeup', target: who.value, reason: why.value }); toast('Đã ghi tên vào sổ'); load(); } catch (e) { toast(e.message, 'bad'); }
            } }, 'Ghi tên'));
          }
        } else if (isToday && !me.guest) parts.push(h('p', { class: 'muted small' }, `Chỉ học sinh lớp chuyên ${lop} (và thầy cô) mới ghi được sổ lớp này.`));
        body.replaceChildren(...parts);
      } catch (e) { body.replaceChildren(h('p', { class: 'err' }, e.message)); }
    };
    b.append(body);
    load();
  }, { wide: true });
}

// ======================= Ném bóng nước: chọn người =======================
function balloonPicker() {
  const list = [...world.others.entries()]
    .map(([id, o]) => ({ id, o, d: Math.hypot(o.x - world.me.x, o.y - world.me.y) }))
    .sort((a, b) => a.d - b.d);
  openSheet('🎈 Ném bóng nước vào ai?', (b) => {
    if (!list.length) b.append(h('p', { class: 'muted' }, world.scene.id === 'campus' ? 'Chưa có ai online ở sân trường. Rủ bạn vào chơi nhé!' : 'Trong lớp chưa có ai khác.'));
    else b.append(h('p', { class: 'muted' }, 'Chọn một bạn đang online. Bạn ở xa quá thì lại gần hơn để ném trúng.'));
    b.append(h('div', { class: 'pick-list' }, ...list.map(({ id, o, d }) => {
      const far = d > 700, shield = !!o.data.noBalloon;
      return h('button', { class: 'pick', disabled: far || shield, onclick: () => { closeSheet(); throwBalloon(id); } },
        avatarCanvas(o.data.look, 44),
        h('span', { class: 'pick-info' }, h('b', {}, o.data.name), h('small', {}, [world.subOf(o.data), shield ? '🛡️ đang bật khiên' : far ? 'xa quá, lại gần hơn' : `cách ${Math.max(1, Math.round(d / 20))} bước`].filter(Boolean).join(' · '))),
        h('span', { class: 'pick-go', 'aria-hidden': 'true' }, shield ? '🛡️' : far ? '🚶' : '🎈'));
    })),
    h('button', { class: 'btn ghost', onclick: () => { closeSheet(); throwBalloon(null); } }, 'Ném ra phía trước'));
  });
}

// ======================= Ảnh kỷ yếu =======================
const LOGO = Object.assign(new Image(), { src: 'logo.jpg' });

// Khung ảnh kỷ yếu. Ảnh chụp ở sân có tỉ lệ cố định; ảnh tải lên giữ tỉ lệ (cao 300–820 px, cắt giữa nếu quá dài).
async function composeYearbook(shot, people, caption) {
  await LOGO.decode().catch(() => {});
  const W = 720, PW = W - 88;
  const PH = Math.round(Math.max(300, Math.min(820, PW * shot.height / shot.width)));
  const H = 660 - 404 + PH;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const font = (w, size, fam = '"Be Vietnam Pro", system-ui, sans-serif') => `${w} ${size}px ${fam}`;
  x.fillStyle = '#FFF8EC'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#1B2A4E'; x.fillRect(0, 0, W, 12); x.fillRect(0, H - 12, W, 12); x.fillRect(0, 0, 12, H); x.fillRect(W - 12, 0, 12, H);
  x.strokeStyle = '#F2B233'; x.lineWidth = 2; x.strokeRect(22, 22, W - 44, H - 44);
  if (LOGO.naturalWidth) { x.save(); x.beginPath(); x.arc(76, 76, 36, 0, Math.PI * 2); x.clip(); x.drawImage(LOGO, 40, 40, 72, 72); x.restore(); }
  x.textBaseline = 'alphabetic'; x.textAlign = 'left';
  x.fillStyle = '#D8343A'; x.font = font(800, 34); x.fillText('KỶ YẾU', 128, 72);
  x.fillStyle = '#1B2A4E'; x.font = font(700, 16); x.fillText('TRƯỜNG THPT CHUYÊN THÁI NGUYÊN', 128, 98);
  x.textAlign = 'right'; x.fillStyle = '#5B6577'; x.font = font(600, 13);
  x.fillText(new Date().toLocaleDateString('vi-VN'), W - 40, 70);
  x.fillText(me.guest ? '' : [me.khoa, me.lop && 'Chuyên ' + me.lop].filter(Boolean).join(' · '), W - 40, 92);
  // ảnh: phủ kín khung, cắt phần thừa ở giữa
  x.fillStyle = '#fff'; x.fillRect(34, 124, W - 68, PH + 20);
  const k = Math.max(PW / shot.width, PH / shot.height), sw = PW / k, sh = PH / k;
  x.drawImage(shot, (shot.width - sw) / 2, (shot.height - sh) / 2, sw, sh, 44, 134, PW, PH);
  // chú thích + tên
  const y0 = 134 + PH;
  x.textAlign = 'center'; x.fillStyle = '#1D2433';
  x.font = font(400, 24, 'Pangolin, "Be Vietnam Pro", cursive');
  if (caption) x.fillText(caption.slice(0, 60), W / 2, y0 + 50);
  x.fillStyle = '#5B6577'; x.font = font(600, 13);
  let names = people.join(', ');
  while (x.measureText(names).width > W - 90 && names.length > 4) names = names.slice(0, -4) + '…';
  x.fillText(names, W / 2, caption ? y0 + 76 : y0 + 58);
  x.fillStyle = '#9AA0A6'; x.font = font(600, 11);
  x.fillText('234A Lương Ngọc Quyến · TP Thái Nguyên', W / 2, H - 28);
  return c;
}

// Đọc ảnh người dùng chọn (xoay đúng chiều theo EXIF nếu trình duyệt hỗ trợ), thu nhỏ còn cạnh dài ≤ 1400 px
async function readPhoto(file) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    src = await new Promise((ok, bad) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => bad(new Error('Không đọc được ảnh này')); im.src = URL.createObjectURL(file); });
  }
  const w0 = src.width || src.naturalWidth, h0 = src.height || src.naturalHeight;
  const k = Math.min(1, 1400 / Math.max(w0, h0));
  const c = document.createElement('canvas'); c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  src.close?.();
  return c;
}

function jpeg(canvas, maxW, quality, maxLen) {
  let c = canvas;
  if (canvas.width > maxW) {
    c = document.createElement('canvas'); c.width = maxW; c.height = Math.round(canvas.height * maxW / canvas.width);
    c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
  }
  let q = quality, url = c.toDataURL('image/jpeg', q);
  while (url.length > maxLen && q > 0.35) { q -= 0.1; url = c.toDataURL('image/jpeg', q); }
  return url;
}

panels.photo = () => {
  openSheet('📸 Chụp ảnh kỷ yếu', (b, { onCleanup }) => {
    const intro = () => h('div', { class: 'shot-stage' }, h('p', { class: 'muted' }, 'Chụp ở sân trường: gọi bạn bè đứng gần nhau (khoảng 13 bước quanh bạn), tạo dáng rồi bấm Chụp. Hoặc tải ảnh thật từ máy lên để làm ảnh kỷ yếu. Ảnh có khung kỷ yếu, lưu về máy hoặc đăng lên album trường.'));
    const stage = intro();
    const caption = h('input', { class: 'input', maxlength: 60, placeholder: 'Lời ghi trên ảnh (vd: Họp lớp 10 năm 🎉)', 'aria-label': 'Lời ghi trên ảnh' });
    const peopleInp = h('input', { class: 'input', maxlength: 200, placeholder: 'Ảnh tải lên: những ai trong ảnh (cách nhau bởi dấu phẩy)', 'aria-label': 'Những ai trong ảnh' });
    const actions = h('div', { class: 'stack' });
    const fileInp = h('input', { type: 'file', accept: 'image/*', hidden: true, 'aria-label': 'Chọn ảnh' });
    let timer = 0;
    onCleanup(() => clearInterval(timer));

    const show = (framed, people, again) => {
      const full = jpeg(framed, 720, 0.82, 290000);
      stage.replaceChildren(h('img', { class: 'shot', src: full, alt: 'Ảnh kỷ yếu: ' + people.join(', ') }));
      const post = h('button', { class: 'btn primary', onclick: async () => {
        if (!needMe()) return;
        post.disabled = true;
        try {
          const r = await call('albumPost', { full, thumb: jpeg(framed, 240, 0.72, 38000), caption: caption.value.trim(), people });
          setMe(r.user); toast('Đã đăng lên album kỷ yếu!'); post.textContent = '✅ Đã đăng lên album';
        } catch (e) { toast(e.message, 'bad'); post.disabled = false; }
      } }, '🖼️ Đăng lên album trường');
      actions.replaceChildren(
        h('a', { class: 'btn ghost', href: full, download: `ky-yeu-chuyen-thai-nguyen-${Date.now()}.jpg` }, '⬇️ Lưu ảnh về máy'),
        post, again, home());
    };
    const shoot = () => {
      let n = 3;
      const cd = h('div', { class: 'countdown', 'aria-live': 'assertive' }, String(n));
      stage.replaceChildren(cd);
      actions.replaceChildren();
      if (!me.guest) sayPrompt.send('📸 Cười lên nào!'); else world.say('me', '📸 Cười lên nào!');
      timer = setInterval(async () => {
        n -= 1;
        if (n > 0) { cd.textContent = String(n); return; }
        clearInterval(timer);
        cd.textContent = '📸';
        cd.classList.add('flash');
        const people = world.peopleNear();
        const framed = await composeYearbook(world.capture(640, 404, 1.6), people, caption.value.trim());
        show(framed, people, h('button', { class: 'btn ghost', onclick: shoot }, '🔁 Chụp lại'));
      }, 1000);
    };
    // Tải ảnh từ máy: ảnh thật của lớp, buổi họp lớp…
    fileInp.addEventListener('change', async () => {
      const f = fileInp.files[0];
      fileInp.value = '';
      if (!f) return;
      if (!/^image\//.test(f.type)) { toast('Hãy chọn một file ảnh (JPG, PNG…)', 'bad'); return; }
      if (f.size > 20e6) { toast('Ảnh quá lớn (tối đa 20 MB)', 'bad'); return; }
      stage.replaceChildren(h('p', { class: 'muted' }, 'Đang xử lý ảnh…'));
      try {
        const pic = await readPhoto(f);
        const typed = peopleInp.value.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 12);
        const people = typed.length ? typed : [me.name];
        const framed = await composeYearbook(pic, people, caption.value.trim());
        sfx.shutter();
        show(framed, people, h('button', { class: 'btn ghost', onclick: () => fileInp.click() }, '🔁 Chọn ảnh khác'));
      } catch (e) { stage.replaceChildren(h('p', { class: 'err' }, e.message || 'Không đọc được ảnh này')); }
    });
    const home = () => h('button', { class: 'btn link muted', onclick: start }, '← Chọn cách khác');
    const start = () => {
      stage.replaceChildren(...intro().childNodes);
      actions.replaceChildren(
        h('div', { class: 'row-btns' },
          h('button', { class: 'btn primary big', onclick: shoot }, '📸 Chụp ở sân'),
          h('button', { class: 'btn ghost big', onclick: () => fileInp.click() }, '🖼️ Tải ảnh lên')),
        h('p', { class: 'muted small' }, 'Ảnh tải lên được đóng khung kỷ yếu ngay trên máy bạn. Chỉ đăng lên album những ảnh bạn có quyền chia sẻ và mọi người trong ảnh đồng ý.'),
        h('button', { class: 'btn ghost', onclick: () => albumSheet() }, '🖼️ Xem album'));
    };
    start();
    b.append(stage, caption, peopleInp, fileInp, actions);
  }, { wide: true });
};

function albumSheet() {
  openSheet('🖼️ Album kỷ yếu', async (b) => {
    const grid = h('div', { class: 'album' }, h('p', { class: 'muted' }, 'Đang tải…'));
    b.append(h('p', { class: 'muted' }, 'Ảnh mọi người chụp ở sân trường ảo. Chạm để xem lớn.'), grid);
    try {
      const { items } = await call('album');
      grid.replaceChildren(...(items.length ? items.map((it) => h('button', { class: 'album-item', onclick: () => photoView(it) },
        h('img', { src: it.thumb, alt: it.caption || 'Ảnh kỷ yếu', loading: 'lazy' }),
        h('small', {}, `${it.by}${it.khoa ? ' · ' + it.khoa : ''} · ${ago(it.at)}`))) : [h('p', { class: 'muted' }, 'Chưa có ảnh nào. Ra sân khấu chụp tấm đầu tiên nhé!')]));
    } catch (e) { grid.replaceChildren(h('p', { class: 'err' }, e.message)); }
  }, { wide: true });
}

function photoView(it) {
  openSheet(it.caption || 'Ảnh kỷ yếu', async (b) => {
    const img = h('img', { class: 'shot', src: it.thumb, alt: it.caption || 'Ảnh kỷ yếu' });
    const dl = h('a', { class: 'btn ghost', href: it.thumb, download: `ky-yeu-${it.id}.jpg` }, '⬇️ Lưu ảnh về máy');
    b.append(img, h('p', { class: 'muted' }, `Chụp bởi ${it.by} · ${new Date(it.at).toLocaleString('vi-VN')}`),
      it.people?.length ? h('p', {}, 'Trong ảnh: ' + it.people.join(', ')) : null,
      h('div', { class: 'stack' }, dl, h('button', { class: 'btn ghost', onclick: () => albumSheet() }, '← Về album')));
    try { const r = await call('photo', { id: it.id }); img.src = r.full; dl.href = r.full; } catch { /* giữ ảnh nhỏ */ }
  }, { wide: true });
}

// ======================= Sổ lưu bút (mỗi người một quyển) =======================
function bookSheet(owner) {
  const room = 'so:' + owner.id;
  const mine = owner.id === me.id;
  openSheet(mine ? '📖 Sổ lưu bút của tôi' : `📖 Sổ lưu bút của ${owner.name}`, async (b) => {
    let entries = [];
    let page = 0; // 0 = bìa; 1..n = trang lưu bút; n+1 = trang viết
    const pageEl = h('div', { class: 'book-page' });
    const nav = h('div', { class: 'book-nav' });
    const render = () => {
      const n = entries.length, last = n + 1;
      pageEl.className = 'book-page' + (page === 0 ? ' cover' : '');
      if (page === 0) {
        pageEl.replaceChildren(
          h('img', { class: 'book-logo', src: 'logo.jpg', alt: '' }),
          h('div', { class: 'book-title' }, 'Sổ lưu bút'),
          h('div', { class: 'book-owner' }, owner.name),
          h('div', { class: 'book-sub' }, 'Trường THPT Chuyên Thái Nguyên'),
          h('div', { class: 'book-count' }, n ? `${n} trang lưu bút` : 'Chưa có ai viết'));
      } else if (page <= n) {
        const it = entries[page - 1];
        pageEl.replaceChildren(
          h('div', { class: 'book-to' }, `Gửi ${owner.name},`),
          h('p', { class: 'book-body' }, it.body),
          h('div', { class: 'book-sign' }, `— ${it.name}${describe(it) ? ' (' + describe(it) + ')' : ''}`),
          h('div', { class: 'book-date' }, new Date(it.at).toLocaleDateString('vi-VN')));
      } else {
        const ta = h('textarea', { class: 'book-input', rows: 7, maxlength: 600, placeholder: mine ? 'Viết lời mở đầu cho sổ lưu bút của bạn…' : `Viết gì đó cho ${owner.name}…`, 'aria-label': 'Lời lưu bút' });
        const err = h('p', { class: 'err' });
        pageEl.replaceChildren(h('div', { class: 'book-to' }, `Gửi ${owner.name},`), ta, err,
          h('button', { class: 'btn primary', onclick: async (e) => {
            if (!needMe()) return;
            e.target.disabled = true;
            try { const r = await call('sign', { room, body: ta.value }); setMe(r.user); toast('Đã viết vào sổ lưu bút · +5 điểm'); await load(); page = entries.length; render(); }
            catch (ex) { err.textContent = ex.message; e.target.disabled = false; }
          } }, '✍️ Ký vào sổ'));
      }
      nav.replaceChildren(
        h('button', { class: 'icon-btn', 'aria-label': 'Trang trước', disabled: page === 0, onclick: () => { page -= 1; render(); } }, '‹'),
        h('span', {}, page === 0 ? 'Bìa' : page <= n ? `Trang ${page}/${n}` : 'Trang viết'),
        h('button', { class: 'icon-btn', 'aria-label': 'Trang sau', disabled: page === last, onclick: () => { page += 1; render(); } }, '›'));
    };
    const load = async () => { const r = await call('guestbook', { room }); entries = r.items.slice().reverse(); };
    b.append(pageEl, nav, h('button', { class: 'btn ghost', onclick: () => { page = entries.length + 1; render(); } }, '✍️ Tới trang viết'));
    try { await load(); } catch { /* sổ trống */ }
    render();
  }, { wide: true });
}

// ======================= Khung chat, online, âm thanh, chuông trống =======================
let addFeed = () => {};
let removeChatRows = () => {};
let matchOwn = () => {};
let feedEl = null;
// bật/tắt nút quản trị trên các dòng chat theo phiên quản trị hiện tại
function refreshAdminUi() { feedEl?.classList.toggle('admin', !!sessionGet(ADMIN_KEY)); }
// Bảng nhỏ khi quản trị chạm "⋯" trên một dòng chat
function adminMsgSheet(m) {
  openSheet('🔑 Tin nhắn của ' + m.name, (b) => {
    const msg = h('div', {});
    b.append(h('p', { class: 'speech' }, m.text), msg,
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', disabled: !m.id, onclick: async () => {
          try { await call('adminDeleteChat', { code: sessionGet(ADMIN_KEY) || '', ids: [m.id] }); removeChatRows([m.id]); closeSheet(); toast('Đã xoá tin nhắn'); } catch (e) { adminFail(e, msg); }
        } }, '🗑️ Xoá tin này'),
        h('button', { class: 'btn ghost', onclick: (e) => { e.currentTarget.disabled = true; b.append(banForm({ id: m.uid, name: m.name }, () => closeSheet())); } }, '🚫 Khoá người này')),
      m.id ? null : h('p', { class: 'muted small' }, 'Tin vừa gửi, chờ vài giây để máy chủ ghi nhận rồi mới xoá được.'));
  });
}
// Bị quản trị khoá: báo cho người dùng, chuyển về chế độ khách
let bannedShown = false;
function bannedNotice(text) {
  if (bannedShown) return;
  bannedShown = true;
  me = GUEST; world.me.name = 'Khách'; world.me.sub = ''; hud.update();
  openSheet('🚫 Tài khoản đã bị khoá', (b) => {
    b.append(h('p', {}, text), h('p', { class: 'muted' }, 'Bạn vẫn xem sân trường như khách nhưng không nhắn tin, viết lưu bút hay tham gia hoạt động được. Nếu nghĩ đây là nhầm lẫn, hãy liên hệ ban quản trị trang.'),
      h('button', { class: 'btn primary', onclick: () => closeSheet() }, 'Đã hiểu'));
  });
}
let lastOnline = [];
const visited = new Set();
function visitZone(z) {
  if (me.guest || !ZONE_IDS.includes(z) || visited.has(z)) return;
  visited.add(z);
  call('act', { kind: 'zone', value: z }).then((r) => setMe(r.user)).catch(() => {});
}

// Banner trên cùng (chuông trống, chào cờ) – có thể kèm một nút hành động
function banner(text, action) {
  const el = document.getElementById('banner');
  if (!el) return;
  el.replaceChildren(h('span', {}, text), action ? h('button', { class: 'btn sm primary', onclick: () => { el.hidden = true; action.run(); } }, action.label) : null,
    h('button', { class: 'icon-btn sm', 'aria-label': 'Ẩn thông báo', onclick: () => { el.hidden = true; } }, '✕'));
  el.hidden = false;
  clearTimeout(banner.t); banner.t = setTimeout(() => { el.hidden = true; }, 15000);
}
function isMondayMorning(now = Date.now()) {
  const d = new Date(now + 7 * 3600e3);
  return d.getUTCDay() === 1 && d.getUTCHours() < 12;
}
function goToFlagSeat() {
  backToCampus();
  const lop = LOPS.includes(me.lop) ? me.lop : 'Toán';
  const seat = CAMPUS_SCENE.seats.find((st) => st.chao === lop && !world.others.size) || CAMPUS_SCENE.seats.find((st) => st.chao === lop);
  closeSheet();
  world.walkTo(seat.x, seat.y, { sit: seat });
}
let lastPeriod = '';
function checkBell(first = false) {
  const p = periodOf(Date.now()).label;
  if (first && isMondayMorning()) { banner('🥁 Tùng tùng tùng! Sáng thứ Hai tập trung chào cờ ở sân trường.', { label: 'Ra chào cờ', run: goToFlagSeat }); lastPeriod = p; return; }
  if (!first && p !== lastPeriod) {
    if (p === 'Ra chơi') { sfx.bell(); banner('🔔 Tùng tùng tùng! Ra chơi rồi, căng tin đang giảm giá 20%.', { label: 'Ra căng tin', run: () => { backToCampus(); world.goToHotspot(HOTSPOTS.find((x) => x.id === 'canteen')); } }); }
    else if (p.startsWith('Tiết')) { sfx.drum(3); banner(`🔔 Trống vào lớp: ${p}`, LOPS.includes(me.lop) ? { label: 'Vào lớp', run: () => { backToCampus(); world.goToHotspot(HOTSPOTS.find((x) => x.id === 'lop-' + me.lop)); } } : null); }
  }
  lastPeriod = p;
}

function onSit(seat) {
  sfx.click();
  if (world.scene.id.startsWith('lop:')) {
    if (me.guest) return;
    call('act', { kind: 'classSit', value: world.scene.lop }).then((r) => { setMe(r.user); if (r.msg) { sfx.coin(); toast(r.msg); } }).catch(() => {});
  } else if (seat.chao) {
    if (isMondayMorning() && !me.guest) {
      call('flag').then((r) => { setMe(r.user); if (r.fresh) { sfx.coin(); toast('🇻🇳 Đã điểm danh chào cờ: +20 điểm thi đua, +10.000đ vào ví!'); } else toast('Bạn đã chào cờ tuần này rồi.'); }).catch(() => {});
    } else toast(`🪑 Ghế lớp chuyên ${seat.chao}. Sáng thứ Hai ra đây chào cờ nhé!`);
  }
}

function handleInbox(it) {
  if (it.kind === 'gift') {
    sfx.coin();
    toast(`🎁 ${it.fromName} đã đãi bạn ${it.icon} ${it.item}!`);
    world.say('me', `Cảm ơn ${it.fromName} đã đãi ${it.icon}!`);
  } else if (it.kind === 'love') {
    sfx.heart();
    openSheet('💌 Lời tỏ tình', (b) => {
      b.append(h('div', { class: 'love-card' }, h('p', { class: 'muted' }, `${it.fromName} gửi bạn:`), h('p', { class: 'love-line' }, LOVE_LINES[it.line])),
        h('div', { class: 'stack' }, ...LOVE_REPLIES.map((r, i) => h('button', { class: 'btn ' + (i === 0 ? 'primary' : 'ghost'), onclick: () => {
          call('loveReply', { id: it.id, ans: i }).then(() => { closeSheet(); toast('Đã trả lời ' + it.fromName); }).catch((e) => toast(e.message, 'bad'));
        } }, r))));
    });
  } else if (it.kind === 'loveReply') {
    if (it.ans === 0) sfx.heart();
    toast(`💌 ${it.fromName} trả lời: ${LOVE_REPLIES[it.ans]}`);
  }
}

function onlineSheet() {
  const here = lastOnline.filter((p) => (p.scene || 'campus') === world.scene.id);
  const others = lastOnline.filter((p) => (p.scene || 'campus') !== world.scene.id);
  const where = (p) => (p.scene || 'campus') === 'campus' ? (ZONES[p.zone] || 'Sân trường') : 'Lớp chuyên ' + p.scene.slice(4);
  const row = (p) => h('button', { class: 'pick', onclick: () => { closeSheet(); if ((p.scene || 'campus') === world.scene.id) world.walkTo(p.x + 30, p.y); else toast(`${p.name} đang ở ${where(p)}`); } },
    avatarCanvas(p.look, 40), h('span', { class: 'pick-info' }, h('b', {}, p.name), h('small', {}, [world.subOf(p), where(p)].filter(Boolean).join(' · '))), h('span', { class: 'pick-go' }, p.sit ? '🪑' : '🚶'));
  openSheet(`👥 ${lastOnline.length + (me.guest ? 0 : 1)} người đang online`, (b) => {
    b.append(h('p', { class: 'muted' }, 'Số người cập nhật mỗi vài giây. Chạm vào một bạn ở cùng khu để đi tới.'),
      h('h3', {}, `Ở khu này (${here.length + (me.guest ? 0 : 1)})`), h('div', { class: 'pick-list' }, ...here.map(row)),
      others.length ? [h('h3', {}, `Ở khu khác (${others.length})`), h('div', { class: 'pick-list' }, ...others.map(row))] : null);
  });
}

function soundSheet() {
  openSheet('🎵 Âm thanh', (b, { onCleanup }) => {
    const slider = (label, key, onInput) => {
      const val = h('b', {}, soundSettings[key] + '%');
      const inp = h('input', { type: 'range', min: 0, max: 100, value: soundSettings[key], class: 'range', 'aria-label': label });
      inp.addEventListener('input', () => { soundSettings[key] = Number(inp.value); val.textContent = inp.value + '%'; saveSettings(); onInput?.(); });
      return h('div', { class: 'range-row' }, h('span', {}, label), inp, val);
    };
    const now = h('p', { class: 'now-playing' });
    const playBtn = h('button', { class: 'mp-btn main', 'aria-label': 'Phát / tạm dừng', onclick: () => music.toggle() });
    const list = h('ol', { class: 'playlist' });
    const render = () => {
      now.replaceChildren(music.playing ? '▶️ Đang phát: ' : '⏸ Tạm dừng: ', h('b', {}, music.title()));
      playBtn.textContent = music.playing ? '⏸' : '▶️';
      list.replaceChildren(...PLAYLIST.map((t, i) => h('li', {}, h('button', { class: 'pl-item' + (i === music.i ? ' on' : ''), onclick: () => music.pick(i) },
        h('span', { class: 'pl-no' }, i === music.i && music.playing ? '🔊' : String(i + 1)), t.title))));
    };
    music.onChange = render;
    onCleanup(() => { if (music.onChange === render) music.onChange = null; });
    render();
    b.append(
      h('div', { class: 'card' },
        h('h3', {}, '🎶 Nhạc nền'),
        h('p', { class: 'muted' }, 'Ba bài phát lần lượt, hết bài cuối tự quay lại bài đầu. Chạm tên bài để nghe ngay.'),
        now,
        h('div', { class: 'mp-row' },
          h('button', { class: 'mp-btn', 'aria-label': 'Bài trước', onclick: () => music.prev() }, '⏮'), playBtn,
          h('button', { class: 'mp-btn', 'aria-label': 'Bài sau', onclick: () => music.next() }, '⏭')),
        list,
        slider('Âm lượng nhạc nền', 'music', () => music.volume(soundSettings.music))),
      h('div', { class: 'card' }, h('h3', {}, '🔔 Hiệu ứng'), slider('Âm lượng hiệu ứng', 'sfx', () => sfx.click()),
        h('button', { class: 'btn ghost', onclick: () => sfx.bell() }, 'Nghe thử tiếng chuông')));
  });
}

// ======================= Nhiệm vụ, thành tựu, ví =======================
function questSheet() {
  if (!needMe()) return;
  openSheet('📜 Nhiệm vụ', async (b) => {
    const box = h('div', {}, h('p', { class: 'muted' }, 'Đang tải…'));
    b.append(box);
    const load = async (tabIdx = 0) => {
      const q = await call('quests');
      setMe(q.user);
      const claim = async (kind, id) => {
        try { const r = await call('claim', { kind, id }); setMe(r.user); sfx.coin(); toast('Đã nhận thưởng!'); load(kind === 'daily' ? 0 : 1); }
        catch (e) { toast(e.message, 'bad'); }
      };
      const qRow = (x, kind) => h('div', { class: 'quest' + (x.claimed ? ' claimed' : '') },
        h('span', { class: 'q-ico' }, x.icon || '🏆'),
        h('div', { class: 'q-body' }, h('b', {}, x.title), h('small', {}, x.desc),
          kind === 'ach' && !x.claimed ? h('div', { class: 'bar' }, h('i', { style: { width: Math.round(x.progress / x.n * 100) + '%' } })) : null,
          h('small', { class: 'q-reward' }, `🎁 ${money(x.reward)}${kind === 'ach' ? ` · ${x.progress}/${x.n}` : ''}`)),
        x.claimed ? h('span', { class: 'q-done' }, '✓ Đã nhận')
          : (kind === 'daily' ? x.done : x.progress >= x.n && x.unlocked) ? h('button', { class: 'btn sm primary', onclick: () => claim(kind, x.id) }, 'Nhận')
            : h('span', { class: 'q-todo' }, kind === 'ach' && !x.unlocked ? '🔒' : 'Chưa xong'));
      box.replaceChildren(tabs([
        { label: '📅 Hôm nay', render: (c) => {
          c.append(h('p', { class: 'muted' }, 'Làm mới lúc 5 giờ sáng mỗi ngày. Xong nhiệm vụ thì bấm "Nhận" để cộng tiền vào ví.'),
            h('div', { class: 'quest-list' }, ...q.daily.map((x) => qRow(x, 'daily')),
              qRow({ ...q.bonus, done: q.bonus.got >= q.bonus.need, desc: `${q.bonus.desc} (${Math.min(q.bonus.got, q.bonus.need)}/${q.bonus.need})` }, 'daily')));
        } },
        { label: '🏆 Thành tựu', render: (c) => {
          const total = q.achievements.filter((a) => a.claimed).length;
          c.append(h('p', { class: 'muted' }, `Đã nhận ${total}/${q.achievements.length} thành tựu. Nhận gần đủ thành tựu của cấp hiện tại để mở cấp sau.`));
          q.tiers.forEach((t, i) => {
            const list = q.achievements.filter((a) => a.tier === i);
            c.append(h('details', { class: 'tier', open: t.unlocked && t.got < t.total },
              h('summary', {}, h('b', {}, (t.unlocked ? '🎓 ' : '🔒 ') + t.name), h('span', { class: 'muted' }, ` ${t.got}/${t.total}${t.unlocked ? '' : ` · cần ${q.tiers[i - 1]?.need ?? 0} thành tựu ${q.tiers[i - 1]?.name ?? ''}`}`)),
              h('div', { class: 'quest-list' }, ...list.map((a) => qRow(a, 'ach')))));
          });
        } },
      ], tabIdx));
    };
    try { await load(); } catch (e) { box.replaceChildren(h('p', { class: 'err' }, e.message)); }
  }, { wide: true });
}

function walletSheet() {
  if (!needMe()) return;
  openSheet('💰 Ví ăn vặt', async (b) => {
    try {
      const w = await call('wallet');
      setMe(w.user);
      b.append(h('div', { class: 'wallet-big' }, money(w.wallet)),
        h('p', { class: 'muted' }, `🔥 Chuỗi đi học: ${w.streak || 0} ngày · đi học đều mỗi 5 ngày được thưởng thêm 10.000đ.`),
        h('h3', {}, 'Lịch sử'),
        w.ledger.length ? h('div', { class: 'ledger' }, ...w.ledger.map((x) => h('div', { class: 'ledger-row' }, h('span', {}, x.text), h('b', { class: x.amount >= 0 ? 'ok' : 'err' }, (x.amount >= 0 ? '+' : '') + money(x.amount)), h('small', {}, ago(x.at)))))
          : h('p', { class: 'muted' }, 'Chưa có giao dịch. Gửi xe ở cổng để nhận tiền ăn vặt!'));
    } catch (e) { b.append(h('p', { class: 'err' }, e.message)); }
  });
}

// ======================= Nhân vật phụ =======================
const NPC_ACTIONS = {
  office: ['🏛️ Vào nhà hiệu bộ', () => panels.office()],
  canteen: ['🍜 Mua đồ ăn', () => panels.canteen()],
  football: ['🏸 Chơi đá cầu', () => panels.football()],
  lab: ['🧪 Pha chế hóa học', () => gameSheet('hoahoc')],
  oldLesson: ['📝 Kiểm tra bài cũ', (n) => oldLessonSheet(n)],
  computer: ['💣 Chơi dò mìn', () => gameSheet('domin')],
  library: ['📖 Giới thiệu sách hay', () => panels.library()],
};
function npcSheet(n) {
  openSheet(n.name, (b) => {
    const line = h('p', { class: 'speech' }, n.lines[Math.floor(Math.random() * n.lines.length)]);
    const act = NPC_ACTIONS[n.panel];
    b.append(h('div', { class: 'me-card' }, avatarCanvas(n.look, 72), h('div', {}, h('b', {}, n.name), h('div', { class: 'muted' }, n.sub))), line,
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', onclick: () => { line.textContent = n.lines[Math.floor(Math.random() * n.lines.length)]; } }, '💬 Nói chuyện tiếp'),
        act ? h('button', { class: 'btn primary', onclick: () => act[1](n) }, act[0]) : null),
      ...(n.slot ? [h('button', { class: 'btn link', onclick: () => teacherEditSheet(n.slot) }, n.id === 'npc-gvcn' ? '✏️ Sửa tên thầy cô chủ nhiệm' : isOtherNpc(n.slot) ? '✏️ Sửa tên nhân vật' : '✏️ Sửa tên thầy cô')] : []));
  });
}

function oldLessonSheet(n) {
  openSheet('📝 Kiểm tra bài cũ', (b) => {
    const root = h('div', { class: 'quiz' });
    b.append(h('p', { class: 'muted' }, `${n.name} gọi em lên bảng trả bài môn chuyên ${n.lop}.`), root);
    oldLesson(root, n.lop, (score) => {
      if (me.guest) return;
      call('score', { game: 'baicu', score, lop: n.lop }).then((r) => { setMe(r.user); toast(`${n.name} đã ghi ${score / 10}/10 vào sổ đầu bài hôm nay.`); }).catch(() => {});
    });
  });
}

// ======================= Trò chơi theo vòng =======================
function gameSheet(id) {
  const g = MINIGAMES[id];
  openSheet(g.title, (b, { onCleanup }) => {
    const root = h('div', { class: 'game-root' });
    const board = h('div', {});
    const loadBoard = async () => {
      const r = await call('leaderboard', { game: id });
      board.replaceChildren(rankList(r.items.map((x) => ({ name: x.name, sub: `${x.lop || ''} ${x.khoa || ''}`, val: x.score + ' điểm' })), 'Chưa ai chơi. Lên bảng đầu tiên nào!'));
    };
    b.append(h('p', { class: 'muted' }, g.intro), root, h('h3', {}, '🏆 Bảng xếp hạng'), board);
    const stop = g.start(root, (pts) => {
      if (me.guest) { toast('Ghi danh để lưu điểm lên bảng xếp hạng.'); return; }
      call('score', { game: id, score: pts }).then((r) => { setMe(r.user); loadBoard(); if (pts >= r.best) toast(`🏆 Kỷ lục mới: ${pts} điểm!`); }).catch(() => {});
    });
    onCleanup(() => stop?.());
    visitZone({ hoahoc: 'lab', domin: 'computer' }[id] || 'dacau');
    loadBoard().catch(() => {});
  }, { wide: true });
}

// ======================= Đãi bạn, tỏ tình =======================
function friendsHere() {
  return [...world.others.entries()].map(([id, o]) => ({ id, ...o.data }));
}
function loveSheet(p) {
  if (!needMe()) return;
  openSheet(`💌 Tỏ tình với ${p.name}`, (b) => {
    b.append(h('p', { class: 'muted' }, 'Chọn một lời muốn nói. Bạn ấy sẽ chọn cách trả lời.'),
      h('div', { class: 'stack' }, ...LOVE_LINES.map((ln, i) => h('button', { class: 'btn ghost love-opt', onclick: () => {
        call('love', { to: p.id, line: i }).then(() => { sfx.heart(); closeSheet(); toast(`💌 Đã gửi lời tỏ tình tới ${p.name}`); }).catch((e) => toast(e.message, 'bad'));
      } }, ln))));
  });
}

// ======================= Giấy chứng nhận, thiệp tri ân, tặng hoa =======================
function imageActions(canvas, filename, text) {
  const url = canvas.toDataURL('image/jpeg', 0.9);
  const img = h('img', { class: 'shot', src: url, alt: text });
  const dl = h('a', { class: 'btn ghost', href: url, download: filename }, '⬇️ Tải ảnh');
  const share = h('button', { class: 'btn primary', onclick: async () => {
    const r = await shareCanvas(canvas, filename, text);
    if (r === 'download') { dl.click(); toast('Máy này chưa chia sẻ trực tiếp được – đã tải ảnh về.'); }
  } }, '📤 Chia sẻ');
  return { img, buttons: h('div', { class: 'row-btns' }, share, dl) };
}

function diplomaView(c) {
  const kind = me.role === 'gv' ? 'gv' : me.role === 'khach' || me.role === 'em' ? 'khach' : 'hs';
  let q = Math.floor(Math.random() * DIPLOMA_QUOTES[kind].length);
  const box = h('div', {});
  const render = async () => {
    const cv = await drawDiploma(me.guest ? { ...me, name: 'Khách ghé trường', role: 'khach' } : me, q);
    const { img, buttons } = imageActions(cv, 'giay-chung-nhan-chuyen-thai-nguyen.jpg', 'Giấy chứng nhận kỷ niệm – Trường THPT Chuyên Thái Nguyên');
    box.replaceChildren(img, buttons);
  };
  c.append(h('p', { class: 'muted' }, 'Bản kỷ niệm, không có giá trị pháp lý. Mẹo: soi gương đổi sang áo dài hoặc vest kỷ yếu cho hợp không khí!'),
    h('button', { class: 'btn ghost', onclick: () => { q++; render(); } }, '🔄 Đổi câu đề tặng'), box);
  render();
  if (!me.guest) call('act', { kind: 'diploma' }).then((r) => setMe(r.user)).catch(() => {});
}

function thanksView(c) {
  const to = h('input', { class: 'input', maxlength: 60, placeholder: 'Kính gửi… (vd: Cô Thu, chủ nhiệm Văn K20)', 'aria-label': 'Kính gửi' });
  const msg = h('textarea', { class: 'input', rows: 4, maxlength: 300, placeholder: 'Em cảm ơn cô vì…', 'aria-label': 'Lời tri ân' });
  const out = h('div', {});
  const flowerBox = h('div', { class: 'flower-box' }, h('p', { class: 'muted' }, 'Đang tải…'));
  const loadFlowers = async () => {
    const f = await call('flowers');
    flowerBox.replaceChildren(
      h('div', { class: 'flower-count' }, '💐 ', h('b', {}, String(f.today)), ' bó hoa đã được tặng thầy cô hôm nay'),
      h('button', { class: 'btn primary', onclick: async () => {
        if (!needMe()) return;
        try { const r = await call('flower', { to: to.value }); setMe(r.user); sfx.heart(); toast(r.fresh ? '💐 Đã tặng hoa tri ân thầy cô!' : 'Hôm nay bạn đã tặng hoa rồi, mai tặng tiếp nhé!'); sayPrompt.send?.('💐 Chúc mừng thầy cô 20/11!'); loadFlowers(); }
        catch (e) { toast(e.message, 'bad'); }
      } }, '💐 Tặng hoa tri ân thầy cô'),
      f.recent.length ? h('div', { class: 'feed' }, ...f.recent.slice(0, 5).map((x) => h('div', { class: 'feed-item' }, `💐 ${x.name}${x.khoa ? ' (' + [x.lop, x.khoa].filter(Boolean).join(' ') + ')' : ''} tặng hoa${x.to ? ' ' + x.to : ''} · ${ago(x.at)}`))) : null);
  };
  c.append(flowerBox,
    h('h3', {}, '💌 Thiệp tri ân'), to, msg,
    h('button', { class: 'btn ghost', onclick: async () => {
      const cv = await drawThanksCard({ to: to.value.trim(), message: msg.value.trim(), from: me.guest ? 'Một học trò' : me.name, label: me.guest ? '' : describe(me) });
      const { img, buttons } = imageActions(cv, 'thiep-tri-an.jpg', 'Thiệp tri ân thầy cô từ Trường THPT Chuyên Thái Nguyên online');
      out.replaceChildren(img, buttons);
    } }, '🎨 Tạo thiệp'), out,
    h('h3', {}, '✍️ Lời tri ân'));
  guestbook(c, 'trian', { placeholder: 'Em gửi lời cảm ơn thầy/cô…' });
  loadFlowers().catch(() => {});
}

function isTeachersDay(now = Date.now()) {
  const d = new Date(now + 7 * 3600e3);
  return d.getUTCMonth() === 10 && d.getUTCDate() >= 18 && d.getUTCDate() <= 21;
}

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
      (me.guest ? Promise.reject(new Error('khách')) : api('quiz', { correct, total: qs.length })).then((r) => { setMe(r.user); box.append(h('p', { class: 'muted' }, r.award ? `+${r.award} điểm thi đua cho khóa ${me.khoa || ''}` : 'Hôm nay bạn đã nhận đủ điểm đố vui (10 điểm/ngày).')); }).catch(() => {});
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
