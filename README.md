# Blog de Rocío

Blog personal de Rocío Rodríguez Urrutia. Relatos, fotografías y viajes, de Chile a Berlín y más allá.

Sitio: https://chiolinski.github.io/blog-de-rocio/

## Trabajar en el blog

Se necesita Node.js 22. No hay dependencias externas.

```sh
npm run build
npm run check
npm run preview
```

La vista previa abre en http://127.0.0.1:4173. Los cambios subidos a `main` se verifican y publican automáticamente mediante GitHub Actions.

- `contenido/publicaciones.json`: las 35 entradas y 2 páginas publicadas, con sus textos originales.
- `contenido/media.json`: relación entre las imágenes originales y sus copias locales.
- `assets/images/`: 101 imágenes del contenido publicado.
- `assets/style.css` y `assets/app.js`: diseño adaptable, búsqueda y filtros por año.
- `scripts/build.mjs`: genera la portada y una página por publicación en `dist/`.
- `respaldo/`: XML original, excluido de Git por contener borradores y datos internos.

Para agregar una entrada, se añade un objeto a `contenido/publicaciones.json` con `titulo`, `tipo: "post"`, `slug` único, `fecha` en formato `AAAA-MM-DD HH:mm:ss`, `enlace` y `contenido_html`. Para importar imágenes nuevas desde WordPress, ejecutar `npm run media`. Después se genera y comprueba la web antes de subir los cambios.

Las fotografías incluidas son copias locales. Los videos siguen usando sus direcciones originales de WordPress. No se trasladan formularios, comentarios interactivos ni funciones de administración de WordPress: este es un blog estático.

Los textos y las imágenes conservan los derechos de sus respectivos titulares.
