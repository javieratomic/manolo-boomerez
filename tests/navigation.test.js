import {test,assert,assertEq} from './runner.js';

test('Navegación: catorce pantallas en cuatro grupos cortos y atajos anteriores intactos',async()=>{
 const {TABS,NAV_GROUPS}=await import('../src/ui/navigation.js');
 assertEq(NAV_GROUPS.length,4);assertEq(TABS.length,14);assertEq(new Set(TABS.map(t=>t.id)).size,14);
 assertEq(TABS.slice(0,7).map(t=>t.id).join(','),'ciudad,imperio,mercado,plantilla,finanzas,manolo,noticias');
 for(const g of NAV_GROUPS){const tabs=TABS.filter(t=>t.group===g.id);assert(tabs.length>0&&tabs.length<=4);}
 for(const id of ['rd','marketing','exterior','online','viviendas','direccion','beneficios'])assert(TABS.some(t=>t.id===id));
});
