import {LOCAL_RULES,ANNUAL_LOCAL,SINGLE_LOCAL} from '../data/localEvents.js';
import {CITY_BY_ID} from '../data/cities.js';
import {addMod,addRep} from './helpers.js';

export const localState=(s,id)=>s.localEvents?.[id]||{visits:0,successes:0,failures:0,standing:0,level:0,lastMonth:-1,lastYear:-1,lastSuccessYear:-1,lastChoice:null,lastLabel:'',lastOutcome:null};
export function recordLocal(s,id,key,label,good,updates={}) {
 const old=localState(s,id);
 const next={...old,visits:old.visits+1,successes:old.successes+(good?1:0),failures:old.failures+(good?0:1),standing:Math.max(-10,Math.min(10,old.standing+(good?2:-3))),lastMonth:s.month,lastYear:Math.floor(s.month/12),lastChoice:key,lastLabel:label,lastOutcome:good?'acuerdo':'conflicto',...updates};
 s.localEvents||={};s.localEvents[id]=next;return next;
}
export function localMemoryText(s,id) {
 const p=localState(s,id);
 if(!p.visits)return `Reputación actual: ${Math.round(s.rep)}/100. ${s.rep>=65?'La gente está dispuesta a escucharte.':s.rep<35?'Los vecinos te reciben con recelo.':'Todavía tienes que ganarte la confianza local.'}`;
 return `La última vez elegiste «${p.lastLabel}». ${p.lastOutcome==='conflicto'?'Recuerdan el conflicto y piden garantías.':'Recuerdan el acuerdo y esperan que lo cuides.'} Reputación actual: ${Math.round(s.rep)}/100.`;
}
export function reputationWeight(s,id) {
 const profile=LOCAL_RULES[id][2],p=localState(s,id);
 const rep=Math.max(0,Math.min(100,s.rep));
 return Math.max(0.2,(profile==='conflict'?1.5-rep/100:0.5+rep/100)+p.standing*0.025);
}
export function decorateLocalEvent(e) {
 const annual=ANNUAL_LOCAL.has(e.id),single=SINGLE_LOCAL.has(e.id);
 const rule=LOCAL_RULES[e.id];
 return {...e,local:true,annual,memory:true,once:single||e.once,forced:single?false:e.forced,cooldown:annual?12:e.cooldown,
  weight:s=>e.weight(s)*reputationWeight(s,e.id),
  text:(s,p)=>`${e.text(s,p)}\n\n${localMemoryText(s,e.id)}`,
  choices:e.choices.map((c,index)=>({...c,key:`local_${index}`,effect(s,p){
   const previous=localState(s,e.id);
   if(annual&&previous.lastYear===Math.floor(s.month/12)||single&&previous.visits>0)return 'Esta edición ya se ha resuelto. Las decisiones anteriores siguen vigentes.';
   const rep=s.rep,label=typeof c.label==='function'?c.label(s,p):c.label;
   let text=c.effect(s,p);
   const good=s.rep>rep||rule[1].includes(index)&&s.rep>=rep;
   if(good&&previous.successes>0){
    const bonus=Math.min(0.1,0.02*Math.min(5,previous.successes)*(0.5+s.rep/100));
    s.mods=s.mods.filter(m=>m.localEvent!==e.id);
    addMod(s,{kind:'revenue',city:rule[0],factor:1+bonus,months:1,label:'Confianza local acumulada',localEvent:e.id});
    text+=` La confianza de los acuerdos anteriores añade un ${(bonus*100).toFixed(1).replace('.',',')} % de demanda local este mes.`;
   }else if(!good&&previous.lastChoice===`local_${index}`){
    const penalty=2+Math.floor(Math.max(0,-previous.standing)/4);addRep(s,-penalty);
    text+=` Repetir la misma conducta cuesta otros ${penalty} puntos de reputación: los vecinos ya te conocen.`;
   }
   recordLocal(s,e.id,`local_${index}`,label,good);return text;
  }})),
 };
}

export function decemberTradition(s,type,category,city,month) {
 if(month!==11||category!=='sobaos'||!['express','maison','obrador'].includes(type)||city.foreign)return 1;
 const p=localState(s,'ciudad_salamanca'),year=Math.floor(s.month/12);
 if(p.level>=4)return 1+(s.rep<30?0.075:0.15);
 if(p.lastSuccessYear!==year)return 1;
 if(p.level===3)return 1.1;
 if(p.level===2&&city.region===CITY_BY_ID.salamanca.region)return 1.08;
 return 1;
}
