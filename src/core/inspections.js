// Cálculo de la gravedad de inspecciones y auditorías.

export const DELITO_FISCAL = 120000;

export function laborSeverity(s) {
  const p = s.policies;
  const control = s.lastReport?.control ?? 0;
  let v = 0;
  v += { convenio: 0, minimo: 0.5, negro: 3 }[p.salario];
  v += { pagadas: 0, gratis: 1, tiburon: 2.5 }[p.horas];
  v += { ninguno: 0, algunos: 1.2, legion: 2.5 }[p.becarios];
  if (s.businesses.some((b) => b.type === 'vivienda')) v += { social: 0, mercado: 0.2, abusivo: 1.5 }[p.alquiler] * control;
  return v;
}

export function laborFine(s) {
  const employees = s.lastReport?.employees ?? 10;
  const fine = laborSeverity(s) * (1500 + employees * 300);
  return Math.round(fine * (s.perks.abogado ? 0.7 : 1));
}

export function haciendaDebt(s) {
  return Math.round(s.evaded * (s.perks.andorra ? 1.5 : 1));
}

// Probabilidad mensual de visita según el radar.
export const inspectionChance = (heat) => 0.01 + Math.pow(heat / 100, 1.5) * 0.35;
export const auditChance = (heat) => 0.008 + Math.pow(heat / 100, 1.5) * 0.3;
