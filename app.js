/* =========================================================
   Acuerdo Inteligente de Servicios Digitales
   PWA — wizard + contrato bilingüe ES/EN + firma + PDF
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
  const loc = localeHint === "en" ? "en-US" : (window.I18N && window.I18N.locale === "en" ? "en-US" : "es-MX");
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
const STORAGE_KEY = "acuerdoInteligente.draft.v2";

function getPrevailingLanguage() {
  const checked = document.querySelector('input[name="prevailing"]:checked');
  return checked ? checked.value : "es";
}

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
    metadata: {
      prevailingLanguage: getPrevailingLanguage(),
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
  if (d.metadata && d.metadata.prevailingLanguage) {
    const radio = document.querySelector(`input[name="prevailing"][value="${d.metadata.prevailingLanguage}"]`);
    if (radio) radio.checked = true;
    updatePrevailingConfirm();
  }
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
  $("#btnNext").textContent = n === TOTAL_STEPS ? I18N.t("buttons.finish") : I18N.t("buttons.next");
  $("#progressBar").style.width = (n / TOTAL_STEPS * 100) + "%";

  if (n === 4) renderContract();
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

/* -------- Prevailing language UI -------- */
function updatePrevailingConfirm() {
  const lang = getPrevailingLanguage();
  const el = document.getElementById("prevailingConfirm");
  if (!el) return;
  el.textContent = I18N.t(lang === "en" ? "step5.prevailing.confirmEn" : "step5.prevailing.confirmEs");
  el.dataset.i18n = lang === "en" ? "step5.prevailing.confirmEn" : "step5.prevailing.confirmEs";
}

/* -------- Contract rendering (bilingual) -------- */
function renderContract() {
  const d = collectData();
  const todayEs = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
  const todayEn = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const esClauses = window.CLAUSES_ES || [];
  const enClauses = window.CLAUSES_EN || [];

  let html = `
    <div class="document-bilingual-header">
      <div class="dbh-col">
        <h1>Contrato de Prestación de Servicios Digitales</h1>
        <p class="doc-sub">Documento generado el ${todayEs}</p>
      </div>
      <div class="dbh-col">
        <h1>Digital Services Agreement</h1>
        <p class="doc-sub">Document generated on ${todayEn}</p>
      </div>
    </div>
    <div class="contract-bilingual">
  `;

  const len = Math.max(esClauses.length, enClauses.length);
  for (let i = 0; i < len; i++) {
    const es = esClauses[i] || { number: "", title: "", render: () => "" };
    const en = enClauses[i] || { number: "", title: "", render: () => "" };
    const cls = es.isHighlighted || en.isHighlighted ? "clause-row clause-highlighted" : "clause-row";
    html += `
      <div class="${cls}">
        <div class="col col-es" lang="es">
          <h2>${esc(es.number)}. ${esc(es.title)}</h2>
          ${es.render(d)}
        </div>
        <div class="col col-en" lang="en">
          <h2>${esc(en.number)}. ${esc(en.title)}</h2>
          ${en.render(d)}
        </div>
      </div>`;
  }
  html += `</div>`;

  // Disclaimer legal bilingüe
  html += `
    <div class="contract-disclaimer clause-row">
      <div class="col col-es" lang="es">
        <h3>Aviso legal</h3>
        <p>Este contrato bilingüe ha sido preparado con el mejor esfuerzo para reflejar los mismos derechos y obligaciones en ambos idiomas. Para contratos superiores a $15,000 USD o industrias reguladas (salud, fintech, gobierno), se recomienda firmemente la revisión legal en la jurisdicción aplicable antes de firmar.</p>
      </div>
      <div class="col col-en" lang="en">
        <h3>Legal Notice</h3>
        <p>This bilingual contract has been prepared with best efforts to reflect the same rights and obligations in both languages. For contracts exceeding $15,000 USD or regulated industries (healthcare, fintech, government), legal review in the applicable jurisdiction is strongly recommended before signing.</p>
      </div>
    </div>
  `;

  // Bloque de firmas (bilingüe)
  html += renderSignatureBlock(d);

  $("#contractDoc").innerHTML = html;
}

function renderSignatureBlock(d) {
  const clientNameEs = esc(d.signatures.clientName || d.client.name) || "Firma del Cliente";
  const clientNameEn = esc(d.signatures.clientName || d.client.name) || "Client Signature";
  const providerNameEs = esc(d.signatures.providerName || d.provider.name) || "Firma del Proveedor";
  const providerNameEn = esc(d.signatures.providerName || d.provider.name) || "Provider Signature";
  return `
    <div class="sign-row">
      <div class="sign-box" id="sigBoxClient">
        <div class="sign-line"></div>
        <p><strong>${clientNameEs}</strong></p>
        <p>Cliente / Client</p>
      </div>
      <div class="sign-box" id="sigBoxProvider">
        <div class="sign-line"></div>
        <p><strong>${providerNameEs}</strong></p>
        <p>Proveedor / Provider</p>
      </div>
    </div>
  `;
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

/* -------- PDF generation (A4 landscape, bilingual) -------- */
async function downloadPDF() {
  try {
    if (typeof html2canvas === "undefined" || !window.jspdf) {
      toast(I18N.t("toast.libsMissing"), "error");
      return;
    }

    toast(I18N.t("toast.generating"));
    const d = collectData();

    // Re-render contract to capture latest data + prevailing language
    renderContract();

    const original = $("#contractDoc");
    const clone = original.cloneNode(true);
    clone.id = "contractDocClone";

    // Inject signatures into the clone
    if (sigClientPad && !sigClientPad.isEmpty()) {
      const img = sigClientPad.toDataURL("image/png");
      const box = clone.querySelector("#sigBoxClient");
      if (box) box.innerHTML =
        `<img src="${img}" alt="Firma del Cliente / Client Signature" style="max-width:100%;max-height:90px;margin-bottom:6px;" />` +
        `<p style="margin:2px 0;font-size:13px;"><strong>${esc(d.signatures.clientName || d.client.name) || "Cliente / Client"}</strong></p>` +
        `<p style="margin:2px 0;font-size:12px;color:#475569;">Cliente / Client</p>`;
    }
    if (sigProviderPad && !sigProviderPad.isEmpty()) {
      const img = sigProviderPad.toDataURL("image/png");
      const box = clone.querySelector("#sigBoxProvider");
      if (box) box.innerHTML =
        `<img src="${img}" alt="Firma del Proveedor / Provider Signature" style="max-width:100%;max-height:90px;margin-bottom:6px;" />` +
        `<p style="margin:2px 0;font-size:13px;"><strong>${esc(d.signatures.providerName || d.provider.name) || "Proveedor / Provider"}</strong></p>` +
        `<p style="margin:2px 0;font-size:12px;color:#475569;">Proveedor / Provider</p>`;
    }

    // Off-screen wrapper sized for landscape (wider for 2 columns)
    const RENDER_WIDTH = 1100; // px — buena resolución para 297mm landscape
    const holder = document.createElement("div");
    holder.style.cssText = `position:fixed;left:-12000px;top:0;width:${RENDER_WIDTH}px;background:#ffffff;z-index:-1;`;
    clone.style.cssText = "padding:24px 28px;background:#ffffff;color:#0f172a;font-size:12px;";
    holder.appendChild(clone);
    document.body.appendChild(holder);

    // Wait for signature images to load
    const imgs = [...clone.querySelectorAll("img")];
    await Promise.all(imgs.map((img) => img.complete ? Promise.resolve() :
      new Promise((res) => { img.onload = img.onerror = res; })));

    const canvas = await html2canvas(clone, {
      scale: 1.5,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: RENDER_WIDTH,
    });

    document.body.removeChild(holder);

    // JPEG quality 0.92 — clave para mantener el PDF en tamaño razonable
    // (PNG sin compresión sobre 2 columnas largas = 50MB+)
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();   // 297
    const pageH = pdf.internal.pageSize.getHeight();  // 210
    const margin = 8;
    const imgW = pageW - margin * 2;
    const imgH = canvas.height * imgW / canvas.width;

    let heightLeft = imgH;
    let position = margin;

    pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH, undefined, "FAST");
    heightLeft -= (pageH - margin * 2);

    while (heightLeft > 0) {
      position = margin - (imgH - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH, undefined, "FAST");
      heightLeft -= (pageH - margin * 2);
    }

    const safeName = (d.project.name || d.client.name || "contract").replace(/[^\w\-]+/g, "_");
    pdf.save(`Contract_${safeName}_Bilingual.pdf`);
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

/* -------- Language toggle -------- */
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
    // Re-render contract preview with new locale (dates/money formatting)
    if (currentStep === 4) renderContract();
    // Update Next button label and prevailing confirm
    $("#btnNext").textContent = currentStep === TOTAL_STEPS ? I18N.t("buttons.finish") : I18N.t("buttons.next");
    updatePrevailingConfirm();
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
    if (!validateStep(currentStep)) return;
    if (currentStep === TOTAL_STEPS) {
      downloadPDF();
      return;
    }
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

  // Prevailing language radios
  document.querySelectorAll('input[name="prevailing"]').forEach((r) => {
    r.addEventListener("change", () => {
      updatePrevailingConfirm();
      if (currentStep === 4) renderContract();
    });
  });

  $("#btnSave").addEventListener("click", saveDraft);
  $("#btnDownload").addEventListener("click", downloadPDF);

  goToStep(1);
  recalcPayment();
  updatePrevailingConfirm();
});

/* -------- Service Worker -------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
