// RNG determinista (mulberry32). El estado vive en state.rng para que las partidas guardadas
// y los tests sean reproducibles.

export function random(state) {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(state, p) {
  return random(state) < p;
}

export function range(state, min, max) {
  return min + (max - min) * random(state);
}

export function int(state, min, max) {
  return Math.floor(range(state, min, max + 1));
}

export function pick(state, list) {
  return list[Math.floor(random(state) * list.length)];
}

export function weightedPick(state, items, weightOf) {
  const weights = items.map(weightOf);
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let r = random(state) * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
