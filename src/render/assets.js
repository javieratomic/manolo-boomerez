// Carga de arte. Fuente de verdad: assets/manifest.json (lo mantiene el agente de arte).
// Solo se cargan los recursos con status "done". Para el resto se genera un marcador
// procedural, así el juego siempre es jugable aunque falte arte.
import { BUSINESS_TYPES } from '../data/businesses.js';

const images = new Map(); // id -> HTMLImageElement cargada
const placeholders = new Map(); // id -> canvas
let manifest = { assets: [] };
const byId = new Map();

export async function initAssets(manifestUrl = 'assets/manifest.json') {
  try {
    const res = await fetch(manifestUrl, { cache: 'no-cache' });
    if (res.ok) manifest = await res.json();
  } catch {
    /* sin manifiesto: todo con marcadores */
  }
  for (const a of manifest.assets || []) byId.set(a.id, a);
  const done = (manifest.assets || []).filter((a) => a.status === 'done');
  await Promise.all(done.map((a) => loadImage(a)));
}

function loadImage(a) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      images.set(a.id, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = a.file;
  });
}

export const assetInfo = (id) => byId.get(id) || null;
export const hasArt = (id) => images.has(id);

export function getImage(id) {
  return images.get(id) || placeholder(id);
}

export function imageUrl(id) {
  const a = byId.get(id);
  if (images.has(id) && a) return a.file;
  const p = placeholder(id);
  if (!p.dataUrl) p.dataUrl = p.toDataURL('image/png');
  return p.dataUrl;
}

// ---------------------------------------------------------------- Marcadores
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function placeholder(id) {
  if (placeholders.has(id)) return placeholders.get(id);
  let c;
  if (id.startsWith('bld_')) c = buildingPlaceholder(id);
  else if (id.startsWith('portrait_')) c = portraitPlaceholder(id);
  else if (id.startsWith('ev_') || id.startsWith('end_')) c = scenePlaceholder(id);
  else if (id.startsWith('icon_')) c = iconPlaceholder(id);
  else c = scenePlaceholder(id);
  placeholders.set(id, c);
  return c;
}

const shade = (hex, f) => {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
};

// Caja isométrica: (cx, by) = centro de la base frontal.
function isoBox(ctx, cx, by, w, h, color) {
  const hw = w / 2;
  const q = w / 4;
  ctx.fillStyle = shade(color, 0.75);
  ctx.beginPath();
  ctx.moveTo(cx - hw, by - q);
  ctx.lineTo(cx, by);
  ctx.lineTo(cx, by - h);
  ctx.lineTo(cx - hw, by - q - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(color, 0.55);
  ctx.beginPath();
  ctx.moveTo(cx + hw, by - q);
  ctx.lineTo(cx, by);
  ctx.lineTo(cx, by - h);
  ctx.lineTo(cx + hw, by - q - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(color, 1.1);
  ctx.beginPath();
  ctx.moveTo(cx, by - h);
  ctx.lineTo(cx - hw, by - q - h);
  ctx.lineTo(cx, by - 2 * q - h);
  ctx.lineTo(cx + hw, by - q - h);
  ctx.closePath();
  ctx.fill();
}

const BUILDING_SHAPES = {
  bld_obrador_1: { color: '#c9a36b', w: 180, h: 70, letter: '🏠', roof: '#a33a2a' },
  bld_obrador_2: { color: '#c9a36b', w: 200, h: 90, letter: '🏭', roof: '#a33a2a' },
  bld_obrador_3: { color: '#9aa3ad', w: 220, h: 110, letter: '🏭', roof: '#59626b' },
  bld_city_base: { color: '#b9ae97', w: 220, h: 10, letter: '' },
};

function buildingPlaceholder(id) {
  const c = canvas(256, 256);
  const ctx = c.getContext('2d');
  const type = Object.values(BUSINESS_TYPES).find((t) => t.sprite === id);
  const shape = BUILDING_SHAPES[id] || { color: type?.color || '#888888', w: 150, h: 95, letter: type?.letter || '?', roof: null };
  const by = 238;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(128, by - shape.w / 4, shape.w / 1.7, shape.w / 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  isoBox(ctx, 128, by, shape.w, shape.h, shape.color);
  if (shape.roof) isoBox(ctx, 128, by - shape.h, shape.w * 0.8, 14, shape.roof.startsWith('#') ? shape.roof : '#aa3333');
  if (shape.letter) {
    const top = by - shape.h - shape.w / 4 - (shape.roof ? 14 : 0);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 6;
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(shape.letter, 128, top);
    ctx.fillText(shape.letter, 128, top);
  }
  return c;
}

// Configuración de los personajes para el retrato provisional.
const CHARACTERS = {
  manolo: { bg: '#f2c14e', skin: '#e8b48a', hair: '#c9c9c9', bald: true, mustache: '#8a8a8a', shirt: '#f08a7e', sunglasses: true, chain: true },
  padre_anselmo: { bg: '#8c7b5e', skin: '#e0b08a', hair: '#ffffff', bald: true, mustache: '#ffffff', shirt: '#3b3b3b', beret: true },
  inspectora_trabajo: { bg: '#4a6fa5', skin: '#d9a07a', hair: '#3b2a20', shirt: '#2d3e50', glasses: true },
  inspector_hacienda: { bg: '#5a5a5a', skin: '#e3b897', hair: '#2a2a2a', mustache: '#2a2a2a', shirt: '#6b6f73', glasses: true, tie: '#7a1f1f' },
  inspector_sanidad: { bg: '#5fa89a', skin: '#d8a27e', hair: '#5a3a28', shirt: '#ffffff', glasses: true },
  empleada_maripili: { bg: '#d35f5f', skin: '#e2ac83', hair: '#6e2c1e', shirt: '#ffffff', apron: true },
  becario: { bg: '#9cc5a1', skin: '#efc39e', hair: '#2f2a26', shirt: '#7d8b99', young: true },
  cunado_jonathan: { bg: '#3a3a6e', skin: '#e6b58f', hair: '#1c1c1c', shirt: '#111111', cap: '#e05a2a', beard: '#1c1c1c' },
  hija_vanessa: { bg: '#b07cc6', skin: '#efc09b', hair: '#3a2416', shirt: '#2e2e2e', young: true, longHair: true },
  abogado_cosme: { bg: '#4b3b2b', skin: '#e0b090', hair: '#e8e8e8', shirt: '#2b2b40', tie: '#5a1a1a', glasses: true },
  gestor_paco: { bg: '#a08b5b', skin: '#dba881', hair: '#4a4a4a', bald: true, mustache: '#4a4a4a', shirt: '#c7c2b0', tie: '#335533' },
  alcalde: { bg: '#3c6e47', skin: '#e3a986', hair: '#777777', shirt: '#22263a', tie: '#c8a400', sash: true },
  influencer: { bg: '#ff8fb1', skin: '#f0c6a5', hair: '#e8cf8a', shirt: '#ffffff', longHair: true, young: true },
  primo_argentino: { bg: '#74acdf', skin: '#e0ae88', hair: '#2a1d14', shirt: '#ffffff', beard: '#2a1d14' },
  inversor_misterioso: { bg: '#222222', skin: '#d9b39a', hair: '#111111', shirt: '#111111', sunglassesOn: true },
  franquiciado: { bg: '#8a8a8a', skin: '#dcae8c', hair: '#5a4632', shirt: '#e8a33a', sad: true },
  vecina: { bg: '#c9a0dc', skin: '#e8b996', hair: '#b0b0b0', shirt: '#7a3d6e', longHair: true },
  hipster: { bg: '#6d6d5a', skin: '#e6b892', hair: '#3b2a1a', shirt: '#3a3a3a', beard: '#3b2a1a', glasses: true },
  comercial: { bg: '#ffcf33', skin: '#efc2a0', hair: '#d9c27a', shirt: '#22314d', tie: '#c0392b' },
  banquero: { bg: '#2c3e50', skin: '#e2b391', hair: '#6a6a6a', shirt: '#1d2733', tie: '#2a7ab0' },
  presentadora: { bg: '#e74c3c', skin: '#eebd9a', hair: '#1f1f1f', shirt: '#f5f5f5', longHair: true },
  coach: { bg: '#f39c12', skin: '#d79a6f', hair: '#2a1a10', shirt: '#ffffff', beard: '#2a1a10', young: true },
  esposa_merche: { bg: '#8e3b46', skin: '#efc3a0', hair: '#e3c77d', shirt: '#9c8f7a', longHair: true },
  exec_1: { bg: '#1f5f7a', skin: '#e9bf9c', hair: '#3b2a1d', shirt: '#4d5656', glasses: true, longHair: true },
  exec_2: { bg: '#7f8c8d', skin: '#efc6a6', hair: '#6b4f2a', shirt: '#2e86c1', young: true },
  exec_3: { bg: '#6b7a3a', skin: '#d9a47f', hair: '#9e9e9e', shirt: '#7e5109', beard: '#9e9e9e' },
  exec_4: { bg: '#6c3483', skin: '#f0c9a8', hair: '#1c1c1c', shirt: '#212f3d', young: true, longHair: true },
  exec_5: { bg: '#b9663f', skin: '#e4b48f', hair: '#b0b0b0', shirt: '#f4ecf7', glasses: true, longHair: true },
  exec_6: { bg: '#1c2833', skin: '#e3b08a', hair: '#111111', shirt: '#1a5276', tie: '#d4ac0d' },
};

const MANOLO_MOODS = { neutral: 'neutral', smug: 'smug', angry: 'angry', scared: 'scared', happy: 'happy', thinking: 'thinking' };

function portraitPlaceholder(id) {
  const key = id.replace('portrait_', '');
  let mood = 'neutral';
  let cfg = CHARACTERS[key];
  if (key.startsWith('manolo')) {
    cfg = CHARACTERS.manolo;
    mood = MANOLO_MOODS[key.split('_')[1]] || 'neutral';
  }
  if (!cfg) cfg = { bg: '#777', skin: '#e0b090', hair: '#333', shirt: '#555' };
  if (cfg.sad) mood = 'scared';
  const c = canvas(512, 512);
  const ctx = c.getContext('2d');
  // Fondo
  const g = ctx.createRadialGradient(256, 200, 40, 256, 256, 360);
  g.addColorStop(0, shade(cfg.bg, 1.25));
  g.addColorStop(1, shade(cfg.bg, 0.7));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  // Hombros
  ctx.fillStyle = cfg.shirt;
  ctx.beginPath();
  ctx.ellipse(256, 520, 200, 150, 0, Math.PI, 0);
  ctx.fill();
  if (cfg.apron) {
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(196, 420, 120, 92);
  }
  if (cfg.tie) {
    ctx.fillStyle = cfg.tie;
    ctx.beginPath();
    ctx.moveTo(246, 385);
    ctx.lineTo(266, 385);
    ctx.lineTo(276, 480);
    ctx.lineTo(256, 505);
    ctx.lineTo(236, 480);
    ctx.closePath();
    ctx.fill();
  }
  if (cfg.chain) {
    ctx.strokeStyle = '#e8c547';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(256, 370, 62, 0.25 * Math.PI, 0.75 * Math.PI);
    ctx.stroke();
  }
  if (cfg.sash) {
    ctx.strokeStyle = '#c60b1e';
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(130, 400);
    ctx.lineTo(380, 512);
    ctx.stroke();
  }
  // Cuello y cabeza
  ctx.fillStyle = shade(cfg.skin, 0.9);
  ctx.fillRect(220, 320, 72, 60);
  if (cfg.longHair) {
    ctx.fillStyle = cfg.hair;
    ctx.beginPath();
    ctx.ellipse(256, 250, 128, 170, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = cfg.skin;
  ctx.beginPath();
  ctx.ellipse(256, 230, cfg.young ? 100 : 110, cfg.young ? 125 : 135, 0, 0, Math.PI * 2);
  ctx.fill();
  // Pelo
  ctx.fillStyle = cfg.hair;
  if (cfg.bald) {
    ctx.beginPath();
    ctx.ellipse(152, 220, 22, 50, 0, 0, Math.PI * 2);
    ctx.ellipse(360, 220, 22, 50, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(256, 140, 112, 62, 0, Math.PI, 0);
    ctx.fill();
  }
  if (cfg.beret) {
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.ellipse(256, 110, 120, 38, -0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  if (cfg.cap) {
    ctx.fillStyle = cfg.cap;
    ctx.beginPath();
    ctx.ellipse(256, 120, 115, 50, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(256, 112, 150, 18);
  }
  // Ojos y cejas según el humor
  const browY = mood === 'angry' ? 188 : mood === 'scared' ? 172 : 180;
  ctx.strokeStyle = shade(cfg.hair === '#ffffff' ? '#999999' : cfg.hair, 0.8);
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  const browTilt = mood === 'angry' ? 14 : mood === 'scared' ? -12 : mood === 'smug' ? 6 : 0;
  ctx.beginPath();
  ctx.moveTo(196, browY - browTilt);
  ctx.lineTo(236, browY + browTilt);
  ctx.moveTo(276, browY + (mood === 'smug' ? -10 : browTilt));
  ctx.lineTo(316, browY - browTilt);
  ctx.stroke();
  if (cfg.sunglassesOn) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(186, 198, 64, 34);
    ctx.fillRect(262, 198, 64, 34);
    ctx.fillRect(248, 206, 16, 6);
  } else {
    ctx.fillStyle = '#1f1f1f';
    const eyeH = mood === 'scared' ? 16 : mood === 'smug' ? 6 : 11;
    ctx.beginPath();
    ctx.ellipse(216, 214, 11, eyeH, 0, 0, Math.PI * 2);
    ctx.ellipse(296, 214, 11, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (cfg.glasses) {
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 5;
    ctx.strokeRect(186, 196, 60, 38);
    ctx.strokeRect(266, 196, 60, 38);
    ctx.beginPath();
    ctx.moveTo(246, 212);
    ctx.lineTo(266, 212);
    ctx.stroke();
  }
  if (cfg.sunglasses) {
    // Gafas de sol subidas en la calva: seña de identidad de Manolo.
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(220, 118, 36, 18, -0.1, 0, Math.PI * 2);
    ctx.ellipse(292, 118, 36, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(250, 112, 12, 6);
  }
  // Nariz
  ctx.fillStyle = shade(cfg.skin, 0.85);
  ctx.beginPath();
  ctx.ellipse(256, 258, 18, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // Barba / bigote
  if (cfg.beard) {
    ctx.fillStyle = cfg.beard;
    ctx.beginPath();
    ctx.ellipse(256, 320, 96, 60, 0, 0, Math.PI);
    ctx.fill();
  }
  if (cfg.mustache) {
    ctx.fillStyle = cfg.mustache;
    ctx.beginPath();
    ctx.ellipse(256, 292, 52, 16, 0, Math.PI, 0);
    ctx.fill();
  }
  // Boca
  ctx.strokeStyle = '#6b2a20';
  ctx.lineWidth = 8;
  ctx.beginPath();
  if (mood === 'happy' || mood === 'smug') ctx.arc(256, 300, 34, 0.15 * Math.PI, 0.85 * Math.PI);
  else if (mood === 'angry') ctx.arc(256, 335, 30, 1.15 * Math.PI, 1.85 * Math.PI);
  else if (mood === 'scared') ctx.ellipse(256, 318, 16, 20, 0, 0, Math.PI * 2);
  else if (mood === 'thinking') {
    ctx.moveTo(232, 318);
    ctx.lineTo(280, 312);
  } else {
    ctx.moveTo(228, 316);
    ctx.lineTo(284, 316);
  }
  ctx.stroke();
  // Etiqueta "provisional"
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 474, 512, 38);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(key.replace(/_/g, ' ').toUpperCase(), 256, 501);
  return c;
}

const SCENE_EMOJI = {
  ev_intro_herencia: '📜', ev_navidad: '🎄', ev_agosto: '🏖️', ev_inspeccion: '🔎', ev_hacienda: '🏛️', ev_huelga: '✊',
  ev_franquiciado: '😭', ev_pisos_turisticos: '🧳', ev_cripto: '🪙', ev_influencer: '🤳', ev_rata: '🐀', ev_smi: '📈',
  ev_hija: '🎨', ev_supermercado: '🛒', ev_smash: '🍔', ev_vecinos: '🪧', ev_hilo: '🧵', ev_primo: '🧉', ev_premio: '🏆',
  ev_sanidad: '🧪', ev_rival: '☕', ev_banco: '🏦', ev_tv: '📺', ev_maletin: '💼', ev_sindicato: '🗳️', ev_robot: '🤖',
  ev_empanadas: '🥟', ev_calor: '🥵', ev_coach: '🧘', ev_erte: '📋',
  ev_macro_expansion: '📈', ev_macro_burbuja: '🫧', ev_macro_crisis: '📉', ev_macro_recuperacion: '🌱', ev_rival_copia: '🪞', ev_rival_oferta: '💰',
  ev_piso_ilegal: '🔭', ev_averia: '🛠️', ev_susto_padel: '🫀', ev_elecciones: '🗳️', ev_fichaje: '📦', ev_chivato: '💾', ev_divorcio: '💔', ev_junta: '📊',
  ev_jefe_infiltrado: '🥸', ev_okupas: '🔒', ev_igp: '🏅', ev_riders: '🛵', ev_fondos: '🇪🇺', ev_peor_jefe: '👎', ev_mantequilla: '🧈', ev_vanessa: '🎓', ev_cena: '🍽️',
  end_bancarrota: '📉', end_carcel: '⛓️', end_cooperativa: '🤝', end_forbes: '💎', end_tiburon: '🦈', end_pyme: '🏪', end_ruina: '🥀',
};

function scenePlaceholder(id) {
  const isEnd = id.startsWith('end_');
  const c = canvas(isEnd ? 1280 : 768, isEnd ? 720 : 432);
  const ctx = c.getContext('2d');
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, `hsl(${hue},45%,62%)`);
  g.addColorStop(1, `hsl(${(hue + 40) % 360},50%,32%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  // Suelo isométrico sugerido
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = -10; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 80, c.height);
    ctx.lineTo(i * 80 + c.height * 0.9, c.height * 0.1);
    ctx.lineTo(i * 80 + c.height * 0.9 + 40, c.height * 0.1);
    ctx.lineTo(i * 80 + 40, c.height);
    ctx.fill();
  }
  ctx.font = `${isEnd ? 260 : 170}px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(SCENE_EMOJI[id] || '🥐', c.width / 2, c.height / 2);
  return c;
}

const ICON_EMOJI = {
  icon_cash: '💶', icon_debt: '🏦', icon_patrimonio: '🏰', icon_rep: '⭐', icon_moral: '🙂', icon_fama: '📣',
  icon_inspeccion: '🔎', icon_hacienda: '🏛️', icon_calendar: '📅', icon_staff: '👷', icon_control: '🔑',
  icon_action_linkedin: '💼', icon_action_bar: '🍺', icon_action_alcalde: '🥩', icon_action_charla: '📣',
  icon_action_cuentas: '🧾', icon_action_padel: '🎾', icon_action_marbella: '🏖️',
  icon_macro: '📈', icon_action_cena: '🍲', icon_action_escapada: '💐',
};

function iconPlaceholder(id) {
  const c = canvas(64, 64);
  const ctx = c.getContext('2d');
  ctx.font = '44px system-ui, "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ICON_EMOJI[id] || '•', 32, 36);
  return c;
}
