import React, { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
	SiUbuntu,
	SiFedora,
	SiArchlinux,
	SiNixos,
} from "react-icons/si";
import { FaLinux } from "react-icons/fa";

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

export default LinuxInstructions;