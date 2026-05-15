/* =========================================================
   CLÁUSULAS LEGALES — ESPAÑOL
   Cada cláusula es self-contained: { id, number, title,
   isHighlighted, render(d) -> string HTML }.
   Numeración (1..19) DEBE coincidir con clauses-en.js
   en el mismo índice del array.
   Helpers usados: window.AI.{esc, formatMoney, formatDate, listify}
========================================================= */
(function () {
  const H = () => window.AI || {
    esc: (s) => String(s ?? ""),
    formatMoney: (n, c) => `${c || "USD"} ${(+n || 0).toFixed(2)}`,
    formatDate: (d) => d || "___________",
    listify: (t) => (t ? `<li>${t}</li>` : "<li><em>Sin definir</em></li>"),
  };

  const CLAUSES_ES = [
    {
      id: "parties",
      number: "1",
      title: "Partes",
      isHighlighted: false,
      render(d) {
        const { esc } = H();
        return `
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
<p>Ambas partes reconocen tener capacidad legal suficiente para celebrar el presente contrato y manifiestan su consentimiento libre y voluntario.</p>`;
      },
    },

    {
      id: "object",
      number: "2",
      title: "Objeto del Contrato",
      render(d) {
        const { esc } = H();
        return `
<p>El <strong>Proveedor</strong> se compromete a desarrollar y entregar al <strong>Cliente</strong> el siguiente servicio digital:</p>
<div class="highlight">
  <p><strong>${esc(d.project.name) || esc(d.project.type) || "Proyecto digital"}</strong> — ${esc(d.project.type) || ""}</p>
  <p>${esc(d.project.description) || "Sin descripción"}</p>
</div>`;
      },
    },

    {
      id: "scope",
      number: "3",
      title: "Alcance y Entregables",
      render(d) {
        const { listify } = H();
        return `
<p>El proyecto incluye las siguientes funcionalidades y entregables:</p>
<ul>${listify(d.project.features)}</ul>
${d.project.phases ? `<p><strong>Fases del proyecto:</strong></p><ul>${listify(d.project.phases)}</ul>` : ""}`;
      },
    },

    {
      id: "timeline",
      number: "4",
      title: "Tiempos de Entrega",
      render(d) {
        const { formatDate } = H();
        return `
<p><strong>Fecha de inicio:</strong> ${formatDate(d.project.startDate, "es")}</p>
<p><strong>Fecha estimada de entrega:</strong> ${formatDate(d.project.endDate, "es")}</p>
<p>Los tiempos pueden variar si el Cliente retrasa la entrega de información, accesos o aprobaciones necesarias.</p>`;
      },
    },

    {
      id: "payment",
      number: "5",
      title: "Condiciones Económicas",
      render(d) {
        const { esc, formatMoney } = H();
        const cur = d.payment.currency || "USD";
        const initial = (d.payment.total || 0) * ((d.payment.initialPercent || 0) / 100);
        const remaining = (d.payment.total || 0) - initial;
        return `
<div class="highlight">
  <p><strong>Valor total:</strong> ${formatMoney(d.payment.total, cur)}</p>
  <p><strong>Pago inicial (${d.payment.initialPercent || 0}%):</strong> ${formatMoney(initial, cur)}</p>
  <p><strong>Saldo restante:</strong> ${formatMoney(remaining, cur)}</p>
  <p><strong>Método de pago:</strong> ${esc(d.payment.method) || "—"}</p>
  ${d.payment.details ? `<p><strong>Detalles:</strong> ${esc(d.payment.details)}</p>` : ""}
</div>
<p>El pago inicial se realiza al momento de firmar este contrato. El saldo restante se cubre al momento de la entrega final, salvo pacto distinto por escrito.</p>`;
      },
    },

    {
      id: "client_duties",
      number: "6",
      title: "Responsabilidades del Cliente",
      render() {
        return `
<ul>
  <li>Proveer de manera oportuna la información, contenidos, accesos y credenciales necesarios.</li>
  <li>Revisar y aprobar los avances dentro de los plazos acordados.</li>
  <li>Cumplir con los pagos en las fechas establecidas.</li>
  <li>Designar un único punto de contacto para la toma de decisiones.</li>
</ul>`;
      },
    },

    {
      id: "provider_duties",
      number: "7",
      title: "Responsabilidades del Proveedor",
      render() {
        return `
<ul>
  <li>Desarrollar el proyecto conforme al alcance acordado.</li>
  <li>Mantener comunicación periódica sobre el progreso.</li>
  <li>Entregar dentro del plazo estimado, salvo caso fortuito o fuerza mayor.</li>
  <li>Guardar confidencialidad sobre la información del Cliente.</li>
</ul>`;
      },
    },

    {
      id: "revisions",
      number: "8",
      title: "Revisiones y Cambios",
      render(d) {
        return `<p>Se incluyen <strong>${d.extras.revisions || 0}</strong> ronda(s) de revisión dentro del alcance. Cualquier modificación adicional o cambio fuera del alcance inicial (<em>scope creep</em>) será cotizado de forma independiente y requerirá aprobación por escrito antes de ejecutarse.</p>`;
      },
    },

    {
      id: "support",
      number: "9",
      title: "Soporte Post-Entrega",
      render(d) {
        return `<p>${
          d.extras.support
            ? `Se incluye soporte técnico gratuito durante <strong>${d.extras.supportDays || 30} día(s)</strong> posteriores a la entrega, limitado a corrección de errores originados en el desarrollo.`
            : "No se incluye soporte post-entrega en el presente contrato. El soporte podrá contratarse de forma separada."
        }</p>`;
      },
    },

    {
      id: "hosting",
      number: "10",
      title: "Hosting y Dominio",
      render(d) {
        return `<p>${
          d.extras.hosting
            ? "El hosting y/o dominio están incluidos conforme a los términos descritos en el alcance. La titularidad queda a nombre del Cliente."
            : "El hosting y dominio no están incluidos y son responsabilidad exclusiva del Cliente."
        }</p>`;
      },
    },

    {
      id: "ip",
      number: "11",
      title: "Propiedad Intelectual",
      render() {
        return `<p>Los derechos de propiedad intelectual sobre los entregables finales se transferirán al <strong>Cliente</strong> una vez completado el pago total del contrato. Hasta entonces, los derechos permanecen con el <strong>Proveedor</strong>. El Proveedor podrá incluir el proyecto en su portafolio salvo pacto expreso de confidencialidad.</p>`;
      },
    },

    {
      id: "cancellation",
      number: "12",
      title: "Cancelación",
      render() {
        return `<p>En caso de cancelación por parte del Cliente, el pago inicial no será reembolsable por tratarse de trabajo ya iniciado. Si el Proveedor cancela sin causa justificada, devolverá la parte proporcional correspondiente al trabajo no entregado.</p>`;
      },
    },

    {
      id: "confidentiality",
      number: "13",
      title: "Confidencialidad",
      render() {
        return `<p>Ambas partes se comprometen a mantener en reserva toda Información Confidencial a la que accedan durante la ejecución del contrato, incluso después de su finalización. Esta obligación subsistirá por un plazo mínimo de dos (2) años contados desde la terminación del contrato.</p>`;
      },
    },

    {
      id: "liability_limit",
      number: "14",
      title: "Limitación de Responsabilidad",
      isHighlighted: true,
      render() {
        return `<p>EN NINGÚN CASO LA RESPONSABILIDAD TOTAL DEL PROVEEDOR EXCEDERÁ EL MONTO PAGADO POR EL CLIENTE BAJO ESTE CONTRATO. EL PROVEEDOR NO SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, CONSECUENCIALES, LUCRO CESANTE, PÉRDIDA DE DATOS, NI DAÑOS PUNITIVOS, INCLUSO SI HUBIERA SIDO ADVERTIDO DE LA POSIBILIDAD DE TALES DAÑOS.</p>`;
      },
    },

    {
      id: "warranty_disclaimer",
      number: "15",
      title: "Exclusión de Garantías Implícitas",
      isHighlighted: true,
      render() {
        return `<p>SALVO LO EXPRESAMENTE ESTABLECIDO EN ESTE CONTRATO, EL PROVEEDOR NO OTORGA NINGUNA GARANTÍA EXPRESA O IMPLÍCITA, INCLUYENDO PERO NO LIMITADA A GARANTÍAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR O NO INFRACCIÓN. LOS ENTREGABLES SE PROPORCIONAN "TAL CUAL" UNA VEZ ACEPTADOS POR EL CLIENTE.</p>`;
      },
    },

    {
      id: "force_majeure",
      number: "16",
      title: "Fuerza Mayor",
      render() {
        return `<p>Ninguna de las Partes será responsable por incumplimientos derivados de Fuerza Mayor o Caso Fortuito (incluyendo, sin limitación: desastres naturales, pandemias, guerras, actos terroristas, fallos masivos de infraestructura o disposiciones gubernamentales). La Parte afectada notificará a la otra dentro de un plazo razonable y ambas acordarán de buena fe la suspensión o reprogramación de obligaciones.</p>`;
      },
    },

    {
      id: "governing_law",
      number: "17",
      title: "Ley Aplicable y Jurisdicción",
      render() {
        return `<p>El presente contrato se rige por la legislación aplicable al domicilio del Proveedor. Cualquier controversia se resolverá preferentemente mediante acuerdo amistoso y, en su defecto, ante los tribunales competentes del domicilio del Proveedor, salvo que las Partes pacten por escrito el sometimiento a Mediación o Arbitraje.</p>`;
      },
    },

    {
      id: "acceptance",
      number: "18",
      title: "Aceptación y Firmas",
      render() {
        return `<p>Las Partes declaran haber leído y aceptado cada una de las cláusulas del presente contrato, firmándolo en señal de conformidad.</p>`;
      },
    },
  ];

  window.CLAUSES_ES = CLAUSES_ES;
})();
