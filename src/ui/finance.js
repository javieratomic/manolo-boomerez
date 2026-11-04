import {financeSnapshot} from '../core/finance.js';
import {money,dateLabel} from '../core/helpers.js';
const tone=x=>x<0?'neg':'pos';
const row=(label,value,total=false)=>`<tr${total?' class="total"':''}><td>${label}</td><td class="${tone(value)}">${money(Math.round(value)||0)}</td></tr>`;

export function renderWealth(s) {
 const p=financeSnapshot(s),a=p.assets,d=p.liabilities,e=p.exposure;
 return `<div class="card wealth-balance"><h4>Patrimonio · ${dateLabel(s.month)}</h4>
  <p class="small muted">Foto de las cuentas actuales. Valores en libros, incluidos locales en obras y caprichos; no son precios de venta ni dinero disponible.</p>
  <h4>Activos</h4><table class="tbl pl"><tbody>
   ${row('Caja',a.cash)}${row('Obrador y ampliaciones',a.factory)}${row('Negocios y viviendas',a.businesses)}${row('Caprichos',a.luxury)}${row('Total de activos',a.total,true)}
  </tbody></table>
  <h4>Deudas confirmadas</h4><table class="tbl pl"><tbody>
   ${row('Banco',-d.bank)}${row('Préstamo de Doña Remedios',-d.family)}${row('Seguridad Social · cuotas pendientes',-d.socialSecurity)}${row('Total de deudas',-d.total,true)}
  </tbody></table>
  <p class="small muted">Las cuotas pendientes de Seguridad Social incluyen el recargo del aplazamiento. Otros gastos fijos futuros no se descuentan de golpe del patrimonio.</p>
  <table class="tbl pl"><tbody>${row('Patrimonio antes de accionistas',p.equity,true)}
   ${s.ipo?`<tr><td>Participación del jugador</td><td>${Math.round(p.ownership*100)} %</td></tr><tr><td>Factor de sentimiento bursátil</td><td>×${p.sentiment.toFixed(2).replace('.',',')}</td></tr>`:''}
   ${row('Patrimonio del jugador',p.playerWealth,true)}
  </tbody></table><p class="small muted">Activos menos deudas confirmadas${s.ipo?', multiplicado después por tu participación y el sentimiento bursátil':''}. Esta última cifra es la que cuenta para el objetivo de patrimonio.</p>
 </div>
 <div class="card wealth-exposure"><h4>Contingencias · fuera del balance</h4>
  <p class="small muted">Importes acumulados que podrían reclamar las inspecciones. No son deudas confirmadas ni se han restado del patrimonio anterior.</p>
  <table class="tbl pl"><tbody>${row('Hacienda · cuota estimada acumulada',-e.tax)}${row('Trabajo · liquidación estimada pendiente',-e.labor)}${row('Exposición conjunta',-e.total,true)}</tbody></table>
  <p class="small muted">Estimación con las condiciones actuales, sin multas adicionales. La resolución depende de la visita y de tus decisiones. Las cuotas de Seguridad Social ya aplazadas están en las deudas confirmadas, no se suman aquí otra vez.</p>
  ${e.total>0?`<details open><summary>Si pagaras ambas estimaciones íntegramente ahora</summary><table class="tbl pl"><tbody>
   ${row('Caja restante · antes de crédito',e.cashAfter)}${row('Patrimonio antes de accionistas',e.equityAfter)}${row('Patrimonio del jugador',e.playerWealthAfter,true)}
  </tbody></table><p class="small ${e.cashAfter<0?'warn':'muted'}">${e.cashAfter<0?'La caja actual no cubriría este pago conjunto. ':''}Escenario ilustrativo: no ejecuta pagos, no aplaza cuotas ni avanza el mes.</p></details>`:'<p class="small pos">Sin importes acumulados pendientes de inspección. Esto no elimina el riesgo de nuevas sanciones.</p>'}
 </div>`;
}
