# Acuerdo Inteligente de Servicios Digitales

PWA para generar contratos digitales profesionales **en español o inglés** (formato US Legal 8.5"×14") con firma electrónica.

## Características

- Wizard de 5 pasos: Cliente · Proyecto · Pagos · Contrato · Firma
- **18 cláusulas legales** profesionales (incluyendo Limitación de Responsabilidad, Exclusión de Garantías Implícitas, Fuerza Mayor)
- **Toggle de UI ES/EN** en el header — cambia el wizard y el preview del contrato
- **Dos botones de descarga independientes** en el último paso: PDF en español o PDF en inglés (el operador elige cuál entregar al cliente)
- Firma digital con dedo (móvil) o mouse (desktop)
- **PDF en formato US Legal portrait** (8.5"×14") con paginación inteligente — las cláusulas no se cortan entre páginas
- Guardado de borrador en `localStorage`
- Modo claro/oscuro
- Totalmente responsive
- Instalable como PWA con soporte offline (incluye traducciones cacheadas)
- Soporte para 7 monedas (USD, MXN, EUR, COP, ARS, CLP, PEN)

## Uso local

Sirve los archivos desde un servidor HTTP:

```bash
python -m http.server 8000
# o
npx serve .
```

Luego abre http://localhost:8000

## Despliegue

Desplegado en Vercel como sitio estático — no requiere build step.

## Stack

- HTML5 + CSS3 + JavaScript vanilla (sin bundler, sin npm install)
- [signature_pad](https://github.com/szimek/signature_pad) para las firmas
- [html2pdf.js](https://github.com/ekoopmans/html2pdf.js) — bundle único que combina html2canvas + jsPDF + paginación CSS-aware (resuelve corte de cláusulas entre páginas)
- Service Worker para funcionamiento offline
- Sistema de i18n propio (`lib/i18n.js`) sin dependencias

## Estructura del proyecto

```
.
├── index.html              # Wizard + UI con atributos data-i18n
├── app.js                  # Wizard, render single-lang, downloadPDF(locale)
├── styles.css              # Estilos (incluye .clause-block + page-break-inside avoid)
├── sw.js                   # Service worker (cachea i18n y cláusulas)
├── manifest.json
├── icon.svg
└── lib/
    ├── i18n.js             # Sistema vanilla i18n (carga JSON, API t())
    ├── messages/
    │   ├── es.json         # Strings UI en español
    │   └── en.json         # Strings UI en inglés
    └── legal/
        ├── glossary.js     # LEGAL_GLOSSARY (74 términos ES↔EN, referencia)
        ├── clauses-es.js   # 18 cláusulas en español (render functions)
        └── clauses-en.js   # 18 cláusulas en inglés (numeración paralela)
```

## Cómo funciona el sistema de idiomas

### Toggle de UI (header)

Botón con badge `EN`/`ES`. Cambia toda la interfaz (titles, labels, placeholders, botones, mensajes de toast) y el preview del contrato en step 4. Persiste en `localStorage` (`ai.locale`).

### Selector de idioma del PDF (step 5)

En el último paso aparecen **dos botones de descarga**:
- **"Descargar PDF (Español)"** → genera el contrato completo en español
- **"Download PDF (English)"** → genera el contrato completo en inglés

El operador puede generar uno o ambos. Cada PDF es **monolingüe**, en formato US Legal portrait (8.5"×14"). Estos botones son **independientes del toggle UI**: el toggle decide qué ves, los botones deciden qué descargas.

## PDF — detalles técnicos

- **Formato:** US Legal portrait (612 × 1008 pt = 8.5" × 14")
- **Márgenes:** 25mm top/bottom, 20mm laterales
- **Tipografía cuerpo:** Times New Roman (apariencia legal estándar)
- **Paginación:** `pagebreak: { avoid: ['.clause-block', '.signature-block', ...] }` — html2pdf respeta los breaks CSS y no corta cláusulas
- **Compresión:** JPEG quality 0.95 + jsPDF compress — ~300 KB para un contrato de 3 páginas
- **Nombre del archivo:** `Contract_<projectname>_{ES|EN}.pdf`

## Cómo agregar una cláusula nueva

1. Abre `lib/legal/clauses-es.js` y agrega un objeto al array `CLAUSES_ES` con `{ id, number, title, isHighlighted?, render(d) }`.
2. Abre `lib/legal/clauses-en.js` y agrega el equivalente en inglés con **el mismo `id` y `number`** en la **misma posición del array**.
3. Si la cláusula es crítica (limita responsabilidad, excluye garantías, etc.), marca `isHighlighted: true` para que se renderice con caja amarilla.
4. Si introduce términos legales nuevos, agrégalos a `lib/legal/glossary.js` para mantener consistencia futura.

## Cómo agregar/cambiar una traducción de UI

1. Edita `lib/messages/es.json` o `lib/messages/en.json`.
2. Si agregas una clave nueva, refleja la misma estructura en ambos archivos.
3. En el HTML, usa el atributo correspondiente:
   - `data-i18n="key.path"` → reemplaza `textContent`
   - `data-i18n-ph="key.path"` → reemplaza `placeholder`
   - `data-i18n-aria="key.path"` → reemplaza `aria-label`
   - `data-i18n-empty="key.path"` (en `<select>`) → reemplaza el primer `<option value="">`

El sistema soporta interpolación simple (`{var}`) y plurales ICU básicos (`{n, plural, one {# x} other {# y}}`).

## Aviso legal

Las cláusulas han sido preparadas con el mejor esfuerzo para reflejar derechos y obligaciones estándar. Para contratos superiores a $15,000 USD o industrias reguladas (salud, fintech, gobierno), se recomienda firmemente la **revisión legal en la jurisdicción aplicable** antes de firmar.

Las traducciones legales del sistema usan equivalentes oficiales (no traducciones literales), documentadas en `lib/legal/glossary.js`. Para validación adicional antes de release público, se recomienda una revisión única por abogado bilingüe ($200–500 una sola vez).
