import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCog } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";

import { Server } from "../../types/server";
import ServerItem from "../../components/ServerItem/ServerItem";
import "./DashboardPage.css";

const MOCK_SERVERS: Server[] = [
	{
		id: "1",
		name: "Мой главный сервер",
		path: "D:\\Projects\\lumi_server_main",
		status: "online",
		settings: {
			motd: "§e§lLumi§f§r Server §c§n1.21§r §7(Онлайн!)",
			"server-port": 19132,
			"max-players": 50,
		},
	},
	{
		id: "2",
		name: "default.server_name",
		path: "C:\\Users\\Admin\\Desktop\\test_server",
		status: "offline",
		settings: {
			motd: "§aТестовый §bсервер §m(Выключен)",
			"server-port": 19133,
			"max-players": 10,
		},
	},
	{
		id: "3",
		name: "Сервер для друзей",
		path: "/home/user/lumi_friends",
		status: "unknown",
		settings: {
			motd: "§d§oПриватный мир...",
			"server-port": 19134,
			"max-players": 20,
		},
	},
];

const DashboardPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(true);
	const [servers, setServers] = useState<Server[]>([]);
	const [loadingAnim, setLoadingAnim] = useState(null);

	useEffect(() => {
		fetch("/animations/loading.json")
			.then((res) => res.json())
			.then((data) => setLoadingAnim(data));
	}, []);

	// TODO: Снести
	useEffect(() => {
		const timer = setTimeout(() => {
			// setServers([]);
			setServers(MOCK_SERVERS);
			setIsLoading(false);
		}, 2000);

		return () => clearTimeout(timer);
	}, []);

	const renderContent = () => {
		if (isLoading || !loadingAnim) {
			return (
				<motion.div
					key="loading"
					className="dashboard-state-container"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
				>
					<div className="lottie-loader">
						<Lottie
							animationData={loadingAnim}
							loop={true}
							autoplay={true}
						/>
					</div>
				</motion.div>
			);
		}

		if (servers.length === 0) {
			return (
				<motion.div
					key="empty"
					className="dashboard-state-container empty-state"
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0 }}
				>
					<h1>{t("dashboard.empty_title", "🤷")}</h1>
					<p>{t("dashboard.empty_subtitle", "Oops...")}</p>
				</motion.div>
			);
		}

		return (
			<motion.div
				key="list"
				className="server-list-container"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
			>
				<h2>{t("dashboard.servers_title", "My servers")}</h2>
				<div className="server-list">
					{servers.map((server) => (
						<ServerItem key={server.id} server={server} />
					))}
				</div>
			</motion.div>
		);
	};

	return (
		<div className="dashboard-page">
			<button
				onClick={() => navigate("/settings")}
				className="settings-button"
				title={t("settings.title")}
			>
				<FaCog />
			</button>

			<AnimatePresence mode="wait">
				{renderContent()}
			</AnimatePresence>
		</div>
	);
};

export default DashboardPage;