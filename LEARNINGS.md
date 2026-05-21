# Bitácora de fallos y aprendizajes

Notas de errores reales que cometí en este proyecto y cómo evitarlos en otros.
Pensado como recordatorio antes de tocar HTML→PDF, PWA, o flujos de
descarga en otros sitios.

---

## 1. html2pdf.js + holder off-screen → PDF en blanco

**Síntoma:** PDF descargado de ~800 bytes, completamente blanco.

**Root cause:** `html2pdf.toContainer()` clona el holder dentro de un
overlay full-screen propio. Si el holder fuente está posicionado con
`position: absolute` o `position: fixed`, el clon colapsa a `height: 0`
y `html2canvas` devuelve un canvas vacío. El truco clásico de
"esconder con `left: -9999px`" rompe la herramienta.

**Fix correcto:** holder en `position: static` (flujo normal). Para que
no afecte visualmente el layout, va dentro de un wrapper invisible
(`overflow:hidden; opacity:0; pointer-events:none; height:0`). El
wrapper sí puede ser absolute — sólo el holder objetivo debe ser static.

---

## 2. html2pdf.js + holder más ancho que `pageSize.inner.width` → texto cortado a la izquierda

**Síntoma:** PDF renderiza pero el primer ~10–15% de cada línea está cortado.

**Root cause:** El container interno que crea `toContainer` tiene
`width = pageSize.inner.width` (= ancho de página − márgenes L+R) en
la unidad del jsPDF. Para Legal portrait con margins `[16,14,16,14]mm`
son ~533pt ≈ 712px. Si el holder tiene `width: 794px` u otro valor
mayor, desborda del container y el overlay (`overflow:hidden`) lo clipa.

**Fix correcto:** dar al holder un `width` explícito igual (o ligeramente
menor) que `pageSize.inner.width` convertido a px. Para `unit: mm`, una
conversión exacta es: `inner.width.mm * 96/25.4`.

---

## 3. html2pdf.js + holder SIN width explícito dentro de wrapper estrecho → página 1 vacía + cláusulas truncadas

**Síntoma:** PDF tiene N páginas pero la primera queda casi en blanco
(huge top margin) y faltan cláusulas al final. Pasa con texto corto;
con texto largo "se compensa" y parece OK.

**Root cause (el peor de los tres porque parece OK en algunos tests):**
si el holder NO tiene `width` explícito y vive dentro de un wrapper
estrecho con `overflow:hidden` (ej. wrapper de 1×1), el holder hereda
ese ancho. El texto se rompe palabra por palabra y `scrollHeight`
explota (en mi caso 17.160 px). html2pdf usa ese clon como base para
calcular paginación y el resultado es paginación incoherente — bloques
con `pagebreak: avoid-all` (como `.parties` con `display:table`) se
empujan a la siguiente página dejando la anterior vacía, y las últimas
cláusulas se truncan.

**Fix correcto:** width SIEMPRE explícito en el holder (ver fallo #2).
El wrapper debe ser >= width del holder (no clipa).

**Por qué no lo cacé antes:** mi E2E test rellenaba el form con texto
largo, que enmascaraba el bug. Probar con form vacío/mínimo es lo que
hace el usuario en su primer intento.

**Regla general:** cuando un layout dependa del ancho del contenedor,
SIEMPRE probar el caso "input mínimo / texto corto" además del feliz.

---

## 4. Service Worker que cachea cross-origin → caída silenciosa cuando el CDN falla

**Síntoma:** En entorno con cert authority no reconocido (o CDN caído),
los scripts externos no cargan y la app no avisa.

**Root cause:** el SW interceptaba `fetch` de cualquier origen y, al
fallar la red, devolvía `cached` que podía ser `undefined`.

**Fix correcto:** filtrar por `url.origin === self.location.origin` y
dejar que el browser maneje los CDN sin SW. Mejor aún: vendorizar las
deps al repo (mejor offline-first y reproducibilidad). Lo hice en
`lib/vendor/`.

---

## 5. Service Worker con `skipWaiting` + `clients.claim` no recarga clientes activos

**Síntoma:** Después de bumpear `CACHE`, los usuarios con la pestaña
abierta seguían viendo la versión vieja hasta que cerraban y reabrían.

**Fix correcto:** suscribirse a `registration.updatefound` y disparar
un toast cuando hay un SW en estado `installed` con un controller
existente. El usuario decide cuándo recargar.

---

## 6. Verificación visual del PDF en headless: usar `pdftoppm`

`pdftotext` no devuelve nada cuando el PDF es una imagen rasterizada
(que es lo que produce html2pdf vía html2canvas). Para verificar
visualmente en CI o tests, usar `pdftoppm -png -r 60 file.pdf prefix`
y compararlo o entregarlo al usuario como artefacto.

---

## 7. Plantilla de checklist antes de declarar "PDF arreglado"

- [ ] Holder con `position: static` (no absolute/fixed).
- [ ] Holder con `width` explícito ≤ `pageSize.inner.width` en px.
- [ ] Wrapper invisible pero NO clipa horizontalmente al holder.
- [ ] `<style>` inline DENTRO del holder (html2pdf no hereda `<head>`).
- [ ] `document.fonts.ready` + 2× `requestAnimationFrame` antes de
      rasterizar.
- [ ] Esperar `img.complete && img.naturalWidth > 0` para firmas dataURL.
- [ ] Sanity check: `holder.offsetWidth >= 100 && holder.scrollHeight >= 50`.
- [ ] Botón con `__pdfBusy` + spinner para evitar doble click.
- [ ] **Probar con form mínimo Y form lleno.** Renderizar página 1, 2, 3
      con `pdftoppm` y verificar visualmente.
- [ ] Service Worker bumpea de versión cuando cambia el bundle.
