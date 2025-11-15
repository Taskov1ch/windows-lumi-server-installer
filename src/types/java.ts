export interface JavaConfig {
	required_java_version: string;
	windows_links: {
		[key: string]: {
			url: string;
		};
	};
}

export interface WindowsInstructionsProps {
	config: JavaConfig;
}

export interface JavaCheckResult {
	is_installed: boolean;
	version: string | null;
	major_version: number | null;
	is_compatible: boolean;
	required_version: string;
}
