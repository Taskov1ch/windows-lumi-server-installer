import React from "react";
import { useTranslation } from "react-i18next";
import { FaWindows } from "react-icons/fa";
import { openUrl as open } from "@tauri-apps/plugin-opener";
import { WindowsInstructionsProps } from "../../types/java";
import "./WindowsInstructions.css";

const WindowsInstructions: React.FC<WindowsInstructionsProps> = ({ config }) => {
	const { t } = useTranslation();

	/* @ts-ignore */
	const linkKeys: string[] = t("where_java.windows.link_order", {
		returnObjects: true,
	});

	const handleLinkClick = async (url: string) => {
		try {
			await open(url);
		} catch (err) {
			console.error("Failed to open URL:", err);
		}
	};

	return (
		<div className="instruction-card">
			<h2 className="card-title">
				<FaWindows />
				{t("where_java.windows.title")}
			</h2>

			<div className="windows-links-wrapper">
				{linkKeys.map((key) => {
					const url = config.windows_links[key]?.url;
					const name = t(`where_java.windows.links.${key}.name`);
					const description = t(
						`where_java.windows.links.${key}.description`
					);

					if (!url) return null;

					return (
						<div
							key={key}
							onClick={() => handleLinkClick(url)}
							className="download-link-card"
							role="button"
							tabIndex={0}
							onKeyDown={(e) => (e.key === "Enter" ? handleLinkClick(url) : null)}
						>
							<span className="download-link-title">{name}</span>
							<span className="download-link-description">
								{description}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default WindowsInstructions;