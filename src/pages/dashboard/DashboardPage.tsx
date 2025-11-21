import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCog, FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import { Server, ScanResult, RustServerConfig } from "../../types/server";
import ServerItem from "../../components/ServerItem/ServerItem";
import { getSavedServers, addSavedServer, removeSavedServer, SavedServer } from "../../utils/storeServers";
import "./DashboardPage.css";
import { AlertModal } from "../../components/AlertModal/AlerModal";
import { CoreSelectorModal } from "../../components/CoreSelectorModal/CoreSelectorModal";
import { KillServerModal } from "../../components/KillServerModal/KillServerModal";
import { DeleteServerModal } from "../../components/DeleteServerModal/DeleteServerModal";
import { ErrorLogModal } from "../../components/ErrorLogModal/ErrorLogModal";
import { StartErrorModal } from "../../components/StartErrorModal/StartErrorModal";

const DashboardPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(true);
	const [servers, setServers] = useState<Server[]>([]);
	const [loadingAnim, setLoadingAnim] = useState<any>(null);

	const [runningPids, setRunningPids] = useState<Record<string, number>>({});
	const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

	const [killModal, setKillModal] = useState<{ isOpen: boolean, serverId: string | null, pid: number | null }>({
		isOpen: false, serverId: null, pid: null
	});

	const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, serverId: string | null, serverName: string }>({
		isOpen: false, serverId: null, serverName: ""
	});

	const [startErrorModal, setStartErrorModal] = useState<{ isOpen: boolean, error: string }>({
		isOpen: false, error: ""
	});

	const [errorLogModal, setErrorLogModal] = useState<{ isOpen: boolean, error: string }>({
		isOpen: false, error: ""
	});

	const [pendingPath, setPendingPath] = useState<string | null>(null);
	const [pendingConfig, setPendingConfig] = useState<RustServerConfig | null>(null);
	const [jarList, setJarList] = useState<string[]>([]);
	const [showCoreSelector, setShowCoreSelector] = useState(false);

	const [alert, setAlert] = useState<{
		isOpen: boolean;
		title: string;
		message: string;
		type: "error" | "warning" | "info";
	}>({ isOpen: false, title: "", message: "", type: "error" });

	const showAlert = (title: string, message: string, type: "error" | "warning" | "info" = "error") => {
		setAlert({ isOpen: true, title, message, type });
	};

	useEffect(() => {
		const storedPids = localStorage.getItem("running_server_pids");
		if (storedPids) {
			try {
				setRunningPids(JSON.parse(storedPids));
			} catch (e) {
				console.error("Failed to parse running pids", e);
			}
		}
	}, []);

	const loadServers = useCallback(async () => {
		try {
			const savedList = await getSavedServers();

			const serverPromises = savedList.map(async (saved: SavedServer) => {
				try {
					const scanResult = await invoke<ScanResult>("scan_server_folder", {
						serverPath: saved.path,
					});

					if (scanResult.status === "NoSettings" || scanResult.status === "NoJars") {
						const errorMsg = scanResult.status === "NoSettings"
							? t("errors.settings_missing")
							: t("errors.no_jars");

						return {
							id: saved.id,
							name: saved.name,
							path: saved.path,
							status: "error",
							coreJar: saved.coreJar,
							settings: { motd: "", "server-port": 0, "max-players": 0 },
							errorMessage: errorMsg
						} as Server;
					}

					if (scanResult.status === "Valid" || scanResult.status === "NeedCoreSelection") {
						const { config, jars } = scanResult.data;

						const effectiveCore = saved.coreJar || "core.jar";

						if (!jars.includes(effectiveCore)) {
							return {
								id: saved.id,
								name: saved.name,
								path: saved.path,
								status: "error",
								coreJar: effectiveCore,
								settings: { motd: config.motd, "server-port": config.server_port, "max-players": config.max_players },
								errorMessage: t("errors.core_missing", { core: effectiveCore })
							} as Server;
						}

						const statusResult = await invoke<"online" | "offline" | "unknown">("check_server_status", {
							serverPath: saved.path,
						});

						return {
							id: saved.id,
							name: saved.name,
							path: saved.path,
							status: statusResult,
							coreJar: effectiveCore,
							settings: {
								motd: config.motd,
								"server-port": config.server_port,
								"max-players": config.max_players,
							},
						} as Server;
					}

					return {
						id: saved.id,
						name: saved.name,
						path: saved.path,
						status: "error",
						coreJar: saved.coreJar,
						settings: { motd: "", "server-port": 0, "max-players": 0 },
						errorMessage: "Unknown Scan Status"
					} as Server;

				} catch (e: any) {
					console.error("Error parsing server:", e);
					return {
						id: saved.id,
						name: saved.name,
						path: saved.path,
						status: "error",
						coreJar: saved.coreJar,
						settings: { motd: "", "server-port": 0, "max-players": 0 },
						errorMessage: typeof e === "string" ? e : (e.message || JSON.stringify(e))
					} as Server;
				}
			});

			const results = await Promise.all(serverPromises);
			const validServers = results.filter((s): s is Server => s !== null);
			setServers(validServers);

			setRunningPids(prevPids => {
				const newPids = { ...prevPids };
				let changed = false;

				validServers.forEach(server => {
					const isLoading = loadingStates[server.id];

					if (server.status === "online" && isLoading) {
						setLoadingStates(prev => ({ ...prev, [server.id]: false }));
					}

					if ((server.status === "offline" || server.status === "error") && !isLoading && newPids[server.id]) {
						delete newPids[server.id];
						changed = true;
					}
				});

				if (changed) {
					localStorage.setItem("running_server_pids", JSON.stringify(newPids));
					return newPids;
				}
				return prevPids;
			});

		} catch (error) {
			console.error("Failed to load servers", error);
		}
	}, [t, loadingStates]);

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

	const handleServerToggle = async (server: Server) => {
		if (loadingStates[server.id] || server.status === "error") return;

		if (server.status === "online" && runningPids[server.id]) {
			setKillModal({ isOpen: true, serverId: server.id, pid: runningPids[server.id] });
			return;
		}

		setLoadingStates(prev => ({ ...prev, [server.id]: true }));

		try {
			const pid = await invoke<number>("launch_server_terminal", {
				path: server.path,
				coreJar: server.coreJar,
			});

			const newPids = { ...runningPids, [server.id]: pid };
			setRunningPids(newPids);
			localStorage.setItem("running_server_pids", JSON.stringify(newPids));

		} catch (error: any) {
			console.error("Launch error:", error);
			setStartErrorModal({
				isOpen: true,
				error: typeof error === "string" ? error : (error.message || JSON.stringify(error))
			});

			setLoadingStates(prev => ({ ...prev, [server.id]: false }));
		}
	};

	const handleDeleteClick = (id: string, name: string) => {
		setDeleteModal({ isOpen: true, serverId: id, serverName: name });
	};

	const confirmDeleteServer = async () => {
		const { serverId } = deleteModal;
		if (!serverId) return;

		try {
			await removeSavedServer(serverId);
			await loadServers();
			setDeleteModal({ isOpen: false, serverId: null, serverName: "" });
		} catch (e: any) {
			showAlert(t("errors.action_failed"), e.toString(), "error");
			setDeleteModal({ isOpen: false, serverId: null, serverName: "" });
		}
	};

	const confirmKillServer = async () => {
		const { serverId, pid } = killModal;
		if (!pid || !serverId) return;

		setKillModal({ isOpen: false, serverId: null, pid: null });
		setLoadingStates(prev => ({ ...prev, [serverId]: true }));

		try {
			await invoke("stop_server", { pid: pid });

			const newPids = { ...runningPids };
			delete newPids[serverId];
			setRunningPids(newPids);
			localStorage.setItem("running_server_pids", JSON.stringify(newPids));

			await loadServers();
		} catch (e: any) {
			showAlert(t("errors.action_failed"), e.toString(), "error");
		} finally {
			setLoadingStates(prev => ({ ...prev, [serverId]: false }));
		}
	};

	const handleAddServer = async () => {
		try {
			const selected = await open({ directory: true, multiple: false, title: t("dashboard.select_server_folder") });
			if (selected && typeof selected === "string") {
				const currentList = await getSavedServers();
				if (currentList.some((s) => s.path === selected)) {
					showAlert(t("dashboard.alerts.duplicate.title"), t("dashboard.alerts.duplicate.message"), "warning");
					return;
				}
				await processNewServerFolder(selected);
			}
		} catch (err: any) {
			console.error("Add server error:", err);
			setErrorLogModal({
				isOpen: true,
				error: typeof err === "string" ? err : (err.message || JSON.stringify(err))
			});
		}
	};

	const processNewServerFolder = async (path: string) => {
		const result = await invoke<ScanResult>("scan_server_folder", { serverPath: path });
		switch (result.status) {
			case "NoSettings": showAlert(t("dashboard.alerts.not_server.title"), t("dashboard.alerts.not_server.message"), "error"); break;
			case "NoJars": showAlert(t("dashboard.alerts.no_jars.title"), t("dashboard.alerts.no_jars.message"), "error"); break;
			case "NeedCoreSelection": setPendingPath(path); setPendingConfig(result.data.config); setJarList(result.data.jars); setShowCoreSelector(true); break;
			case "Valid": await finalizeAddServer(path, result.data.config.motd, result.data.config.core_jar); break;
		}
	};

	const finalizeAddServer = async (path: string, _: string, coreJar: string) => {
		try {
			const folderName = path.split(/[\\/]/).pop() || t("dashboard.default_new_server");
			await addSavedServer(folderName, path, coreJar);
			setShowCoreSelector(false); setPendingPath(null); setPendingConfig(null); loadServers();
		} catch (e: any) { showAlert(t("errors.save_error"), e.toString(), "error"); }
	};


	const renderContent = () => {
		if (isLoading || !loadingAnim) {
			return (
				<motion.div key="loader" className="state-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
					<div className="loader-wrapper"><Lottie animationData={loadingAnim} loop={true} autoplay={true} /></div>
				</motion.div>
			);
		}

		if (servers.length === 0) {
			return (
				<motion.div key="empty" className="state-container empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
					<div className="empty-content">
						<h1>{t("dashboard.empty_title", "Здесь пусто")}</h1>
						<p>{t("dashboard.empty_subtitle", "Добавьте свой первый сервер, чтобы начать работу")}</p>
						<button className="main-action-btn" onClick={handleAddServer}><FaPlus /> {t("dashboard.add_first_server", "Добавить сервер")}</button>
					</div>
				</motion.div>
			);
		}

		return (
			<motion.div key="list" className="server-list-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
				<header className="dashboard-header">
					<h2>{t("dashboard.servers_title")} <span className="badge">{servers.length}</span></h2>
					<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
						<button className="icon-btn add" onClick={handleAddServer} title={t("dashboard.add_server_tooltip")}><FaPlus /></button>
					</div>
				</header>

				<div className="server-grid">
					{servers.map((server) => {
						const isOnline = server.status === "online";
						const hasPid = !!runningPids[server.id];
						const isExternal = isOnline && !hasPid;

						const serverName = server.name === "default.server_name"
							? t("dashboard.default_server_name", "Lumi Server")
							: server.name;

						return (
							<ServerItem
								key={server.id}
								server={server}
								isRunning={isOnline}
								isLoading={!!loadingStates[server.id]}
								isExternal={isExternal}
								onToggle={() => handleServerToggle(server)}
								onDelete={() => handleDeleteClick(server.id, serverName)}
							/>
						);
					})}
				</div>
			</motion.div>
		);
	};

	return (
		<div className="dashboard-page">
			<div className="top-actions">
				<button className="icon-btn settings" onClick={() => navigate("/settings")}><FaCog /></button>
			</div>

			<AnimatePresence>
				{alert.isOpen && <AlertModal isOpen={alert.isOpen} title={alert.title} message={alert.message} type={alert.type} onClose={() => setAlert(prev => ({ ...prev, isOpen: false }))} />}

				{showCoreSelector && <CoreSelectorModal isOpen={showCoreSelector} jars={jarList} onSelect={(jar) => { if (pendingPath && pendingConfig) finalizeAddServer(pendingPath, pendingConfig.motd, jar); }} onCancel={() => { setShowCoreSelector(false); setPendingPath(null); }} />}

				{killModal.isOpen && (
					<KillServerModal
						isOpen={killModal.isOpen}
						onConfirm={confirmKillServer}
						onCancel={() => setKillModal({ isOpen: false, serverId: null, pid: null })}
					/>
				)}

				{deleteModal.isOpen && (
					<DeleteServerModal
						isOpen={deleteModal.isOpen}
						serverName={deleteModal.serverName}
						onConfirm={confirmDeleteServer}
						onCancel={() => setDeleteModal({ isOpen: false, serverId: null, serverName: "" })}
					/>
				)}

				{errorLogModal.isOpen && (
					<ErrorLogModal
						isOpen={errorLogModal.isOpen}
						error={errorLogModal.error}
						onClose={() => setErrorLogModal({ isOpen: false, error: "" })}
					/>
				)}

				{startErrorModal.isOpen && (
					<StartErrorModal
						isOpen={startErrorModal.isOpen}
						error={startErrorModal.error}
						onClose={() => setStartErrorModal({ isOpen: false, error: "" })}
					/>
				)}
			</AnimatePresence>

			<AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
		</div>
	);
};

export default DashboardPage;