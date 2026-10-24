import { FOREIGN_BY_ID, DISPUTES } from './international.js';
import { resolveDispute } from '../core/international.js';

const answer = (s,p,choice) => { const r = resolveDispute(s,p.dealId,choice); return r.text || r.msg; };

export const INTERNATIONAL_EVENTS = [{
  id:'socio_extranjero', title:'El socio extranjero llama... por fin', portrait:'portrait_manolo_scared',
  text(s,p) {
    const d = (s.foreignDeals || []).find(d => d.id === p.dealId);
    return `${FOREIGN_BY_ID[d?.market]?.partner || 'Tu socio'}: ${DISPUTES[p.reason] || 'Hay un desacuerdo.'}\n\nEl contrato queda suspendido hasta que tomes una decisión.`;
  },
  weight:()=>0,
  choices:[
    {label:'Intervenir y exigir auditorías (12.000 €)', hint:'Después: 900 €/mes. Reduce el riesgo, pero no crea capacidad de producción.', available:s=>s.cash>=12000, effect:(s,p)=>answer(s,p,'audit')},
    {label:'Rescindir el acuerdo (5.000 €)', available:s=>s.cash>=5000, effect:(s,p)=>answer(s,p,'end')},
    {label:'«Eso lo arregláis vosotros»', hint:'Asumes impagos o reclamaciones y pierdes reputación; una copia afecta a tus ventas.', effect:(s,p)=>answer(s,p,'ignore')},
  ],
}];
