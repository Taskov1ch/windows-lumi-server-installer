import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import SplashScreen from "./pages/splash/SplashScreen";
import WelcomeStep from "./pages/welcome/WelcomeStep";
import WhereJavaPage from "./pages/where-java/WhereJavaPage";
import { JavaCheckResult } from "./types/java";
import CheckingPage from "./pages/checking/CheckingPage";

import "./App.css";

function App() {
	const [showSplash, setShowSplash] = useState(true);
	const navigate = useNavigate();
	const location = useLocation();

	const onSplashFinish = () => {
		setShowSplash(false);
		navigate("/checking");
	};

	useEffect(() => {
		if (!showSplash && location.pathname === "/checking") {
			const timer = setTimeout(() => {
				checkJava();
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [showSplash, location.pathname, navigate]);

	const checkJava = async () => {
		try {
			const response = await fetch("/config/java.json");
			const config = await response.json();
			const requiredVersion = config.required_java_version || "21";

			const result: JavaCheckResult = await invoke("check_java_version", {
				requiredVersionStr: requiredVersion,
			});

			if (result.is_compatible) {
				navigate("/welcome");
			} else {
				navigate("/java-missing");
			}
		} catch (err) {
			console.error("Не удалось проверить Java или загрузить конфиг:", err);
			navigate("/java-missing");
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
						<Routes location={location} key={location.pathname}>
							<Route path="/checking" element={<CheckingPage />} />
							<Route path="/java-missing" element={<WhereJavaPage />} />
							<Route
								path="/welcome"
								element={
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
								}
							/>
							<Route path="*" element={<CheckingPage />} />
						</Routes>
					</AnimatePresence>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default App;