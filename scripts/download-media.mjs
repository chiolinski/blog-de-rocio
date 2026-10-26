import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const posts = JSON.parse((await fs.readFile('contenido/publicaciones.json', 'utf8')).replace(/^\uFEFF/, ''));
const urls = [...new Set(posts.flatMap(p => [...p.contenido_html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)/gi)].map(m => m[1].replaceAll('&amp;', '&'))))];
await fs.mkdir('assets/images', {recursive: true});
const mapping = {};
const failures = [];
let cursor = 0;
await Promise.all(Array.from({length: 5}, async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const parsed = new URL(url);
      if (!['blogderociobelen.wordpress.com', 'blogderociobelen.files.wordpress.com'].includes(parsed.hostname)) throw Error('Proveedor externo');
      const ext = path.extname(parsed.pathname).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) throw Error('Formato no compatible');
      const file = `assets/images/${crypto.createHash('sha256').update(url).digest('hex').slice(0, 16)}${ext}`;
      try { await fs.access(file); } catch {
        let response;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            response = await fetch(url, {signal: AbortSignal.timeout(45000)});
            if (!response.ok) throw Error(`HTTP ${response.status}`);
            break;
          } catch (error) { if (attempt === 2) throw error; }
        }
        if (!response.headers.get('content-type')?.startsWith('image/')) throw Error('La respuesta no es una imagen');
        const data = new Uint8Array(await response.arrayBuffer());
        if (data.length > 15 * 1024 * 1024) throw Error('Imagen demasiado grande');
        await fs.writeFile(file, data);
      }
      mapping[url] = file;
    } catch (error) { failures.push({url, error: error.message}); }
  }
}));
await fs.writeFile('contenido/media.json', JSON.stringify(mapping, null, 2) + '\n');
console.log(JSON.stringify({imagenes: urls.length, descargadas: Object.keys(mapping).length, fallos: failures}, null, 2));
if (failures.length) process.exitCode = 1;
