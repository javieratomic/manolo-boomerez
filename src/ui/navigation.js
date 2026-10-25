import {esc} from './dom.js';

export const NAV_GROUPS=[
 {id:'empresa',label:'Empresa',emoji:'🏢'},
 {id:'expansion',label:'Expansión',emoji:'🚀'},
 {id:'equipo',label:'Equipo',emoji:'👥'},
 {id:'personal',label:'Manolo',emoji:'😎'},
];
// Los siete primeros conservan los atajos numéricos históricos.
export const TABS=[
 {id:'ciudad',label:'Ciudad',emoji:'📍',group:'empresa'},
 {id:'imperio',label:'Imperio',emoji:'🏰',group:'empresa'},
 {id:'mercado',label:'Mercado',emoji:'📊',group:'empresa'},
 {id:'plantilla',label:'Plantilla',emoji:'👷',group:'equipo'},
 {id:'finanzas',label:'Finanzas',emoji:'💶',group:'empresa'},
 {id:'manolo',label:'Manolo',emoji:'😎',group:'personal'},
 {id:'noticias',label:'Archivo',emoji:'🗂️',group:'personal'},
 {id:'marketing',label:'Marketing',emoji:'📢',group:'expansion'},
 {id:'rd',label:'I+D',emoji:'🧪',group:'expansion'},
 {id:'exterior',label:'Exterior',emoji:'🌍',group:'expansion'},
 {id:'online',label:'Online',emoji:'🛒',group:'expansion'},
 {id:'beneficios',label:'Beneficios',emoji:'🎁',group:'equipo'},
 {id:'viviendas',label:'Viviendas',emoji:'🏘️',group:'equipo'},
 {id:'direccion',label:'Dirección',emoji:'💼',group:'equipo'},
];
export const groupForTab=id=>NAV_GROUPS.find(g=>g.id===TABS.find(t=>t.id===id)?.group)||NAV_GROUPS[0];
export function renderNavigation(id) {
 const group=groupForTab(id),tabs=TABS.filter(t=>t.group===group.id);
 return `<div class="nav-groups" role="group" aria-label="Áreas de gestión">${NAV_GROUPS.map(g=>`<button class="nav-group ${g.id===group.id?'on':''}" data-act="nav-group" data-group="${g.id}" aria-pressed="${g.id===group.id}"><span aria-hidden="true">${g.emoji}</span><span>${esc(g.label)}</span></button>`).join('')}</div><div class="nav-sections" style="--menu-count:${tabs.length}" role="group" aria-label="Menús de ${esc(group.label)}">${tabs.map(t=>`<button class="tab ${id===t.id?'on':''}" data-act="tab" data-tab="${t.id}" aria-controls="panel-body" ${id===t.id?'aria-current="page"':''}><span aria-hidden="true">${t.emoji}</span><span class="tab-label">${esc(t.label)}</span></button>`).join('')}</div>`;
}
