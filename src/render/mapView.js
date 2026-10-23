// Vista de mapa 2.5D en Canvas: España como maqueta, ciudades y edificios del imperio Boomerez.
import { WORLD, project } from './projection.js';
import { SPAIN, PORTUGAL, FRANCE, BALEARES, CANARIAS, CANARIAS_BOX } from '../data/geo.js';
import { CITIES } from '../data/cities.js';
import { BUSINESS_TYPES } from '../data/businesses.js';
import { getImage, hasArt } from './assets.js';
import { moneyShort } from '../core/helpers.js';

const SLOTS = [[0, -8], [-32, 4], [32, 4], [-16, 18], [16, 18], [0, 30]];
const BUILDING_SIZE = 66;
const OBRADOR_SIZE = 104;

export class MapView {
  constructor(canvas, { getState, onCityClick, onHover }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.getState = getState;
    this.onCityClick = onCityClick;
    this.onHover = onHover || (() => {});
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
      if (this.dirty || this.floaters.length || this.selected) this.draw();
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
        const id = this.cityAt(p.x, p.y);
        if (id) {
          this.selected = id;
          this.onCityClick(id);
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
    this.selected = id;
    this.dirty = true;
  }

  // Textos flotantes de beneficio por ciudad tras cerrar el mes.
  showProfits(report) {
    const byCity = {};
    for (const l of report.lines) byCity[l.city] = (byCity[l.city] || 0) + (l.revenue - l.cost);
    const now = performance.now();
    let i = 0;
    for (const [city, v] of Object.entries(byCity)) {
      if (Math.abs(v) < 1) continue;
      this.floaters.push({ city, text: `${v >= 0 ? '+' : ''}${moneyShort(v)}`, good: v >= 0, t0: now + i * 90 });
      i++;
    }
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
    } else {
      this.drawProceduralMap(ctx);
    }
    if (s) this.drawCities(ctx, s);
    this.drawFloaters(ctx);
  }

  drawSea(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#5aa9d6');
    g.addColorStop(1, '#2f6f9f');
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
    const z = this.cam.z;
    const t = performance.now() / 1000;
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
        ctx.strokeStyle = `rgba(255,220,80,${0.6 + 0.4 * Math.sin(t * 4)})`;
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
        items.push({ sprite: BUSINESS_TYPES[b.type].sprite, dx: slot[0], dy: slot[1], size: BUILDING_SIZE, franchise: b.mode === 'franquicia' });
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
      // Etiqueta
      const fs = Math.max(12, 13 / Math.sqrt(z));
      ctx.font = `${c.hq ? 'bold ' : ''}${fs}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const label = list.length ? `${c.name} · ${list.length}` : c.name;
      const w = ctx.measureText(label).width + 10;
      ctx.fillStyle = sel ? 'rgba(255,214,64,0.95)' : 'rgba(255,255,255,0.88)';
      roundRect(ctx, p.x - w / 2, p.y + 32, w, fs + 6, 6);
      ctx.fill();
      ctx.fillStyle = '#222';
      ctx.fillText(label, p.x, p.y + 35);
    }
  }

  drawFloaters(ctx) {
    const now = performance.now();
    const life = 2200;
    this.floaters = this.floaters.filter((f) => now - f.t0 < life);
    for (const f of this.floaters) {
      const k = (now - f.t0) / life;
      if (k < 0) continue;
      const p = this.cityPos[f.city];
      ctx.globalAlpha = 1 - k * k;
      ctx.font = `bold ${Math.max(15, 16 / Math.sqrt(this.cam.z))}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.fillStyle = f.good ? '#8dff8a' : '#ff8a8a';
      const y = p.y - 70 - k * 40;
      ctx.strokeText(f.text, p.x, y);
      ctx.fillText(f.text, p.x, y);
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
