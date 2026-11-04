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
export async function watchOffline(serviceWorker,indicator,probe=ready) {
 indicator.hidden=false;indicator.dataset.state='preparing';indicator.textContent='Preparando el juego sin conexión…';
 let request=0,registration=null;
 const unavailable=()=>{indicator.dataset.state='unavailable';delete indicator.dataset.copy;indicator.textContent='No se pudo preparar la copia sin conexión. Puedes seguir jugando online.';};
 const recover=async(current,failed)=>{
  for(const worker of new Set([registration?.active,serviceWorker.controller])){
   if(current!==request)return false;
   if(!worker||worker===failed||worker.state!=='activated')continue;
   let ok=false;try{ok=await probe(worker);}catch{}
   if(current!==request)return false;
   if(ok){indicator.dataset.state='ready';indicator.dataset.copy='saved';indicator.textContent='Copia guardada disponible sin conexión. La actualización no se completó.';return true;}
  }
  if(current===request)unavailable();return false;
 };
 const confirm=async(worker,current)=>{
  let ok=false;
  try{if(worker?.state==='activating')await offlineWorker(worker);ok=await probe(worker);}catch{}
  if(!ok)return recover(current,worker);
  if(current===request){const waiting=worker.state!=='activated';delete indicator.dataset.copy;indicator.dataset.state=waiting?'waiting':'ready';indicator.textContent=waiting?'Actualización sin conexión preparada. Se aplicará al reabrir el juego.':'Juego disponible sin conexión.';}
  return ok;
 };
 const observe=async worker=>{
  const current=++request;indicator.dataset.state='preparing';delete indicator.dataset.copy;indicator.textContent='Preparando el juego sin conexión…';
  try{await offlineWorker(worker);return await confirm(worker,current);}
  catch{return recover(current,worker);}
 };
 serviceWorker.addEventListener('controllerchange',()=>observe(serviceWorker.controller));
 try{
  registration=await serviceWorker.register('sw.js',{updateViaCache:'none'});
  registration.addEventListener('updatefound',()=>observe(registration.installing));
  return await observe(registration.installing||registration.waiting||registration.active);
 }catch{
  return recover(0,null);
 }
}
export async function prepareOffline() {
 if(!('serviceWorker' in navigator)||!window.isSecureContext||!location.protocol.startsWith('http')||/^(localhost|127\.)/.test(location.hostname))return false;
 const indicator=document.getElementById('offline-status');
 return indicator?watchOffline(navigator.serviceWorker,indicator):false;
}
