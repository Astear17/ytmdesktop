import { createI18n } from "vue-i18n";
import en from "./en.json";
import vi from "./vi.json";

const i18n = createI18n({
  legacy: false,
  locale: navigator.language.startsWith("vi") ? "vi" : "en",
  fallbackLocale: "en",
  messages: {
    en,
    vi
  }
});

export default i18n;
