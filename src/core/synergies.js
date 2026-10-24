import {CITY_BY_ID} from '../data/cities.js';

export function businessSynergies(s,b) {
 const partner=b.type==='academy'?'coworking':b.type==='coworking'?'academy':null;
 const learning=partner&&s.businesses.some(x=>x.city===b.city&&x.type===partner)?0.15:0;
 const sold=s.citySobaoSales?.[b.city]||0;
 const fitness=b.type==='gimnasio'?0.35*Math.min(1,sold/(5000*Math.max(0.5,CITY_BY_ID[b.city].pop))):0;
 return {learning,fitness,factor:(1+learning)*(1+fitness)};
}
