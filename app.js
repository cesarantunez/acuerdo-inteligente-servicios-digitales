/* =========================================================
   Acuerdo Inteligente de Servicios Digitales
   PWA — wizard + contrato + firma digital + PDF
========================================================= */

const TOTAL_STEPS = 5;
let currentStep = 1;
let sigClientPad, sigProviderPad;

const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

/* -------- State & persistence -------- */
const STORAGE_KEY = "acuerdoInteligente.draft.v1";

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
    toast("Borrador guardado", "success");
  } catch (e) { toast("No se pudo guardar", "error"); }
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
  $$(".panel").forEach(p => p.classList.toggle("active", +p.dataset.panel === n));
  $$(".step").forEach(s => {
    const sn = +s.dataset.step;
    s.classList.toggle("active", sn === n);
    s.classList.toggle("done", sn < n);
  });
  $("#btnPrev").disabled = n === 1;
  $("#btnNext").textContent = n === TOTAL_STEPS ? "Finalizar" : "Siguiente →";
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
      if (!el.value.trim()) { el.focus(); toast("Completa los campos obligatorios", "error"); return false; }
    }
  }
  if (n === 2) {
    if (!$("#projectType").value) { $("#projectType").focus(); toast("Selecciona el tipo de proyecto", "error"); return false; }
    if (!$("#projectDescription").value.trim()) { $("#projectDescription").focus(); toast("Describe el proyecto", "error"); return false; }
    if (!$("#projectFeatures").value.trim()) { $("#projectFeatures").focus(); toast("Agrega al menos una funcionalidad", "error"); return false; }
  }
  if (n === 3) {
    if (!$("#totalPrice").value) { $("#totalPrice").focus(); toast("Ingresa el precio total", "error"); return false; }
    if (!$("#paymentMethod").value) { $("#paymentMethod").focus(); toast("Selecciona método de pago", "error"); return false; }
  }
  return true;
}

/* -------- Payment calc -------- */
function formatMoney(n, cur = "USD") {
  try { return new Intl.NumberFormat("es-MX", { style: "currency", currency: cur }).format(n || 0); }
  catch { return `${cur} ${(n || 0).toFixed(2)}`; }
}
function recalcPayment() {
  const total = parseFloat($("#totalPrice").value || 0);
  const pct = parseFloat($("#initialPercent").value || 0);
  const cur = $("#currency").value || "USD";
  const initial = total * (pct / 100);
  const remaining = total - initial;
  $("#initialAmount").value = formatMoney(initial, cur);
  $("#remainingAmount").value = formatMoney(remaining, cur);
}

/* -------- Contract rendering -------- */
function formatDate(d) {
  if (!d) return "___________";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
  } catch { return d; }
}
function esc(s) {
  return (s || "").replace(/[&<>]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
}
function listify(text) {
  const items = (text || "").split("\n").map(t => t.trim()).filter(Boolean);
  if (!items.length) return "<li><em>Sin definir</em></li>";
  return items.map(i => `<li>${esc(i)}</li>`).join("");
}

function renderContract() {
  const d = collectData();
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
  const cur = d.payment.currency || "USD";
  const initial = (d.payment.total || 0) * ((d.payment.initialPercent || 0) / 100);
  const remaining = (d.payment.total || 0) - initial;

  const html = `
    <h1>Contrato de Prestación de Servicios Digitales</h1>
    <p class="doc-sub">Documento generado el ${today}</p>

    <h2>1. Partes</h2>
    <div class="parties">
      <div class="party">
        <h3>Proveedor</h3>
        <p><strong>${esc(d.provider.name) || "—"}</strong></p>
        ${d.provider.id ? `<p>ID fiscal: ${esc(d.provider.id)}</p>` : ""}
        <p>${esc(d.provider.email) || ""}</p>
        ${d.provider.phone ? `<p>${esc(d.provider.phone)}</p>` : ""}
      </div>
      <div class="party">
        <h3>Cliente</h3>
        <p><strong>${esc(d.client.name) || "—"}</strong>${d.client.company ? ` — ${esc(d.client.company)}` : ""}</p>
        ${d.client.id ? `<p>ID: ${esc(d.client.id)}</p>` : ""}
        <p>${esc(d.client.email) || ""}</p>
        ${d.client.phone ? `<p>${esc(d.client.phone)}</p>` : ""}
        ${d.client.address ? `<p>${esc(d.client.address)}</p>` : ""}
      </div>
    </div>
    <p>Ambas partes reconocen tener capacidad legal suficiente para celebrar el presente contrato y manifiestan su consentimiento libre y voluntario.</p>

    <h2>2. Objeto del Contrato</h2>
    <p>El <strong>Proveedor</strong> se compromete a desarrollar y entregar al <strong>Cliente</strong> el siguiente servicio digital:</p>
    <div class="highlight">
      <p><strong>${esc(d.project.name) || esc(d.project.type) || "Proyecto digital"}</strong> — ${esc(d.project.type) || ""}</p>
      <p>${esc(d.project.description) || "Sin descripción"}</p>
    </div>

    <h2>3. Alcance y Entregables</h2>
    <p>El proyecto incluye las siguientes funcionalidades y entregables:</p>
    <ul>${listify(d.project.features)}</ul>
    ${d.project.phases ? `<p><strong>Fases del proyecto:</strong></p><ul>${listify(d.project.phases)}</ul>` : ""}

    <h2>4. Tiempos de Entrega</h2>
    <p><strong>Fecha de inicio:</strong> ${formatDate(d.project.startDate)}</p>
    <p><strong>Fecha estimada de entrega:</strong> ${formatDate(d.project.endDate)}</p>
    <p>Los tiempos pueden variar si el Cliente retrasa la entrega de información, accesos o aprobaciones necesarias.</p>

    <h2>5. Condiciones Económicas</h2>
    <div class="highlight">
      <p><strong>Valor total:</strong> ${formatMoney(d.payment.total, cur)}</p>
      <p><strong>Pago inicial (${d.payment.initialPercent}%):</strong> ${formatMoney(initial, cur)}</p>
      <p><strong>Saldo restante:</strong> ${formatMoney(remaining, cur)}</p>
      <p><strong>Método de pago:</strong> ${esc(d.payment.method) || "—"}</p>
      ${d.payment.details ? `<p><strong>Detalles:</strong> ${esc(d.payment.details)}</p>` : ""}
    </div>
    <p>El pago inicial se realiza al momento de firmar este contrato. El saldo restante se cubre al momento de la entrega final, salvo pacto distinto por escrito.</p>

    <h2>6. Responsabilidades del Cliente</h2>
    <ul>
      <li>Proveer de manera oportuna la información, contenidos, accesos y credenciales necesarios.</li>
      <li>Revisar y aprobar los avances dentro de los plazos acordados.</li>
      <li>Cumplir con los pagos en las fechas establecidas.</li>
      <li>Designar un único punto de contacto para la toma de decisiones.</li>
    </ul>

    <h2>7. Responsabilidades del Proveedor</h2>
    <ul>
      <li>Desarrollar el proyecto conforme al alcance acordado.</li>
      <li>Mantener comunicación periódica sobre el progreso.</li>
      <li>Entregar dentro del plazo estimado, salvo caso fortuito o fuerza mayor.</li>
      <li>Guardar confidencialidad sobre la información del Cliente.</li>
    </ul>

    <h2>8. Revisiones y Cambios</h2>
    <p>Se incluyen <strong>${d.extras.revisions || 0}</strong> ronda(s) de revisión dentro del alcance. Cualquier modificación adicional o cambio fuera del alcance inicial (<em>scope creep</em>) será cotizado de forma independiente y requerirá aprobación por escrito antes de ejecutarse.</p>

    <h2>9. Soporte Post-Entrega</h2>
    <p>${d.extras.support
      ? `Se incluye soporte técnico gratuito durante <strong>${d.extras.supportDays || 30} día(s)</strong> posteriores a la entrega, limitado a corrección de errores originados en el desarrollo.`
      : "No se incluye soporte post-entrega en el presente contrato. El soporte podrá contratarse de forma separada."}</p>

    <h2>10. Hosting y Dominio</h2>
    <p>${d.extras.hosting
      ? "El hosting y/o dominio están incluidos conforme a los términos descritos en el alcance. La titularidad queda a nombre del Cliente."
      : "El hosting y dominio no están incluidos y son responsabilidad exclusiva del Cliente."}</p>

    <h2>11. Propiedad Intelectual</h2>
    <p>Los derechos de propiedad intelectual sobre los entregables finales se transferirán al <strong>Cliente</strong> una vez completado el pago total del contrato. Hasta entonces, los derechos permanecen con el <strong>Proveedor</strong>. El Proveedor podrá incluir el proyecto en su portafolio salvo pacto expreso de confidencialidad.</p>

    <h2>12. Cancelación</h2>
    <p>En caso de cancelación por parte del Cliente, el pago inicial no será reembolsable por tratarse de trabajo ya iniciado. Si el Proveedor cancela sin causa justificada, devolverá la parte proporcional correspondiente al trabajo no entregado.</p>

    <h2>13. Confidencialidad</h2>
    <p>Ambas partes se comprometen a mantener en reserva toda información confidencial a la que accedan durante la ejecución del contrato, incluso después de su finalización.</p>

    <h2>14. Ley Aplicable y Jurisdicción</h2>
    <p>El presente contrato se rige por la legislación aplicable al domicilio del Proveedor. Cualquier controversia se resolverá preferentemente mediante acuerdo amistoso y, en su defecto, ante los tribunales competentes.</p>

    <h2>15. Aceptación y Firmas</h2>
    <p>Las partes declaran haber leído y aceptado cada una de las cláusulas del presente contrato, firmándolo en señal de conformidad.</p>

    <div class="sign-row">
      <div class="sign-box" id="sigBoxClient">
        <div class="sign-line"></div>
        <p><strong>${esc(d.signatures.clientName || d.client.name) || "Firma del Cliente"}</strong></p>
        <p>Cliente</p>
      </div>
      <div class="sign-box" id="sigBoxProvider">
        <div class="sign-line"></div>
        <p><strong>${esc(d.signatures.providerName || d.provider.name) || "Firma del Proveedor"}</strong></p>
        <p>Proveedor</p>
      </div>
    </div>
  `;
  $("#contractDoc").innerHTML = html;
}

/* -------- Signatures -------- */
function resizeCanvases() {
  [sigClientPad, sigProviderPad].forEach(pad => {
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

  $$("[data-clear]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.clear;
      if (id === "sigClient") sigClientPad.clear();
      if (id === "sigProvider") sigProviderPad.clear();
    });
  });
}

/* -------- PDF generation -------- */
async function downloadPDF() {
  try {
    if (typeof html2canvas === "undefined" || !window.jspdf) {
      toast("Librerías no cargadas. Revisa tu conexión a internet.", "error");
      return;
    }

    toast("Generando PDF...");
    const d = collectData();

    // Render contract into an off-screen visible clone (so html2canvas can rasterize it)
    renderContract();
    const original = $("#contractDoc");
    const clone = original.cloneNode(true);
    clone.id = "contractDocClone";

    // Inject signatures into the clone
    if (sigClientPad && !sigClientPad.isEmpty()) {
      const img = sigClientPad.toDataURL("image/png");
      const box = clone.querySelector("#sigBoxClient");
      if (box) box.innerHTML =
        `<img src="${img}" alt="Firma del Cliente" style="max-width:100%;max-height:90px;margin-bottom:6px;" />` +
        `<p style="margin:2px 0;font-size:13px;"><strong>${esc(d.signatures.clientName || d.client.name) || "Cliente"}</strong></p>` +
        `<p style="margin:2px 0;font-size:12px;color:#475569;">Cliente</p>`;
    }
    if (sigProviderPad && !sigProviderPad.isEmpty()) {
      const img = sigProviderPad.toDataURL("image/png");
      const box = clone.querySelector("#sigBoxProvider");
      if (box) box.innerHTML =
        `<img src="${img}" alt="Firma del Proveedor" style="max-width:100%;max-height:90px;margin-bottom:6px;" />` +
        `<p style="margin:2px 0;font-size:13px;"><strong>${esc(d.signatures.providerName || d.provider.name) || "Proveedor"}</strong></p>` +
        `<p style="margin:2px 0;font-size:12px;color:#475569;">Proveedor</p>`;
    }

    // Host the clone in a visible but off-screen wrapper
    const holder = document.createElement("div");
    holder.style.cssText = "position:fixed;left:-10000px;top:0;width:800px;background:#ffffff;z-index:-1;";
    holder.appendChild(clone);
    document.body.appendChild(holder);

    // Wait for images (signatures) to load before rasterizing
    const imgs = [...clone.querySelectorAll("img")];
    await Promise.all(imgs.map(img => img.complete ? Promise.resolve() :
      new Promise(res => { img.onload = img.onerror = res; })));

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      windowWidth: 800
    });

    document.body.removeChild(holder);

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const imgW = pageW - margin * 2;
    const imgH = canvas.height * imgW / canvas.width;

    let heightLeft = imgH;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
    heightLeft -= (pageH - margin * 2);

    while (heightLeft > 0) {
      position = margin - (imgH - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, imgW, imgH);
      heightLeft -= (pageH - margin * 2);
    }

    const safeName = (d.project.name || d.client.name || "contrato").replace(/[^\w\-]+/g, "_");
    pdf.save(`Contrato_${safeName}.pdf`);
    toast("PDF descargado", "success");
  } catch (err) {
    console.error("Error generando PDF:", err);
    toast("Error: " + (err.message || "No se pudo generar el PDF"), "error");
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

/* -------- Init -------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
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
  $$(".step").forEach(s => s.addEventListener("click", () => {
    const n = +s.dataset.step;
    if (n <= currentStep || validateStep(currentStep)) goToStep(n);
  }));

  ["totalPrice", "initialPercent", "currency"].forEach(id => {
    document.getElementById(id).addEventListener("input", recalcPayment);
  });

  $("#btnSave").addEventListener("click", saveDraft);
  $("#btnDownload").addEventListener("click", downloadPDF);

  goToStep(1);
  recalcPayment();
});

/* -------- Service Worker -------- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
