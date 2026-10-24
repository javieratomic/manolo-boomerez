// Acuerdos territoriales: estado serializable y riesgos con el RNG de la partida.
import { FOREIGN_BY_ID, DEAL_MODES, DISPUTES } from '../data/international.js';
import { addCash, addRep, addMod, log, money } from './helpers.js';
import { chance, pick } from './rng.js';

export function agreementTerms(marketId, mode, audit = false) {
  const m = FOREIGN_BY_ID[marketId];
  if (!m || !DEAL_MODES[mode]) return null;
  return {
    setup: Math.round(m.setup * (mode === 'licence' ? 1.5 : 1)), months:24,
    monthly: audit ? 900 : 0, risk:m.risk * (mode === 'licence' ? 1.3 : 1) * (audit ? 0.4 : 1),
    units: mode === 'private_label' ? m.units : 0,
    royalty: mode === 'licence' ? 0.08 : 0,
  };
}

export function canSignAgreement(s, marketId, mode, audit = false) {
  const terms = agreementTerms(marketId, mode, audit);
  if (!terms || typeof audit !== 'boolean') return {ok:false, msg:'Acuerdo desconocido.'};
  if (!s.brand) return {ok:false, msg:'Elige tu marca primero.'};
  if ((s.foreignDeals || []).some(d => d.market === marketId)) return {ok:false, msg:'Ya tienes un acuerdo exclusivo en este país.'};
  if (s.cash < terms.setup) return {ok:false, msg:`Necesitas ${money(terms.setup)} para abrir ese mercado.`};
  return {ok:true, terms};
}

export function signAgreement(s, marketId, mode, audit = false) {
  const check = canSignAgreement(s, marketId, mode, audit);
  if (!check.ok) return check;
  const deal = {id:s.nextId++, market:marketId, mode, audit, brand:s.brand, months:check.terms.months, shortMonths:0, dispute:null};
  (s.foreignDeals ||= []).push(deal);
  addCash(s, -check.terms.setup);
  log(s, `🌍 ${FOREIGN_BY_ID[marketId].country}: firmas ${DEAL_MODES[mode].name.toLowerCase()} con ${FOREIGN_BY_ID[marketId].partner}, por 24 meses.`, 'good');
  return {ok:true, deal};
}

export const activeDeals = s => (s.foreignDeals || []).filter(d => d.months > 0 && !d.dispute);
export const foreignDemand = s => activeDeals(s).reduce((sum,d) => sum + agreementTerms(d.market,d.mode,d.audit).units,0);

// Costes directos; los salarios del obrador se calculan una sola vez en economy.js.
export function foreignLines(s, fill, unitCost) {
  return activeDeals(s).map(d => {
    const m = FOREIGN_BY_ID[d.market], terms = agreementTerms(d.market,d.mode,d.audit);
    const units = terms.units * fill;
    const revenue = d.mode === 'private_label' ? units * m.price : m.turnover * terms.royalty * (0.75 + s.rep / 200);
    const materials = units * unitCost, shipping = units * m.shipping;
    return {id:`foreign_${d.id}`, dealId:d.id, type:'international', city:'selaya', label:`${m.country} · ${DEAL_MODES[d.mode].name}`, foreign:true,
      revenue, cost:materials + shipping + terms.monthly, staff:0, units, materials, shipping, audit:terms.monthly};
  });
}

function removeDeal(s, id) {
  s.foreignDeals = (s.foreignDeals || []).filter(d => d.id !== id);
  s.pending = s.pending.filter(p => p.id !== 'socio_extranjero' || p.params?.dealId !== id);
}

export function endAgreement(s, id) {
  const d = (s.foreignDeals || []).find(d => d.id === id);
  if (!d) return {ok:false, msg:'El acuerdo ya no existe.'};
  if (s.cash < 5000) return {ok:false, msg:'La rescisión cuesta 5.000 €.'};
  addCash(s,-5000); removeDeal(s,id);
  log(s, `🌍 Rescindes el acuerdo de ${FOREIGN_BY_ID[d.market].country} y pagas 5.000 €.`, 'info');
  return {ok:true};
}

export function tickInternational(s, report) {
  for (const d of [...(s.foreignDeals || [])]) {
    d.months--;
    if (d.months <= 0) {
      removeDeal(s,d.id);
      const text = `El acuerdo de ${FOREIGN_BY_ID[d.market].country} ha vencido. Puedes negociar uno nuevo en Mercado.`;
      log(s,text,'info'); (s.notices ||= []).push({kicker:'🌍 Exterior', title:'Acuerdo vencido', text});
      continue;
    }
    if (d.dispute) continue;
    d.shortMonths = d.mode === 'private_label' && report.fill < 0.8 ? (d.shortMonths || 0) + 1 : 0;
    const shortage = d.shortMonths >= 2;
    if (shortage || chance(s,agreementTerms(d.market,d.mode,d.audit).risk)) {
      d.dispute = shortage ? 'suministro' : pick(s, d.mode === 'licence' ? ['calidad','impago','copia'] : ['calidad','impago']);
      s.pending.push({kind:'event', id:'socio_extranjero', params:{dealId:d.id,reason:d.dispute}});
    }
  }
}

export function resolveDispute(s, id, choice) {
  const d = (s.foreignDeals || []).find(d => d.id === id);
  if (!d?.dispute) return {ok:false, msg:'Ese conflicto ya no está activo.'};
  if (!['audit','end','ignore'].includes(choice)) return {ok:false, msg:'Respuesta desconocida.'};
  const reason = d.dispute;
  if (choice === 'audit') {
    if (s.cash < 12000) return {ok:false, msg:'La intervención cuesta 12.000 €.'};
    addCash(s,-12000); d.audit=true; d.shortMonths=0; d.dispute=null;
    addRep(s,1);
    return {ok:true,text:'Pagas 12.000 € para revisar el lote y renegociar. Auditoría permanente: 900 €/mes, menor riesgo. Reputación +1. Si falta capacidad, tendrás que ampliarla.'};
  }
  if (choice === 'end') {
    const result = endAgreement(s,id);
    return {...result,text:result.ok ? 'Rescindes por 5.000 €. Dejas de cobrar y de exponer la marca en ese país.' : result.msg};
  }
  d.dispute=null; d.shortMonths=0;
  const fine = reason === 'impago' ? 18000 : 8000;
  addCash(s,-fine); addRep(s,-6);
  if (reason === 'copia') addMod(s,{kind:'revenue',category:'sobaos',factor:0.94,months:6,label:'Imitación extranjera de Boomerez'});
  return {ok:true,text:`El contrato sigue, pero asumes ${money(fine)} en impagos o reclamaciones. Reputación −6.${reason === 'copia' ? ' La imitación resta un 6 % de demanda de sobaos durante seis meses.' : ''}`};
}
