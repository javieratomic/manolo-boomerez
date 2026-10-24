// Vista de mapa 2.5D en Canvas: España como maqueta, ciudades y edificios del imperio Boomerez.
import { WORLD, project } from './projection.js';
import { SPAIN, PORTUGAL, FRANCE, BALEARES, CANARIAS, CANARIAS_BOX } from '../data/geo.js';
import { CITIES } from '../data/cities.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import {businessSprite} from '../core/construction.js';
import { getImage, hasArt } from './assets.js';
import { moneyShort } from '../core/helpers.js';
import { RIVALS } from '../data/rivals.js';
import { cityAlerts, ALERT_EMOJI } from '../core/mapInfo.js';
import { layoutLabels } from './labels.js';

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const PULSE_MS = 1500;
const PAIR_PX = 30; // dos ciudades a menos de esto del dedo: el toque acerca en vez de elegir
const LEVEL_RING = { 3: '#e74c3c', 2: '#f39c12', 1: '#95a5a6' };

const SLOTS = [[0, -8], [-32, 4], [32, 4], [-16, 18], [16, 18], [0, 30]];
const BUILDING_SIZE = 66;
const OBRADOR_SIZE = 104;

export class MapView {
  constructor(canvas, { getState, onCityClick, onHover, onBadgeClick, onEmptyClick }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.getState = getState;
    this.onCityClick = onCityClick;
    this.onHover = onHover || (() => {});
    this.onBadgeClick = onBadgeClick || onCityClick;
    this.onEmptyClick = onEmptyClick || (() => {});
    this.badges = [];
    this.pendingFloaters = [];
    this.selT = 0;
    this.cam = { x: 0, y: 0, z: 1 };
    this.fitZ = 1;
    this.selected = null;
    this.hover = null;
    this.floaters = [];
    this.pointers = new Map();
    this.dirty = true;
    this.cityPos = Object.fromEntries(CITIES.map((c) => [c.id, project(c.lon, c.lat)]));
    this.bindInput();
    new ResizeObserver(() => this.resize()).observe(canvas.parentElement);
    this.resize();
    const loop = () => {
      // Comprobación barata por si el ResizeObserver no avisa (p. ej. al mostrar el juego tras el título).
      const parent = this.canvas.parentElement;
      if (parent.clientWidth && (Math.abs(parent.clientWidth - this.w) > 0.5 || Math.abs(parent.clientHeight - this.h) > 0.5)) this.resize();
      // Solo se pinta si algo ha cambiado: el pulso de la selección dura 1,5 s y luego queda un anillo fijo.
      const pulsing = this.selected && !reducedMotion() && performance.now() - this.selT < PULSE_MS;
      if (this.dirty || this.floaters.length || pulsing) this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  resize() {
    const r = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    const prevFit = this.fitZ;
    this.fitZ = Math.min(this.w / WORLD.width, this.h / WORLD.height) * 0.98;
    if (!this.initialized || Math.abs(this.cam.z - prevFit) < 1e-6) this.fit();
    this.initialized = true;
    this.dirty = true;
  }

  fit() {
    this.cam.z = this.fitZ;
    this.cam.x = (this.w - WORLD.width * this.cam.z) / 2;
    this.cam.y = (this.h - WORLD.height * this.cam.z) / 2;
    this.dirty = true;
  }

  focusCity(id, zoom = 1.6) {
    const p = this.cityPos[id];
    if (!p) return;
    this.cam.z = Math.max(this.fitZ, Math.min(zoom * this.fitZ * 2, 3));
    this.cam.x = this.w / 2 - p.x * this.cam.z;
    this.cam.y = this.h / 2 - p.y * this.cam.z;
    this.clamp();
    this.dirty = true;
  }

  toWorld(sx, sy) {
    return { x: (sx - this.cam.x) / this.cam.z, y: (sy - this.cam.y) / this.cam.z };
  }

  zoomAt(sx, sy, factor) {
    const before = this.toWorld(sx, sy);
    this.cam.z = Math.max(this.fitZ * 0.8, Math.min(3, this.cam.z * factor));
    this.cam.x = sx - before.x * this.cam.z;
    this.cam.y = sy - before.y * this.cam.z;
    this.clamp();
    this.dirty = true;
  }

  clamp() {
    const mw = WORLD.width * this.cam.z;
    const mh = WORLD.height * this.cam.z;
    const pad = 80;
    this.cam.x = Math.min(pad, Math.max(this.w - mw - pad, this.cam.x));
    this.cam.y = Math.min(pad, Math.max(this.h - mh - pad, this.cam.y));
    if (mw < this.w) this.cam.x = (this.w - mw) / 2;
    if (mh < this.h) this.cam.y = (this.h - mh) / 2;
  }

  cityAt(sx, sy) {
    const p = this.toWorld(sx, sy);
    let best = null;
    let bestD = Math.max(44, 26 / this.cam.z);
    for (const c of CITIES) {
      const q = this.cityPos[c.id];
      const d = Math.hypot(q.x - p.x, (q.y - p.y) * 1.3);
      if (d < bestD) {
        bestD = d;
        best = c.id;
      }
    }
    return best;
  }

  // Ciudades a menos de `px` píxeles de pantalla del punto.
  citiesNear(sx, sy, px) {
    return CITIES.filter((c) => {
      const q = this.cityPos[c.id];
      return Math.hypot(q.x * this.cam.z + this.cam.x - sx, q.y * this.cam.z + this.cam.y - sy) <= px;
    }).map((c) => c.id);
  }

  bindInput() {
    const cv = this.canvas;
    let drag = null;
    let pinch = null;
    const pos = (e) => {
      const r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, pos(e));
      if (this.pointers.size === 1) {
        const p = pos(e);
        drag = { sx: p.x, sy: p.y, cx: this.cam.x, cy: this.cam.y, moved: false };
      } else if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.cam.z };
        drag = null;
      }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = pos(e);
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, p);
      if (pinch && this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        this.zoomAt(mx, my, (pinch.z * (d / pinch.d)) / this.cam.z);
        return;
      }
      if (drag) {
        const dx = p.x - drag.sx;
        const dy = p.y - drag.sy;
        if (Math.hypot(dx, dy) > 6) {
          drag.moved = true;
          this.onHover(null);
        }
        if (drag.moved) {
          this.cam.x = drag.cx + dx;
          this.cam.y = drag.cy + dy;
          this.clamp();
          this.dirty = true;
        }
        return;
      }
      const h = e.pointerType === 'mouse' ? this.cityAt(p.x, p.y) : null;
      if (h !== this.hover) {
        this.hover = h;
        cv.style.cursor = h ? 'pointer' : 'grab';
        this.dirty = true;
      }
      this.onHover(h, p);
    });
    const end = (e) => {
      const p = pos(e);
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) pinch = null;
      if (drag && !drag.moved && e.type === 'pointerup') {
        const badge = this.badges.find((b) => Math.hypot(b.x - p.x, b.y - p.y) <= b.r + 6);
        // Con el dedo y el mapa casi entero, si caen dos ciudades bajo el dedo, primero se acerca (×2,2).
        if (!badge && e.pointerType !== 'mouse' && this.cam.z < this.fitZ * 1.35 && this.citiesNear(p.x, p.y, PAIR_PX).length >= 2) {
          this.zoomAt(p.x, p.y, 2.2);
          drag = null;
          return;
        }
        const id = badge?.city || this.cityAt(p.x, p.y);
        if (id) {
          this.select(id);
          (badge ? this.onBadgeClick : this.onCityClick)(id);
        } else {
          this.onEmptyClick();
        }
        this.dirty = true;
      }
      drag = null;
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', () => {
      this.onHover(null);
      if (this.hover) {
        this.hover = null;
        this.dirty = true;
      }
    });
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const p = pos(e);
      this.zoomAt(p.x, p.y, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });
  }

  select(id) {
    if (id !== this.selected) this.selT = performance.now();
    this.selected = id;
    this.dirty = true;
  }

  // Beneficio por ciudad tras cerrar el mes: se guarda y se reproduce al cerrar el informe (las 10 ciudades
  // que más se mueven), para que no salga por detrás de la ventana.
  showProfits(report) {
    const byCity = {};
    for (const l of report.lines) byCity[l.city] = (byCity[l.city] || 0) + (l.revenue - l.cost);
    this.pendingFloaters = Object.entries(byCity)
      .filter(([city, v]) => this.cityPos[city] && Math.abs(v) >= 1)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 10)
      .map(([city, v]) => ({ city, text: `${v >= 0 ? '+' : ''}${moneyShort(v)}`, good: v >= 0 }));
  }

  playProfits() {
    const now = performance.now();
    this.floaters = this.pendingFloaters.map((f, i) => ({ ...f, t0: now + i * 90 }));
    this.pendingFloaters = [];
  }

  // ------------------------------------------------------------------ Dibujo
  draw() {
    this.dirty = false;
    const ctx = this.ctx;
    const s = this.getState();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawSea(ctx);
    ctx.setTransform(this.dpr * this.cam.z, 0, 0, this.dpr * this.cam.z, this.dpr * this.cam.x, this.dpr * this.cam.y);
    if (hasArt('map_spain')) {
      ctx.drawImage(getImage('map_spain'), 0, 0, WORLD.width, WORLD.height);
      this.featherMapEdges(ctx);
    } else {
      this.drawProceduralMap(ctx);
    }
    if (s) this.drawCities(ctx, s);
    // Lo que se lee (rótulos, insignias, cifras) va en coordenadas de pantalla: legible con cualquier zoom.
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (s) this.drawOverlay(ctx, s);
    this.drawFloaters(ctx);
  }

  // Color medio del borde del mapa dibujado, para que el mar de fondo empalme con él.
  artSeaColor() {
    if (this.seaColor !== undefined) return this.seaColor;
    this.seaColor = null;
    try {
      const img = getImage('map_spain');
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 34;
      const x = c.getContext('2d');
      x.drawImage(img, 0, 0, 64, 34);
      const d = x.getImageData(0, 0, 64, 34).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < 64 * 34; i++) {
        const px = i % 64, py = Math.floor(i / 64);
        if (px > 2 && px < 61 && py > 2 && py < 31) continue; // solo el marco exterior
        r += d[i * 4]; g += d[i * 4 + 1]; b += d[i * 4 + 2]; n++;
      }
      this.seaColor = `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
    } catch {
      /* sin acceso a los píxeles: se queda el mar por defecto */
    }
    return this.seaColor;
  }

  // Funde los bordes de la imagen del mapa con el mar de fondo.
  featherMapEdges(ctx) {
    const sea = this.artSeaColor();
    if (!sea) return;
    const f = 40; // sin tapar el recuadro de Canarias, que llega casi al borde inferior
    const rgba = (a) => sea.replace('rgb(', 'rgba(').replace(')', `,${a})`);
    const edges = [
      [0, 0, WORLD.width, f, 0, 0, 0, f],
      [0, WORLD.height - f, WORLD.width, f, 0, WORLD.height, 0, WORLD.height - f],
      [0, 0, f, WORLD.height, 0, 0, f, 0],
      [WORLD.width - f, 0, f, WORLD.height, WORLD.width, 0, WORLD.width - f, 0],
    ];
    for (const [x, y, w, h, x0, y0, x1, y1] of edges) {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, rgba(1));
      g.addColorStop(1, rgba(0));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
  }

  drawSea(ctx) {
    const art = hasArt('map_spain') ? this.artSeaColor() : null;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, art || '#5aa9d6');
    g.addColorStop(1, art || '#2f6f9f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    const step = 26;
    const ox = ((this.cam.x % step) + step) % step;
    const oy = ((this.cam.y % step) + step) % step;
    for (let y = oy; y < this.h; y += step) {
      ctx.beginPath();
      for (let x = ox - step; x < this.w; x += step) {
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + step / 4, y - 3, x + step / 2, y);
      }
      ctx.stroke();
    }
  }

  path(ctx, poly, dy = 0) {
    ctx.beginPath();
    poly.forEach(([lon, lat], i) => {
      const p = project(lon, lat);
      if (i === 0) ctx.moveTo(p.x, p.y + dy);
      else ctx.lineTo(p.x, p.y + dy);
    });
    ctx.closePath();
  }

  landBlock(ctx, poly, top, side, outline) {
    const e = WORLD.extrude;
    ctx.fillStyle = 'rgba(0,30,60,0.25)';
    this.path(ctx, poly, e + 6);
    ctx.fill();
    ctx.fillStyle = side;
    for (let k = e; k > 0; k -= 2) {
      this.path(ctx, poly, k);
      ctx.fill();
    }
    ctx.fillStyle = top;
    this.path(ctx, poly);
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  drawProceduralMap(ctx) {
    const neighbour = '#c9c3b4';
    this.landBlock(ctx, FRANCE, neighbour, '#8f8a7e', 'rgba(0,0,0,0.15)');
    this.landBlock(ctx, PORTUGAL, neighbour, '#8f8a7e', 'rgba(0,0,0,0.15)');
    const g = ctx.createLinearGradient(0, 60, 0, 1000);
    g.addColorStop(0, '#6fa65a');
    g.addColorStop(0.25, '#9db866');
    g.addColorStop(0.55, '#d1bc7a');
    g.addColorStop(1, '#d9a762');
    this.landBlock(ctx, SPAIN, g, '#7c5a3a', 'rgba(60,40,20,0.35)');
    for (const isl of BALEARES) this.landBlock(ctx, isl, '#cdbd7e', '#7c5a3a', 'rgba(60,40,20,0.35)');

    // Recuadro de Canarias
    const a = project(CANARIAS_BOX.minLon, CANARIAS_BOX.maxLat);
    const b = project(CANARIAS_BOX.maxLon, CANARIAS_BOX.minLat);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.setLineDash([]);
    for (const isl of CANARIAS) this.landBlock(ctx, isl, '#c9a86a', '#6e4a2e', 'rgba(60,40,20,0.35)');

    // Relieve sugerido: Picos de Europa, Pirineos, Sistema Central, Sierra Nevada
    const mountains = [[-4.8, 43.15], [-4.5, 43.1], [-0.5, 42.65], [0.5, 42.6], [1.2, 42.45], [-5.0, 40.3], [-4.2, 40.75], [-3.3, 37.05], [-2.0, 41.9]];
    for (const [lon, lat] of mountains) this.mountain(ctx, project(lon, lat));

    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(70,65,55,0.5)';
    let p = project(-8.1, 39.6);
    ctx.fillText('PORTUGAL', p.x, p.y);
    p = project(1.4, 43.75);
    ctx.fillText('FRANCIA', p.x, p.y);
    ctx.font = 'italic 14px Georgia, serif';
    ctx.fillStyle = 'rgba(70,65,55,0.45)';
    p = project(-8.1, 39.3);
    ctx.fillText('(aquí no hay mercado)', p.x, p.y);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillText('Mar Cantábrico', project(-5.5, 44.0).x, project(-5.5, 43.85).y);
    ctx.fillText('Mar Mediterráneo', project(1.6, 38.2).x, project(1.6, 38.2).y);
    ctx.fillText('Océano Atlántico', project(-8.6, 37.9).x, project(-8.6, 37.6).y);
  }

  mountain(ctx, p) {
    ctx.fillStyle = 'rgba(110,90,70,0.55)';
    ctx.beginPath();
    ctx.moveTo(p.x - 26, p.y + 8);
    ctx.lineTo(p.x - 6, p.y - 18);
    ctx.lineTo(p.x + 4, p.y - 6);
    ctx.lineTo(p.x + 12, p.y - 14);
    ctx.lineTo(p.x + 28, p.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(p.x - 10, p.y - 13);
    ctx.lineTo(p.x - 6, p.y - 18);
    ctx.lineTo(p.x - 1, p.y - 11);
    ctx.closePath();
    ctx.fill();
  }

  drawCities(ctx, s) {
    const now = performance.now();
    const pulsing = !reducedMotion() && now - this.selT < PULSE_MS;
    const byCity = {};
    for (const b of s.businesses) (byCity[b.city] ||= []).push(b);
    const sorted = [...CITIES].sort((a, b) => this.cityPos[a.id].y - this.cityPos[b.id].y);
    for (const c of sorted) {
      const p = this.cityPos[c.id];
      const list = byCity[c.id] || [];
      const sel = this.selected === c.id;
      const hov = this.hover === c.id;
      // Base
      if (sel) {
        ctx.strokeStyle = `rgba(255,220,80,${pulsing ? 0.6 + 0.4 * Math.sin(now / 125) : 0.95})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 8, 52, 26, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (hasArt('bld_city_base')) {
        ctx.drawImage(getImage('bld_city_base'), p.x - 56, p.y - 20, 112, 56);
      } else {
        ctx.fillStyle = hov || sel ? 'rgba(255,248,220,0.75)' : 'rgba(255,248,220,0.45)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 8, 44, 21, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.hq ? '#c0392b' : '#34495e';
        ctx.beginPath();
        ctx.arc(p.x, p.y + 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      // Edificios
      const items = [];
      if (c.hq) {
        const tier = s.obrador.upgrades.includes('nave') ? 3 : s.obrador.upgrades.length ? 2 : 1;
        items.push({ sprite: `bld_obrador_${tier}`, dx: 0, dy: 2, size: OBRADOR_SIZE });
      }
      list.slice(0, SLOTS.length).forEach((b, i) => {
        const slot = SLOTS[(i + (c.hq ? 1 : 0)) % SLOTS.length];
          items.push({ sprite: businessSprite(b), dx: slot[0], dy: slot[1], size: BUILDING_SIZE, franchise: b.mode === 'franquicia' });
      });
      items.sort((a, b) => a.dy - b.dy);
      for (const it of items) {
        const img = getImage(it.sprite);
        const sz = it.size;
        // Ancla: centro inferior en (128, 240) de un lienzo de 256.
        ctx.drawImage(img, p.x + it.dx - sz / 2, p.y + it.dy - sz * (240 / 256), sz, sz);
        if (it.franchise) {
          if (hasArt('bld_franchise_flag')) ctx.drawImage(getImage('bld_franchise_flag'), p.x + it.dx + 6, p.y + it.dy - sz * 0.95, 18, 18);
          else {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x + it.dx + 14, p.y + it.dy - sz * 0.8, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#333';
            ctx.font = 'bold 9px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('F', p.x + it.dx + 14, p.y + it.dy - sz * 0.8 + 0.5);
          }
        }
      }
    }
  }

  // Rótulos sin solaparse (por prioridad), chapas de rivales, campañas e insignias de alertas.
  drawOverlay(ctx, s) {
    const z = this.cam.z;
    const big = document.body.classList.contains('big-text');
    const fs = big ? 14 : 12;
    const byCity = {};
    for (const b of s.businesses) byCity[b.city] = (byCity[b.city] || 0) + 1;
    const alerts = cityAlerts(s);
    const toScreen = (p, dy = 0) => ({ x: this.cam.x + p.x * z, y: this.cam.y + (p.y + dy) * z });
    const items = [];
    for (const c of CITIES) {
      const p = this.cityPos[c.id];
      const q = toScreen(p, 30);
      if (q.x < -80 || q.x > this.w + 80 || q.y < -40 || q.y > this.h + 40) continue;
      const n = byCity[c.id] || 0;
      const text = n ? `${c.name} · ${n}` : c.name;
      ctx.font = `${c.hq || n ? 'bold ' : ''}${fs}px system-ui, sans-serif`;
      const w = ctx.measureText(text).width + 10;
      const priority = (this.selected === c.id ? 1e6 : 0) + (this.hover === c.id ? 5e5 : 0) + (n || c.hq ? 1e4 + n * 100 : 0) + (alerts[c.id] ? 5e3 : 0) + c.pop * 100;
      items.push({ id: c.id, x: q.x, y: q.y, w, h: fs + 6, priority, text, bold: !!(c.hq || n) });
    }
    for (const it of layoutLabels(items)) {
      const sel = this.selected === it.id;
      ctx.font = `${it.bold ? 'bold ' : ''}${fs}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = sel ? 'rgba(255,214,64,0.97)' : 'rgba(255,255,255,0.9)';
      roundRect(ctx, it.x - it.w / 2, it.y, it.w, it.h, 6);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillText(it.text, it.x, it.y + 3);
      if (s.mods.some((m) => m.campaign && m.city === it.id)) {
        ctx.font = `${fs + 2}px system-ui, "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = 'right';
        ctx.fillText('📢', it.x - it.w / 2 - 3, it.y + 1);
      }
      (s.rivals || []).filter((r) => r.presence[it.id]).forEach((r, i) => {
        const rx = it.x + it.w / 2 + 9 + i * 16;
        const ry = it.y + it.h / 2;
        ctx.fillStyle = RIVALS[r.id].color;
        ctx.beginPath();
        ctx.arc(rx, ry, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(r.presence[it.id]), rx, ry + 0.5);
      });
    }
    // Una insignia por ciudad con el nivel más alto y cuántas alertas hay.
    this.badges = [];
    for (const [city, list] of Object.entries(alerts)) {
      const p = this.cityPos[city];
      if (!p || !list.length) continue;
      const q = toScreen(p, 0);
      const r = 10;
      const bx = q.x + Math.max(16, 40 * z);
      const by = q.y - Math.max(18, 60 * z);
      if (bx < -20 || bx > this.w + 20 || by < -20 || by > this.h + 20) continue;
      const top = list[0];
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = LEVEL_RING[top.level] || LEVEL_RING[1];
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      const icon = `icon_alert_${top.kind}`;
      if (hasArt(icon)) ctx.drawImage(getImage(icon), bx - 8, by - 8, 16, 16);
      else {
        ctx.font = '11px system-ui, "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#222';
        ctx.fillText(ALERT_EMOJI[top.kind] || '!', bx, by + 1);
      }
      if (list.length > 1) {
        ctx.fillStyle = LEVEL_RING[top.level] || LEVEL_RING[1];
        ctx.beginPath();
        ctx.arc(bx + 9, by - 8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(list.length), bx + 9, by - 7.5);
      }
      this.badges.push({ city, x: bx, y: by, r });
    }
  }

  // Cifras de beneficio en pantalla (13 px), subiendo y desvaneciéndose.
  drawFloaters(ctx) {
    const now = performance.now();
    const life = reducedMotion() ? 1600 : 2200;
    this.floaters = this.floaters.filter((f) => now - f.t0 < life);
    for (const f of this.floaters) {
      const k = (now - f.t0) / life;
      if (k < 0) continue;
      const p = this.cityPos[f.city];
      if(!p)continue;
      const x = this.cam.x + p.x * this.cam.z;
      const y = this.cam.y + p.y * this.cam.z - Math.max(24, 70 * this.cam.z) - (reducedMotion() ? 0 : k * 30);
      ctx.globalAlpha = 1 - k * k;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.fillStyle = f.good ? '#8dff8a' : '#ff8a8a';
      ctx.strokeText(f.text, x, y);
      ctx.fillText(f.text, x, y);
      ctx.globalAlpha = 1;
    }
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
