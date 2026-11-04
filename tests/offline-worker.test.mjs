import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {offlineCatalog,checkOfflineCatalog,offlineHash} from '../tools/offline_catalog.mjs';

const root=new URL('../',import.meta.url);
const catalog=await offlineCatalog();
const source=await readFile(new URL('sw.js',root),'utf8');
const generated=await readFile(new URL('offline-files.js',root),'utf8');
const resources=new Map(await Promise.all(catalog.files.map(async f=>[f.file,await readFile(new URL(f.file,root))])));

async function worker({base='/juego/',failure=null,corrupt=null,shared=null,revision=null,artQuota=false,deferActivation=false}={}) {
 const store=shared||new Map(),handlers={},network=[];
 let disconnected=false;
 let skipRequested;const skipping=new Promise(resolve=>skipRequested=resolve);
 const normalize=x=>new URL(typeof x==='string'?x:x.url,`https://game.test${base}`).href;
 const caches={
  keys:async()=>[...store.keys()],delete:async name=>store.delete(name),
  open:async name=>{if(!store.has(name))store.set(name,new Map());const data=store.get(name);return {
   put:async(req,res)=>{if(artQuota&&name.startsWith('boomerez-art:'))throw new Error('Cuota agotada');data.set(normalize(req),res.clone());},
   match:async req=>data.get(normalize(req))?.clone(),
   keys:async()=>[...data.keys()].map(url=>new Request(url)),
  };},
  match:async(req,{cacheName}={})=>{for(const [name,data] of store){if(cacheName&&cacheName!==name)continue;const r=data.get(normalize(req));if(r)return r.clone();}},
 };
 const self={location:{href:`https://game.test${base}sw.js`,origin:'https://game.test'},clients:{claim:async()=>{}},skipWaiting:()=>{skipRequested();return deferActivation?new Promise(()=>{}):Promise.resolve();},addEventListener:(type,fn)=>handlers[type]=fn};
 const fetch=async req=>{
  const url=normalize(req);network.push(url);const file=new URL(url).pathname.slice(base.length);
  if(disconnected)throw new Error('Sin conexión');
  if(file===failure)throw new Error('Sin red');
  if(file===corrupt)return new Response('Contenido incorrecto');
  if(resources.has(file))return new Response(resources.get(file));
  if(file==='assets/manifest.json')return new Response('{"assets":[]}');
  if(file.startsWith('assets/'))return new Response('arte nuevo');
  return new Response('no encontrado',{status:404});
 };
 const context=vm.createContext({self,location:self.location,caches,fetch,URL,Request,Response,TextEncoder,crypto:webcrypto,console});
 context.importScripts=()=>vm.runInContext(revision?generated.replace(catalog.revision,revision):generated,context);
 vm.runInContext(source,context);
 const lifecycle=async type=>{let pending=Promise.resolve();handlers[type]({waitUntil:p=>pending=p});return pending;};
 const request=async(req)=>{let response;const waits=[];handlers.fetch({request:req,respondWith:p=>response=p,waitUntil:p=>waits.push(p)});const r=response?await response:null;await Promise.all(waits);return r;};
 const status=async()=>{let result=null;const waits=[];handlers.message?.({data:{type:'OFFLINE_STATUS'},ports:[{postMessage:m=>result=m}],waitUntil:p=>waits.push(p)});await Promise.all(waits);return result;};
 return {store,network,caches,self,handlers,lifecycle,request,status,base,skipping,setOffline:value=>disconnected=value};
}

test('Offline: catálogo completo con hashes actuales y SVG de I+D',async()=>{
 await checkOfflineCatalog();assert(catalog.files.some(f=>f.file==='index.html'));assert(catalog.files.some(f=>f.file==='src/main.js'));
 assert(catalog.files.some(f=>f.file==='assets/ui/rd_congelados.svg'));assert(!catalog.files.some(f=>f.file==='assets/manifest.json'||f.file.endsWith('.png')));
 for(const f of catalog.files)assert.equal(createHash('sha256').update(resources.get(f.file).toString().replace(/^\uFEFF/,'').replace(/\r\n/g,'\n')).digest('hex'),f.sha256);
 assert.equal(offlineHash('a\r\nb'),offlineHash('a\nb'));assert.equal(offlineHash('\uFEFFa\nb'),offlineHash('a\nb'));
});

test('Offline: primera instalación prepara todo el código antes de anunciar listo',async()=>{
 const w=await worker();await w.lifecycle('install');await w.lifecycle('activate');const p=await w.status();assert.equal(p?.ready,true);assert.equal(p?.revision,catalog.revision);
 for(const f of catalog.files){const r=await w.request(new Request(`https://game.test/juego/${f.file}`));assert(r?.ok,f.file);}
});

test('Offline: una descarga fallida o corrupta no activa una revisión parcial',async()=>{
 for(const option of [{failure:'src/main.js'},{corrupt:'styles.css'}]){const store=new Map([['boomerez-shell:/juego/:anterior',new Map()],['otra-app',new Map()]]),w=await worker({...option,shared:store});
  await assert.rejects(w.lifecycle('install'));assert(store.has('boomerez-shell:/juego/:anterior'));assert(store.has('otra-app'));assert(![...store.keys()].some(k=>k.includes(catalog.revision)));
 }
});

test('Offline: activar limpia solo revisiones propias de la misma ruta',async()=>{
 const shared=new Map([['boomerez-shell:/juego/:anterior',new Map()],['boomerez-shell:/otro/:anterior',new Map()],['boomerez-art:/juego/',new Map()],['otra-app',new Map()]]);
 const w=await worker({shared});await w.lifecycle('install');await w.lifecycle('activate');assert(!shared.has('boomerez-shell:/juego/:anterior'));assert(shared.has('boomerez-shell:/otro/:anterior'));assert(shared.has('boomerez-art:/juego/'));assert(shared.has('otra-app'));
});

test('Offline: código usa la revisión verificada, no una mezcla de red posterior',async()=>{
 const w=await worker();await w.lifecycle('install');const before=w.network.length;
 const res=await w.request(new Request('https://game.test/juego/src/main.js'));assert.equal(await res.text(),resources.get('src/main.js').toString());assert.equal(w.network.length,before);
});

test('Offline: arte posterior se obtiene de red y conserva respaldo sin ligar su versión al código',async()=>{
 const w=await worker();await w.lifecycle('install');const res=await w.request(new Request('https://game.test/juego/assets/edificios/nuevo.png'));assert.equal(await res.text(),'arte nuevo');
 const names=[...w.store.keys()];assert(names.includes('boomerez-art:/juego/'));assert.equal((await w.status()).ready,true);
});

test('Offline: navegar con query resuelve index y no inventa páginas fuera del juego',async()=>{
 const w=await worker();await w.lifecycle('install');const nav={url:'https://game.test/juego/?semilla=42',method:'GET',mode:'navigate'};
 const res=await w.request(nav);assert.equal(await res.text(),resources.get('index.html').toString());
 assert.equal(await w.request(new Request('https://game.test/otra-app/data.json')),null);
 assert.equal(await w.request(new Request('https://externo.test/data.json')),null);
 assert.equal(await w.request(new Request('https://game.test/juego/api',{method:'POST'})),null);
});

test('Offline: caché incompleta nunca responde listo',async()=>{
 const w=await worker();await w.lifecycle('install');const shell=[...w.store.values()].find(c=>[...c.keys()].some(k=>k.endsWith('/src/main.js')));shell.delete('https://game.test/juego/src/main.js');assert.equal((await w.status()).ready,false);
});

test('Offline: recuperar un archivo desalojado repara la preparación si coincide su hash',async()=>{
 const w=await worker();await w.lifecycle('install');const shell=[...w.store.values()].find(c=>[...c.keys()].some(k=>k.endsWith('/src/main.js')));shell.delete('https://game.test/juego/src/main.js');
 assert((await w.request(new Request('https://game.test/juego/src/main.js'))).ok);assert.equal((await w.status()).ready,true);
});

test('Offline: ni un catálogo antiguo completo permite aceptar un worker publicado a medias',async()=>{
 const old=await worker();await old.lifecycle('install');const broken=await worker({shared:old.store,corrupt:'sw.js'});
 await assert.rejects(broken.lifecycle('install'));assert.equal((await old.status()).ready,true);
});

test('Offline: cuota opcional de arte no rompe respuestas online y la copia sirve sin red',async()=>{
 const quota=await worker({artQuota:true});await quota.lifecycle('install');assert.equal(await (await quota.request(new Request('https://game.test/juego/assets/escena.png'))).text(),'arte nuevo');
 const w=await worker();await w.lifecycle('install');await w.request(new Request('https://game.test/juego/assets/escena.png'));w.setOffline(true);
 assert.equal(await (await w.request(new Request('https://game.test/juego/assets/escena.png'))).text(),'arte nuevo');assert((await w.request(new Request('https://game.test/juego/src/main.js'))).ok);
});

test('Offline: una actualización fallida conserva la revisión anterior realmente utilizable',async()=>{
 const old=await worker();await old.lifecycle('install');await old.lifecycle('activate');const next=await worker({shared:old.store,revision:'f'.repeat(64),failure:'styles.css'});
 await assert.rejects(next.lifecycle('install'));old.setOffline(true);assert.equal((await old.status()).ready,true);assert((await old.request(new Request('https://game.test/juego/src/main.js'))).ok);
 const good=await worker({shared:old.store,revision:'e'.repeat(64)});await good.lifecycle('install');await good.lifecycle('activate');assert.equal((await good.status()).ready,true);assert(![...good.store.keys()].some(k=>k.endsWith(catalog.revision)));
});

test('Offline: actualización conserva el arte descargado por el worker antiguo',async()=>{
 const url='https://game.test/juego/assets/mapa.png',shared=new Map([['boomerez-v1',new Map([[url,new Response('arte anterior válido')]])]]);
 const w=await worker({shared});await w.lifecycle('install');await w.lifecycle('activate');w.setOffline(true);
 assert.equal(await (await w.request(new Request(url))).text(),'arte anterior válido');assert(shared.has('boomerez-v1'));
});

test('Offline: instalación no espera a que termine la transición de activación',async()=>{
 const w=await worker({deferActivation:true});let installed=false;const installing=w.lifecycle('install').then(()=>installed=true);
 await Promise.race([w.skipping,installing]);await new Promise(resolve=>setImmediate(resolve));
 assert(installed);assert.equal((await w.status()).ready,true);
});
