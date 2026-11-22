// Tiện ích giao diện: tạo phần tử an toàn (textContent), bảng trượt (sheet), thông báo.

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

let current = null;
export function openSheet(title, build, { wide = false, onClose } = {}) {
  closeSheet();
  const body = h('div', { class: 'sheet-body' });
  // bỏ qua null/false khi thêm nội dung (tránh hiện chữ "null")
  body.append = (...kids) => Element.prototype.append.apply(body, kids.flat().filter((k) => k != null && k !== false));
  body.replaceChildren = (...kids) => Element.prototype.replaceChildren.apply(body, kids.flat().filter((k) => k != null && k !== false));
  const closeBtn = h('button', { class: 'icon-btn', 'aria-label': 'Đóng', onclick: () => closeSheet() }, '✕');
  const sheet = h('div', { class: 'sheet' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'sheet-head' }, h('h2', {}, title), closeBtn), body);
  const backdrop = h('div', { class: 'backdrop', onclick: (e) => { if (e.target === backdrop) closeSheet(); } }, sheet);
  document.body.append(backdrop);
  const cleanups = [];
  current = { backdrop, onClose, cleanups };
  build(body, { onCleanup: (fn) => cleanups.push(fn), setTitle: (t) => { sheet.querySelector('h2').textContent = t; } });
  requestAnimationFrame(() => backdrop.classList.add('open'));
  return body;
}
export function closeSheet() {
  if (!current) return;
  const { backdrop, onClose, cleanups } = current;
  current = null;
  for (const fn of cleanups) try { fn(); } catch { /* bỏ qua */ }
  backdrop.classList.remove('open');
  setTimeout(() => backdrop.remove(), 200);
  onClose?.();
}
export const sheetOpen = () => !!current;
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

let toastTimer = 0;
export function toast(msg, kind = '') {
  let t = document.getElementById('toast');
  if (!t) { t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
  t.textContent = msg;
  t.className = 'show ' + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, 2800);
}

export function money(v) { return (v || 0).toLocaleString('vi-VN') + 'đ'; }

export function ago(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  if (s < 86400 * 30) return Math.floor(s / 86400) + ' ngày trước';
  return new Date(ts).toLocaleDateString('vi-VN');
}

export function tabs(items, initial = 0) {
  // items: [{label, render(container)}]
  const bar = h('div', { class: 'tabs', role: 'tablist' });
  const panel = h('div', { class: 'tab-panel' });
  const btns = items.map((it, i) => h('button', { role: 'tab', class: 'tab', onclick: () => select(i) }, it.label));
  function select(i) {
    btns.forEach((b, j) => { b.classList.toggle('on', i === j); b.setAttribute('aria-selected', String(i === j)); });
    panel.replaceChildren();
    items[i].render(panel);
  }
  bar.append(...btns);
  select(Math.min(initial, items.length - 1));
  return h('div', {}, bar, panel);
}
