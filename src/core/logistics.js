// Logística: los sobaos viajan desde el obrador más cercano y el transporte cuesta por kilómetro.
import { CITY_BY_ID } from '../data/cities.js';

export const TRANSPORT_PER_100KM = 0.025; // € por sobao y cada 100 km
export const REGIONAL_CAPACITY = 15000;

// Coordenadas reales (Canarias se dibuja en un recuadro) y sobrecoste por cruzar el mar.
const REAL = { laspalmas: { lat: 28.12, lon: -15.43 } };
const ISLAND = { laspalmas: 2.2, palma: 1.5, ibiza: 1.5 };

function coords(id) {
  const c = CITY_BY_ID[id];
  return REAL[id] || { lat: c.lat, lon: c.lon };
}

export function km(a, b) {
  const p = coords(a);
  const q = coords(b);
  const rad = Math.PI / 180;
  const dLat = (q.lat - p.lat) * rad;
  const dLon = (q.lon - p.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p.lat * rad) * Math.cos(q.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h)) * 1.25; // por carretera, algo más que en línea recta
}

export function productionSites(s) {
  return ['selaya', ...s.businesses.filter((b) => b.type === 'obrador_regional').map((b) => b.city)];
}

export function nearestSite(s, cityId) {
  let best = null;
  for (const site of productionSites(s)) {
    const d = site === cityId ? 0 : km(site, cityId);
    if (!best || d < best.km) best = { city: site, km: d };
  }
  return best;
}

// Coste de transporte por sobao hasta una ciudad.
export function transportCost(s, cityId) {
  const n = nearestSite(s, cityId);
  // Cruzar el mar encarece el transporte, salga de una isla o vaya a ella.
  const sea = n.city !== cityId ? Math.max(ISLAND[cityId] || 1, ISLAND[n.city] || 1) : 1;
  return (TRANSPORT_PER_100KM * n.km) / 100 * sea;
}

export function regionalCount(s) {
  return s.businesses.filter((b) => b.type === 'obrador_regional').length;
}
