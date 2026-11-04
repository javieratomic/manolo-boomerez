// Preparación no bloqueante: una partida online nunca depende de la instalación.
export function offlineWorker(worker) {
 if(!worker)return Promise.reject(new Error('No hay worker disponible.'));
 if(['installed','activated'].includes(worker.state))return Promise.resolve(worker);
 return new Promise((resolve,reject)=>{
  const changed=()=>{
   if(!['installed','activated','redundant'].includes(worker.state))return;
   worker.removeEventListener('statechange',changed);
   if(worker.state!=='redundant')resolve(worker);else reject(new Error('Instalación incompleta.'));
  };
  worker.addEventListener('statechange',changed);changed();
 });
}
function ready(worker) {
 if(!worker)return Promise.resolve(false);
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();
  const timer=setTimeout(()=>{channel.port1.close();reject(new Error('Sin confirmación offline.'));},3000);
  channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data?.ready===true);};
  worker.postMessage({type:'OFFLINE_STATUS'},[channel.port2]);
 });
}
export async function prepareOffline() {
 if(!('serviceWorker' in navigator)||!window.isSecureContext||!location.protocol.startsWith('http')||/^(localhost|127\.)/.test(location.hostname))return false;
 const indicator=document.getElementById('offline-status');
 if(!indicator)return false;
 indicator.hidden=false;indicator.dataset.state='preparing';indicator.textContent='Preparando el juego sin conexión…';
 let request=0;
 const confirm=async(worker,current)=>{
  let ok=false;
  try{if(worker?.state==='activating')await offlineWorker(worker);ok=await ready(worker);}catch{}
  if(current===request){const waiting=ok&&worker.state!=='activated';indicator.dataset.state=ok?(waiting?'waiting':'ready'):'unavailable';indicator.textContent=ok?(waiting?'Actualización sin conexión preparada. Se aplicará al reabrir el juego.':'Juego disponible sin conexión.'):'No se pudo preparar la copia sin conexión. Puedes seguir jugando online.';}
  return ok;
 };
 const observe=async worker=>{
  const current=++request;indicator.dataset.state='preparing';indicator.textContent='Preparando el juego sin conexión…';
  try{await offlineWorker(worker);return await confirm(worker,current);}
  catch{if(current===request){indicator.dataset.state='unavailable';indicator.textContent='No se pudo preparar la copia sin conexión. Puedes seguir jugando online.';}return false;}
 };
 navigator.serviceWorker.addEventListener('controllerchange',()=>observe(navigator.serviceWorker.controller));
 try{
  const registration=await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});
  registration.addEventListener('updatefound',()=>observe(registration.installing));
  return await observe(registration.installing||registration.waiting||registration.active);
 }catch{
  indicator.dataset.state='unavailable';indicator.textContent='No se pudo preparar la copia sin conexión. Puedes seguir jugando online.';return false;
 }
}
