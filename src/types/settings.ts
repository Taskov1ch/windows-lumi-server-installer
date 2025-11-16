export const supportedLanguage = ["en", "ru"] as const;
export type SupportedLanguage = typeof supportedLanguage[number];

export interface SettingsPageProps {
	currentScale: number;
	onScaleChange: (newScale: number) => void;
}