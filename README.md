# Acuerdo Inteligente de Servicios Digitales

PWA para generar contratos digitales **bilingües (ES/EN)** profesionales con firma electrónica y exportación a PDF.

## Características

- Wizard de 5 pasos: Cliente · Proyecto · Pagos · Contrato · Firma
- **19 cláusulas legales bilingües** (español + inglés side-by-side), incluyendo Limitación de Responsabilidad, Exclusión de Garantías Implícitas, Fuerza Mayor, Idioma Prevaleciente
- **Toggle de UI ES/EN** en el header
- **Selector de idioma prevaleciente** (decisión legal en step 5)
- Firma digital con dedo (móvil) o mouse (desktop)
- **Exportación a PDF en A4 landscape** con layout bilingual side-by-side
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

- HTML5 + CSS3 + JavaScript vanilla (sin bundler)
- [signature_pad](https://github.com/szimek/signature_pad) para las firmas
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://github.com/niklasvh/html2canvas) para el PDF
- Service Worker para funcionamiento offline
- Sistema de i18n propio (`lib/i18n.js`) sin dependencias

## Estructura del proyecto

```
.
├── index.html              # Wizard + UI con atributos data-i18n
├── app.js                  # Lógica del wizard, render bilingual, PDF
├── styles.css              # Estilos (incluye layout bilingual + selector)
├── sw.js                   # Service worker (cachea i18n y cláusulas)
├── manifest.json
├── icon.svg
└── lib/
    ├── i18n.js             # Sistema vanilla i18n (carga JSON, API t())
    ├── messages/
    │   ├── es.json         # Strings UI en español
    │   └── en.json         # Strings UI en inglés
    └── legal/
        ├── glossary.js     # LEGAL_GLOSSARY (60+ términos ES↔EN, referencia)
        ├── clauses-es.js   # 19 cláusulas en español (render functions)
        └── clauses-en.js   # 19 cláusulas en inglés (numeración paralela)
```

## Sistema bilingüe

### Toggle de idioma de la UI

Botón con badge `EN`/`ES` en la esquina superior derecha del header. Cambia toda la interfaz (labels, placeholders, opciones, botones, mensajes de toast) y persiste la elección en `localStorage` (`ai.locale`).

### Idioma prevaleciente (decisión legal)

En el step 5, antes de firmar, el operador elige cuál idioma prevalecerá en caso de discrepancia legal. Esa elección queda guardada en el draft (`metadata.prevailingLanguage`) y se inyecta literalmente en la cláusula 18 del contrato.

**Importante:** el idioma prevaleciente NO es lo mismo que el toggle visual. El toggle cambia cómo el operador ve la app; el idioma prevaleciente es un compromiso legal del firmante.

### PDF bilingual

El PDF se genera en formato **A4 landscape (297 × 210 mm)** con dos columnas paralelas: español a la izquierda, inglés a la derecha. La sincronización de cláusulas se logra con CSS Grid (`align-items: stretch`) — la columna más larga marca la altura de la fila, así que no es necesario calcular alturas manualmente.

### Cómo agregar una cláusula nueva

1. Abre `lib/legal/clauses-es.js` y agrega un nuevo objeto al array `CLAUSES_ES` con `{ id, number, title, isHighlighted?, render(d) }`.
2. Abre `lib/legal/clauses-en.js` y agrega el equivalente en inglés con **el mismo `id` y `number`** en la **misma posición del array**. Si la posición o el número no coinciden, las columnas se desincronizan.
3. Si la cláusula introduce términos legales nuevos, agrégalos a `lib/legal/glossary.js` para mantener consistencia futura.
4. Si la cláusula es crítica (limita responsabilidad, excluye garantías, etc.), marca `isHighlighted: true` para que se renderice con caja amarilla.

### Cómo agregar/cambiar una traducción de UI

1. Edita `lib/messages/es.json` o `lib/messages/en.json`.
2. Si agregas una clave nueva, refleja la misma estructura en ambos archivos.
3. En el HTML, usa el atributo correspondiente:
   - `data-i18n="key.path"` → reemplaza `textContent`
   - `data-i18n-ph="key.path"` → reemplaza `placeholder`
   - `data-i18n-aria="key.path"` → reemplaza `aria-label`
   - `data-i18n-title="key.path"` → reemplaza `title`
   - `data-i18n-empty="key.path"` (en `<select>`) → reemplaza el primer `<option value="">`

El sistema soporta interpolación simple (`{var}`) y plurales ICU básicos (`{n, plural, one {# x} other {# y}}`).

## Aviso legal

Este contrato bilingüe ha sido preparado con el mejor esfuerzo para reflejar los mismos derechos y obligaciones en ambos idiomas. Para contratos superiores a $15,000 USD o industrias reguladas (salud, fintech, gobierno), se recomienda firmemente la **revisión legal en la jurisdicción aplicable** antes de firmar.

Las traducciones legales del sistema usan equivalentes oficiales (no traducciones literales). Para validación adicional antes de release público, se recomienda una revisión única por abogado bilingüe ($200–500 una sola vez).
