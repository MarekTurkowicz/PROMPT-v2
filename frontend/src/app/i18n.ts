import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import auth from "@/locales/pl/auth.json";
import common from "@/locales/pl/common.json";

export const resources = { pl: { common, auth } } as const;

void i18n.use(initReactI18next).init({
  lng: "pl",
  fallbackLng: "pl",
  defaultNS: "common",
  resources,
  interpolation: { escapeValue: false },
});

export default i18n;
