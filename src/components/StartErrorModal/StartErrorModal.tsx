import React from "react";
import { useTranslation } from "react-i18next";
import { FaExclamationCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import "./StartErrorModal.css";

interface StartErrorModalProps {
	isOpen: boolean;
	error: string;
	onClose: () => void;
}

export const StartErrorModal: React.FC<StartErrorModalProps> = ({
	isOpen,
	error,
	onClose,
}) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	return (
		<div className="start-error-overlay" onClick={onClose}>
			<motion.div
				className="start-error-content"
				onClick={(e) => e.stopPropagation()}
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
			>
				<div className="start-error-header">
					<FaExclamationCircle className="start-error-icon" />
					<h3>{t("dashboard.modal_start_error.title")}</h3>
				</div>

				<div className="start-error-body">
					<p>{t("dashboard.modal_start_error.description")}</p>
					<div className="error-message-box">
						<p className="error-message-text">{error}</p>
					</div>
				</div>

				<div className="start-error-actions">
					<button className="start-error-close-btn" onClick={onClose}>
						{t("dashboard.modal_start_error.close")}
					</button>
				</div>
			</motion.div>
		</div>
	);
};