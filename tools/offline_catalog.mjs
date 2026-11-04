// Catálogo del código estático para preparar una revisión offline completa.
// Uso: node tools/offline_catalog.mjs [--check]
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
// Git puede convertir finales de línea al publicar. Todos los recursos de este
// catálogo son texto UTF-8: el worker verifica la misma representación canónica.
export const offlineHash=bytes=>createHash('sha256').update(bytes.toString().replace(/^\uFEFF/,'').replace(/\r\n/g,'\n')).digest('hex');
async function walk(dir) {
 const entries=await readdir(dir,{withFileTypes:true});
 return (await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]))).flat();
}
export async function offlineCatalog(root=ROOT) {
 const sources=(await walk(path.join(root,'src'))).filter(f=>f.endsWith('.js'));
 const icons=(await readdir(path.join(root,'assets','ui'))).filter(f=>/^rd_.*\.svg$/.test(f)).map(f=>path.join(root,'assets','ui',f));
 const paths=[...['index.html','styles.css','manifest.webmanifest','icon.svg','sw.js'].map(f=>path.join(root,f)),...sources,...icons];
 const files=await Promise.all(paths.sort().map(async f=>({file:path.relative(root,f).split(path.sep).join('/'),sha256:offlineHash(await readFile(f))})));
 return {revision:offlineHash(JSON.stringify(files)),files};
}
const render=manifest=>`// Generado por node tools/offline_catalog.mjs. No editar a mano.\nself.BOOMEREZ_OFFLINE = ${JSON.stringify(manifest,null,2)};\n`;
export async function writeOfflineCatalog(root=ROOT) {
 const catalog=await offlineCatalog(root);await writeFile(path.join(root,'offline-files.js'),render(catalog));return catalog;
}
export async function checkOfflineCatalog(root=ROOT) {
 let actual='';try{actual=await readFile(path.join(root,'offline-files.js'),'utf8');}catch{}
 if(actual.replace(/\r\n/g,'\n')!==render(await offlineCatalog(root)))throw new Error('Catálogo offline obsoleto. Ejecuta node tools/offline_catalog.mjs antes de validar o publicar.');
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 try{if(process.argv.includes('--check')){await checkOfflineCatalog();console.log('Catálogo offline actualizado.');}
 else{const m=await writeOfflineCatalog();console.log(`Catálogo offline: ${m.files.length} archivos · ${m.revision.slice(0,12)}.`);}}
 catch(e){console.error(e.message);process.exitCode=1;}
}
