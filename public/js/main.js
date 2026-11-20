import { api, getToken, setToken, getMode } from './api.js';
import { LOPS, ROLES, BREAK_TEXT, periodOf, vnClock, TRANSPORTS, GAMES, LOVE_LINES, LOVE_REPLIES, ZONE_IDS, CLASS_RULES, BAC_HO } from './logic.js';
import { World, CAMPUS_SCENE } from './world.js';
import { classroomScene } from './classroom.js';
import { SPAWN, HOTSPOTS, PLACES } from './campus.js';
import { avatarCanvas, avatarStage, normLook, randomLook, outfitsFor, SKINS, HAIR_COLORS, HAIR_COLOR_NAMES, HAIR_SWATCH, HAIR_NAMES, GIRL_HAIR, outfitLabel, SHIRT_COLORS } from './avatar.js';
import { MINIGAMES, oldLesson } from './minigames.js';
import { drawDiploma, drawThanksCard, shareCanvas, DIPLOMA_QUOTES } from './cards.js';
import { sfx, settings as soundSettings, saveSettings } from './sound.js';
import { campusNpcs, classNpcs } from './npcs.js';
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

// ======================= Nhạc nền: bài ca truyền thống =======================
// Phát qua trình phát nhúng của YouTube (không tải file về). Đổi video tại MUSIC.youtubeId.
const MUSIC = { youtubeId: 'N7Rl5xQd538', title: 'Bài ca truyền thống' };
const music = {
  playing: false,
  frame: null,
  box: null,
  button: h('button', { class: 'music-btn', 'aria-label': 'Âm thanh: nhạc nền và hiệu ứng', title: 'Âm thanh', onclick: () => soundSheet() }, '🎵'),
  cmd(func, args = []) {
    try { this.frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*'); } catch { /* */ }
  },
  volume(v) { this.cmd('setVolume', [v]); },
  open() {
    const id = MUSIC.youtubeId;
    this.frame = h('iframe', {
      src: `https://www.youtube-nocookie.com/embed/${id}?enablejsapi=1&autoplay=1&loop=1&playlist=${id}&playsinline=1&rel=0`,
      title: MUSIC.title, allow: 'autoplay; encrypted-media', referrerpolicy: 'strict-origin-when-cross-origin',
    });
    this.box = h('div', { class: 'music-box', role: 'region', 'aria-label': 'Trình phát nhạc' },
      h('div', { class: 'music-head' },
        h('b', {}, '🎵 ' + MUSIC.title),
        h('button', { class: 'icon-btn sm', 'aria-label': 'Tắt nhạc', onclick: () => this.close() }, '✕')),
      this.frame,
      h('a', { href: `https://www.youtube.com/watch?v=${id}`, target: '_blank', rel: 'noopener' }, 'Không nghe được? Mở trên YouTube ↗'));
    document.body.append(this.box);
    this.frame.addEventListener('load', () => setTimeout(() => this.volume(soundSettings.music), 800));
    this.playing = true;
  },
  close() { this.box?.remove(); this.box = this.frame = null; this.playing = false; this.sync(); },
  toggle() {
    if (!this.box) this.open();
    else if (this.playing) { this.cmd('pauseVideo'); this.playing = false; }
    else { this.cmd('playVideo'); this.playing = true; }
    this.sync();
  },
  sync() { this.button.classList.toggle('on', this.playing); this.button.setAttribute('aria-pressed', String(this.playing)); },
};

// ======================= Sân trường =======================
const hud = { update() {} };

function enterSchool() {
  const canvas = h('canvas', { id: 'world', 'aria-label': 'Sơ đồ sân trường. Chạm để di chuyển, chạm nhãn để mở.' });
  const zoneEl = h('b', {}, 'Sân trường');
  const clockEl = h('small', {});
  const online = h('button', { class: 'online-pill', title: 'Ai đang online', onclick: () => onlineSheet() }, h('i', {}), h('span', {}, '1'));
  const feed = h('div', { class: 'chat-feed', 'aria-live': 'polite' });
  addFeed = (name, text, mine = false) => {
    const row = h('div', { class: 'feed-row' + (mine ? ' mine' : '') }, h('b', {}, name + ': '), text);
    feed.append(row);
    while (feed.children.length > 4) feed.firstChild.remove();
    setTimeout(() => { row.classList.add('fade'); setTimeout(() => row.remove(), 600); }, 9000);
  };
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
  world.onArrive = (hs) => openHotspot(hs);
  world.onTapPlayer = (p) => playerCard(p);
  world.onTapNpc = (n) => npcSheet(n);
  world.onSay = (p, text) => addFeed(p.name, text);
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
  if (new URLSearchParams(location.search).has('debug')) { window.ctnWorld = world; window.ctnDebug = { panels, gameSheet, questSheet, walletSheet, onlineSheet, npcSheet }; } // dùng cho kiểm thử tự động
  hud.update();
  updateClock();
  setInterval(updateClock, 15000);

  let lastZone = '';
  let pendingSay = null;
  sayPrompt.send = (t) => { pendingSay = t; world.say('me', t); addFeed(me.name, t, true); };
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
      if (me.guest) r = await api('online');
      else {
        const sit = world.me.sit;
        const body = { ...pos, zone, scene: world.scene.id, sit: !!sit, sitBack: !!(sit && sit.back), dir: world.me.dir || 1, noBalloon: world.shield };
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
      if (!tick.done) { tick.done = true; hud.update(); }
    } catch { /* thử lại lượt sau */ }
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

  office() {
    openSheet('🏛️ Nhà hiệu bộ', (b) => {
      b.append(tabs([
        { label: '📅 Họp lớp', render: (c) => eventsView(c) },
        { label: '💐 Tri ân', render: (c) => thanksView(c) },
        { label: '🎓 Phòng cấp bằng', render: (c) => diplomaView(c) },
      ], isTeachersDay() ? 1 : 0));
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

async function composeYearbook(shot, people, caption) {
  await LOGO.decode().catch(() => {});
  const W = 720, H = 660;
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
  // ảnh
  x.fillStyle = '#fff'; x.fillRect(34, 124, W - 68, 424);
  x.drawImage(shot, 44, 134, W - 88, 404);
  // chú thích + tên
  x.textAlign = 'center'; x.fillStyle = '#1D2433';
  x.font = font(400, 24, 'Pangolin, "Be Vietnam Pro", cursive');
  if (caption) x.fillText(caption.slice(0, 60), W / 2, 588);
  x.fillStyle = '#5B6577'; x.font = font(600, 13);
  let names = people.join(', ');
  while (x.measureText(names).width > W - 90 && names.length > 4) names = names.slice(0, -4) + '…';
  x.fillText(names, W / 2, caption ? 614 : 596);
  x.fillStyle = '#9AA0A6'; x.font = font(600, 11);
  x.fillText('234A Lương Ngọc Quyến · TP Thái Nguyên', W / 2, H - 28);
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
    const stage = h('div', { class: 'shot-stage' }, h('p', { class: 'muted' }, 'Gọi bạn bè đứng gần nhau (trong khoảng 13 bước quanh bạn), tạo dáng rồi bấm Chụp. Ảnh có khung kỷ yếu, lưu về máy hoặc đăng lên album trường.'));
    const caption = h('input', { class: 'input', maxlength: 60, placeholder: 'Lời ghi trên ảnh (vd: Họp lớp 10 năm 🎉)', 'aria-label': 'Lời ghi trên ảnh' });
    const actions = h('div', { class: 'stack' });
    let timer = 0;
    onCleanup(() => clearInterval(timer));
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
        const full = jpeg(framed, 720, 0.82, 290000);
        const img = h('img', { class: 'shot', src: full, alt: 'Ảnh kỷ yếu: ' + people.join(', ') });
        stage.replaceChildren(img);
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
          post,
          h('button', { class: 'btn ghost', onclick: shoot }, '🔁 Chụp lại'));
      }, 1000);
    };
    actions.append(h('button', { class: 'btn primary big', onclick: shoot }, '📸 Chụp'), h('button', { class: 'btn ghost', onclick: () => albumSheet() }, '🖼️ Xem album'));
    b.append(stage, caption, actions);
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
  openSheet('🎵 Âm thanh', (b) => {
    const slider = (label, key, onInput) => {
      const val = h('b', {}, soundSettings[key] + '%');
      const inp = h('input', { type: 'range', min: 0, max: 100, value: soundSettings[key], class: 'range', 'aria-label': label });
      inp.addEventListener('input', () => { soundSettings[key] = Number(inp.value); val.textContent = inp.value + '%'; saveSettings(); onInput?.(); });
      return h('div', { class: 'range-row' }, h('span', {}, label), inp, val);
    };
    b.append(
      h('div', { class: 'card' },
        h('h3', {}, '🎶 ' + MUSIC.title),
        h('p', { class: 'muted' }, 'Phát qua trình phát YouTube, hiện ở góc dưới bên trái.'),
        h('button', { class: 'btn primary', onclick: () => { music.toggle(); closeSheet(); } }, music.playing ? '⏸ Tạm dừng nhạc' : '▶️ Phát nhạc'),
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
};
function npcSheet(n) {
  openSheet(n.name, (b) => {
    const line = h('p', { class: 'speech' }, n.lines[Math.floor(Math.random() * n.lines.length)]);
    const act = NPC_ACTIONS[n.panel];
    b.append(h('div', { class: 'me-card' }, avatarCanvas(n.look, 72), h('div', {}, h('b', {}, n.name), h('div', { class: 'muted' }, n.sub))), line,
      h('div', { class: 'row-btns' },
        h('button', { class: 'btn ghost', onclick: () => { line.textContent = n.lines[Math.floor(Math.random() * n.lines.length)]; } }, '💬 Nói chuyện tiếp'),
        act ? h('button', { class: 'btn primary', onclick: () => act[1](n) }, act[0]) : null));
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
