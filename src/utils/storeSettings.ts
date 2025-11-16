import { LazyStore } from "@tauri-apps/plugin-store";
import { SupportedLanguage } from "../types/settings";

const LANG_KEY = "language";
const SCALE_KEY = "appScale";

const store = new LazyStore("settings.json");

export const changeLanguage = async (language: SupportedLanguage) => {
	await store.set(LANG_KEY, language);
	await store.save();
};

export const getLanguage = async (): Promise<SupportedLanguage> => {
	const language = await store.get<SupportedLanguage>(LANG_KEY);
	return language || "en";
};

export const setAppScale = async (scale: number) => {
	await store.set(SCALE_KEY, scale);
	await store.save();
};

export const getAppScale = async (): Promise<number> => {
	const scale = await store.get<number>(SCALE_KEY);
	return scale || 1;
};