/* =========================================================
   GLOSARIO LEGAL BILINGÜE — Acuerdo Inteligente
   Equivalencias legales OFICIALES (no traducciones literales).
   Referencia para quien añada cláusulas nuevas.
   No se invoca en runtime durante la generación del PDF.
========================================================= */
(function () {
  const LEGAL_GLOSSARY = {
    // Conceptos fundamentales
    "Fuerza Mayor": "Force Majeure",
    "Acto de Dios": "Act of God",
    "Caso Fortuito": "Fortuitous Event",

    // Incumplimiento
    "Incumplimiento Material": "Material Breach",
    "Incumplimiento Sustancial": "Substantial Non-Performance",
    "Subsanación": "Cure Period",
    "Mora": "Default",

    // Responsabilidad
    "Daños y Perjuicios": "Damages and Liabilities",
    "Daños Directos": "Direct Damages",
    "Daños Indirectos": "Indirect Damages",
    "Daños Consecuenciales": "Consequential Damages",
    "Lucro Cesante": "Loss of Profits",
    "Daño Emergente": "Actual Damages",
    "Limitación de Responsabilidad": "Limitation of Liability",

    // Propiedad Intelectual
    "Propiedad Intelectual": "Intellectual Property Rights (IPR)",
    "Derechos de Autor": "Copyright",
    "Marca Registrada": "Trademark",
    "Código Fuente": "Source Code",
    "Licencia": "License",
    "Cesión": "Assignment",
    "Transferencia de Derechos": "Transfer of Rights",
    "Licencia Perpetua No Exclusiva": "Perpetual Non-Exclusive License",

    // Confidencialidad
    "Acuerdo de Confidencialidad": "Non-Disclosure Agreement (NDA)",
    "Información Confidencial": "Confidential Information",
    "Información Propietaria": "Proprietary Information",

    // Resolución de conflictos
    "Mediación": "Mediation",
    "Arbitraje": "Arbitration",
    "Arbitraje Vinculante": "Binding Arbitration",
    "Jurisdicción": "Jurisdiction",
    "Ley Aplicable": "Governing Law",
    "Laudo Arbitral": "Arbitration Award",
    "Cláusula Compromisoria": "Arbitration Clause",
    "Renuncia a Juicio por Jurado": "Jury Trial Waiver",

    // Contrato
    "Contrato": "Agreement / Contract",
    "Anexo": "Addendum / Exhibit / Appendix",
    "Cláusula": "Clause / Section",
    "Disposición": "Provision",
    "Considerando": "Whereas",
    "Por Cuanto": "Whereas",
    "Las Partes": "The Parties",
    "Objeto del Contrato": "Subject Matter",
    "Alcance": "Scope of Work (SOW)",
    "Vigencia": "Term / Duration",
    "Terminación": "Termination",
    "Rescisión": "Rescission",
    "Resolución": "Cancellation",

    // Pagos
    "Contraprestación": "Consideration",
    "Honorarios": "Fees",
    "Inversión": "Investment",
    "Hito de Pago": "Payment Milestone",
    "Interés Moratorio": "Late Payment Interest",
    "Factura": "Invoice",
    "Comprobante de Pago": "Payment Receipt",

    // Entregables
    "Entregable": "Deliverable",
    "Especificaciones": "Specifications",
    "Criterios de Aceptación": "Acceptance Criteria",
    "Prueba de Aceptación": "Acceptance Testing (UAT)",
    "Orden de Cambio": "Change Order / Change Request",

    // Garantías
    "Garantía": "Warranty",
    "Garantía Expresa": "Express Warranty",
    "Garantía Implícita": "Implied Warranty",
    "Exclusión de Garantías": "Disclaimer of Warranties",
    "Idoneidad para un Propósito": "Fitness for Purpose",
    "Comerciabilidad": "Merchantability",
    "No Infracción": "Non-Infringement",

    // Misc
    "Contratistas Independientes": "Independent Contractors",
    "Divisibilidad": "Severability",
    "Renuncia": "Waiver",
    "Integridad del Acuerdo": "Entire Agreement",
    "Notificación": "Notice",
    "Buena Fe": "Good Faith",
    "Esfuerzos Razonables": "Reasonable Efforts",
    "Debida Diligencia": "Due Diligence",
    "Idioma Prevaleciente": "Prevailing Language",
  };

  function getLegalEquivalent(spanishTerm) {
    return Object.prototype.hasOwnProperty.call(LEGAL_GLOSSARY, spanishTerm)
      ? LEGAL_GLOSSARY[spanishTerm]
      : null;
  }

  window.LEGAL_GLOSSARY = LEGAL_GLOSSARY;
  window.getLegalEquivalent = getLegalEquivalent;
})();
