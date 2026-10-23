// Cálculo económico mensual. Función pura: no muta el estado (salvo lo que haga quien la llama).
import { BUSINESS_TYPES, OBRADOR_BASE, OBRADOR_UPGRADES, PERKS } from '../data/businesses.js';
import { POLICIES, BECARIO_WAGE } from '../data/policies.js';
import { CITY_BY_ID } from '../data/cities.js';
import { difficultyOf } from './state.js';
import { macroFx } from './macro.js';

export const SOBAO_SEASON = [1.05, 0.95, 0.95, 1, 1, 0.9, 0.85, 0.9, 1, 1.05, 1.1, 1.35];
export const TOURISM_SEASON = [0.6, 0.65, 0.8, 0.95, 1, 1.2, 1.5, 1.55, 1.15, 0.9, 0.7, 0.85];
export const CORPORATE_TAX = 0.25;
export const FRANCHISE_ROYALTY = 0.05;
export const FRANCHISEE_WAGE = 1500;

export function policyFx(s) {
  const p = s.policies;
  return {
    sal: POLICIES.salario.options[p.salario],
    hor: POLICIES.horas.options[p.horas],
    bec: POLICIES.becarios.options[p.becarios],
    alq: POLICIES.alquiler.options[p.alquiler],
    con: POLICIES.contabilidad.options[p.contabilidad],
    ing: POLICIES.ingredientes.options[p.ingredientes],
  };
}

export const moralFactor = (moral) => 0.8 + (0.4 * moral) / 100;
export const repFactor = (rep) => 0.55 + (0.9 * rep) / 100;

export function obradorCapacity(s) {
  return OBRADOR_BASE.capacity + s.obrador.upgrades.reduce((a, id) => a + (OBRADOR_UPGRADES.find((u) => u.id === id)?.capacity || 0), 0);
}

export function obradorValue(s) {
  return OBRADOR_BASE.baseValue + s.obrador.upgrades.reduce((a, id) => a + (OBRADOR_UPGRADES.find((u) => u.id === id)?.cost || 0) * 0.8, 0);
}

export function averageWage(s) {
  const fx = policyFx(s);
  const base = (1 - fx.bec.share) * fx.sal.wage * (s.wageIndex || 1) + fx.bec.share * BECARIO_WAGE;
  return base * fx.hor.laborMult * modFactor(s, 'labor');
}

function modFactor(s, kind, category) {
  let f = 1;
  for (const m of s.mods) {
    if (m.kind !== kind) continue;
    if (m.category && m.category !== category) continue;
    f *= m.factor;
  }
  return f;
}

export function patrimonio(s) {
  const assets = s.businesses.reduce((a, b) => a + (b.value || 0), 0);
  return s.cash - s.debt + obradorValue(s) + assets;
}

export function creditLimit(s) {
  const assets = s.businesses.reduce((a, b) => a + (b.value || 0), 0) + obradorValue(s);
  return Math.round(Math.max(150000, assets * 0.6) * macroFx(s).credit + s.creditBonus);
}

export function computeEconomy(s) {
  const fx = policyFx(s);
  const m = s.month % 12;
  const wage = averageWage(s);
  const service = moralFactor(s.moral) * fx.bec.service;
  const repF = repFactor(s.rep);
  const quality = fx.ing.quality;
  const strike = modFactor(s, 'strike');
  const macro = macroFx(s);
  const sobaoSeason = SOBAO_SEASON[m] * macro.demand;
  const tourSeason = TOURISM_SEASON[m] * macro.tourism;

  // Saturación: nº de negocios del mismo tipo por ciudad.
  const counts = {};
  for (const b of s.businesses) {
    const k = `${b.city}:${b.type}`;
    counts[k] = (counts[k] || 0) + 1;
  }
  const sat = (b) => 1 / (1 + 0.45 * ((counts[`${b.city}:${b.type}`] || 1) - 1));

  const lines = [];
  const costs = { salarios: 0, alquileres: 0, materias: 0, otros: 0, intereses: 0, asesores: 0, impuestos: 0 };
  const revenueByCat = { sobaos: 0, inmobiliario: 0, hosteleria: 0, formacion: 0 };
  let employees = 0;

  // --- Demanda de sobaos ---------------------------------------------------
  const shopUnits = OBRADOR_BASE.shopUnits * repF * sobaoSeason * modFactor(s, 'revenue', 'sobaos');
  const contractUnits = s.contracts.reduce((a, c) => a + c.units, 0);
  const wholesaleUnits = OBRADOR_BASE.wholesaleUnits;

  const sobaoEntries = [];
  for (const b of s.businesses) {
    const t = BUSINESS_TYPES[b.type];
    if (t.category !== 'sobaos') continue;
    const c = CITY_BY_ID[b.city];
    let demand;
    if (t.brand === 'express') {
      demand = t.baseUnits * Math.pow(c.pop, 0.85) * (1.15 - 0.25 * (c.wealth - 1)) * (0.7 + 0.3 * quality);
    } else {
      demand = t.baseUnits * Math.pow(c.pop, 0.35) * Math.pow(c.wealth, 1.6) * (0.6 + 0.8 * c.tourism) * quality * quality * (1 + s.fama / 200);
    }
    const franchiseService = b.mode === 'franquicia' ? 0.95 : service;
    demand *= repF * sobaoSeason * sat(b) * franchiseService * modFactor(s, 'revenue', 'sobaos');
    sobaoEntries.push({ b, t, c, demand });
  }

  const capacity = obradorCapacity(s) * strike;
  const totalDemand = shopUnits + wholesaleUnits + contractUnits + sobaoEntries.reduce((a, e) => a + e.demand, 0);
  const fill = totalDemand > 0 ? Math.min(1, capacity / totalDemand) : 1;
  const produced = totalDemand * fill;

  // --- Obrador ---------------------------------------------------------------
  const robot = s.obrador.upgrades.includes('robot') ? 0.85 : 1;
  const obradorStaff = 3 + Math.ceil((produced / 3000) * robot);
  employees += obradorStaff;
  const localUnitCost = 1.05 * fx.ing.cost;
  const obRevenue =
    shopUnits * fill * OBRADOR_BASE.shopPrice +
    wholesaleUnits * fill * OBRADOR_BASE.wholesalePrice +
    s.contracts.reduce((a, c) => a + c.units * fill * c.price, 0);
  const obMaterials = (shopUnits + wholesaleUnits + contractUnits) * fill * localUnitCost;
  const obWages = obradorStaff * wage;
  const obFixed = OBRADOR_BASE.fixedCost + OBRADOR_BASE.upgradeUpkeep * s.obrador.upgrades.length;
  costs.salarios += obWages;
  costs.materias += obMaterials;
  costs.otros += obFixed;
  revenueByCat.sobaos += obRevenue;
  lines.push({ id: 'obrador', type: 'obrador', city: 'selaya', label: 'Obrador Boomerez', revenue: obRevenue, cost: obMaterials + obWages + obFixed, staff: obradorStaff, units: produced });

  for (const e of sobaoEntries) {
    const { b, t, c } = e;
    const units = e.demand * fill;
    const materials = units * t.unitCost * fx.ing.cost;
    costs.materias += materials;
    if (b.mode === 'franquicia') {
      const fRevenue = units * t.price;
      const income = units * t.wholesale + fRevenue * FRANCHISE_ROYALTY;
      const franchiseeProfit = fRevenue - units * t.wholesale - fRevenue * FRANCHISE_ROYALTY - t.staff * FRANCHISEE_WAGE - t.rentBase * c.rent;
      revenueByCat.sobaos += income;
      lines.push({ id: b.id, type: b.type, city: b.city, label: t.name, revenue: income, cost: materials, staff: 0, units, franchise: true, franchiseeProfit });
    } else {
      const revenue = units * t.price;
      const wages = t.staff * wage;
      const rent = t.rentBase * c.rent;
      costs.salarios += wages;
      costs.alquileres += rent;
      employees += t.staff;
      revenueByCat.sobaos += revenue;
      lines.push({ id: b.id, type: b.type, city: b.city, label: t.name, revenue, cost: materials + wages + rent, staff: t.staff, units });
    }
  }

  // --- Resto de negocios -----------------------------------------------------
  const viviendas = [];
  for (const b of s.businesses) {
    const t = BUSINESS_TYPES[b.type];
    if (t.category === 'sobaos') continue;
    const c = CITY_BY_ID[b.city];
    let revenue = 0;
    let cost = 0;
    let lineStaff = t.staff;
    if (t.category === 'hosteleria') {
      const trend = s.trends[t.trend] ?? 1;
      revenue = t.baseRevenue * Math.pow(c.pop, 0.5) * Math.pow(c.wealth, 0.4) * trend * repF * service * sat(b) *
        (0.7 + 0.3 * quality) * strike * macro.demand * modFactor(s, 'revenue', 'hosteleria');
      const materials = revenue * t.cogs * (0.6 + 0.4 * fx.ing.cost);
      // Más clientela, más plantilla.
      lineStaff = Math.ceil(t.staff * Math.pow(Math.max(1, revenue / t.baseRevenue), 0.85));
      const wages = lineStaff * wage;
      const rent = t.rentBase * c.rent;
      costs.materias += materials;
      costs.salarios += wages;
      costs.alquileres += rent;
      cost = materials + wages + rent;
      if (b.type === 'empanadas' && s.flags.primoSocio) {
        costs.otros += revenue * 0.1; // el 10 % del primo Rodrigo
        cost += revenue * 0.1;
      }
      employees += lineStaff;
    } else if (b.type === 'airbnb') {
      const nightly = 60 * c.wealth * (0.6 + 0.6 * c.tourism);
      const occupancy = Math.min(0.95, (0.25 + 0.65 * c.tourism) * tourSeason);
      revenue = t.flats * nightly * 30 * occupancy * Math.sqrt(repF) * sat(b) * modFactor(s, 'revenue', 'inmobiliario');
      const wages = t.staff * wage;
      costs.salarios += wages;
      costs.otros += t.upkeep;
      cost = wages + t.upkeep;
      employees += t.staff;
    } else if (b.type === 'academy') {
      revenue = (1500 + 5 * s.fama * s.fama) * (0.6 + 0.4 * repF) * modFactor(s, 'revenue', 'formacion');
      const wages = t.staff * wage;
      const rent = t.rentBase * c.rent;
      costs.salarios += wages;
      costs.alquileres += rent;
      costs.otros += t.ads;
      cost = wages + rent + t.ads;
      employees += t.staff;
    } else if (b.type === 'vivienda') {
      viviendas.push(b);
      continue;
    }
    revenueByCat[t.category] += revenue;
    lines.push({ id: b.id, type: b.type, city: b.city, label: t.name, revenue, cost, staff: lineStaff });
  }

  // --- Viviendas para la plantilla (dependen del nº de empleados) ------------
  const beds = viviendas.length * BUSINESS_TYPES.vivienda.beds;
  const housed = Math.min(employees, beds);
  const control = employees > 0 ? housed / employees : 0;
  let remaining = housed;
  for (const b of viviendas) {
    const occ = Math.min(BUSINESS_TYPES.vivienda.beds, remaining);
    remaining -= occ;
    const revenue = occ * fx.alq.rent;
    const cost = BUSINESS_TYPES.vivienda.upkeep;
    costs.otros += cost;
    revenueByCat.inmobiliario += revenue;
    lines.push({ id: b.id, type: b.type, city: b.city, label: BUSINESS_TYPES.vivienda.name, revenue, cost, staff: 0, occupied: occ });
  }

  // --- Costes generales ------------------------------------------------------
  for (const [id, on] of Object.entries(s.perks)) if (on) costs.asesores += PERKS[id].monthly;
  costs.otros += s.extraMonthly.reduce((a, x) => a + x.amount, 0);
  costs.intereses = s.debt * (difficultyOf(s).interest + macro.interest);

  const revenue = Object.values(revenueByCat).reduce((a, b) => a + b, 0);
  const totalCost = costs.salarios + costs.alquileres + costs.materias + costs.otros + costs.intereses + costs.asesores;
  const profit = revenue - totalCost;

  let tax = 0;
  let evaded = 0;
  if (profit > 0) {
    const due = profit * CORPORATE_TAX;
    const declared = fx.con.declared * (s.perks.andorra ? 0.7 : 1);
    tax = due * declared;
    evaded = due - tax;
  }
  costs.impuestos = tax;

  return {
    month: s.month,
    revenue, revenueByCat, costs, totalCost, profit, tax, evaded,
    net: profit - tax,
    employees, housed, beds, control,
    capacity, totalDemand, produced, fill,
    lines,
  };
}

// Estima cuánto cambiaría el beneficio mensual (antes de impuestos) al abrir un negocio.
export function estimateOpening(s, typeId, cityId, mode = 'propia') {
  const base = computeEconomy(s);
  const clone = JSON.parse(JSON.stringify(s));
  clone.businesses.push({ id: -1, type: typeId, city: cityId, mode, value: 0 });
  const after = computeEconomy(clone);
  return { delta: after.profit - base.profit, fillAfter: after.fill, fillBefore: base.fill };
}
