import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import SplashScreen from "./pages/splash/SplashScreen";
import WelcomeStep from "./pages/welcome/WelcomeStep";
import WhereJavaPage from "./pages/where-java/WhereJavaPage";
import { JavaCheckResult } from "./types/java";
import CheckingPage from "./pages/checking/CheckingPage";

import "./App.css";

function App() {
	const [showSplash, setShowSplash] = useState(true);
	const [appFlowStep, setAppFlowStep] = useState<
		"checking" | "java-missing" | "welcome"
	>("checking");

	const onSplashFinish = () => {
		setShowSplash(false);
	};

	useEffect(() => {
		if (!showSplash && appFlowStep === "checking") {
			const timer = setTimeout(() => {
				checkJava();
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [showSplash, appFlowStep]);

	const checkJava = async () => {
		try {
			const response = await fetch("/config/java.json");
			const config = await response.json();
			const requiredVersion = config.required_java_version || "21";

			const result: JavaCheckResult = await invoke("check_java_version", {
				requiredVersionStr: requiredVersion,
			});

			if (result.is_compatible) {
				setAppFlowStep("welcome");
			} else {
				setAppFlowStep("java-missing");
			}
		} catch (err) {
			console.error("Не удалось проверить Java или загрузить конфиг:", err);
			setAppFlowStep("java-missing");
		}
	};

	return (
		<AnimatePresence mode="wait">
			{showSplash ? (
				<SplashScreen key="splash" onFinish={onSplashFinish} />
			) : (
				<motion.div
					key="app"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					style={{ width: "100%", height: "100%" }}
				>
					<AnimatePresence mode="wait">
						{appFlowStep === "checking" && (
							<CheckingPage key="checking" />
						)}

						{appFlowStep === "java-missing" && (
							<WhereJavaPage
								key="where-java"
							/>
						)}

						{appFlowStep === "welcome" && (
							<motion.div
								key="welcome-wrapper"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, transition: { duration: 0.3 } }}
								transition={{ duration: 0.6 }}
								style={{ width: "100%", height: "100%" }}
							>
								<WelcomeStep />
							</motion.div>
						)}
					</AnimatePresence>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default App;