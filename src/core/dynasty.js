// Continuidad generacional de la campaña europea; no reinicia el estado empresarial.
import {CITY_BY_ID} from '../data/cities.js';
import {isOperating} from './construction.js';
import {log,addRep,addMoral} from './helpers.js';
import {chance} from './rng.js';

export const newDynasty = () => ({generation:0,name:'Manolo Boomerez',birthMonth:-660,portrait:'portrait_manolo_neutral',history:[],highStressMonths:0,pendingCause:null});
export const leaderAge = (s, month=s.month) => Math.max(0,Math.floor((month-(s.dynasty?.birthMonth??-660))/12));
export function successor(s,key='profesional') {
 const generation=s.dynasty?.generation||0;
 if(key==='designado')key=s.sucesion?.heir||'profesional';
 if(key==='familia')key=generation===0&&!s.flags.vanessaRival?'vanessa':generation===0?'kevin':'familia';
 if(key==='vanessa'&&!s.flags.vanessaRival&&generation===0)return {key,name:'Vanessa Boomerez',age:19+Math.floor(s.month/12),portrait:'portrait_hija_vanessa'};
 if(key==='kevin'&&generation===0)return {key,name:'Kevin Boomerez',age:24+Math.floor(s.month/12),portrait:'portrait_sobrino_kevin'};
 if(key==='merche'&&!s.flags.divorciado&&generation===0)return {key,name:'Merche',age:53+Math.floor(s.month/12),portrait:'portrait_esposa_merche'};
 if(key==='plantilla')return {key,name:`Dirección cooperativa ${generation+1}`,age:40,portrait:'portrait_empleada_maripili'};
 if(key==='familia')return {key,name:`Generación ${generation+1} Boomerez`,age:32,portrait:'portrait_manolo_neutral'};
 return {key:'profesional',name:s.sucesion?.heir==='directivo'&&s.sucesion.execName?s.sucesion.execName:`Dirección profesional ${generation+1}`,age:45,portrait:'portrait_manolo_neutral'};
}
export function nominateHeir(s,key) {
 if(!['vanessa','kevin','merche','plantilla','profesional','familia'].includes(key))return {ok:false,msg:'Sucesor desconocido.'};
 const candidate=successor(s,key);
 if(candidate.key!==key&&key!=='familia')return {ok:false,msg:'Esa persona ya no puede asumir la sucesión.'};
 s.sucesion||={};s.sucesion.heir=key;
 log(s,`📜 Nombras sucesor a ${candidate.name}.`,'info');return {ok:true};
}
export function beginSuccession(s,cause) {
 s.dynasty||=newDynasty();
 if(s.dynasty.pendingCause)return false;
 s.dynasty.pendingCause=cause;
 s.pending=s.pending.filter(p=>!['susto_padel','velas_1','velas_2','velas_3','divorcio'].includes(p.id));
 s.pending.unshift({kind:'event',id:'relevo_dinastia',params:{cause}});
 return true;
}
export function tickDynasty(s,resting=s.restMonths>0) {
 if(s.campaign!=='europe')return;
 const d=s.dynasty||=newDynasty();if(d.pendingCause)return;
 if(leaderAge(s,s.month+1)>=80){beginSuccession(s,'edad');return;}
 if(resting){d.highStressMonths=0;return;}
 d.highStressMonths=s.estres>=90?d.highStressMonths+1:0;
 if(d.highStressMonths===1)(s.notices||=[]).push({kicker:'🫀 Dirección',title:'Estrés crítico',text:'Por encima de 90 durante tres meses seguidos hay riesgo de fallecimiento. Descansar, delegar y reducir el estrés evita esa acumulación. La empresa continuará con su sucesor si fallece.'});
 if(d.highStressMonths>=3&&chance(s,Math.min(0.12,(s.estres-85)*0.004+(leaderAge(s)>=70?0.02:0))))beginSuccession(s,'estres');
}
export function succeed(s,key='designado') {
 const d=s.dynasty;if(!d?.pendingCause)return {ok:false,msg:'No hay una sucesión pendiente.'};
 const next=successor(s,key),previous=d.name,cause=d.pendingCause;
 d.history.push({name:previous,age:leaderAge(s,cause==='edad'?s.month+1:s.month),cause,month:s.month});
 d.generation++;d.name=next.name;d.birthMonth=s.month-next.age*12;d.portrait=next.portrait;d.pendingCause=null;d.highStressMonths=0;
 s.estres=25;s.restMonths=0;s.actionUsed=false;s.familia=60;
 // Las tramas de Merche pertenecen al fundador, no a cada nueva persona al mando.
 s.flags.founderGone=true;s.sucesion={heir:null,execName:null,clausula:null,m:null};
 s.pending=s.pending.filter(p=>p.id!=='relevo_dinastia');
 if(next.key==='plantilla')addMoral(s,8);else addRep(s,2);
 const text=`${previous} ${cause==='retiro'?'se retira':'ha fallecido'}. ${next.name} toma el mando a los ${next.age} años. Conservas caja, deuda, empresas, contratos e investigación; continúa el calendario.`;
 log(s,`📜 ${text}`,'info');return {ok:true,text};
}
export function europeProgress(s,wealth=0) {
 const countries=new Set(['es']);
 for(const b of s.businesses)if(b.mode!=='franquicia'&&isOperating(s,b)){const c=CITY_BY_ID[b.city];if(c&&!c.foreign) countries.add('es');else if(c?.europe)countries.add(c.country);}
 const sectors=['banca','telecom','logistica'].filter(type=>s.businesses.some(b=>b.type===type&&b.mode!=='franquicia'&&isOperating(s,b)));
 return {countries:countries.size,targetCountries:8,wealth,targetWealth:1e9,sectors:sectors.length,targetSectors:3,complete:wealth>=1e9&&countries.size>=8&&sectors.length===3};
}
