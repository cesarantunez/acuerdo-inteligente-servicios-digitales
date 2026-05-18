/* =========================================================
   ETIQUETAS LOCALIZADAS — mapping de valores internos
   (values de <select>) a su etiqueta visible en cada idioma.
   Se usa tanto en clauses-es.js / clauses-en.js como en
   renderContractHtml() para asegurar que el contrato NUNCA
   muestre los valores crudos ("web", "stripe", "USD"), sino
   sus etiquetas humanas en el idioma del PDF.
========================================================= */
(function () {
  const PROJECT_TYPE = {
    es: {
      web: "Página web",
      mobile: "Aplicación móvil",
      saas: "Aplicación web / SaaS",
      automation: "Automatización / Integración",
      ecommerce: "E-commerce",
      branding: "Branding / Diseño",
      ai: "Inteligencia Artificial",
      other: "Otro",
    },
    en: {
      web: "Website",
      mobile: "Mobile app",
      saas: "Web app / SaaS",
      automation: "Automation / Integration",
      ecommerce: "E-commerce",
      branding: "Branding / Design",
      ai: "Artificial Intelligence",
      other: "Other",
    },
  };

  const PAYMENT_METHOD = {
    es: {
      stripe: "Stripe",
      paypal: "PayPal",
      zelle: "Zelle",
      bank: "Transferencia bancaria",
      wise: "Wise",
      crypto: "Crypto (USDT/BTC)",
      cash: "Efectivo",
    },
    en: {
      stripe: "Stripe",
      paypal: "PayPal",
      zelle: "Zelle",
      bank: "Bank transfer",
      wise: "Wise",
      crypto: "Crypto (USDT/BTC)",
      cash: "Cash",
    },
  };

  const CURRENCY = {
    es: {
      USD: "Dólar estadounidense",
      MXN: "Peso mexicano",
      EUR: "Euro",
      COP: "Peso colombiano",
      ARS: "Peso argentino",
      CLP: "Peso chileno",
      PEN: "Sol peruano",
    },
    en: {
      USD: "US Dollar",
      MXN: "Mexican Peso",
      EUR: "Euro",
      COP: "Colombian Peso",
      ARS: "Argentine Peso",
      CLP: "Chilean Peso",
      PEN: "Peruvian Sol",
    },
  };

  function pick(map, locale, value) {
    const lc = locale === "en" ? "en" : "es";
    if (!value) return "";
    return (map[lc] && map[lc][value]) || value;
  }

  window.LABELS = {
    projectType: (loc, v) => pick(PROJECT_TYPE, loc, v),
    paymentMethod: (loc, v) => pick(PAYMENT_METHOD, loc, v),
    currency: (loc, v) => pick(CURRENCY, loc, v),
    _raw: { PROJECT_TYPE, PAYMENT_METHOD, CURRENCY },
  };
})();
