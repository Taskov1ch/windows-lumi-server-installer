import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import ruTranslation from "../locales/ru.json";
import enTranslation from "../locales/en.json";

const resources = {
	en: enTranslation,
	ru: ruTranslation,
};

i18next
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		lng: "en",
		debug: true,

		interpolation: {
			escapeValue: false,
		},
	});

export default i18next;