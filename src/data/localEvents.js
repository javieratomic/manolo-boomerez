// [ciudad, decisiones que cuidan la relación local, perfil de reputación].
export const LOCAL_RULES={
 ciudad_pamplona:['pamplona',[0,1],'festival'],ciudad_valencia:['valencia',[0],'conflict'],
 ciudad_sevilla:['sevilla',[0],'invitation'],ciudad_marbella:['marbella',[0],'invitation'],
 ciudad_bilbao:['bilbao',[0],'invitation'],ciudad_barcelona:['barcelona',[0,1],'conflict'],
 ciudad_madrid:['madrid',[0,1],'conflict'],ciudad_palma:['palma',[0,3],'conflict'],
 ciudad_zaragoza:['zaragoza',[0,1],'festival'],ciudad_santander:['santander',[0,1,2],'invitation'],
 ciudad_coruna:['coruna',[0,1],'festival'],ciudad_valladolid:['valladolid',[0,1],'festival'],
 ciudad_cordoba:['cordoba',[0,3],'invitation'],ciudad_toledo:['toledo',[0,2],'invitation'],
 ciudad_tarragona:['tarragona',[0,1],'invitation'],ciudad_almeria:['almeria',[0,1],'invitation'],
 ciudad_laspalmas:['laspalmas',[0,1],'festival'],ciudad_granada:['granada',[0],'conflict'],
 ciudad_murcia:['murcia',[0,1,2],'festival'],ciudad_alicante:['alicante',[0],'invitation'],
 ciudad_salamanca:['salamanca',[0,1],'festival'],ciudad_oviedo:['oviedo',[0,1,3],'invitation'],
 ciudad_vitoria:['vitoria',[0,2],'invitation'],ciudad_selaya:['selaya',[0,1],'festival'],
};
export const ANNUAL_LOCAL=new Set(['ciudad_pamplona','ciudad_sevilla','ciudad_zaragoza','ciudad_laspalmas','ciudad_murcia','ciudad_salamanca']);
export const SINGLE_LOCAL=new Set(['ciudad_valencia','ciudad_cordoba']);
export const NEW_YEAR_STAGES=['Propuesta local','Salamanca','Universidades de Castilla y León','Campaña nacional','Tradición nacional'];
