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

function validateStep(n) {
  if (n === 1) {
    const required = ["clientName", "clientEmail", "providerName", "providerEmail"];
    for (const id of required) {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.focus(); toast(I18N.t("toast.fillRequired"), "error"); return false; }
    }
  }
  if (n === 2) {
    if (!$("#projectType").value) { $("#projectType").focus(); toast(I18N.t("toast.selectProject"), "error"); return false; }
    if (!$("#projectDescription").value.trim()) { $("#projectDescription").focus(); toast(I18N.t("toast.describeProject"), "error"); return false; }
    if (!$("#projectFeatures").value.trim()) { $("#projectFeatures").focus(); toast(I18N.t("toast.addFeature"), "error"); return false; }
  }
  if (n === 3) {
    if (!$("#totalPrice").value) { $("#totalPrice").focus(); toast(I18N.t("toast.enterPrice"), "error"); return false; }
    if (!$("#paymentMethod").value) { $("#paymentMethod").focus(); toast(I18N.t("toast.selectPayment"), "error"); return false; }
  }
  return true;
}

/* -------- Payment calc -------- */
function recalcPayment() {
  const total = parseFloat($("#totalPrice").value || 0);
  const pct = parseFloat($("#initialPercent").value || 0);
  const cur = $("#currency").value || "USD";
  const initial = total * (pct / 100);
  const remaining = total - initial;
  $("#initialAmount").value = formatMoney(initial, cur);
  $("#remainingAmount").value = formatMoney(remaining, cur);
}

/* -------- Contract rendering (monolingüe) --------
   Genera HTML del contrato en un solo idioma, con cada cláusula como
   .clause-block separada para que html2pdf respete page-breaks.
*/
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

  let html = `
    <div class="contract-doc" lang="${locale}">
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
  sigClientPad = new SignaturePad($("#sigClient"), { penColor: "#0f172a", backgroundColor: "#ffffff" });
  sigProviderPad = new SignaturePad($("#sigProvider"), { penColor: "#0f172a", backgroundColor: "#ffffff" });
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

/* -------- PDF generation (US Legal portrait, monolingüe) -------- */
async function downloadPDF(locale) {
  if (typeof html2pdf === "undefined") {
    toast(I18N.t("toast.libsMissing"), "error");
    return;
  }
  try {
    toast(I18N.t("toast.generating"));
    const d = collectData();
    const html = renderContractHtml(locale, d, { includeSignatures: true });

    // Wrapper invisible (off-screen) con ancho fijo en px que se aproxime al
    // ancho del contenido en pt (Legal portrait ≈ 612 - margen ≈ 552pt).
    // Usamos 800px de render para buena resolución y luego html2pdf escala.
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-12000px;top:0;width:800px;background:#ffffff;color:#0f172a;z-index:-1;";
    holder.innerHTML = html;
    document.body.appendChild(holder);

    // Esperar imágenes (firmas) si hay
    const imgs = [...holder.querySelectorAll("img")];
    await Promise.all(imgs.map((img) => img.complete ? Promise.resolve() :
      new Promise((res) => { img.onload = img.onerror = res; })));

    const safeName = (d.project.name || d.client.name || "contract").replace(/[^\w\-]+/g, "_");
    const filename = `Contract_${safeName}_${locale === "en" ? "EN" : "ES"}.pdf`;

    await html2pdf()
      .from(holder.firstElementChild)
      .set({
        margin:   [25, 20, 25, 20], // top, left, bottom, right (mm)
        filename,
        image:    { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: 800,
        },
        jsPDF:    { unit: "mm", format: "legal", orientation: "portrait", compress: true },
        pagebreak:{
          mode:  ["css", "legacy", "avoid-all"],
          avoid: [".clause-block", ".signature-block", "section", "h2", "h3", "ul", ".sign-row"],
        },
      })
      .save();

    document.body.removeChild(holder);
    toast(I18N.t("toast.pdfDownloaded"), "success");
  } catch (err) {
    console.error("Error generando PDF:", err);
    toast(I18N.t("toast.pdfError") + ": " + (err.message || ""), "error");
  }
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
    // Update Next button label
    $("#btnNext").textContent = currentStep === TOTAL_STEPS ? I18N.t("buttons.finish") : I18N.t("buttons.next");
  });

  updateBadge();
}

/* -------- Init -------- */
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();

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

/* -------- Service Worker -------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
