import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FaExclamationCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
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
	type?: "error" | "warning" | "info";
	onClose: () => void;
}) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	let Icon = FaExclamationCircle;
	let iconClass = "error";

	if (type === "warning") {
		Icon = FaExclamationTriangle;
		iconClass = "warning";
	} else if (type === "info") {
		Icon = FaInfoCircle;
		iconClass = "info";
	}

	return (
		<div className="alert-modal-overlay" onClick={onClose}>
			<motion.div
				className="alert-modal-content"
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				onClick={(e) => e.stopPropagation()}
			>
				<div className={`alert-header ${iconClass}`}>
					<Icon className="alert-icon" />
					<h3>{title}</h3>
				</div>

				<div className="alert-body">
					<p className="alert-message">{message}</p>
				</div>

				<div className="alert-actions">
					<button className="alert-btn primary" onClick={onClose}>
						{t("common.acknowledge")}
					</button>
				</div>
			</motion.div>
		</div>
	);
};