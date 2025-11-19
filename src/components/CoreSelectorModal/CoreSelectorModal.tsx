import { motion } from "framer-motion";
import { FaServer, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import "./CoreSelectorModal.css";

export const CoreSelectorModal = ({
	isOpen,
	jars,
	onSelect,
	onCancel,
}: {
	isOpen: boolean;
	jars: string[];
	onSelect: (jar: string) => void;
	onCancel: () => void;
}) => {
	const { t } = useTranslation();

	if (!isOpen) return null;

	return (
		<div className="modal-backdrop">
			<motion.div
				className="modal-container core-selector"
				initial={{ scale: 0.95, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.95, opacity: 0 }}
			>
				<div className="modal-header">
					<h3>{t("core_selector.title")}</h3>
					<button className="icon-btn close" onClick={onCancel}>
						<FaTimes />
					</button>
				</div>
				<p className="modal-description">
					{t("core_selector.description")}
				</p>
				<div className="jar-list">
					{jars.map((jar) => (
						<button key={jar} className="jar-item" onClick={() => onSelect(jar)}>
							<FaServer className="jar-icon" />
							<span>{jar}</span>
						</button>
					))}
				</div>
				<div className="modal-footer">
					<button className="modal-btn secondary" onClick={onCancel}>
						{t("common.cancel")}
					</button>
				</div>
			</motion.div>
		</div>
	);
};