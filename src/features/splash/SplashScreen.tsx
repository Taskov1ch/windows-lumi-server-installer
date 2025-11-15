import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { useTranslation } from "react-i18next";

import "./SplashScreen.css";

interface SplashScreenProps {
	onFinish?: () => void;
}

export const SplashScreen = ({ onFinish }: SplashScreenProps) => {
	const [animationData, setAnimationData] = useState(null);
	const { t } = useTranslation();

	useEffect(() => {
		fetch("/lumi_animated.json")
			.then((res) => res.json())
			.then((data) => setAnimationData(data));

		const timer = setTimeout(() => {
			if (onFinish) onFinish();
		}, 3500);

		return () => clearTimeout(timer);
	}, [onFinish]);

	if (!animationData) return null;

	return (
		<motion.div
			className="splash-container"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, transition: { duration: 0.8 } }}
		>
			<motion.div
				className="splash-glow-bg"
				animate={{
					scale: [0.8, 1.2, 0.8],
					opacity: [0.2, 0.5, 0.2],
				}}
				transition={{
					duration: 4,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			/>

			<div className="splash-content">
				<div className="splash-lottie">
					<Lottie
						animationData={animationData}
						loop={false}
						autoplay={true}
					/>
				</div>

				<motion.h1
					className="splash-title"
					initial={{
						filter: "blur(10px)",
						transform: "scale(1.6)",
						opacity: 0
					}}
					animate={{
						filter: "blur(0px)",
						transform: "scale(1)",
						opacity: 1
					}}
					transition={{
						duration: 1.5,
						ease: "easeOut",
						delay: 0.5
					}}
				>
					{t("title")}
				</motion.h1>
			</div>
		</motion.div>
	);
};