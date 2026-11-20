// Âm thanh hiệu ứng tổng hợp bằng Web Audio (không cần file), có chỉnh âm lượng và lưu lựa chọn.
const KEY = 'ctn.sound';
export const settings = (() => {
  try { return { music: 60, sfx: 70, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { music: 60, sfx: 70 }; }
})();
export function saveSettings() { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* */ } }

let ac = null;
function ctx() {
  try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}

function tone({ f = 440, f2 = null, dur = 0.15, type = 'sine', vol = 0.5, at = 0 }) {
  const a = ctx();
  if (!a || settings.sfx <= 0) return;
  const t = a.currentTime + 0.01 + at;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(vol * settings.sfx / 100, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

function noise({ dur = 0.25, vol = 0.4, at = 0, hp = 800 }) {
  const a = ctx();
  if (!a || settings.sfx <= 0) return;
  const t = a.currentTime + 0.01 + at;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(); src.buffer = buf;
  const filt = a.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = hp;
  const g = a.createGain(); g.gain.value = vol * settings.sfx / 100;
  src.connect(filt).connect(g).connect(a.destination);
  src.start(t);
}

export const sfx = {
  click: () => tone({ f: 660, dur: 0.05, type: 'triangle', vol: 0.25 }),
  coin: () => { tone({ f: 988, dur: 0.08, type: 'square', vol: 0.18 }); tone({ f: 1319, dur: 0.18, type: 'square', vol: 0.18, at: 0.08 }); },
  pop: () => tone({ f: 300, f2: 900, dur: 0.12, type: 'sine', vol: 0.4 }),
  whoosh: () => noise({ dur: 0.3, vol: 0.15, hp: 2000 }),
  splash: () => { noise({ dur: 0.35, vol: 0.5, hp: 600 }); tone({ f: 500, f2: 120, dur: 0.25, vol: 0.25 }); },
  drum: (n = 3) => { for (let i = 0; i < n; i++) tone({ f: 110, f2: 45, dur: 0.45, vol: 0.9, at: i * 0.55 }); },
  bell: () => { for (let i = 0; i < 3; i++) { tone({ f: 1046, dur: 0.6, type: 'triangle', vol: 0.3, at: i * 0.35 }); tone({ f: 1568, dur: 0.4, vol: 0.12, at: i * 0.35 }); } },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone({ f, dur: 0.18, type: 'triangle', vol: 0.3, at: i * 0.09 })),
  lose: () => [392, 330, 262].forEach((f, i) => tone({ f, dur: 0.22, type: 'triangle', vol: 0.3, at: i * 0.12 })),
  shutter: () => { noise({ dur: 0.08, vol: 0.5, hp: 3000 }); noise({ dur: 0.06, vol: 0.4, hp: 3000, at: 0.1 }); },
  heart: () => [660, 880].forEach((f, i) => tone({ f, dur: 0.2, vol: 0.3, at: i * 0.15 })),
};
