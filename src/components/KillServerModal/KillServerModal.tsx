import React from "react";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle, FaSkull } from "react-icons/fa";
import { motion } from "framer-motion";
import "./KillServerModal.css";

interface KillServerModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export const KillServerModal: React.FC<KillServerModalProps> = ({
	isOpen,
	onConfirm,
	onCancel,
}) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	return (
		<div className="kill-modal-overlay" onClick={onCancel}>
			<motion.div
				className="kill-modal-content"
				onClick={(e) => e.stopPropagation()}
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
			>
				<div className="kill-header">
					<FaExclamationTriangle className="warning-icon" />
					<h3>{t("dashboard.modal_kill.title")}</h3>
				</div>

				<div className="kill-body">
					<p>{t("dashboard.modal_kill.description")}</p>
					<div className="warning-box">
						<p>{t("dashboard.modal_kill.warning")}</p>
					</div>
				</div>

				<div className="kill-actions">
					<button className="cancel-btn" onClick={onCancel}>
						{t("dashboard.modal_kill.cancel")}
					</button>
					<button className="kill-btn" onClick={onConfirm}>
						<FaSkull /> {t("dashboard.modal_kill.confirm")}
					</button>
				</div>
			</motion.div>
		</div>
	);
};