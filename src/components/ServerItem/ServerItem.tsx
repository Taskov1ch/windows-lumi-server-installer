import { useTranslation } from "react-i18next";
import { Server } from "../../types/server";
import { parseMotd } from "../../utils/minecraftFormatter";
import { FaPencilAlt } from "react-icons/fa";
import "./ServerItem.css";

interface ServerItemProps {
	server: Server;
}

const ServerItem = ({ server }: ServerItemProps) => {
	const { t } = useTranslation();
	const { name, status, path, settings } = server;

	const serverName =
		name === "default.server_name"
			? t("dashboard.default_server_name", "Lumi Server")
			: name;

	const motdNodes = parseMotd(settings.motd);

	const handleEditClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		console.log("Edit server:", server.id);
		// TODO: Редактор
	};

	return (
		<div className="server-item">
			<div className="server-info">
				<h3 className="server-name">
					<div
						className={`status-indicator ${status}`}
						title={t(`dashboard.status.${status}`, status)}
					/>
					<span>{serverName}</span>
				</h3>

				<p className="server-path" title={path}>{path}</p>

				<div className="server-settings">
					<span className="setting-item motd-item">
						<label>{t("dashboard.label_motd", "MOTD")}:</label>
						<span className="motd-container">{motdNodes}</span>
					</span>

					<span className="setting-separator">|</span>

					<span className="setting-item">
						<label>{t("dashboard.label_port", "Port")}:</label>
						<span>{settings["server-port"]}</span>
					</span>

					<span className="setting-separator">|</span>

					<span className="setting-item">
						<label>{t("dashboard.label_players", "Players")}:</label>
						<span>{settings["max-players"]}</span>
					</span>
				</div>
			</div>

			<div className="server-actions">
				<button
					className="server-edit-button"
					title={t("dashboard.edit_server_title", "Edit")}
					onClick={handleEditClick}
				>
					<FaPencilAlt />
				</button>
			</div>
		</div>
	);
};

export default ServerItem;