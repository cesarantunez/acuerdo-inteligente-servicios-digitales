# Acuerdo Inteligente de Servicios Digitales

PWA para generar contratos digitales profesionales con firma electrónica y exportación a PDF.

## Características

- Wizard de 5 pasos: Cliente · Proyecto · Pagos · Contrato · Firma
- 15 cláusulas legales profesionales generadas automáticamente
- Firma digital con dedo (móvil) o mouse (desktop)
- Exportación a PDF multipágina
- Guardado de borrador en `localStorage`
- Modo claro/oscuro
- Totalmente responsive
- Instalable como PWA con soporte offline
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

- HTML5 + CSS3 + JavaScript vanilla
- [signature_pad](https://github.com/szimek/signature_pad) para las firmas
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://github.com/niklasvh/html2canvas) para el PDF
- Service Worker para funcionamiento offline
