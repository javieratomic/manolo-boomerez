import {successor,succeed,leaderAge} from '../core/dynasty.js';
const answer=(s,key)=>{const r=succeed(s,key);return r.text||r.msg;};
export const DYNASTY_EVENTS=[{
 id:'relevo_dinastia',title:'El imperio continúa',portrait:'portrait_padre_anselmo',weight:()=>0,
 text(s,p){const name=s.dynasty?.name||'Manolo';return `${name}: ${p.cause==='retiro'?'llega el relevo voluntario':p.cause==='estres'?'ha fallecido tras una crisis de estrés':`ha fallecido a los 80 años`}.\n\nLa empresa no termina aquí. Elige quién toma el mando; conservarás todo el imperio y el calendario.`;},
 choices:[
  {label:s=>`Respetar el nombramiento: ${successor(s,'designado').name}`,effect:s=>answer(s,'designado')},
  {label:'Confiar la gestión a una dirección profesional',effect:s=>answer(s,'profesional')},
  {label:s=>`Continuidad familiar: ${successor(s,'familia').name}`,effect:s=>answer(s,'familia')},
 ]
}];
