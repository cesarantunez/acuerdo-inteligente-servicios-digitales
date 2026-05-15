/* =========================================================
   LEGAL CLAUSES — ENGLISH
   Each clause is self-contained: { id, number, title,
   isHighlighted, render(d) -> HTML string }.
   Numbering (1..19) MUST match clauses-es.js
   at the same array index.
   Helpers used: window.AI.{esc, formatMoney, formatDate, listify}
========================================================= */
(function () {
  const H = () => window.AI || {
    esc: (s) => String(s ?? ""),
    formatMoney: (n, c) => `${c || "USD"} ${(+n || 0).toFixed(2)}`,
    formatDate: (d) => d || "___________",
    listify: (t) => (t ? `<li>${t}</li>` : "<li><em>Not defined</em></li>"),
  };

  const CLAUSES_EN = [
    {
      id: "parties",
      number: "1",
      title: "Parties",
      isHighlighted: false,
      render(d) {
        const { esc } = H();
        return `
<div class="parties">
  <div class="party">
    <h3>Provider</h3>
    <p><strong>${esc(d.provider.name) || "—"}</strong></p>
    ${d.provider.id ? `<p>Tax ID: ${esc(d.provider.id)}</p>` : ""}
    <p>${esc(d.provider.email) || ""}</p>
    ${d.provider.phone ? `<p>${esc(d.provider.phone)}</p>` : ""}
  </div>
  <div class="party">
    <h3>Client</h3>
    <p><strong>${esc(d.client.name) || "—"}</strong>${d.client.company ? ` — ${esc(d.client.company)}` : ""}</p>
    ${d.client.id ? `<p>ID: ${esc(d.client.id)}</p>` : ""}
    <p>${esc(d.client.email) || ""}</p>
    ${d.client.phone ? `<p>${esc(d.client.phone)}</p>` : ""}
    ${d.client.address ? `<p>${esc(d.client.address)}</p>` : ""}
  </div>
</div>
<p>Both parties acknowledge having sufficient legal capacity to enter into this Agreement and declare their free and voluntary consent.</p>`;
      },
    },

    {
      id: "object",
      number: "2",
      title: "Subject Matter",
      render(d) {
        const { esc } = H();
        return `
<p>The <strong>Provider</strong> agrees to develop and deliver to the <strong>Client</strong> the following digital service:</p>
<div class="highlight">
  <p><strong>${esc(d.project.name) || esc(d.project.type) || "Digital project"}</strong> — ${esc(d.project.type) || ""}</p>
  <p>${esc(d.project.description) || "No description"}</p>
</div>`;
      },
    },

    {
      id: "scope",
      number: "3",
      title: "Scope of Work and Deliverables",
      render(d) {
        const { listify } = H();
        return `
<p>The project includes the following features and deliverables:</p>
<ul>${listify(d.project.features)}</ul>
${d.project.phases ? `<p><strong>Project phases:</strong></p><ul>${listify(d.project.phases)}</ul>` : ""}`;
      },
    },

    {
      id: "timeline",
      number: "4",
      title: "Delivery Timeline",
      render(d) {
        const { formatDate } = H();
        return `
<p><strong>Start date:</strong> ${formatDate(d.project.startDate, "en")}</p>
<p><strong>Estimated delivery date:</strong> ${formatDate(d.project.endDate, "en")}</p>
<p>Timelines may shift if the Client delays the delivery of required information, access credentials, or approvals.</p>`;
      },
    },

    {
      id: "payment",
      number: "5",
      title: "Payment Terms",
      render(d) {
        const { esc, formatMoney } = H();
        const cur = d.payment.currency || "USD";
        const initial = (d.payment.total || 0) * ((d.payment.initialPercent || 0) / 100);
        const remaining = (d.payment.total || 0) - initial;
        return `
<div class="highlight">
  <p><strong>Total amount:</strong> ${formatMoney(d.payment.total, cur)}</p>
  <p><strong>Initial payment (${d.payment.initialPercent || 0}%):</strong> ${formatMoney(initial, cur)}</p>
  <p><strong>Remaining balance:</strong> ${formatMoney(remaining, cur)}</p>
  <p><strong>Payment method:</strong> ${esc(d.payment.method) || "—"}</p>
  ${d.payment.details ? `<p><strong>Details:</strong> ${esc(d.payment.details)}</p>` : ""}
</div>
<p>The initial payment is due upon signing this Agreement. The remaining balance is due upon final delivery, unless otherwise agreed in writing.</p>`;
      },
    },

    {
      id: "client_duties",
      number: "6",
      title: "Client Responsibilities",
      render() {
        return `
<ul>
  <li>Provide in a timely manner all required information, content, access credentials, and assets.</li>
  <li>Review and approve milestones within the agreed timeframes.</li>
  <li>Comply with payments on the established dates.</li>
  <li>Designate a single point of contact for decision-making.</li>
</ul>`;
      },
    },

    {
      id: "provider_duties",
      number: "7",
      title: "Provider Responsibilities",
      render() {
        return `
<ul>
  <li>Develop the project according to the agreed scope.</li>
  <li>Maintain regular communication regarding progress.</li>
  <li>Deliver within the estimated timeframe, except in cases of Force Majeure.</li>
  <li>Maintain confidentiality regarding the Client's information.</li>
</ul>`;
      },
    },

    {
      id: "revisions",
      number: "8",
      title: "Revisions and Changes",
      render(d) {
        return `<p><strong>${d.extras.revisions || 0}</strong> revision round(s) are included within the agreed scope. Any additional modification or change beyond the initial scope (<em>scope creep</em>) will be quoted independently and requires written approval before execution.</p>`;
      },
    },

    {
      id: "support",
      number: "9",
      title: "Post-Delivery Support",
      render(d) {
        return `<p>${
          d.extras.support
            ? `Free technical support is included for <strong>${d.extras.supportDays || 30} day(s)</strong> following delivery, limited to bug fixes originating from the development.`
            : "Post-delivery support is not included in this Agreement. Support may be contracted separately."
        }</p>`;
      },
    },

    {
      id: "hosting",
      number: "10",
      title: "Hosting and Domain",
      render(d) {
        return `<p>${
          d.extras.hosting
            ? "Hosting and/or domain are included as described in the scope. Ownership remains in the Client's name."
            : "Hosting and domain are not included and are the Client's exclusive responsibility."
        }</p>`;
      },
    },

    {
      id: "ip",
      number: "11",
      title: "Intellectual Property Rights",
      render() {
        return `<p>Intellectual Property Rights over the final deliverables shall be transferred to the <strong>Client</strong> once the total contract payment has been completed. Until then, the rights remain with the <strong>Provider</strong>. The Provider may include the project in its portfolio unless an express confidentiality agreement states otherwise.</p>`;
      },
    },

    {
      id: "cancellation",
      number: "12",
      title: "Cancellation",
      render() {
        return `<p>If the Client cancels, the initial payment is non-refundable, as it covers work already started. If the Provider cancels without justified cause, it shall refund the proportional amount corresponding to undelivered work.</p>`;
      },
    },

    {
      id: "confidentiality",
      number: "13",
      title: "Confidentiality",
      render() {
        return `<p>Both Parties agree to keep confidential all Confidential Information accessed during the execution of the Agreement, even after its termination. This obligation shall survive for a minimum period of two (2) years from the termination of the Agreement.</p>`;
      },
    },

    {
      id: "liability_limit",
      number: "14",
      title: "Limitation of Liability",
      isHighlighted: true,
      render() {
        return `<p>IN NO EVENT SHALL THE PROVIDER'S TOTAL LIABILITY EXCEED THE AMOUNT PAID BY THE CLIENT UNDER THIS AGREEMENT. THE PROVIDER SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL DAMAGES, LOSS OF PROFITS, LOSS OF DATA, OR PUNITIVE DAMAGES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>`;
      },
    },

    {
      id: "warranty_disclaimer",
      number: "15",
      title: "Disclaimer of Implied Warranties",
      isHighlighted: true,
      render() {
        return `<p>EXCEPT AS EXPRESSLY SET FORTH IN THIS AGREEMENT, THE PROVIDER MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. DELIVERABLES ARE PROVIDED "AS IS" ONCE ACCEPTED BY THE CLIENT.</p>`;
      },
    },

    {
      id: "force_majeure",
      number: "16",
      title: "Force Majeure",
      render() {
        return `<p>Neither Party shall be liable for breaches arising from Force Majeure or Fortuitous Events (including, without limitation: natural disasters, pandemics, wars, terrorist acts, massive infrastructure failures, or governmental actions). The affected Party shall notify the other within a reasonable timeframe, and both shall agree in good faith to suspend or reschedule the affected obligations.</p>`;
      },
    },

    {
      id: "governing_law",
      number: "17",
      title: "Governing Law and Jurisdiction",
      render() {
        return `<p>This Agreement shall be governed by the laws applicable to the Provider's domicile. Any dispute shall be resolved preferably through amicable agreement and, failing that, before the competent courts of the Provider's domicile, unless the Parties agree in writing to submit to Mediation or Arbitration.</p>`;
      },
    },

    {
      id: "acceptance",
      number: "18",
      title: "Acceptance and Signatures",
      render() {
        return `<p>The Parties declare having read and accepted each clause of this Agreement, signing it as a sign of conformity.</p>`;
      },
    },
  ];

  window.CLAUSES_EN = CLAUSES_EN;
})();
