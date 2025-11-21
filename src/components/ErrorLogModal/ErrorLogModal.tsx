import React from "react";
import { useTranslation } from "react-i18next";
import { FaBug, FaCopy, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import "./ErrorLogModal.css";

interface ErrorLogModalProps {
	isOpen: boolean;
	error: string;
	onClose: () => void;
}

export const ErrorLogModal: React.FC<ErrorLogModalProps> = ({
	isOpen,
	error,
	onClose,
}) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	const handleCopy = () => {
		navigator.clipboard.writeText(error);
	};

	return (
		<div className="error-modal-overlay" onClick={onClose}>
			<motion.div
				className="error-modal-content"
				onClick={(e) => e.stopPropagation()}
				initial={{ opacity: 0, y: 20, scale: 0.95 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				exit={{ opacity: 0, y: 20, scale: 0.95 }}
			>
				<div className="error-header">
					<FaBug className="error-icon" />
					<h3>{t("dashboard.modal_error_log.title")}</h3>
				</div>

				<p className="error-description">
					{t("dashboard.modal_error_log.description")}
				</p>

				<div className="error-log-container">
					<pre className="error-log-text">{error}</pre>
				</div>

				<div className="error-actions">
					<button className="copy-btn" onClick={handleCopy}>
						<FaCopy /> {t("dashboard.modal_error_log.copy")}
					</button>
					<button className="close-error-btn" onClick={onClose}>
						<FaTimes /> {t("dashboard.modal_error_log.close")}
					</button>
				</div>
			</motion.div>
		</div>
	);
};