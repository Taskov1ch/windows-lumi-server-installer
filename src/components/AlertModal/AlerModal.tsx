import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import "./AlertModal.css";

export const AlertModal = ({
	isOpen,
	title,
	message,
	type = "error",
	onClose,
}: {
	isOpen: boolean;
	title: string;
	message: string;
	type?: "error" | "warning";
	onClose: () => void;
}) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<motion.div
				className={`modal-container alert-type-${type}`}
				initial={{ scale: 0.9, opacity: 0, y: 20 }}
				animate={{ scale: 1, opacity: 1, y: 0 }}
				exit={{ scale: 0.9, opacity: 0, y: 20 }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-icon">
					<img src="/images/1.svg" alt="Alert Icon" className="alert-svg-icon" />
				</div>
				<h3 className="modal-title">{title}</h3>
				<p className="modal-message">{message}</p>
				<button className="modal-btn primary" onClick={onClose}>
					{t("common.acknowledge")}
				</button>
			</motion.div>
		</div>
	);
};