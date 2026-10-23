// Música de fondo generativa: pasodoble lo-fi en cadencia andaluza (Lam - Sol - Fa - Mi).
// Todo sintetizado con WebAudio, sin ficheros ni licencias.
import { getAudioContext } from './sound.js';

const KEY = 'manolo-boomerez-music';
const BPM = 112;
const BEAT = 60 / BPM;
const LOOKAHEAD = 0.15;

// Cada acorde dura dos compases de 2/4 (4 tiempos): bajo + notas del acorde.
const A_SECTION = [
  { bass: 110.0, chord: [220.0, 261.63, 329.63] }, // Lam
  { bass: 98.0, chord: [196.0, 246.94, 293.66] }, // Sol
  { bass: 87.31, chord: [174.61, 220.0, 261.63] }, // Fa
  { bass: 82.41, chord: [164.81, 207.65, 246.94] }, // Mi
];
const B_SECTION = [
  { bass: 146.83, chord: [293.66, 349.23, 440.0] }, // Rem
  { bass: 110.0, chord: [220.0, 261.63, 329.63] }, // Lam
  { bass: 82.41, chord: [164.81, 207.65, 246.94] }, // Mi
  { bass: 110.0, chord: [220.0, 261.63, 329.63] }, // Lam
];
// Escala de La menor armónica (con el sol sostenido que le da el aire flamenco).
const SCALE = [440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 830.61, 880.0];

let enabled = true;
try {
  enabled = localStorage.getItem(KEY) !== '0';
} catch {
  /* sin almacenamiento: con música */
}
let timer = null;
let master = null;
let nextTime = 0;
let step = 0;
let melodyIdx = 4;

export const isMusicOn = () => enabled;

export function setMusic(on) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* sin almacenamiento */
  }
  if (on) startMusic();
  else stopMusic();
}

export function startMusic() {
  if (!enabled || timer) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  master = ctx.createGain();
  master.gain.value = 0.0001;
  master.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 2);
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1900;
  master.connect(lowpass).connect(ctx.destination);
  nextTime = ctx.currentTime + 0.1;
  timer = setInterval(() => schedule(ctx), 40);
}

export function stopMusic() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
  const ctx = getAudioContext();
  if (ctx && master) {
    const m = master;
    m.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
    setTimeout(() => m.disconnect(), 800);
  }
  master = null;
}

function note(ctx, freq, t, dur, type, vol) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function hat(ctx, t, vol) {
  const len = Math.ceil(ctx.sampleRate * 0.05);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 6000;
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

// Programa las corcheas que caen dentro de la ventana de anticipación.
function schedule(ctx) {
  if (!master) return;
  while (nextTime < ctx.currentTime + LOOKAHEAD) {
    const eighth = step % 8; // 8 corcheas = 2 compases de 2/4 = un acorde
    const chordIdx = Math.floor(step / 8) % 8;
    const section = chordIdx < 4 ? A_SECTION : B_SECTION;
    const ch = section[chordIdx % 4];
    const t = nextTime;
    // Pasodoble: bajo en el tiempo fuerte, acorde en el débil ("chun-pa").
    if (eighth % 4 === 0) note(ctx, eighth === 0 ? ch.bass : ch.bass * 1.5, t, BEAT * 0.9, 'triangle', 0.5);
    if (eighth % 4 === 2) for (const f of ch.chord) note(ctx, f, t, BEAT * 0.45, 'square', 0.06);
    if (eighth % 2 === 1) hat(ctx, t, 0.08);
    // Melodía: paseo aleatorio por la escala, a veces con silencios.
    if (Math.random() < (eighth % 2 === 0 ? 0.55 : 0.25)) {
      melodyIdx = Math.max(0, Math.min(SCALE.length - 1, melodyIdx + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
      note(ctx, SCALE[melodyIdx], t, BEAT * (eighth % 2 === 0 ? 0.8 : 0.4), 'triangle', 0.18);
    }
    nextTime += BEAT / 2;
    step++;
  }
}
