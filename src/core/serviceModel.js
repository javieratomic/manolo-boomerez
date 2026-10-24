// Demanda y plantilla de servicios: compartidas por nóminas y permisos de contratación.
import {BUSINESS_TYPES} from '../data/businesses.js';
import {CITY_BY_ID} from '../data/cities.js';
import {policyFx,moralFactor,repFactor,modFactor,bizMult} from './economy.js';
import {macroFx} from './macro.js';
import {govFx} from './politics.js';

export function serviceRevenue(s,b,saturation=null) {
 const t=BUSINESS_TYPES[b.type],c=CITY_BY_ID[b.city],fx=policyFx(s),m=s.month%12;
 const count=saturation==null?s.businesses.filter(x=>x.city===b.city&&x.type===b.type).length:0;
 const sat=saturation??1/(1+(0.5/(0.75+c.pop))*Math.max(0,count-1));
 return t.baseRevenue*Math.pow(c.pop,t.popExp)*Math.pow(c.wealth,t.wealthExp)*(1+(t.tourismW||0)*(c.tourism-0.5))*(t.famaW?0.8+s.fama/250:1)*(s.trends[t.trend]??1)*repFactor(s.rep)*moralFactor(s.moral)*fx.bec.service*sat*(t.food?0.7+0.3*fx.ing.quality:1)*modFactor(s,'strike')*macroFx(s).demand*govFx(s).demand*(t.season?t.season[m]:1)*bizMult(s,b,t.category,c,m);
}
export const serviceStaff=(s,b,revenue=serviceRevenue(s,b))=>Math.ceil(BUSINESS_TYPES[b.type].staff*Math.pow(Math.max(1,revenue/BUSINESS_TYPES[b.type].baseRevenue),0.85));
