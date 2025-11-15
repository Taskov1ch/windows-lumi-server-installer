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