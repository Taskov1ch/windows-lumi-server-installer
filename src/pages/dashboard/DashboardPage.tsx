import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaCog } from "react-icons/fa";

const DashboardPage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<div
			style={{
				padding: 40,
				color: "white",
				position: "relative",
				height: "100%",
				boxSizing: "border-box",
			}}
		>
			<button
				onClick={() => navigate("/settings")}
				style={{
					position: "absolute",
					top: 20,
					right: 20,
					background: "none",
					border: "none",
					color: "white",
					cursor: "pointer",
					fontSize: "1.5rem",
					opacity: 0.7,
				}}
				title={t("settings.title")}
			>
				<FaCog />
			</button>

			<div style={{ textAlign: "center", paddingTop: "100px" }}>
				<h1>{t("welcome.title")}</h1>
				<p>{t("welcome.subtitle")}</p>
			</div>
		</div>
	);
};

export default DashboardPage;