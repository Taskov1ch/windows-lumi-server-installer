import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ruTranslation from "../locales/ru.json";
import enTranslation from "../locales/en.json";

const resources = {
	en: enTranslation,
	ru: ruTranslation,
};

i18next
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		debug: true,

		interpolation: {
			escapeValue: false,
		},

		detection: {
			order: ["localStorage", "navigator"],
			caches: ["localStorage"]
		}
	});

export default i18next;