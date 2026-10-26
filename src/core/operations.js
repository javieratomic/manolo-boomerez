// Plan estructural: calendario contratado con las condiciones actuales.
// No avanza la simulación, completa I+D, cobra renovaciones ni consume azar.
import {HQ_CITY} from '../data/cities.js';
import {housingSpec} from '../data/housing.js';
import {isOperating,businessName,renovationSchedule} from './construction.js';
import {workforcePlan} from './workforce.js';

export function operationsPlan(s) {
 const from=s.month,to=from+12;
 const pending=s.businesses.filter(b=>!isOperating(s,b));
 const projects=pending.filter(b=>b.readyMonth<=to).map(b=>({
  id:b.id,city:b.city,type:b.type,name:businessName(b),month:b.readyMonth,months:b.readyMonth-from,
  homes:b.type==='vivienda'?housingSpec(b).units:0,
 })).sort((a,b)=>a.month-b.month||a.id-b.id);
 const renewals=renovationSchedule(s);
 const cities=[...new Set([HQ_CITY,...s.businesses.map(b=>b.city)])].sort();
 const timeline=Array.from({length:13},(_,i)=>{
  const month=from+i,future={...s,month};
  const rows=cities.map(city=>{
   const w=workforcePlan(future,city);
   return {city,beds:w.beds,required:w.required,available:w.available,missingBeds:w.missingBeds};
  });
  return {month,cities:rows,missingBeds:rows.reduce((n,w)=>n+w.missingBeds,0)};
 });
 const shortages=cities.flatMap(city=>{
  const rows=timeline.map(t=>({month:t.month,...t.cities.find(c=>c.city===city)}));
  const first=rows.find(r=>r.missingBeds>0);if(!first)return [];
  const peak=rows.reduce((a,b)=>b.missingBeds>a.missingBeds?b:a);
  return [{city,firstMonth:first.month,firstMissingBeds:first.missingBeds,nowMissingBeds:rows[0].missingBeds,
   peakMonth:peak.month,peakMissingBeds:peak.missingBeds,peakRequired:peak.required,peakAvailable:peak.available}];
 }).sort((a,b)=>a.firstMonth-b.firstMonth||b.peakMissingBeds-a.peakMissingBeds||a.city.localeCompare(b.city));
 return {from,to,projects,renewals,timeline,shortages,
  laterProjects:pending.length-projects.length,
  pendingHomes:projects.reduce((n,p)=>n+p.homes,0),
  renewalReserve:renewals.reduce((n,r)=>n+r.cost,0),
  nowMissingBeds:timeline[0].missingBeds,
  peakMissingBeds:Math.max(...timeline.map(t=>t.missingBeds)),
 };
}
