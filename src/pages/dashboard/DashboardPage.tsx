import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCog, FaPlus, FaSync } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import { Server, ScanResult, RustServerConfig } from "../../types/server";
import ServerItem from "../../components/ServerItem/ServerItem";
import { getSavedServers, addSavedServer, SavedServer } from "../../utils/storeServers";
import "./DashboardPage.css";
import { AlertModal } from "../../components/AlertModal/AlerModal";
import { CoreSelectorModal } from "../../components/CoreSelectorModal/CoreSelectorModal";

const DashboardPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(true);
	const [servers, setServers] = useState<Server[]>([]);
	const [loadingAnim, setLoadingAnim] = useState<any>(null);

	const [pendingPath, setPendingPath] = useState<string | null>(null);
	const [pendingConfig, setPendingConfig] = useState<RustServerConfig | null>(null);
	const [jarList, setJarList] = useState<string[]>([]);
	const [showCoreSelector, setShowCoreSelector] = useState(false);

	const [alert, setAlert] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		type: "error" | "warning";
	}>({ isOpen: false, title: "", message: "", type: "error" });

	const showAlert = (title: string, message: string, type: "error" | "warning" = "error") => {
		setAlert({ isOpen: true, title, message, type });
	};

	const closeAlert = () => {
		setAlert((prev) => ({ ...prev, isOpen: false }));
	};

	const loadServers = useCallback(async () => {
		try {
			const savedList = await getSavedServers();

			const serverPromises = savedList.map(async (saved: SavedServer) => {
				try {
					const scanResult = await invoke<ScanResult>("scan_server_folder", {
						serverPath: saved.path,
					});

					const statusResult = await invoke<"online" | "offline" | "unknown">("check_server_status", {
						serverPath: saved.path,
					});

					if (scanResult.status === "Valid" || scanResult.status === "NeedCoreSelection") {
						const data = scanResult.status === "Valid" ? scanResult.data : scanResult.data.config;

						const effectiveCore = (scanResult.status === "Valid" ? scanResult.data.core_jar : null)
							|| saved.coreJar
							|| "core.jar";

						return {
							id: saved.id,
							name: saved.name,
							path: saved.path,
							status: statusResult,
							coreJar: effectiveCore,
							settings: {
								motd: data.motd,
								"server-port": data.server_port,
								"max-players": data.max_players,
							},
						} as Server;
					}

					return {
						id: saved.id,
						name: saved.name,
						path: saved.path,
						status: "unknown",
						coreJar: saved.coreJar || "core.jar",
						settings: { motd: t("dashboard.status.unknown"), "server-port": 0, "max-players": 0 },
					} as Server;
				} catch (e) {
					console.error("Error parsing server:", e);
					return null;
				}
			});

			const results = await Promise.all(serverPromises);
			setServers(results.filter((s): s is Server => s !== null));
		} catch (error) {
			console.error("Failed to load servers", error);
		}
	}, [t]);

	useEffect(() => {
		fetch("/animations/loading.json")
			.then((res) => res.json())
			.then((data) => setLoadingAnim(data));

		const initialLoad = async () => {
			setIsLoading(true);
			await loadServers();
			setIsLoading(false);
		};
		initialLoad();

		const refreshInterval = setInterval(() => {
			loadServers();
		}, 5000);

		return () => clearInterval(refreshInterval);
	}, [loadServers]);

	const handleAddServer = async () => {
		try {
			const selected = await open({
				directory: true,
				multiple: false,
				title: t("dashboard.select_server_folder"),
			});

			if (selected && typeof selected === "string") {
				const currentList = await getSavedServers();
				const isDuplicate = currentList.some((s) => s.path === selected);

				if (isDuplicate) {
					showAlert(
						t("dashboard.alerts.duplicate.title"),
						t("dashboard.alerts.duplicate.message"),
						"warning"
					);
					return;
				}

				await processNewServerFolder(selected);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const processNewServerFolder = async (path: string) => {
		const result = await invoke<ScanResult>("scan_server_folder", { serverPath: path });

		switch (result.status) {
			case "NoSettings":
				showAlert(
					t("dashboard.alerts.not_server.title"),
					t("dashboard.alerts.not_server.message"),
					"error"
				);
				break;

			case "NoJars":
				showAlert(
					t("dashboard.alerts.no_jars.title"),
					t("dashboard.alerts.no_jars.message"),
					"error"
				);
				break;

			case "NeedCoreSelection":
				setPendingPath(path);
				setPendingConfig(result.data.config);
				setJarList(result.data.jars);
				setShowCoreSelector(true);
				break;

			case "Valid":
				await finalizeAddServer(path, result.data.motd, result.data.core_jar);
				break;
		}
	};

	const finalizeAddServer = async (path: string, _: string, coreJar: string) => {
		try {
			const folderName = path.split(/[\\/]/).pop() || t("dashboard.default_new_server");
			await addSavedServer(folderName, path, coreJar);

			setShowCoreSelector(false);
			setPendingPath(null);
			setPendingConfig(null);
			loadServers();
		} catch (e: any) {
			showAlert(t("errors.save_error"), e.toString(), "error");
		}
	};

	const renderContent = () => {
		if (isLoading || !loadingAnim) {
			return (
				<motion.div key="loader" className="state-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<div className="loader-wrapper">
						<Lottie animationData={loadingAnim} loop={true} autoplay={true} />
					</div>
				</motion.div>
			);
		}

		if (servers.length === 0) {
			return (
				<motion.div key="empty" className="state-container empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
					<div className="empty-content">
						<h1>{t("dashboard.empty_title", "Здесь пусто")}</h1>
						<p>{t("dashboard.empty_subtitle", "Добавьте свой первый сервер, чтобы начать работу")}</p>
						<button className="main-action-btn" onClick={handleAddServer}>
							<FaPlus /> {t("dashboard.add_first_server", "Добавить сервер")}
						</button>
					</div>
				</motion.div>
			);
		}

		return (
			<motion.div key="list" className="server-list-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
				<header className="dashboard-header">
					<h2>{t("dashboard.servers_title")} <span className="badge">{servers.length}</span></h2>

					<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
						<button className="icon-btn add" onClick={handleAddServer} title={t("dashboard.add_server_tooltip")}>
							<FaPlus />
						</button>
					</div>
				</header>

				<div className="server-grid">
					{servers.map((server) => (
						<ServerItem key={server.id} server={server} />
					))}
				</div>
			</motion.div>
		);
	};

	return (
		<div className="dashboard-page">
			<div className="top-actions">
				<button className="icon-btn settings" onClick={() => navigate("/settings")}>
					<FaCog />
				</button>
			</div>

			<AnimatePresence>
				{alert.isOpen && (
					<AlertModal
						isOpen={alert.isOpen}
						title={alert.title}
						message={alert.message}
						type={alert.type}
						onClose={closeAlert}
					/>
				)}
				{showCoreSelector && (
					<CoreSelectorModal
						isOpen={showCoreSelector}
						jars={jarList}
						onSelect={(jar) => {
							if (pendingPath && pendingConfig) {
								finalizeAddServer(pendingPath, pendingConfig.motd, jar);
							}
						}}
						onCancel={() => {
							setShowCoreSelector(false);
							setPendingPath(null);
						}}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence mode="wait">
				{renderContent()}
			</AnimatePresence>
		</div>
	);
};

export default DashboardPage;