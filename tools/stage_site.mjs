// Prepara únicamente los archivos del juego para publicar en un servidor estático.
import {cp,mkdir,rm,realpath,lstat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkOfflineCatalog} from './offline_catalog.mjs';

const root=await realpath(fileURLToPath(new URL('../',import.meta.url)));
await checkOfflineCatalog(root);
await mkdir(path.join(root,'dist'),{recursive:true});
const parent=await realpath(path.join(root,'dist'));
if(!parent.startsWith(root+path.sep))throw new Error('La salida del sitio debe estar dentro del repositorio.');
const out=path.join(parent,'site');
const previous=await lstat(out).catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
if(previous?.isSymbolicLink())throw new Error('La salida del sitio no puede ser un enlace simbólico.');
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
for(const entry of ['index.html','styles.css','manifest.webmanifest','icon.svg','sw.js','offline-files.js','src','assets'])await cp(path.join(root,entry),path.join(out,entry),{recursive:true});
await writeFile(path.join(out,'.nojekyll'),'');
console.log(`Sitio preparado en ${out}`);
