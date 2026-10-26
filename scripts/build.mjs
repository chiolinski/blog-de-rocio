import fs from 'node:fs/promises';
import path from 'node:path';

const load = async file => JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const data = (await load('contenido/publicaciones.json')).map(p => ({...p, slug: decodeURIComponent(p.slug)}));
const media = await load('contenido/media.json');
const posts = data.filter(p => p.tipo === 'post').sort((a,b) => b.fecha.localeCompare(a.fecha));
const pages = data.filter(p => p.tipo === 'page');
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const plain = html => html.replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&#039;',"'").replaceAll('&amp;','&').replace(/&#\d+;/g,' ').replace(/\s+/g,' ').trim();
const date = p => new Date(p.fecha.slice(0,10) + 'T12:00:00Z').toLocaleDateString('es-CL', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'});
const image = p => p.contenido_html.match(/<img\b[^>]*src=["']([^"']+)/i)?.[1]?.replaceAll('&amp;', '&');
const route = p => p.tipo === 'post' ? `historias/${p.slug}/` : `${p.slug}/`;
const localImage = (p, root) => { const url = image(p); return url && media[url] ? root + media[url] : null; };
const links = new Map(data.map(p => [p.enlace, route(p)]));
function content(p, root) {
  let html = p.contenido_html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*')/gi,'').replace(/\s+style=("[^"]*"|'[^']*')/gi,'').replace(/\s+(srcset|sizes|width|height)=("[^"]*"|'[^']*')/gi,'').replace(/<p>\s*<\/p>/gi,'');
  html = html.replace(/\bsrc="([^"]+)"/gi, (match, url) => {const file = media[url.replaceAll('&amp;','&')]; return file ? `src="${root}${file}" loading="lazy" decoding="async"` : match;});
  html = html.replace(/\bhref="([^"]+)"/gi, (match, url) => {
    if (/^javascript:/i.test(url)) return 'href="#"';
    const target = links.get(url); return target ? `href="${root}${target}"` : match;
  });
  return html.replace(/<video\b/gi, '<video preload="none" playsinline');
}
function shell(title, body, root = './', description = 'Relatos, fotografías y pequeñas historias de Rocío Rodríguez Urrutia. De Chile a Berlín y más allá.', extra='') {
 return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escape(description)}"><meta name="theme-color" content="#ffde59"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:type" content="${extra ? 'article' : 'website'}"><title>${escape(title)}</title><link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="${root}assets/style.css?v=cv2"><link rel="stylesheet" href="${root}assets/journal.css?v=diva2"><script src="${root}assets/app.js" defer></script></head>
<body><a class="skip" href="#contenido">Saltar al contenido</a><header class="header"><a class="brand" href="${root}" aria-label="Blog de Rocío, inicio">ro<span>cí</span>o<span class="brand-dot">.</span></a><nav aria-label="Principal"><a href="${root}#historias">Historias</a><a href="${root}sobre-mi/">Acerca de mí</a><a class="nav-note" href="${root}#archivo">El archivo <span aria-hidden="true">↗</span></a></nav></header>
${body}
<footer class="footer"><a class="brand" href="${root}">rocío.</a><p>Palabras para recordar.<br>Fotografías para volver.</p><div><span>© ${new Date().getUTCFullYear()} Rocío Rodríguez Urrutia</span><a href="${root}sobre-mi/">Acerca de mí ↗</a></div></footer></body></html>`;
}
function card(p, root='./', index=0) {
 const img = localImage(p,root);
 return `<article class="story-card" data-search="${escape((p.titulo+' '+plain(p.contenido_html)).toLocaleLowerCase('es'))}" data-year="${p.fecha.slice(0,4)}"><a class="card-image ${img?'':'without-image'}" href="${root}${route(p)}">${img?`<img src="${img}" alt="${escape(p.titulo)}" loading="lazy" decoding="async">`:'<span aria-hidden="true">entre líneas.</span>'}<span class="image-arrow" aria-hidden="true">↗</span></a><div class="card-meta"><span>HISTORIA ${String(index+1).padStart(2,'0')}</span><time datetime="${p.fecha.slice(0,10)}">${date(p)}</time></div><h3><a href="${root}${route(p)}">${escape(p.titulo)}</a></h3><p>${escape(plain(p.contenido_html).slice(0,155))}${plain(p.contenido_html).length > 155?'…':''}</p><a class="read-link" href="${root}${route(p)}">Leer historia <span aria-hidden="true">↗</span></a></article>`;
}
const output = path.resolve('dist');
if (path.dirname(output) !== process.cwd() || path.basename(output) !== 'dist') throw Error('Directorio de salida inválido');
await fs.rm(output, {recursive:true, force:true});
await fs.mkdir(output, {recursive:true});
await fs.cp('assets', 'dist/assets', {recursive:true});
const hero = posts.find(p => p.slug === 'atardecer-en-la-capital-germana') || posts[0];
const heroImg = localImage(hero, './');
const years = [...new Set(posts.map(p=>p.fecha.slice(0,4)))];
const winter = posts.find(p => p.slug === 'schnee-von-gestern');
const travel = posts.find(p => p.slug === 'no-solo-es-viajar-es-sentir');
const about = pages.find(p => p.slug === 'sobre-mi');
const home = `<main id="contenido" class="journal diva">
<section class="diva-cover" aria-labelledby="diva-title"><p class="diva-kicker">EL UNIVERSO DE ROCÍO RODRÍGUEZ URRUTIA</p><h1 id="diva-title">ROCÍO<span aria-hidden="true">✦</span></h1><div class="diva-edition"><span>CHILE · BERLÍN · EL MUNDO</span><span>FOTOS, LETRAS Y UNA MIRADA PROPIA</span></div>
<div class="diva-stage"><div class="diva-intro"><span class="diva-number">PERSONAL, SIEMPRE.</span><h2>La vida,<br><em>a mi<br> manera.</em></h2><p>Escribo lo que siento.<br>Fotografío lo que me mueve.<br>Lo demás, aquí se cuenta.</p><a class="diva-button" href="#historias">ENTRAR A MI MUNDO <span aria-hidden="true">↗</span></a></div>
<figure class="diva-portrait"><a href="./sobre-mi/"><img src="${localImage(about,'./')}" alt="Autorretrato de Rocío reflejada en una obra frente a la ciudad" fetchpriority="high"></a><figcaption><span>LA QUE ESCRIBE</span><a href="./sobre-mi/">Rocío Rodríguez Urrutia ↗</a></figcaption></figure>
<aside class="diva-aside"><span class="diva-sparkle" aria-hidden="true">✧</span><p class="diva-number">POSTAL DESDE BERLÍN</p><a class="diva-postcard" href="./${route(hero)}"><img src="${heroImg}" alt="Atardecer en Berlín" loading="lazy"><span>${escape(hero.titulo)} ↗</span></a><blockquote>«Es observar<br>con el corazón.»</blockquote><a class="diva-quote-link" href="./${route(travel)}">No solo es viajar, es sentir ↗</a></aside></div>
<div class="diva-bottom"><span>UN BLOG CON VOZ PROPIA.</span><a href="#historias">Historias</a><a href="./sobre-mi/">La autora</a><a href="#archivo">El archivo</a><span aria-hidden="true">✦</span></div></section>
<section class="stories section" id="historias"><div class="section-heading"><div><p class="eyebrow">PARA LEER SIN PRISA</p><h2>Mis historias.<br><span>Con todas mis letras.</span></h2></div><span class="story-count">${posts.length} historias · desde 2022</span></div><div class="tools"><div class="year-filters" role="group" aria-label="Filtrar por año"><button type="button" class="active" data-year-filter="all" aria-pressed="true">Todas</button>${years.map(y=>`<button type="button" data-year-filter="${y}" aria-pressed="false">${y}</button>`).join('')}</div><label class="search"><span aria-hidden="true">⌕</span><span class="sr-only">Buscar historias</span><input id="search" type="search" placeholder="Encuentra una historia…" autocomplete="off"></label></div><p class="sr-only" id="search-status" role="status" aria-live="polite"></p><div class="story-grid">${posts.map((p,i)=>card(p,'./',i)).join('')}</div><p id="empty" hidden>No encontré historias con esa búsqueda. Prueba con otra palabra.</p><button class="load-more" id="load-more" hidden type="button">Quiero leer más <span aria-hidden="true">↓</span></button></section>
<section class="journal-interlude"><p class="eyebrow">UNA LÍNEA PARA LLEVARSE</p><blockquote>«Y, por supuesto, no importa si me muevo <mark>10 km o 13.000 km.</mark> Las reglas son las mismas.»</blockquote><a href="./${route(travel)}">No solo es viajar, es sentir ↗</a></section>
<section class="about-band"><p class="eyebrow">LA AUTORA</p><h2>La mirada.<br>La voz.<br><em>Rocío.</em></h2><div><p>«Aunque a veces escribo menos, nunca he dejado de hacerlo; la escritura es un fuego que me acompaña, y que no pienso abandonar.»</p><a class="read-link" href="./sobre-mi/">Conocer a Rocío <span aria-hidden="true">↗</span></a></div></section>
<section class="archive section" id="archivo"><p class="eyebrow">TODO LO QUE HE CONTADO</p><h2>Toda una historia.</h2>${years.map(y=>`<details><summary><span>${y}</span><span>${posts.filter(p=>p.fecha.startsWith(y)).length} ${posts.filter(p=>p.fecha.startsWith(y)).length===1?'historia':'historias'} <span aria-hidden="true">+</span></span></summary><ul>${posts.filter(p=>p.fecha.startsWith(y)).map(p=>`<li><a href="./${route(p)}">${escape(p.titulo)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul></details>`).join('')}</section></main>`;
await fs.writeFile('dist/index.html',shell('Blog de Rocío · Entre líneas, fotos y lugares',home));
for (const p of data) {
 const root = p.tipo === 'post' ? '../../' : '../';
 const idx = posts.indexOf(p);
 const related = p.tipo === 'post' ? `<section class="related section"><p class="eyebrow">SEGUIR LEYENDO</p><div class="story-grid">${[posts[(idx+1)%posts.length],posts[(idx+2)%posts.length]].map(q=>card(q,root)).join('')}</div></section>` : '';
 const articleBody = p.slug === 'was-ich-schreibe' ? `<p>Todas las historias del blog, de la más reciente a la primera.</p><ul>${posts.map(q=>`<li><a href="${root}${route(q)}">${escape(q.titulo)}</a></li>`).join('')}</ul>` : content(p,root);
 const body = `<main id="contenido"><div class="article-top"><a class="back-link" href="${root}#historias">← Volver a las historias</a><p class="eyebrow">${p.tipo === 'post' ? 'EL CUADERNO DE ROCÍO' : 'DETRÁS DE LAS PALABRAS'}</p><h1>${escape(p.titulo)}</h1>${p.tipo==='post'?`<p class="article-meta"><time datetime="${p.fecha.slice(0,10)}">${date(p)}</time> <span>·</span> Rocío Rodríguez Urrutia <span>·</span> ${Math.max(1,Math.ceil(plain(p.contenido_html).split(/\s+/).length/200))} min de lectura</p>`:''}</div><article class="article-body">${articleBody}</article><div class="article-end"><span aria-hidden="true">✳</span><p>Gracias por leer hasta aquí.</p><a href="${root}#historias">Volver al cuaderno ↗</a></div>${related}</main>`;
 await fs.mkdir(`dist/${route(p)}`, {recursive:true});
 await fs.writeFile(`dist/${route(p)}index.html`,shell(`${p.titulo} · Blog de Rocío`,body,root,plain(p.contenido_html).slice(0,160) || p.titulo, p.tipo==='post'?'article':''));
}
await fs.writeFile('dist/404.html', shell('Página no encontrada · Blog de Rocío', '<main id="contenido" class="article-top"><p class="eyebrow">404 · NOS PERDIMOS UN POQUITO</p><h1>Esta página no está aquí.</h1><p>Puedes volver al blog para encontrar otra historia.</p><a class="button" href="/blog-de-rocio/">Volver al inicio ↗</a></main>', '/blog-de-rocio/'));
await fs.writeFile('dist/.nojekyll','');
console.log(`Web generada: ${posts.length} entradas, ${pages.length} páginas y ${Object.keys(media).length} imágenes locales.`);






