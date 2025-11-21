import React from "react";
import { useTranslation } from "react-i18next";
import { FaTrashAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import "./DeleteServerModal.css";

interface DeleteServerModalProps {
	isOpen: boolean;
	serverName: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export const DeleteServerModal: React.FC<DeleteServerModalProps> = ({
	isOpen,
	serverName,
	onConfirm,
	onCancel,
}) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	return (
		<div className="delete-modal-overlay" onClick={onCancel}>
			<motion.div
				className="delete-modal-content"
				onClick={(e) => e.stopPropagation()}
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
			>
				<div className="delete-header">
					<FaTrashAlt className="delete-icon" />
					<h3>{t("dashboard.modal_delete.title")}</h3>
				</div>

				<div className="delete-body">
					<p>
						{t("dashboard.modal_delete.description")}{" "}
						<span className="server-name-highlight">"{serverName}"</span>?
					</p>
					<div className="delete-warning-box">
						<p>{t("dashboard.modal_delete.warning")}</p>
					</div>
				</div>

				<div className="delete-actions">
					<button className="cancel-btn" onClick={onCancel}>
						{t("dashboard.modal_delete.cancel")}
					</button>
					<button className="delete-confirm-btn" onClick={onConfirm}>
						<FaTrashAlt /> {t("dashboard.modal_delete.confirm")}
					</button>
				</div>
			</motion.div>
		</div>
	);
};