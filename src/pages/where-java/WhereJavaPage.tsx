import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
	SiUbuntu,
	SiFedora,
	SiArchlinux,
	SiNixos,
} from "react-icons/si";
import { FaWindows, FaLinux } from "react-icons/fa";
import { IoRefreshSharp } from "react-icons/io5";

import { Platform, platform } from "@tauri-apps/plugin-os";
import { openUrl as open } from "@tauri-apps/plugin-opener";

import "./WhereJavaPage.css";
import { JavaConfig, WindowsInstructionsProps } from "../../types/java";

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
};

type LinuxDistro = "ubuntu" | "fedora" | "arch" | "nixos";

const LinuxInstructions: React.FC = () => {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState<LinuxDistro>("ubuntu");

	return (
		<div className="instruction-card">
			<h2 className="card-title">
				<FaLinux />
				{t("where_java.linux.title")}
			</h2>

			<div className="linux-tabs-header">
				<button
					className={`tab-button ${activeTab === "ubuntu" ? "active" : ""}`}
					onClick={() => setActiveTab("ubuntu")}
				>
					<SiUbuntu />
					{t("where_java.linux.tabs.ubuntu")}
				</button>
				<button
					className={`tab-button ${activeTab === "fedora" ? "active" : ""}`}
					onClick={() => setActiveTab("fedora")}
				>
					<SiFedora />
					{t("where_java.linux.tabs.fedora")}
				</button>
				<button
					className={`tab-button ${activeTab === "arch" ? "active" : ""}`}
					onClick={() => setActiveTab("arch")}
				>
					<SiArchlinux />
					{t("where_java.linux.tabs.arch")}
				</button>
				<button
					className={`tab-button ${activeTab === "nixos" ? "active" : ""}`}
					onClick={() => setActiveTab("nixos")}
				>
					<SiNixos />
					{t("where_java.linux.tabs.nixos")}
				</button>
			</div>

			<div className="linux-tab-content">
				<p className="code-title">{t("where_java.linux.code_title")}</p>

				{activeTab === "ubuntu" && (
					<motion.div
						key="ubuntu"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="code-snippet-group"
					>
						<div className="code-snippet">
							<span className="code-label">
								{t("where_java.linux.distros.ubuntu.label")}
							</span>
							<code className="code-content">
								{t("where_java.linux.distros.ubuntu.command")}
							</code>
						</div>
					</motion.div>
				)}

				{activeTab === "fedora" && (
					<motion.div
						key="fedora"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="code-snippet-group"
					>
						<div className="code-snippet">
							<span className="code-label">
								{t("where_java.linux.distros.fedora.label")}
							</span>
							<code className="code-content">
								{t("where_java.linux.distros.fedora.command")}
							</code>
						</div>
					</motion.div>
				)}

				{activeTab === "arch" && (
					<motion.div
						key="arch"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="code-snippet-group"
					>
						<div className="code-snippet">
							<span className="code-label">
								{t("where_java.linux.distros.arch.label")}
							</span>
							<code className="code-content">
								{t("where_java.linux.distros.arch.command")}
							</code>
						</div>
					</motion.div>
				)}

				{activeTab === "nixos" && (
					<motion.div
						key="nixos"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.3 }}
						className="code-snippet-group"
					>
						<div className="code-snippet">
							<span className="code-label">
								{t("where_java.linux.distros.nixos.label")}
							</span>
							<code className="code-content">
								{t("where_java.linux.distros.nixos.command")}
							</code>
							<span className="code-label-note">
								{t("where_java.linux.distros.nixos.note")}
							</span>
						</div>
					</motion.div>
				)}
			</div>
		</div>
	);
};

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

const WhereJavaPage: React.FC = () => {
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(false);
	const [userOS, setUserOS] = useState<Platform | null>(null);
	const [config, setConfig] = useState<JavaConfig | null>(null);

	useEffect(() => {
		const getPlatform = async () => {
			try {
				const osPlatform = await platform();
				setUserOS(osPlatform);
			} catch (e) {
				console.error("Failed to get platform:", e);
				setUserOS("windows");
			}
		};

		const getConfig = async () => {
			try {
				const response = await fetch("/config/java.json");
				const data = await response.json();
				setConfig(data);
			} catch (e) {
				console.error("Failed to fetch config:", e);
				setConfig({
					required_java_version: "21",
					windows_links: {
						adoptium: {
							url: "https://adoptium.net/temurin/releases/?version=21",
						},
					},
				});
			}
		};

		getPlatform();
		getConfig();
	}, []);

	const handleCheckAgain = () => {
		if (isLoading) return;
		setIsLoading(true);
		setTimeout(() => {
			console.log("Повторная проверка Java...");
			setIsLoading(false);
		}, 2000);
	};

	if (!config || !userOS) {
		return (
			<div className="java-page-container">
				<div className="java-page-content">
					<p>{t("where_java.loading_config")}</p>
				</div>
			</div>
		);
	}

	const isErrorText = t("where_java.java_not_found", {
		version: config.required_java_version,
	});

	return (
		<div className="java-page-container">

			<div className="java-glow-bg sphere1"></div>
			<div className="java-glow-bg sphere2"></div>

			<motion.div
				className="java-page-content"
				initial="hidden"
				animate="visible"
			>
				<motion.h1
					className="title-java-page"
					variants={itemVariants}
					transition={{ duration: 0.8 }}
				>
					{t("where_java.title")}
				</motion.h1>

				<motion.p
					className="subtitle-java-page"
					variants={itemVariants}
					transition={{ duration: 0.8, delay: 0.1 }}
				>
					{isErrorText}
				</motion.p>

				<motion.div
					className="instructions-wrapper"
					variants={itemVariants}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					{userOS === "linux" ? (
						<>
							<LinuxInstructions />
							<WindowsInstructions config={config} />
						</>
					) : (
						<>
							<WindowsInstructions config={config} />
							<LinuxInstructions />
						</>
					)}
				</motion.div>

				<motion.button
					onClick={handleCheckAgain}
					disabled={isLoading}
					className="check-button"
					variants={itemVariants}
					whileTap={{ scale: 0.95 }}
					transition={{ duration: 0.1 }}
				>
					<IoRefreshSharp className={isLoading ? "animate-spin" : ""} />
					{t("where_java.check_again_button")}
				</motion.button>

			</motion.div>
		</div>
	);
};

export default WhereJavaPage;