import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SplashScreen from "./pages/splash/SplashScreen";
import WelcomeStep from "./pages/welcome/WelcomeStep";
import WhereJavaPage from "./pages/where-java/WhereJavaPage";
import "./App.css";

// TODO: Заменить на проверку Java
const JAVA_IS_INSTALLED = false;

function App() {
	const [showSplash, setShowSplash] = useState(true);
	const [appFlowStep] = useState(
		JAVA_IS_INSTALLED ? 'welcome' : 'java-missing'
	);

	const onSplashFinish = () => {
		setShowSplash(false);
	}

	return (
		<AnimatePresence mode="wait">
			{showSplash ? (
				<SplashScreen key="splash" onFinish={onSplashFinish} />
			) : (
				<motion.div
					key="app"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					style={{ width: "100%", height: "100%" }}
				>
					<AnimatePresence mode="wait">
						{appFlowStep === 'java-missing' && (
							<WhereJavaPage
								key="where-java"
							// TODO: Добавить onJavaFound={() => setAppFlowStep('welcome')}
							/>
						)}

						{appFlowStep === 'welcome' && (
							<motion.div
								key="welcome-wrapper"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
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