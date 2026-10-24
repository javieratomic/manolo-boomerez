import {serviceRevenue,serviceStaff} from './serviceModel.js';
import {businessSynergies} from './synergies.js';
import {housingTerms} from './housing.js';
import {workforcePlan,factoryLaborFactor,plannedStaff} from './workforce.js';
import {researchFactor} from '../data/market.js';
import { foreignDemand, foreignLines } from './international.js';
// Cálculo económico mensual. Función pura: no muta el estado (salvo lo que haga quien la llama).
import { BUSINESS_TYPES, OBRADOR_BASE, OBRADOR_UPGRADES, PERKS, expansionValue } from '../data/businesses.js';
import { POLICIES, BECARIO_WAGE } from '../data/policies.js';
import { CITY_BY_ID } from '../data/cities.js';
import { difficultyOf } from './state.js';
import { macroFx } from './macro.js';
import { rivalFactor } from './rivals.js';
import { RIVALS } from '../data/rivals.js';
import { productFactor, levelFactor } from './market.js';
import { execBonus, execSalaries } from './execs.js';
import { lujoValue, lujoUpkeep } from './life.js';
import { transportCost, regionalCount, REGIONAL_CAPACITY, productionSites } from './logistics.js';
import { govFx } from './politics.js';

export const SOBAO_SEASON = [1.05, 0.95, 0.95, 1, 1, 0.9, 0.85, 0.9, 1, 1.05, 1.1, 1.35];
export const TOURISM_SEASON = [0.6, 0.65, 0.8, 0.95, 1, 1.2, 1.5, 1.55, 1.15, 0.9, 0.7, 0.85];
export const CORPORATE_TAX = 0.25;
export const FRANCHISE_ROYALTY = 0.05;
export const FRANCHISEE_WAGE = 1500;
export const STRUCTURE_BASE = 120;
export const STRUCTURE_EXP = 1.4;

export function policyFx(s) {
  const p = s.policies;
  return {
    sal: POLICIES.salario.options[p.salario],
    hor: POLICIES.horas.options[p.horas],
    bec: POLICIES.becarios.options[p.becarios],
    alq: POLICIES.alquiler.options[p.alquiler],
    con: POLICIES.contabilidad.options[p.contabilidad],
    ing: POLICIES.ingredientes.options[p.ingredientes],
    man: POLICIES.mantenimiento.options[p.mantenimiento || 'manitas'],
    rep: POLICIES.reparto.options[p.reparto || 'ninguno'],
  };
}

export const moralFactor = (moral) => 0.8 + (0.4 * moral) / 100;
export const repFactor = (rep) => 0.55 + (0.9 * rep) / 100;

export function obradorCapacity(s) {
  return productionSites(s).reduce((n,city)=>n+workforcePlan(s,city).effective,0);
}

export function obradorValue(s) {
  return OBRADOR_BASE.baseValue + expansionValue(s.obrador.expansions || 0) + s.obrador.upgrades.reduce((a, id) => a + (OBRADOR_UPGRADES.find((u) => u.id === id)?.cost || 0) * 0.8, 0);
}

// Sueldo de convenio (con el plus del convenio de empresa) y el que sale de las políticas. Los pactos
// temporales de los sucesos (ERE, pacto de crisis...) son legales: no cuentan para la liquidación.
export const legalWage = (s) => POLICIES.salario.options.convenio.wage * (s.wageIndex || 1) * (1 + (s.comite?.plus || 0));

export function policyWage(s) {
  const fx = policyFx(s);
  const base = (1 - fx.bec.share) * fx.sal.wage * (s.wageIndex || 1) * (1 + (s.comite?.plus || 0)) + fx.bec.share * BECARIO_WAGE;
  return base * fx.hor.laborMult;
}

export function averageWage(s) {
  return policyWage(s) * modFactor(s, 'labor');
}

// Modificadores temporales (sucesos, campañas, guerras de precios...). Filtran por categoría, ciudad y tipo.
export function modFactor(s, kind, category, city, type) {
  let f = 1;
  for (const m of s.mods) {
    if (m.kind !== kind) continue;
    if (m.category && m.category !== category) continue;
    if (m.city && m.city !== city) continue;
    if (m.types && !m.types.includes(type)) continue;
    f *= m.factor;
  }
  return f;
}

// Un local descuidado vende menos: hasta un −25 % con el estado a cero.
export const conditionFactor = (b) => 0.75 + 0.25 * (b.cond ?? 100) / 100;

// Todo lo que multiplica la demanda de un negocio concreto.
export function bizMult(s, b, category, city, month) {
  return modFactor(s, 'revenue', category, b.city, b.type) * rivalFactor(s, b) * levelFactor(b) * productFactor(s, b.type, category, city, month) *
    (b.mode === 'franquicia' ? 1 : conditionFactor(b)) * businessSynergies(s,b).factor;
}

export const hasCondition = (b) => b.mode !== 'franquicia' && BUSINESS_TYPES[b.type].model !== 'production';

export function maintenanceCost(s) {
  const pct = policyFx(s).man.costPct;
  return s.businesses.reduce((a, b) => a + (hasCondition(b) ? (b.value || 0) * pct : 0), 0);
}

// Todo lo que vale la empresa (y los caprichos de Manolo), antes de descontar a los accionistas.
// Lo que queda por pagar del aplazamiento con la Seguridad Social (es deuda, aunque se pague a plazos).
export const ssOwed = (s) => (s.extraMonthly || []).reduce((a, x) => a + (x.ss && x.months ? x.amount * x.months : 0), 0);

export function grossPatrimonio(s) {
  const assets = s.businesses.reduce((a, b) => a + (b.value || 0), 0);
  // Lo que se debe a Doña Remedios también resta (el banco no se entera, el patrimonio sí).
  return s.cash - s.debt - (s.cartilla?.owed || 0) - ssOwed(s) + obradorValue(s) + assets + lujoValue(s);
}

// Lo que es de Manolo: si cotiza en Bolsa, descuenta la parte de los accionistas.
// Oficinas centrales, gestorías y abogados: crece más deprisa que el número de negocios.
export function structureCost(s) {
  const n = s.businesses.filter((b) => b.mode !== 'franquicia').length + 0.3 * s.businesses.filter((b) => b.mode === 'franquicia').length;
  return Math.round(STRUCTURE_BASE * Math.pow(n, STRUCTURE_EXP) * (1 - 2 * execBonus(s, 'operaciones')) * researchFactor(s,'structureFactor') * (1-Math.min(0.18,0.03*s.businesses.filter(b=>b.type==='telecom'&&b.mode!=='franquicia').length)));
}

// Cotizando, tu parte vale lo que diga el mercado: el sentimiento (0,85-1,05) de la promesa del trimestre.
export function patrimonio(s) {
  return grossPatrimonio(s) * (1 - (s.ipo?.float || 0)) * (s.ipo ? s.ipo.sent ?? 1 : 1);
}

export function creditLimit(s) {
  const assets = s.businesses.reduce((a, b) => a + (b.value || 0), 0) + obradorValue(s);
  return Math.round(Math.max(150000, assets * 0.6) * macroFx(s).credit + s.creditBonus);
}

export function computeEconomy(s) {
  const fx = policyFx(s);
  const workforceCache=new Map();
  const localPlan=city=>{if(!workforceCache.has(city))workforceCache.set(city,workforcePlan(s,city));return workforceCache.get(city);};
  const m = s.month % 12;
  const wage = averageWage(s);
  const service = moralFactor(s.moral) * fx.bec.service;
  const repF = repFactor(s.rep);
  const quality = fx.ing.quality;
  const strike = modFactor(s, 'strike');
  const gov = govFx(s);
  const macro = { ...macroFx(s), demand: macroFx(s).demand * gov.demand };
  const sobaoSeason = SOBAO_SEASON[m] * macro.demand;
  const tourSeason = TOURISM_SEASON[m] * macro.tourism;

  // Saturación: nº de negocios del mismo tipo por ciudad.
  const counts = {};
  for (const b of s.businesses) {
    const k = `${b.city}:${b.type}`;
    counts[k] = (counts[k] || 0) + 1;
  }
  const sat = (b) => 1 / (1 + (0.5 / (0.75 + CITY_BY_ID[b.city].pop)) * ((counts[`${b.city}:${b.type}`] || 1) - 1));

  const lines = [];
  const costs = { salarios: 0, directivos: 0, estructura: 0, mantenimiento: 0, alquileres: 0, materias: 0, transporte: 0, otros: 0, intereses: 0, asesores: 0, personales: 0, reparto: 0, impuestos: 0 };
  const revenueByCat = { sobaos: 0, inmobiliario: 0, hosteleria: 0, formacion: 0, servicios: 0, produccion: 0, finanzas:0, infraestructura:0, logistica:0 };
  let employees = 0;

  // --- Demanda de sobaos ---------------------------------------------------
  const hq = CITY_BY_ID.selaya;
  const shopUnits = OBRADOR_BASE.shopUnits * repF * sobaoSeason * modFactor(s, 'revenue', 'sobaos', 'selaya', 'obrador') * productFactor(s, 'obrador', 'sobaos', hq, m);
  const contractUnits = s.contracts.reduce((a, c) => a + c.units, 0);
  const wholesaleUnits = OBRADOR_BASE.wholesaleUnits;

  const staffFor=b=>{const p=localPlan(b.city);return Math.floor(plannedStaff(b,s)*Math.min(1,p.available/Math.max(1,p.other)));};
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
    demand *= repF * sobaoSeason * sat(b) * franchiseService * bizMult(s, b, 'sobaos', c, m);
    const staff=b.mode==='franquicia'?0:staffFor(b);
    if(b.mode!=='franquicia')demand*=staff/Math.max(1,plannedStaff(b,s));
    sobaoEntries.push({ b, t, c, demand,staff });
  }

  const capacity = productionSites(s).reduce((n,city)=>n+localPlan(city).effective,0) * strike;
  const totalDemand = shopUnits + wholesaleUnits + contractUnits + foreignDemand(s) + sobaoEntries.reduce((a, e) => a + e.demand, 0);
  const fill = totalDemand > 0 ? Math.min(1, capacity / totalDemand) : 1;
  // El regalo usa solo excedente: nunca compite con tiendas o contratos. No es demanda obligatoria.
  const bonusEligible = s.businesses.filter(b => ['service', 'care'].includes(BUSINESS_TYPES[b.type].model) || ['academy', 'airbnb'].includes(b.type));
  const bonusUnits = Math.min(Math.max(0, capacity - totalDemand), bonusEligible.length * 250);
  const bonusPerBusiness = bonusEligible.length ? bonusUnits / bonusEligible.length : 0;
  const surplusBonus = 0.05 * bonusPerBusiness / 250;
  const produced = totalDemand * fill + bonusUnits;

  // --- Obrador ---------------------------------------------------------------
  const robot = factoryLaborFactor(s,'selaya');
  const selayaCap = localPlan('selaya').effective * strike;
  const mainPlan=localPlan('selaya');
  const obradorStaff = Math.min(Math.max(0,mainPlan.available-mainPlan.other),3 + Math.ceil((Math.min(produced, Math.max(0, selayaCap)) / 3000) * robot));
  employees += obradorStaff;
  const localUnitCost = 1.05 * fx.ing.cost * researchFactor(s,'materialFactor');
  const obRevenue =
    shopUnits * fill * OBRADOR_BASE.shopPrice +
    wholesaleUnits * fill * OBRADOR_BASE.wholesalePrice +
    s.contracts.reduce((a, c) => a + c.units * fill * c.price, 0);
  const obMaterials = ((shopUnits + wholesaleUnits + contractUnits) * fill + bonusUnits) * localUnitCost;
  const obWages = obradorStaff * wage;
  const obFixed = (OBRADOR_BASE.fixedCost + OBRADOR_BASE.upgradeUpkeep * (s.obrador.upgrades.length + (s.obrador.expansions || 0)))*researchFactor(s,'fixedFactor');
  costs.salarios += obWages;
  costs.materias += obMaterials;
  costs.otros += obFixed;
  // Embargo materno: lo que se vende en el mostrador de Selaya se lo queda Doña Remedios.
  const embargo = s.cartilla?.embargo ? Math.min(shopUnits * fill * OBRADOR_BASE.shopPrice, s.cartilla.owed || 0) : 0;
  costs.otros += embargo;
  revenueByCat.sobaos += obRevenue;
  lines.push({ id: 'obrador', type: 'obrador', city: 'selaya', label: 'Obrador Boomerez', revenue: obRevenue, cost: obMaterials + obWages + obFixed, staff: obradorStaff, units: produced });

  for (const e of sobaoEntries) {
    const { b, t, c,staff } = e;
    const units = e.demand * fill;
    const shipping = units * transportCost(s, b.city);
    const materials = units * t.unitCost * fx.ing.cost * researchFactor(s,'materialFactor') + shipping;
    costs.materias += materials - shipping;
    costs.transporte += shipping;
    if (b.mode === 'franquicia') {
      const fRevenue = units * t.price;
      const income = units * t.wholesale + fRevenue * FRANCHISE_ROYALTY;
      const franchiseeProfit = fRevenue - units * t.wholesale - fRevenue * FRANCHISE_ROYALTY - t.staff * FRANCHISEE_WAGE - t.rentBase * c.rent;
      revenueByCat.sobaos += income;
      lines.push({ id: b.id, type: b.type, city: b.city, label: t.name, revenue: income, cost: materials, staff: 0, units, franchise: true, franchiseeProfit });
    } else {
      const revenue = units * t.price;
      const wages = staff * wage;
      const rent = t.rentBase * c.rent;
      costs.salarios += wages;
      costs.alquileres += rent;
      employees += staff;
      revenueByCat.sobaos += revenue;
      lines.push({ id: b.id, type: b.type, city: b.city, label: t.name, revenue, cost: materials + wages + rent, staff: staff, units });
    }
  }

  for (const line of foreignLines(s, fill, localUnitCost)) {
    lines.push(line);
    revenueByCat.sobaos += line.revenue;
    costs.materias += line.materials;
    costs.transporte += line.shipping;
    costs.otros += line.audit;
  }

  // --- Resto de negocios -----------------------------------------------------
  const viviendas = [];
  for (const b of s.businesses) {
    const t = BUSINESS_TYPES[b.type];
    if (t.category === 'sobaos') continue;
    const c = CITY_BY_ID[b.city];
    let revenue = 0;
    let cost = 0;
    let lineStaff = staffFor(b);
    if (t.model === 'service') {
      revenue=serviceRevenue(s,b,sat(b));
      const wanted=serviceStaff(s,b,revenue),plan=localPlan(b.city);
      const share=Math.min(1,plan.available/Math.max(1,plan.other));
      lineStaff=Math.floor(wanted*share);
      revenue*=wanted?lineStaff/wanted:0;
      const materials=revenue*t.cogs*(t.food?0.6+0.4*fx.ing.cost:1)*researchFactor(s,'materialFactor');
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
    } else if (t.model === 'production') {
      // Obrador regional: no vende, fabrica (su capacidad se suma en obradorCapacity).
      const plan=localPlan(b.city);
      lineStaff=Math.min(Math.max(0,plan.available-plan.other),Math.ceil(8*plan.effective*factoryLaborFactor(s,b.city)/15000));
      const wages=lineStaff*wage, fixed=t.upkeep*researchFactor(s,'fixedFactor');
      costs.salarios+=wages;costs.otros+=fixed;cost=wages+fixed;employees+=lineStaff;
    } else if (t.model === 'care') {
      // Residencia: plazas limitadas; el precio depende de la renta y la ocupación de la población y la reputación.
      const beds = t.beds + 10 * ((b.level || 1) - 1);
      const price = 1250 * Math.pow(c.wealth, 1.2);
      // La reforma ya añade plazas, así que aquí no se aplica su bonus; y la ocupación nunca pasa del 98 %.
      const pull = (bizMult(s, b, 'servicios', c, m) / levelFactor(b)) * macro.demand ** 0.3;
      const occupancy = Math.min(0.98, (0.55 + 0.3 * Math.sqrt(c.pop)) * Math.sqrt(repF) * Math.sqrt(service) * pull);
      revenue = beds * price * occupancy;
      lineStaff=staffFor(b);
      revenue*=lineStaff/Math.max(1,plannedStaff(b,s));
      const materials = revenue * t.cogs * (0.6 + 0.4 * fx.ing.cost) * researchFactor(s,'materialFactor');
      const wages = lineStaff * wage;
      costs.materias += materials;
      costs.salarios += wages;
      costs.otros += t.upkeep;
      cost = materials + wages + t.upkeep;
      employees += lineStaff;
    } else if (b.type === 'airbnb') {
      const nightly = 60 * c.wealth * (0.6 + 0.6 * c.tourism);
      const occupancy = Math.min(0.95, (0.25 + 0.65 * c.tourism) * tourSeason);
      const flats = t.flats + 2 * ((b.level || 1) - 1);
      revenue = flats * nightly * 30 * occupancy * Math.sqrt(repF) * sat(b) * modFactor(s, 'revenue', 'inmobiliario', b.city, b.type) *
        rivalFactor(s, b) * productFactor(s, b.type, 'inmobiliario', c, m) * conditionFactor(b);
      lineStaff=staffFor(b);
      revenue*=lineStaff/Math.max(1,plannedStaff(b,s));
      const wages=lineStaff*wage;
      costs.salarios+=wages;costs.otros+=t.upkeep;cost=wages+t.upkeep;employees+=lineStaff;
    } else if (b.type === 'academy') {
      revenue = (1500 + 3.5 * s.fama * s.fama) * (1+0.22*Math.sqrt(s.businesses.filter(x=>x.id!==b.id).reduce((n,x)=>n+(x.mode==='franquicia'?0.5:1),0))) * (0.6 + 0.4 * repF) * bizMult(s, b, 'formacion', c, m);
      revenue*=lineStaff/Math.max(1,plannedStaff(b,s));
      const wages = lineStaff * wage;
      const rent = t.rentBase * c.rent;
      costs.salarios += wages;
      costs.alquileres += rent;
      costs.otros += t.ads;
      cost = wages + rent + t.ads;
      employees += lineStaff;
    } else if (b.type === 'vivienda') {
      viviendas.push(b);
      continue;
    }
    const bonus = bonusEligible.includes(b) ? surplusBonus : 0;
    if (bonus > 0) {
      revenue *= 1 + bonus;
      const shipping = bonusPerBusiness * transportCost(s, b.city);
      costs.transporte += shipping;
      cost += shipping;
    }
    revenueByCat[t.category] += revenue;
    const occupied=t.model==='care'?revenue/(1+bonus)/(1250*Math.pow(c.wealth,1.2)):undefined;
    lines.push({ surplusBonus: bonus, id: b.id, type: b.type, city: b.city, label: t.name, revenue, cost, staff: lineStaff, ...(occupied===undefined?{}:{occupied}) });
  }

  // --- Viviendas para la plantilla (dependen del nº de empleados) ------------
  const bedsOf = (b) => BUSINESS_TYPES.vivienda.beds + 5 * ((b.level || 1) - 1);
  const beds = viviendas.reduce((a, b) => a + bedsOf(b), 0);
  const localEmployees = {};
  for (const l of lines) localEmployees[l.city] = (localEmployees[l.city] || 0) + l.staff;
  const localBeds = {};
  for (const b of viviendas) localBeds[b.city] = (localBeds[b.city] || 0) + bedsOf(b);
  const available = Object.fromEntries(Object.entries(localBeds).map(([city, n]) => [city, Math.min(n, localEmployees[city] || 0)]));
  const housed = Object.values(available).reduce((a, n) => a + n, 0);
  const control = employees > 0 ? housed / employees : 0;
  const publicAvailable=Object.fromEntries(Object.keys(localBeds).map(city=>[city,Math.min(localBeds[city]-available[city],housingTerms(s,city).publicDemand)]));
  let publicHoused=0,housingMoral=0,housingInsp=0;
  for (const b of viviendas) {
    const terms=housingTerms(s,b.city);
    const employeeOccupied = Math.min(bedsOf(b), available[b.city] || 0);
    available[b.city] -= employeeOccupied;
    const publicOccupied=Math.min(bedsOf(b)-employeeOccupied,publicAvailable[b.city]||0);
    publicAvailable[b.city]-=publicOccupied;publicHoused+=publicOccupied;
    housingMoral+=terms.moral*employeeOccupied/Math.max(1,employees);
    housingInsp+=terms.insp*employeeOccupied/Math.max(1,employees);
    const occ=employeeOccupied+publicOccupied;
    const revenue = (employeeOccupied*terms.employeeRent+publicOccupied*terms.publicRent) * conditionFactor(b);
    const cost = BUSINESS_TYPES.vivienda.upkeep;
    costs.otros += cost;
    revenueByCat.inmobiliario += revenue;
    lines.push({ id: b.id, type: b.type, city: b.city, label: BUSINESS_TYPES.vivienda.name, revenue, cost, staff: 0, occupied: occ, employeeOccupied,publicOccupied,employeeRent:terms.employeeRent,publicRent:terms.publicRent });
  }

  const residenceBenefit={beneficiaries:0,discount:0,moral:0};
  if(s.policies.residencia==='descuento') {
    const familySlots=Object.fromEntries(Object.entries(localEmployees).map(([city,n])=>[city,Math.floor(n/10)]));
    for(const l of lines.filter(l=>l.type==='residencia')) {
      const count=Math.min(Math.floor(l.occupied||0),familySlots[l.city]||0);
      familySlots[l.city]-=count;
      const discount=count*1250*Math.pow(CITY_BY_ID[l.city].wealth,1.2)*0.2;
      l.revenue-=discount;l.employeeFamilies=count;l.employeeDiscount=discount;
      revenueByCat.servicios-=discount;
      residenceBenefit.beneficiaries+=count;residenceBenefit.discount+=discount;
    }
    residenceBenefit.moral=Math.min(1.5,15*residenceBenefit.beneficiaries/Math.max(1,employees));
  }

  // --- Costes generales ------------------------------------------------------
  for (const [id, on] of Object.entries(s.perks)) if (on) costs.asesores += PERKS[id].monthly;
  costs.otros += s.extraMonthly.reduce((a, x) => a + x.amount, 0);
  costs.intereses = s.debt * (difficultyOf(s).interest + macro.interest) * (1 - execBonus(s, 'finanzas') * 0.5);
  costs.directivos = execSalaries(s);
  costs.estructura = structureCost(s);
  costs.personales = lujoUpkeep(s);
  costs.mantenimiento = maintenanceCost(s);

  const revenue = Object.values(revenueByCat).reduce((a, b) => a + b, 0);
  let totalCost = costs.salarios + costs.directivos + costs.alquileres + costs.materias + costs.otros + costs.intereses + costs.asesores + costs.personales + costs.estructura + costs.transporte + costs.mantenimiento;
  // Reparto con la plantilla: un porcentaje del beneficio antes de impuestos (deducible).
  costs.reparto = Math.max(0, revenue - totalCost) * (fx.rep?.share || 0);
  totalCost += costs.reparto;
  const profit = revenue - totalCost;

  let tax = 0;
  let evaded = 0;
  if (profit > 0) {
    const due = profit * CORPORATE_TAX * gov.tax;
    const declared = fx.con.declared * (s.perks.andorra ? 0.7 : 1);
    evaded = due * (1 - declared);
    // La fundación desgrava (legalmente) un 10 % de lo declarado.
    tax = due * declared * (s.perks.fundacion ? 0.9 : 1);
  }
  costs.impuestos = tax;

  // Contexto para el parte del mes (no cambia ninguna cifra): presión rival de cada línea, fase y huelga.
  const byId = new Map(s.businesses.map((b) => [b.id, b]));
  for (const l of lines) {
    const b = byId.get(l.id);
    if (!b) continue;
    l.rivalF = rivalFactor(s, b);
    l.rivalBy = Object.fromEntries(s.rivals.filter((x) => RIVALS[x.id]?.targets.includes(b.type) && x.presence[b.city]).map((x) => [x.id, x.presence[b.city]]));
  }

  return {
    month: s.month,
    phase: s.macro?.phase ?? null,
    strike,
    debt: s.debt,
    embargo,
    revenue, revenueByCat, costs, totalCost, profit, tax, evaded,
    net: profit - tax,
    employees, housed, beds, control,publicHoused,housingMoral,housingInsp,residenceBenefit,
    capacity, totalDemand, produced, fill, surplusBonus, bonusUnits,
    sobaoSales: Object.fromEntries([...new Set(['selaya',...sobaoEntries.map(e=>e.b.city)])].map(city=>[city,(city==='selaya'?shopUnits*fill:0)+sobaoEntries.filter(e=>e.b.city===city).reduce((n,e)=>n+e.demand*fill,0)])),
    lines,
  };
}

// Estima cuánto cambiaría el beneficio mensual (antes de impuestos) al abrir un negocio.
export function estimateOpening(s, typeId, cityId, mode = 'propia') {
  const base = computeEconomy(s);
  // Sin clonar (el clon era casi todo el coste del bot): un negocio de prueba que se quita siempre.
  const tmp = { id: -1, type: typeId, city: cityId, mode, value: 0, level: 1 };
  s.businesses.push(tmp);
  try {
    const after = computeEconomy(s);
    return { delta: after.profit - base.profit, fillAfter: after.fill, fillBefore: base.fill,
      ...(mode === 'franquicia' ? { franchiseeProfit: after.lines.find(l => l.id === -1).franchiseeProfit } : {}) };
  } finally {
    s.businesses.splice(s.businesses.indexOf(tmp), 1);
  }
}
