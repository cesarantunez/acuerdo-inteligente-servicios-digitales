/* =========================================================
   Acuerdo Inteligente de Servicios Digitales
   PWA — wizard + contrato monolingüe (ES o EN) + firma + PDF Legal
========================================================= */

const TOTAL_STEPS = 5;
let currentStep = 1;
let sigClientPad, sigProviderPad;

const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

/* -------- Helpers compartidos (expuestos para clauses-*.js) -------- */
function esc(s) {
  return (s == null ? "" : String(s)).replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
}
function formatMoney(n, cur = "USD", localeHint) {
  const loc = localeHint === "en" ? "en-US" : (localeHint === "es" ? "es-MX" : (window.I18N && window.I18N.locale === "en" ? "en-US" : "es-MX"));
  try { return new Intl.NumberFormat(loc, { style: "currency", currency: cur }).format(+n || 0); }
  catch { return `${cur} ${(+n || 0).toFixed(2)}`; }
}
function formatDate(d, localeHint) {
  if (!d) return "___________";
  const loc = localeHint === "en" ? "en-US" : (localeHint === "es" ? "es-ES" : (window.I18N && window.I18N.locale === "en" ? "en-US" : "es-ES"));
  try {
    return new Date(d + "T00:00:00").toLocaleDateString(loc, { year: "numeric", month: "long", day: "numeric" });
  } catch { return d; }
}
function listify(text) {
  const items = (text || "").split("\n").map((t) => t.trim()).filter(Boolean);
  if (!items.length) return `<li><em>${(window.I18N && window.I18N.locale === "en") ? "Not defined" : "Sin definir"}</em></li>`;
  return items.map((i) => `<li>${esc(i)}</li>`).join("");
}
window.AI = { esc, formatMoney, formatDate, listify };

/* -------- State & persistence -------- */
const STORAGE_KEY = "acuerdoInteligente.draft.v3";

function collectData() {
  return {
    client: {
      name: $("#clientName").value.trim(),
      company: $("#clientCompany").value.trim(),
      email: $("#clientEmail").value.trim(),
      phone: $("#clientPhone").value.trim(),
      address: $("#clientAddress").value.trim(),
      id: $("#clientId").value.trim(),
    },
    provider: {
      name: $("#providerName").value.trim(),
      email: $("#providerEmail").value.trim(),
      phone: $("#providerPhone").value.trim(),
      id: $("#providerId").value.trim(),
    },
    project: {
      type: $("#projectType").value,
      name: $("#projectName").value.trim(),
      description: $("#projectDescription").value.trim(),
      features: $("#projectFeatures").value.trim(),
      phases: $("#projectPhases").value.trim(),
      startDate: $("#startDate").value,
      endDate: $("#endDate").value,
    },
    extras: {
      support: $("#extraSupport").checked,
      supportDays: $("#supportDays").value,
      revisions: $("#revisions").value,
      hosting: $("#extraHosting").checked,
    },
    payment: {
      currency: $("#currency").value,
      total: parseFloat($("#totalPrice").value || 0),
      initialPercent: parseFloat($("#initialPercent").value || 50),
      method: $("#paymentMethod").value,
      details: $("#paymentDetails").value.trim(),
    },
    signatures: {
      clientName: $("#sigClientName").value.trim(),
      providerName: $("#sigProviderName").value.trim(),
    },
  };
}

function applyData(d) {
  if (!d) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
  const check = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
  if (d.client) { set("clientName", d.client.name); set("clientCompany", d.client.company); set("clientEmail", d.client.email); set("clientPhone", d.client.phone); set("clientAddress", d.client.address); set("clientId", d.client.id); }
  if (d.provider) { set("providerName", d.provider.name); set("providerEmail", d.provider.email); set("providerPhone", d.provider.phone); set("providerId", d.provider.id); }
  if (d.project) { set("projectType", d.project.type); set("projectName", d.project.name); set("projectDescription", d.project.description); set("projectFeatures", d.project.features); set("projectPhases", d.project.phases); set("startDate", d.project.startDate); set("endDate", d.project.endDate); }
  if (d.extras) { check("extraSupport", d.extras.support); set("supportDays", d.extras.supportDays); set("revisions", d.extras.revisions); check("extraHosting", d.extras.hosting); }
  if (d.payment) { set("currency", d.payment.currency || "USD"); set("totalPrice", d.payment.total || ""); set("initialPercent", d.payment.initialPercent ?? 50); set("paymentMethod", d.payment.method); set("paymentDetails", d.payment.details); }
  if (d.signatures) { set("sigClientName", d.signatures.clientName); set("sigProviderName", d.signatures.providerName); }
  recalcPayment();
}

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
    toast(I18N.t("toast.draftSaved"), "success");
  } catch (e) { toast(I18N.t("toast.draftFailed"), "error"); }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) applyData(JSON.parse(raw));
  } catch (e) {}
}

/* -------- Toast -------- */
let toastTimer;
function toast(msg, type = "") {
  const t = $("#toast");
  t.textContent = msg;
  t.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
}

/* -------- Wizard navigation -------- */
function goToStep(n) {
  n = Math.max(1, Math.min(TOTAL_STEPS, n));
  currentStep = n;
  $$(".panel").forEach((p) => p.classList.toggle("active", +p.dataset.panel === n));
  $$(".step").forEach((s) => {
    const sn = +s.dataset.step;
    s.classList.toggle("active", sn === n);
    s.classList.toggle("done", sn < n);
  });
  $("#btnPrev").disabled = n === 1;
  $("#btnNext").disabled = n === TOTAL_STEPS;
  $("#btnNext").textContent = n === TOTAL_STEPS ? I18N.t("buttons.finish") : I18N.t("buttons.next");
  $("#progressBar").style.width = (n / TOTAL_STEPS * 100) + "%";

  if (n === 4) renderContractPreview();
  if (n === 5) setTimeout(resizeCanvases, 50);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep(n) {
  if (n === 1) {
    const required = ["clientName", "clientEmail", "providerName", "providerEmail"];
    for (const id of required) {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.focus(); toast(I18N.t("toast.fillRequired"), "error"); return false; }
    }
    for (const id of ["clientEmail", "providerEmail"]) {
      const el = document.getElementById(id);
      if (!EMAIL_RE.test(el.value.trim())) { el.focus(); toast(I18N.t("toast.invalidEmail"), "error"); return false; }
    }
  }
  if (n === 2) {
    if (!$("#projectType").value) { $("#projectType").focus(); toast(I18N.t("toast.selectProject"), "error"); return false; }
    if (!$("#projectDescription").value.trim()) { $("#projectDescription").focus(); toast(I18N.t("toast.describeProject"), "error"); return false; }
    if (!$("#projectFeatures").value.trim()) { $("#projectFeatures").focus(); toast(I18N.t("toast.addFeature"), "error"); return false; }
  }
  if (n === 3) {
    const price = parseFloat($("#totalPrice").value);
    if (!$("#totalPrice").value) { $("#totalPrice").focus(); toast(I18N.t("toast.enterPrice"), "error"); return false; }
    if (!(price > 0)) { $("#totalPrice").focus(); toast(I18N.t("toast.invalidPrice"), "error"); return false; }
    if (!$("#paymentMethod").value) { $("#paymentMethod").focus(); toast(I18N.t("toast.selectPayment"), "error"); return false; }
  }
  return true;
}

/* -------- Payment calc -------- */
function recalcPayment() {
  const totalRaw = parseFloat($("#totalPrice").value);
  const pctRaw = parseFloat($("#initialPercent").value);
  const total = isFinite(totalRaw) ? totalRaw : 0;
  const pct = isFinite(pctRaw) ? Math.min(100, Math.max(0, pctRaw)) : 0;
  const cur = $("#currency").value || "USD";
  const initial = total * (pct / 100);
  const remaining = total - initial;
  $("#initialAmount").value = formatMoney(initial, cur);
  $("#remainingAmount").value = formatMoney(remaining, cur);
}

/* -------- Contract rendering (monolingüe) --------
   Genera HTML del contrato en un solo idioma. Cada cláusula es .clause-block
   con page-break-inside: avoid para que html2pdf no parta cláusulas.

   IMPORTANTE: el HTML incluye un <style> inline con HEX absolutos. NO usar
   var(--*) porque html2canvas clona el elemento en un iframe interno donde
   las CSS variables del documento padre no se heredan, y el texto sale
   invisible.
*/
function renderContractStyles() {
  // Estilos autocontenidos para el PDF — todos los colores HEX absolutos.
  return `
    .pdf-contract {
      color: #0f172a;
      background: #ffffff;
      font-family: "Times New Roman", Times, "Liberation Serif", serif;
      font-size: 11.5pt;
      line-height: 1.5;
      padding: 0;
    }
    .pdf-contract * { box-sizing: border-box; }
    .pdf-contract .doc-header {
      text-align: center;
      padding-bottom: 14pt;
      margin-bottom: 16pt;
      border-bottom: 1.5px solid #94a3b8;
    }
    .pdf-contract .doc-header h1 {
      margin: 0 0 6pt;
      font-size: 18pt;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
      text-transform: uppercase;
    }
    .pdf-contract .doc-header .doc-sub {
      margin: 0;
      font-size: 10pt;
      color: #475569;
      font-style: italic;
    }
    .pdf-contract .contract-body {
      display: block;
    }
    .pdf-contract .clause-block {
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 0 0 12pt;
      padding: 0;
      color: #0f172a;
    }
    .pdf-contract .clause-block h2 {
      margin: 0 0 6pt;
      font-size: 12pt;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      font-family: "Times New Roman", Times, serif;
    }
    .pdf-contract .clause-block h3 {
      margin: 0 0 4pt;
      font-size: 10pt;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pdf-contract .clause-block p {
      margin: 0 0 6pt;
      font-size: 11pt;
      line-height: 1.55;
      color: #1e293b;
      text-align: justify;
    }
    .pdf-contract .clause-block ul {
      margin: 4pt 0 8pt 18pt;
      padding: 0;
    }
    .pdf-contract .clause-block li {
      margin: 0 0 3pt;
      font-size: 11pt;
      line-height: 1.5;
      color: #1e293b;
    }
    .pdf-contract .clause-block strong {
      color: #0f172a;
      font-weight: 700;
    }
    .pdf-contract .clause-block em {
      font-style: italic;
      color: #475569;
    }
    .pdf-contract .clause-block .parties {
      display: table;
      width: 100%;
      margin: 6pt 0 8pt;
      border-collapse: separate;
      border-spacing: 8pt 0;
    }
    .pdf-contract .clause-block .party {
      display: table-cell;
      width: 50%;
      padding: 8pt 10pt;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    .pdf-contract .clause-block .party h3 {
      margin: 0 0 4pt;
      font-size: 9pt;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-weight: 700;
    }
    .pdf-contract .clause-block .party p {
      margin: 1pt 0;
      font-size: 10.5pt;
      color: #1e293b;
      text-align: left;
    }
    .pdf-contract .clause-block .highlight {
      margin: 6pt 0;
      padding: 8pt 12pt;
      background: #f1f5f9;
      border-left: 3px solid #475569;
    }
    .pdf-contract .clause-block .highlight p {
      margin: 2pt 0;
    }
    .pdf-contract .clause-highlighted {
      margin: 10pt 0;
      padding: 10pt 12pt;
      background: #fef9c3;
      border: 1.5px solid #ca8a04;
    }
    .pdf-contract .clause-highlighted h2 {
      color: #713f12;
    }
    .pdf-contract .clause-highlighted p {
      font-weight: 600;
      font-size: 10.5pt;
      color: #422006;
    }
    .pdf-contract .clause-disclaimer {
      margin-top: 14pt;
      padding: 8pt 12pt;
      background: #f8fafc;
      border-left: 3px solid #94a3b8;
    }
    .pdf-contract .clause-disclaimer h3 {
      margin: 0 0 4pt;
      font-size: 9pt;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .pdf-contract .clause-disclaimer p {
      margin: 0;
      font-size: 9.5pt;
      color: #475569;
      line-height: 1.5;
      font-style: italic;
    }
    .pdf-contract .signature-block {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: 24pt;
      padding-top: 16pt;
      border-top: 1.5px solid #94a3b8;
    }
    .pdf-contract .signature-block .sign-row {
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 24pt 0;
    }
    .pdf-contract .signature-block .sign-box {
      display: table-cell;
      width: 50%;
      text-align: center;
      vertical-align: bottom;
    }
    .pdf-contract .signature-block .sign-box img {
      display: block;
      max-width: 100%;
      max-height: 70pt;
      margin: 0 auto 4pt;
    }
    .pdf-contract .signature-block .sign-line {
      border-top: 1px solid #475569;
      margin: 40pt 12pt 4pt;
    }
    .pdf-contract .signature-block .sig-name {
      margin: 2pt 0 0;
      font-size: 11pt;
      color: #0f172a;
      font-weight: 700;
    }
    .pdf-contract .signature-block .sig-role {
      margin: 1pt 0 0;
      font-size: 9.5pt;
      color: #475569;
      font-style: italic;
    }
  `;
}

function renderContractHtml(locale, d, options = {}) {
  const clauses = locale === "en" ? (window.CLAUSES_EN || []) : (window.CLAUSES_ES || []);
  const dateLocale = locale === "en" ? "en-US" : "es-ES";
  const today = new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });

  const labels = locale === "en"
    ? {
        title: "Digital Services Agreement",
        sub: `Document generated on ${today}`,
        disclaimerH: "Legal Notice",
        disclaimer: "This contract has been prepared with best efforts to reflect industry-standard rights and obligations. For contracts exceeding $15,000 USD or regulated industries (healthcare, fintech, government), legal review in the applicable jurisdiction is strongly recommended before signing.",
        clientLine: "Client",
        providerLine: "Provider",
        sigClient: "Client Signature",
        sigProvider: "Provider Signature",
      }
    : {
        title: "Contrato de Prestación de Servicios Digitales",
        sub: `Documento generado el ${today}`,
        disclaimerH: "Aviso legal",
        disclaimer: "Este contrato ha sido preparado con el mejor esfuerzo para reflejar derechos y obligaciones estándar de la industria. Para contratos superiores a $15,000 USD o industrias reguladas (salud, fintech, gobierno), se recomienda firmemente la revisión legal en la jurisdicción aplicable antes de firmar.",
        clientLine: "Cliente",
        providerLine: "Proveedor",
        sigClient: "Firma del Cliente",
        sigProvider: "Firma del Proveedor",
      };

  // Inyectar override de helpers para que las cláusulas formateen fechas/montos
  // en el locale del PDF, no en el del toggle UI
  const prevAI = window.AI;
  const localizedAI = {
    ...prevAI,
    formatDate: (date) => formatDate(date, locale),
    formatMoney: (n, cur) => formatMoney(n, cur, locale),
    listify: (text) => {
      const items = (text || "").split("\n").map((t) => t.trim()).filter(Boolean);
      if (!items.length) return `<li><em>${locale === "en" ? "Not defined" : "Sin definir"}</em></li>`;
      return items.map((i) => `<li>${esc(i)}</li>`).join("");
    },
  };
  window.AI = localizedAI;

  // CRITICAL: <style> block INLINE dentro del wrapper. html2pdf clona el holder
  // en un iframe interno donde los estilos del <head> del documento padre NO se
  // transfieren — solo los <style> que están adentro del clone.
  let html = `
    <style>${renderContractStyles()}</style>
    <div class="pdf-contract" lang="${locale}">
      <header class="doc-header">
        <h1>${esc(labels.title)}</h1>
        <p class="doc-sub">${esc(labels.sub)}</p>
      </header>
      <div class="contract-body">
  `;

  for (const cl of clauses) {
    const cls = cl.isHighlighted ? "clause-block clause-highlighted" : "clause-block";
    let body = "";
    try { body = cl.render(d) || ""; } catch (err) { body = ""; }
    html += `
      <section class="${cls}">
        <h2>${esc(cl.number)}. ${esc(cl.title)}</h2>
        ${body}
      </section>`;
  }

  // Disclaimer
  html += `
      <section class="clause-block clause-disclaimer">
        <h3>${esc(labels.disclaimerH)}</h3>
        <p>${esc(labels.disclaimer)}</p>
      </section>`;

  // Bloque de firmas
  const sigClientSrc = (options.includeSignatures && sigClientPad && !sigClientPad.isEmpty()) ? sigClientPad.toDataURL("image/png") : null;
  const sigProviderSrc = (options.includeSignatures && sigProviderPad && !sigProviderPad.isEmpty()) ? sigProviderPad.toDataURL("image/png") : null;
  const clientSigName = esc(d.signatures.clientName || d.client.name) || labels.clientLine;
  const providerSigName = esc(d.signatures.providerName || d.provider.name) || labels.providerLine;

  html += `
      <section class="signature-block">
        <div class="sign-row">
          <div class="sign-box">
            ${sigClientSrc ? `<img src="${sigClientSrc}" alt="${esc(labels.sigClient)}" />` : `<div class="sign-line"></div>`}
            <p class="sig-name"><strong>${clientSigName}</strong></p>
            <p class="sig-role">${esc(labels.clientLine)}</p>
          </div>
          <div class="sign-box">
            ${sigProviderSrc ? `<img src="${sigProviderSrc}" alt="${esc(labels.sigProvider)}" />` : `<div class="sign-line"></div>`}
            <p class="sig-name"><strong>${providerSigName}</strong></p>
            <p class="sig-role">${esc(labels.providerLine)}</p>
          </div>
        </div>
      </section>`;

  html += `
      </div>
    </div>`;

  // Restaurar helpers
  window.AI = prevAI;
  return html;
}

/* Preview en step 4 — usa I18N.locale (sigue el toggle UI) */
function renderContractPreview() {
  const d = collectData();
  $("#contractDoc").innerHTML = renderContractHtml(I18N.locale, d, { includeSignatures: false });
}

/* -------- Signatures -------- */
function resizeCanvases() {
  [sigClientPad, sigProviderPad].forEach((pad) => {
    if (!pad) return;
    const canvas = pad.canvas;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const data = pad.toData();
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
    pad.clear();
    if (data && data.length) pad.fromData(data);
  });
}

function initSignatures() {
  if (typeof SignaturePad === "undefined") return;
  // backgroundColor transparente: el PNG exportado para el PDF queda con
  // canal alfa, sin caja blanca alrededor del trazo. El canvas en el wizard
  // sigue blanco gracias al CSS .sig-canvas { background: #fff }.
  sigClientPad = new SignaturePad($("#sigClient"), { penColor: "#0f172a", backgroundColor: "rgba(0,0,0,0)" });
  sigProviderPad = new SignaturePad($("#sigProvider"), { penColor: "#0f172a", backgroundColor: "rgba(0,0,0,0)" });
  resizeCanvases();
  window.addEventListener("resize", () => clearTimeout(window.__rt) || (window.__rt = setTimeout(resizeCanvases, 120)));

  $$("[data-clear]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.clear;
      if (id === "sigClient") sigClientPad.clear();
      if (id === "sigProvider") sigProviderPad.clear();
    });
  });
}

/* -------- PDF generation (US Legal portrait, monolingüe) --------
   ROOT CAUSE del "PDF en blanco / contenido cortado" (verificado con
   html2pdf 0.10.2 + Chromium 2026):

   El método interno html2pdf.toContainer() clona el holder dentro de un
   wrapper propio cuyo width es FIJO = `pageSize.inner.width` (=
   page width − margin.left − margin.right) en la unidad del jsPDF.
   Para Legal portrait con margins [16,14,16,14]mm eso son ~533pt ≈ 710px.

   Si el holder tiene `width: 794px` (u otro valor mayor), se DESBORDA del
   container interno y el overlay (overflow:hidden) lo CLIPA por ambos
   lados — resultado: PDF con texto cortado en la izquierda.

   Si el holder tiene `position: absolute|fixed`, el container interno
   colapsa a altura 0 — resultado: PDF blank (~800 bytes).

   Solución (probada con Puppeteer):
   1. holder en `position: static` (flujo normal).
   2. SIN width explícito en el holder — hereda el width del container
      interno (= inner.width), evitando desborde.
   3. Wrapper externo 1×1 invisible solo para no afectar el layout del
      wizard mientras el holder vive en el DOM.
   4. <style> INLINE dentro del holder (html2pdf no hereda <head>).
   5. document.fonts.ready + 2× rAF + espera de imágenes (firmas dataURL).
   6. Sanity check de altura mínima.
   7. Botón deshabilitado durante la generación. */

let __pdfBusy = false;

async function downloadPDF(locale) {
  if (__pdfBusy) return;
  if (typeof html2pdf === "undefined") {
    toast(I18N.t("toast.libsMissing"), "error");
    return;
  }
  __pdfBusy = true;
  setDownloadButtonsBusy(true);

  let wrapper = null;
  try {
    toast(I18N.t("toast.generating"));
    const d = collectData();
    const html = renderContractHtml(locale, d, { includeSignatures: true });

    // WRAPPER invisible 1×1 (no afecta el layout del wizard mientras
    // el holder vive en el DOM hasta finalizar la generación).
    wrapper = document.createElement("div");
    wrapper.id = "pdfRenderWrapper";
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.style.cssText = [
      "position:absolute",
      "top:0",
      "left:0",
      "width:1px",
      "height:1px",
      "overflow:hidden",
      "opacity:0",
      "pointer-events:none",
    ].join(";") + ";";

    // HOLDER:
    // - position:static (NO usar absolute/fixed: rompe html2pdf → canvas h=0).
    // - SIN width: el container interno de html2pdf le impone su ancho
    //   (= pageSize.inner.width), evitando que el contenido se corte.
    const holder = document.createElement("div");
    holder.id = "pdfRenderHolder";
    holder.style.cssText = [
      "position:static",
      "background:#ffffff",
      "color:#0f172a",
      "font-size:12px",
      "padding:0",
      "margin:0",
      "box-sizing:border-box",
    ].join(";") + ";";
    holder.innerHTML = html;
    wrapper.appendChild(holder);
    document.body.appendChild(wrapper);

    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (_) {}
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const imgs = [...holder.querySelectorAll("img")];
    await Promise.all(imgs.map((img) => img.complete && img.naturalWidth > 0
      ? Promise.resolve()
      : new Promise((res) => { img.onload = img.onerror = res; })));

    const measuredH = holder.scrollHeight;
    if (measuredH < 50) {
      throw new Error("El contenido del contrato no se rasterizó (altura=" + measuredH + "px).");
    }

    const safeName = (d.project.name || d.client.name || "contract")
      .replace(/[^\w\-]+/g, "_")
      .slice(0, 60) || "contract";
    const filename = `Contract_${safeName}_${locale === "en" ? "EN" : "ES"}.pdf`;

    await html2pdf()
      .from(holder)
      .set({
        margin: [16, 14, 16, 14], // mm [top, right, bottom, left] — Legal
        filename,
        enableLinks: false,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#ffffff",
          logging: false,
          // OJO: NO especificar `windowWidth`/`width`/`scrollX` — html2pdf
          // gestiona el viewport del clon vía su container interno.
        },
        jsPDF: {
          unit: "mm",
          format: "legal",
          orientation: "portrait",
          compress: true,
          putOnlyUsedFonts: true,
        },
        pagebreak: {
          mode: ["css", "legacy", "avoid-all"],
          avoid: [".clause-block", ".signature-block", ".sign-row", ".sign-box", ".clause-disclaimer", "h2", "h3"],
        },
      })
      .save();

    toast(I18N.t("toast.pdfDownloaded"), "success");
  } catch (err) {
    console.error("Error generando PDF:", err);
    toast(I18N.t("toast.pdfError") + ": " + (err.message || ""), "error");
  } finally {
    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    __pdfBusy = false;
    setDownloadButtonsBusy(false);
  }
}

function setDownloadButtonsBusy(busy) {
  ["#btnDownloadEs", "#btnDownloadEn"].forEach((sel) => {
    const b = document.querySelector(sel);
    if (!b) return;
    b.disabled = !!busy;
    b.classList.toggle("is-busy", !!busy);
  });
}

/* Inyecta los estilos del contrato (.pdf-contract) al <head> una sola vez.
   Necesario para que tanto el PREVIEW del wizard como el PDF compartan
   la misma apariencia. */
function injectContractStyles() {
  if (document.getElementById("contractRenderStyles")) return;
  const t = document.createElement("style");
  t.id = "contractRenderStyles";
  t.textContent = renderContractStyles();
  document.head.appendChild(t);
}

/* -------- Theme -------- */
function initTheme() {
  const saved = localStorage.getItem("ai.theme");
  if (saved === "dark") document.documentElement.setAttribute("data-theme", "dark");
  $("#btnTheme").addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (dark) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("ai.theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("ai.theme", "dark");
    }
  });
}

/* -------- Language toggle (UI) -------- */
function initLangToggle() {
  const btn = $("#btnLang");
  const code = $("#langCode");
  if (!btn || !code) return;

  const updateBadge = () => {
    code.textContent = I18N.locale === "es" ? "EN" : "ES";
  };

  btn.addEventListener("click", () => {
    const next = I18N.locale === "es" ? "en" : "es";
    I18N.setLocale(next);
    updateBadge();
    // Re-renderiza preview del contrato con el nuevo locale UI
    if (currentStep === 4) renderContractPreview();
    // Re-formatea cantidades calculadas que dependen del locale
    recalcPayment();
    // Update Next button label
    $("#btnNext").textContent = currentStep === TOTAL_STEPS ? I18N.t("buttons.finish") : I18N.t("buttons.next");
  });

  updateBadge();
}

/* -------- Init -------- */
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  injectContractStyles();

  // Cargar traducciones ANTES de cualquier otra cosa que use I18N.t()
  await I18N.init();

  initLangToggle();
  loadDraft();
  initSignatures();

  $("#btnNext").addEventListener("click", () => {
    if (currentStep === TOTAL_STEPS) return; // step 5 ya no auto-descarga
    if (!validateStep(currentStep)) return;
    goToStep(currentStep + 1);
  });
  $("#btnPrev").addEventListener("click", () => goToStep(currentStep - 1));
  $$(".step").forEach((s) => s.addEventListener("click", () => {
    const n = +s.dataset.step;
    if (n <= currentStep || validateStep(currentStep)) goToStep(n);
  }));

  ["totalPrice", "initialPercent", "currency"].forEach((id) => {
    document.getElementById(id).addEventListener("input", recalcPayment);
  });

  $("#btnSave").addEventListener("click", saveDraft);
  $("#btnDownloadEs").addEventListener("click", () => downloadPDF("es"));
  $("#btnDownloadEn").addEventListener("click", () => downloadPDF("en"));

  goToStep(1);
  recalcPayment();
});

/* -------- Service Worker --------
   Se registra al load y escucha actualizaciones. Cuando hay una versión nueva
   del SW (ej. tras bump de CACHE), avisa con un toast invitando a refrescar
   para que la app vieja no muestre estilos/PDF obsoletos. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((reg) => {
      if (!reg) return;
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            try { toast(I18N.t("toast.updateAvailable"), "success"); } catch (_) {}
          }
        });
      });
    }).catch(() => {});
  });
}
