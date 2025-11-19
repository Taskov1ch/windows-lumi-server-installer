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
	coreJar: string;
	settings: ServerSettings;
}

export interface RustServerConfig {
	motd: string;
	server_port: number;
	max_players: number;
	core_jar: string;
}

export type ScanResult =
	| { status: "Valid"; data: RustServerConfig }
	| { status: "NeedCoreSelection"; data: { jars: string[]; config: RustServerConfig } }
	| { status: "NoSettings" | "NoJars" };