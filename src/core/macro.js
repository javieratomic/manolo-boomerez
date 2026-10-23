// Ciclo económico: fases que afectan a la demanda, al turismo, al crédito y al ladrillo.
import { PHASES } from '../data/macro.js';
import { int } from './rng.js';
import { log } from './helpers.js';

export function macroFx(s) {
  return PHASES[s.macro?.phase] || PHASES.expansion;
}

// Avanza un mes. Si cambia de fase, encola la carta correspondiente.
export function tickMacro(s) {
  const m = s.macro;
  m.months++;
  if (m.months < m.length) return null;
  const next = PHASES[m.phase].next;
  const p = PHASES[next];
  s.macro = { phase: next, months: 0, length: int(s, p.min, p.max) };
  log(s, `${p.emoji} La economía entra en fase de ${p.label.toLowerCase()}.`, next === 'crisis' ? 'bad' : 'info');
  s.pending.push({ kind: 'event', id: `macro_${next}` });
  return next;
}
