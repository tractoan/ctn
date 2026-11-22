// Gọi API. Nếu không có máy chủ (mở bằng file tĩnh), tự chuyển sang chế độ offline:
// cùng nghiệp vụ trong logic.js, dữ liệu lưu trong localStorage của trình duyệt.
import { handle } from './logic.js';

const TOKEN_KEY = 'ctn.token';
export const OFFLINE_ADMIN_CODE = 'DEMO';
let mode = null; // 'online' | 'offline'
let detecting = null;

export function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } }
export function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* bỏ qua */ } }

const mem = new Map();
const localStore = {
  _key(t, k) { return `ctn.db.${t}.${k}`; },
  async get(t, k) {
    const key = this._key(t, k);
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return mem.has(key) ? mem.get(key) : null; }
  },
  async put(t, k, v) {
    const key = this._key(t, k);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { mem.set(key, v); }
  },
  async del(t, k) {
    const key = this._key(t, k);
    try { localStorage.removeItem(key); } catch { mem.delete(key); }
  },
  async list(t, prefix, limit = 500) {
    const head = this._key(t, prefix);
    const keys = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(head)) keys.push(k); } }
    catch { for (const k of mem.keys()) if (k.startsWith(head)) keys.push(k); }
    keys.sort().reverse();
    const out = [];
    const base = this._key(t, '').length;
    for (const k of keys.slice(0, limit)) out.push({ k: k.slice(base), v: await this.get(t, k.slice(base)) });
    return out;
  },
};

async function detect() {
  if (mode) return mode;
  if (!detecting) {
    detecting = (async () => {
      if (location.protocol === 'file:') return (mode = 'offline');
      try {
        const r = await fetch('/api/ping', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } });
        const j = await r.json();
        mode = r.ok && j.ok ? 'online' : 'offline';
      } catch { mode = 'offline'; }
      return mode;
    })();
  }
  return detecting;
}

export function getMode() { return mode; }

export async function api(action, body = {}) {
  await detect();
  if (mode === 'offline') {
    // chế độ ngoại tuyến (dữ liệu chỉ trên trình duyệt này): mã quản trị chạy thử là DEMO
    const res = await handle(action, { store: localStore, token: getToken(), now: Date.now(), adminCode: OFFLINE_ADMIN_CODE, ip: 'local' }, JSON.parse(JSON.stringify(body)));
    if (res.status !== 200) throw Object.assign(new Error(res.body.error), { status: res.status });
    return res.body;
  }
  const r = await fetch('/api/' + action, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + getToken() },
    body: JSON.stringify(body),
  });
  let j;
  try { j = await r.json(); } catch { j = { error: 'Mất kết nối máy chủ' }; }
  if (!r.ok) throw Object.assign(new Error(j.error || 'Lỗi'), { status: r.status });
  return j;
}
