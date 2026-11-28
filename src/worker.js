// Cloudflare Worker: phục vụ file tĩnh (public/) và API /api/<action> lưu trên D1.
import { handle } from '../public/js/logic.js';

function d1Store(db) {
  return {
    async get(t, k) {
      const r = await db.prepare('SELECT v FROM kv WHERE t = ? AND k = ?').bind(t, k).first();
      return r ? JSON.parse(r.v) : null;
    },
    async put(t, k, v) {
      await db.prepare('INSERT INTO kv (t, k, v) VALUES (?, ?, ?) ON CONFLICT(t, k) DO UPDATE SET v = excluded.v')
        .bind(t, k, JSON.stringify(v)).run();
    },
    async del(t, k) {
      await db.prepare('DELETE FROM kv WHERE t = ? AND k = ?').bind(t, k).run();
    },
    async list(t, prefix, limit = 500) {
      // So sánh khoảng [prefix, prefix + U+FFFF) để dùng được chỉ mục PRIMARY KEY (t, k)
      const { results } = await db.prepare('SELECT k, v FROM kv WHERE t = ? AND k >= ? AND k < ? ORDER BY k DESC LIMIT ?')
        .bind(t, prefix, prefix + '￿', limit).all();
      return results.map((r) => ({ k: r.k, v: JSON.parse(r.v) }));
    },
  };
}

// Bộ nhớ tạm dùng chung giữa các yêu cầu trong cùng một isolate (ảnh chụp danh sách người online)
const MEM = {};
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Dùng POST' }), { status: 405, headers: JSON_HEADERS });
      const action = url.pathname.slice(5);
      let body = {};
      try {
        const raw = await request.text();
        if (raw.length > (action === 'albumPost' ? 400000 : action === 'adminTeachers' ? 20000 : 8000)) return new Response(JSON.stringify({ error: 'Dữ liệu quá lớn' }), { status: 413, headers: JSON_HEADERS });
        body = raw ? JSON.parse(raw) : {};
      } catch {
        return new Response(JSON.stringify({ error: 'JSON không hợp lệ' }), { status: 400, headers: JSON_HEADERS });
      }
      const auth = request.headers.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      // mã quản trị: `npx wrangler secret put ADMIN_CODE` (chạy thử trên máy: file .dev.vars)
      const ip = request.headers.get('cf-connecting-ip') || '';
      const res = await handle(action, { store: d1Store(env.DB), token, now: Date.now(), adminCode: env.ADMIN_CODE || '', ip, mem: MEM }, body);
      // (Cloudflare tự nén gzip/brotli phản hồi JSON cho trình duyệt)
      return new Response(JSON.stringify(res.body), { status: res.status, headers: JSON_HEADERS });
    }
    return env.ASSETS.fetch(request);
  },
};
