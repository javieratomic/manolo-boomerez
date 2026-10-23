// Efectos de sonido sintetizados con WebAudio: sin ficheros de audio ni licencias.
const KEY = 'manolo-boomerez-mute';
let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem(KEY) === '1';
} catch {
  /* sin almacenamiento: con sonido */
}

export const isMuted = () => muted;

export function setMuted(v) {
  muted = v;
  try {
    localStorage.setItem(KEY, v ? '1' : '0');
  } catch {
    /* sin almacenamiento */
  }
}

export const getAudioContext = () => audio();

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, { type = 'sine', vol = 0.15, slide = 0 } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(start, dur, vol = 0.2, freq = 800) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t0);
}

const SOUNDS = {
  click: () => tone(900, 0, 0.05, { type: 'square', vol: 0.04 }),
  // Caja registradora: "ka-ching".
  cash: () => {
    noise(0, 0.06, 0.15, 3000);
    tone(1568, 0.05, 0.25, { type: 'triangle', vol: 0.12 });
    tone(2093, 0.12, 0.45, { type: 'triangle', vol: 0.1 });
  },
  loss: () => {
    tone(392, 0, 0.18, { type: 'sawtooth', vol: 0.06 });
    tone(311, 0.16, 0.35, { type: 'sawtooth', vol: 0.06, slide: -80 });
  },
  build: () => {
    noise(0, 0.08, 0.25, 500);
    noise(0.12, 0.08, 0.25, 500);
    tone(523, 0.22, 0.12, { type: 'triangle' });
    tone(784, 0.32, 0.25, { type: 'triangle' });
  },
  // Sello de la inspección.
  stamp: () => {
    noise(0, 0.18, 0.5, 220);
    tone(80, 0, 0.25, { type: 'sine', vol: 0.3, slide: -30 });
  },
  event: () => {
    tone(660, 0, 0.12, { type: 'triangle', vol: 0.08 });
    tone(880, 0.1, 0.18, { type: 'triangle', vol: 0.08 });
  },
  goal: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.3, { type: 'triangle', vol: 0.1 })),
  ending: () => [392, 494, 587, 784].forEach((f, i) => tone(f, i * 0.18, 0.6, { type: 'triangle', vol: 0.12 })),
};

export function play(name) {
  if (muted) return;
  try {
    SOUNDS[name]?.();
  } catch {
    /* el audio nunca debe romper el juego */
  }
}
