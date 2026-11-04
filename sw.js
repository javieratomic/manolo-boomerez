// Código de una revisión completa; arte actualizado por red con respaldo offline.
importScripts('./offline-files.js');
const {revision,files}=self.BOOMEREZ_OFFLINE;
const ROOT=new URL('./',self.location.href);
const PREFIX=`boomerez-shell:${ROOT.pathname}:`,CACHE=PREFIX+revision,ART=`boomerez-art:${ROOT.pathname}`;
const shell=new Map(files.map(f=>[new URL(f.file,ROOT).href,f]));
const index=new URL('index.html',ROOT).href;

async function hash(response) {
 const text=(await response.clone().text()).replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
async function download(file) {
 const url=new URL(file.file,ROOT).href,res=await fetch(url,{cache:'reload'});
 if(!res.ok||await hash(res)!==file.sha256)throw new Error(`Revisión offline incompleta: ${file.file}`);
 return res;
}
async function complete() {
 if(!(await caches.keys()).includes(CACHE))return false;
 const cache=await caches.open(CACHE);
 return (await Promise.all([...shell.keys()].map(url=>cache.match(url)))).every(Boolean);
}
self.addEventListener('install',e=>e.waitUntil((async()=>{
 // Verificar el worker antes de tocar la caché impide que una publicación parcial
 // (worker nuevo, catálogo antiguo) borre una revisión anterior del mismo nombre.
 const own=files.find(f=>f.file==='sw.js'),worker=await download(own);
 if(await complete()){self.skipWaiting();return;}
 const cache=await caches.open(CACHE);
 const results=await Promise.allSettled(files.map(async f=>cache.put(new URL(f.file,ROOT).href,f===own?worker:await download(f))));
 const failed=results.find(r=>r.status==='rejected');
 if(failed){await caches.delete(CACHE);throw failed.reason;}
 // La copia ya está completa. No ligar el fin de install a una transición
 // que puede esperar a la sesión del worker anterior.
 self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('message',e=>{
 if(e.data?.type==='OFFLINE_STATUS')e.waitUntil((async()=>{
  e.ports[0]?.postMessage({ready:await complete(),revision});
 })());
});
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==ROOT.origin)return;
 const canonical=url.origin+url.pathname;
 const key=shell.has(canonical)?canonical:req.mode==='navigate'&&url.pathname===ROOT.pathname?index:null;
 if(key){
  let persist=Promise.resolve();
  const response=(async()=>{
   const cache=await caches.open(CACHE),cached=await cache.match(key);
   if(cached)return cached;
   // Si el navegador desalojó un archivo, solo se acepta la misma revisión.
   try{const res=await download(shell.get(key));persist=cache.put(key,res.clone());return res;}catch{return Response.error();}
  })();
  e.waitUntil(response.then(()=>persist).catch(()=>{}));e.respondWith(response);return;
 }
 if(!url.pathname.startsWith(ROOT.pathname+'assets/'))return;
 const network=fetch(req);
 e.waitUntil(network.then(async res=>{if(res.ok){const copy=res.clone();await (await caches.open(ART)).put(req,copy);}}).catch(()=>{}));
 // La versión anterior usaba una caché común. Solo se consulta el URL exacto
 // de arte de esta instalación; no se borra porque puede servir a otra ruta.
 e.respondWith(network.catch(async()=>await caches.match(req,{cacheName:ART})||await caches.match(req,{cacheName:'boomerez-v1'})||Response.error()));
});
