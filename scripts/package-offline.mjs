import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
const dist=resolve(root,'dist');
let html=await readFile(resolve(dist,'index.html'),'utf8');
const script=html.match(/<script[^>]*src="([^"]+\.js)"[^>]*><\/script>/);
const stylesheet=html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/);
if(!script||!stylesheet)throw new Error('Run the production build first.');
let js=await readFile(resolve(dist,script[1]),'utf8');
let css=await readFile(resolve(dist,stylesheet[1]),'utf8');
const mime={'.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg','.gz':'application/gzip'};
const embedded={};
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())await walk(path);else if(mime[extname(path)]){const key=relative(dist,path);embedded[key]=`data:${mime[extname(path)]};base64,${(await readFile(path)).toString('base64')}`;}}}
await walk(resolve(dist,'assets'));
for(const [key,data]of Object.entries(embedded)){
 js=js.replaceAll(`/${key}`,data);
}
css=css.replace(/url\(([^)]+)\)/g,(match,raw)=>{const key=raw.replace(/^["']|["']$/g,'').replace(/^(?:\.\.\/|\.\/|\/)+/,'');return embedded[key]?`url("${embedded[key]}")`:match;});
// Computed lazy audio URLs are resolved locally without changing their decode behaviour.
const audio=Object.fromEntries(Object.entries(embedded).filter(([key])=>key.startsWith('assets/audio/')&&!key.endsWith('.mp3')));
const fetchPatch=`const viceEmbeddedAudio=${JSON.stringify(audio)};const viceNativeFetch=window.fetch.bind(window);window.fetch=(input,init)=>{const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;const key=Object.keys(viceEmbeddedAudio).find(k=>url.endsWith(k));return viceNativeFetch(key?viceEmbeddedAudio[key]:input,init)};`;
html=html.replace(script[0],`<script type="module">${fetchPatch}\n${js}</script>`).replace(stylesheet[0],`<style>${css}</style>`).replace(/<link[^>]*(?:rel="preload"|rel="icon")[^>]*>/g,'');
await writeFile(resolve(root,'play.html'),html);
console.log(`Offline game written: play.html (${(Buffer.byteLength(html)/1024/1024).toFixed(1)} MB).`);
