/* =========================================================
   i18n vanilla — sin dependencias
   Carga messages/{es,en}.json al boot y aplica via data-i18n*.
   API: window.I18N.{init,t,setLocale,apply,onChange}
========================================================= */
(function () {
  const STORAGE_KEY = "ai.locale";
  const SUPPORTED = ["es", "en"];

  const I18N = {
    locale: "es",
    messages: { es: {}, en: {} },
    _listeners: [],

    async init() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.includes(saved)) this.locale = saved;

      try {
        const [es, en] = await Promise.all([
          fetch("lib/messages/es.json").then((r) => r.json()),
          fetch("lib/messages/en.json").then((r) => r.json()),
        ]);
        this.messages.es = es;
        this.messages.en = en;
      } catch (err) {
        console.error("I18N: failed to load messages", err);
      }
      this.apply();
    },

    t(key, params = {}) {
      const val = key.split(".").reduce(
        (o, k) => (o == null ? undefined : o[k]),
        this.messages[this.locale]
      );
      if (val == null) return key;

      // ICU-lite:
      // - {var}
      // - {n, plural, one {# x} other {# y}}
      return String(val).replace(
        /\{(\w+)(?:,\s*plural,\s*one\s*\{([^}]+)\}\s*other\s*\{([^}]+)\})?\}/g,
        (_, k, one, other) => {
          if (one !== undefined) {
            const n = Number(params[k] ?? 0);
            return (n === 1 ? one : other).replace("#", String(n));
          }
          return params[k] != null ? String(params[k]) : "";
        }
      );
    },

    setLocale(loc) {
      if (!SUPPORTED.includes(loc)) return;
      this.locale = loc;
      try { localStorage.setItem(STORAGE_KEY, loc); } catch (_) {}
      this.apply();
      this._listeners.forEach((fn) => {
        try { fn(loc); } catch (_) {}
      });
    },

    onChange(fn) {
      this._listeners.push(fn);
    },

    apply() {
      document.documentElement.lang = this.locale;

      document.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = this.t(el.getAttribute("data-i18n"));
      });
      document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
        el.setAttribute("placeholder", this.t(el.getAttribute("data-i18n-ph")));
      });
      document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
        el.setAttribute("aria-label", this.t(el.getAttribute("data-i18n-aria")));
      });
      document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        el.setAttribute("title", this.t(el.getAttribute("data-i18n-title")));
      });
      document.querySelectorAll("[data-i18n-content]").forEach((el) => {
        el.setAttribute("content", this.t(el.getAttribute("data-i18n-content")));
      });

      // <option data-i18n="key"> está cubierto por data-i18n textContent.
      // <select data-i18n-empty="key"> = primer option vacío.
      document.querySelectorAll("select[data-i18n-empty]").forEach((sel) => {
        const first = sel.querySelector('option[value=""]');
        if (first) first.textContent = this.t(sel.getAttribute("data-i18n-empty"));
      });
    },
  };

  window.I18N = I18N;
})();
