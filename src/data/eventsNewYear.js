import {localState,recordLocal,localMemoryText,reputationWeight} from '../core/localEvents.js';
import {NEW_YEAR_STAGES} from './localEvents.js';
import {computeEconomy} from '../core/economy.js';
import {chance} from '../core/rng.js';
import {addCash,addFama,addRep,addMoral,addHeatTrabajo,addMod,money} from '../core/helpers.js';

export const sponsorshipTerms=s=>{
 const p=localState(s,'ciudad_salamanca');
 return {level:p.level,target:Math.min(4,p.level+1),cost:[3000,12000,45000,100000,40000][p.level],rep:[40,50,60,70,40][p.level]};
};
const localBoost=(s,factor)=>addMod(s,{kind:'revenue',city:'salamanca',factor,months:1,label:'Nochevieja Universitaria'});
const sameEdition=s=>localState(s,'ciudad_salamanca').lastYear===Math.floor(s.month/12);
export function newYearEvent(original) {
 return {...original,local:true,annual:true,memory:true,cooldown:12,
  title:s=>`Nochevieja Universitaria · ${NEW_YEAR_STAGES[localState(s,'ciudad_salamanca').level]}`,
  weight:s=>original.weight(s)*reputationWeight(s,original.id),
  text(s){const p=localState(s,original.id),t=sponsorshipTerms(s);return `Salamanca vuelve a celebrar sus campanadas universitarias con minisobaos. ${p.visits?'Los organizadores vuelven a negociar contigo.':'Los estudiantes proponen sustituir las gominolas por doce minisobaos.'}\n\nEtapa: ${NEW_YEAR_STAGES[p.level]} (${p.level}/4). ${p.level<4?`El siguiente patrocinio puede extenderse a: ${NEW_YEAR_STAGES[t.target]}.`:'Los minisobaos ya son una tradición de diciembre en toda España (+15 % de demanda nacional de sobaos; la mitad si la reputación cae de 30).'}\n\nPatrocinio: ${money(t.cost)}, reputación mínima ${t.rep}, moral mínima 35 y al menos 90 % de suministro reciente y previsto para diciembre. Cada avance necesita una edición de un año distinto.\n\n${localMemoryText(s,original.id)}`;},
  choices:[
   {key:'patrocinio',label:s=>{const t=sponsorshipTerms(s);return `${t.level>=4?'Cuidar la tradición':'Patrocinar con personal pagado y producto adecuado'} (${money(t.cost)})`;},hint:'La reputación, la plantilla y el suministro deciden el éxito. Un fracaso pierde la inversión y no avanza de etapa.',available:s=>{const t=sponsorshipTerms(s);return s.cash>=t.cost&&s.rep>=t.rep;},effect(s){
    if(sameEdition(s))return 'Esta edición ya tiene una decisión. No se vuelve a cobrar ni se añade otro éxito.';
    const t=sponsorshipTerms(s),year=Math.floor(s.month/12),old=localState(s,original.id);
    if(s.cash<t.cost||s.rep<t.rep)return 'No cumples el presupuesto o la reputación necesaria para este patrocinio.';
    const projected={...s,mods:[...s.mods,{kind:'revenue',city:'salamanca',factor:1.15,months:1}],localEvents:{...s.localEvents,[original.id]:{...old,level:t.target,lastSuccessYear:year}}};
    const fill=Math.min(s.lastReport?.fill??1,computeEconomy(projected).fill);
    addCash(s,-t.cost);
    const lowMorale=s.moral<35;
    if(lowMorale||fill<0.9){
     addRep(s,-3);addMoral(s,-2);recordLocal(s,original.id,'patrocinio','Patrocinar las campanadas',false);
     return `La organización falla: ${lowMorale?'la plantilla no puede sostener otro gran acto':'no puedes servir al menos el 90 % de lo previsto'}. Pierdes ${money(t.cost)}, reputación −3 y moral −2. La etapa no avanza; tendrás que recuperar la confianza el año siguiente.`;
    }
    recordLocal(s,original.id,'patrocinio','Patrocinar las campanadas',true,{level:t.target,lastSuccessYear:year});
    addRep(s,2);addFama(s,t.target>=3?5:3);localBoost(s,1.15);
    return `El patrocinio funciona: turnos pagados, minisobaos y suministro suficiente. Inviertes ${money(t.cost)}. Nueva etapa: ${NEW_YEAR_STAGES[t.target]} (${t.target}/4). ${t.target===4?'Tras varios años, las campanadas con minisobaos se convierten en tradición: +15 % de demanda de sobaos cada diciembre en toda España.':t.target===3?'Este diciembre la campaña nacional aumenta un 10 % la demanda española de sobaos.':t.target===2?'Este diciembre otras universidades de Castilla y León se suman: +8 % de demanda de sobaos en la región.':'Salamanca adopta la propuesta. El próximo año podrás extenderla con más reputación.'} Reputación +2.`;
   }},
   {key:'venta',label:'Vender bolsas pequeñas con reparto pagado',hint:'Una edición modesta recupera confianza, sin avanzar de etapa.',effect(s){if(sameEdition(s))return 'Esta edición ya se ha resuelto.';localBoost(s,1.1);addRep(s,2);addFama(s,1);recordLocal(s,original.id,'venta','Vender minisobaos con reparto pagado',true);return 'Los estudiantes cobran su parte y el puesto funciona sin promesas imposibles. Salamanca +10 % este diciembre, reputación +2 y fama +1. Conservas la etapa, sin ganar un patrocinio.';}},
   {key:'viral',label:'Regalar bolsas para un reto con tu logo (3.000 €)',available:s=>s.cash>=3000,hint:s=>`${Math.round(Math.max(0.1,0.55-s.rep/250)*100)} % de que el reto se descontrole. No sustituye al patrocinio organizado.`,effect(s){if(sameEdition(s))return 'Esta edición ya se ha resuelto.';addCash(s,-3000);const bad=chance(s,Math.max(0.1,0.55-s.rep/250));addFama(s,bad?4:6);if(bad)addRep(s,-3);recordLocal(s,original.id,'viral','Regalar bolsas para un reto viral',!bad);return bad?'El reto acaba en vídeos de atracones. Reputación −3 y fama +4; no hay avance de etapa.':'Los vídeos funcionan, pero la viralidad no es todavía un acuerdo estable. Fama +6; no avanzas de etapa.';}},
   {key:'becarios',label:'Usar «prácticas» para repartir sin pagar',hint:'El recuerdo del abuso perjudica las futuras colaboraciones.',effect(s){if(sameEdition(s))return 'Esta edición ya se ha resuelto.';const prev=localState(s,original.id);localBoost(s,1.18);addHeatTrabajo(s,6);addMoral(s,-4);addRep(s,prev.lastChoice==='becarios'?-7:-5);recordLocal(s,original.id,'becarios','Repartir con prácticas sin pagar',false);return 'Los estudiantes publican las condiciones en el tablón de Derecho. Salamanca +18 % este diciembre, radar de Trabajo +6, moral −4 y pérdida de reputación. La campaña no progresa; el conflicto quedará en la memoria de la ciudad.';}},
  ],
 };
}
