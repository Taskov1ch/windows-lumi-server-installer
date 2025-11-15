import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SplashScreen } from "./features/splash/SplashScreen";
import { WelcomeStep } from "./features/welcome/WelcomeStep";
import "./App.css";

function App() {
	const [showSplash, setShowSplash] = useState(true);

	return (
		<AnimatePresence mode="wait">
			{showSplash ? (
				<SplashScreen key="splash" onFinish={() => setShowSplash(false)} />
			) : (
				<motion.div
					key="app"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
					style={{ width: "100%", height: "100%" }}
				>
					<WelcomeStep />
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export default App;