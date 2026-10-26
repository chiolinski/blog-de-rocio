import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const data = JSON.parse((await fs.readFile('contenido/publicaciones.json','utf8')).replace(/^\uFEFF/,''));
assert.ok(data.length > 0);
assert.ok(data.every(p=>typeof p.titulo==='string' && p.titulo.length > 0));
const files = await fs.readdir('dist',{recursive:true});
const htmlFiles = files.filter(f=>f.endsWith('.html'));
assert.equal(htmlFiles.length,data.length+2);
let checked = 0;
for(const file of htmlFiles){
  const html = await fs.readFile(path.join('dist',file),'utf8');
  assert.ok(!/src="(?:undefined|null|[^"\s]*undefined)/.test(html),file);
  assert.ok(html.includes('<html lang="es">'),file);
  assert.ok(!/src="https:\/\/(?:blogderociobelen\.wordpress\.com|blogderociobelen\.files\.wordpress\.com)\/.+\.(?:jpg|jpeg|png)/i.test(html), `Imagen sin descargar: ${file}`);
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const target = match[1].replaceAll('&amp;','&');
    if (/^(https?:|mailto:|tel:|#|data:)/.test(target) || target.startsWith('/')) continue;
    const resolved = path.resolve('dist',path.dirname(file),decodeURIComponent(target.split('#')[0]));
    assert.ok(resolved.startsWith(path.resolve('dist')),`Enlace fuera de dist: ${target}`);
    await fs.access(resolved).catch(()=>{throw Error(`Enlace roto en ${file}: ${target}`)});
    checked++;
  }
}
console.log(`OK: ${data.length} publicaciones, ${htmlFiles.length} páginas HTML y ${checked} enlaces/archivos locales comprobados.`);
