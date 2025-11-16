export interface ServerSettings {
	motd: string;
	"server-port": number;
	"max-players": number;
}

export interface Server {
	id: string;
	name: string;
	path: string;
	status: "online" | "offline" | "unknown";
	settings: ServerSettings;
}