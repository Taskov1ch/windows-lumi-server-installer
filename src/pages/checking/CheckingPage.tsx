import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";

import "./CheckingPage.css";

const CheckingPage = () => {
	const [animationData, setAnimationData] = useState(null);

	useEffect(() => {
		fetch("/animations/loading.json")
			.then((res) => res.json())
			.then((data) => setAnimationData(data));
	}, []);

	return (
		<motion.div
			className="checking-container"
			key="checking"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, transition: { duration: 0.3 } }}
			transition={{ duration: 0.3 }}
		>
			{animationData && (
				<div className="checking-lottie">
					<Lottie
						animationData={animationData}
						loop={true}
						autoplay={true}
					/>
				</div>
			)}
		</motion.div>
	);
};

export default CheckingPage;