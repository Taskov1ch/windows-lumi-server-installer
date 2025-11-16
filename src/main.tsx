import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import i18n from "./lib/i18n";
import { HashRouter } from "react-router-dom";
import { getLanguage } from "./utils/storeSettings";

(async () => {
	try {
		const savedLang = await getLanguage();

		await i18n.changeLanguage(savedLang);
	} catch (error) {
		console.error("Failed to load language settings:", error);
	}

	ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
		<React.StrictMode>
			<HashRouter>
				<App />
			</HashRouter>
		</React.StrictMode>,
	);
})();