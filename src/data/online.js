// Tarifas de juego para pedidos peninsulares en cajas de seis sobaos.
export const ONLINE_LEVELS=[
 {level:0,name:'Sin tienda online',cost:0,monthly:0,staff:0,demand:0,maxOrders:0},
 {level:1,name:'Tienda online',cost:15000,monthly:600,staff:1,demand:6000,maxOrders:1000},
 {level:2,name:'Equipo de comercio electrónico',cost:45000,monthly:1800,staff:3,demand:18000,maxOrders:3500},
 {level:3,name:'Plataforma nacional',cost:140000,monthly:4500,staff:8,demand:60000,maxOrders:10000},
];
export const ONLINE_SHIPPING={
 incluido:{label:'Envío incluido en el precio',charge:0,demand:1},
 compartidos:{label:'El cliente aporta 3 € por pedido',charge:3,demand:0.82},
};
export const ONLINE_BRANDS={
 express:{price:3.8,parcel:6.9,packaging:0.9,traffic:1},
 maison:{price:10.5,parcel:12.9,packaging:2.4,traffic:0.3},
};
export const ONLINE_BOX=6;
export const onlineStaff=s=>s.online?.active?(ONLINE_LEVELS[s.online.level]?.staff||0):0;
