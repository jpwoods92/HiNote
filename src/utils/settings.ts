import browser from "webextension-polyfill";
import { useState, useEffect } from "react";
import { sendMessage } from "./messaging";
import { eventBus } from "./eventBus";

export type AIProvider = "openai" | "anthropic" | "gemini" | "";

export interface Settings {
  theme: "light" | "dark" | "system";
  defaultOpacity: number; // 0.1 to 1.0
  customPalette: string[]; // Array of HEX codes
  aiProvider?: AIProvider;
  apiKey?: string;
  aiModelId?: string;
}

const defaultSettings: Settings = {
  theme: "system",
  defaultOpacity: 0.5,
  customPalette: ["#FFFF00", "#FF00FF", "#00FF00", "#00FFFF"],
  aiProvider: undefined,
  apiKey: undefined,
  aiModelId: undefined,
};

export const SettingsService = {
  async get(): Promise<Settings> {
    try {
      const result = await browser.storage.local.get("settings");
      return { ...defaultSettings, ...(result.settings || {}) };
    } catch (error) {
      console.error("Error getting settings:", error);
      return defaultSettings;
    }
  },
  async set(settings: Settings): Promise<void> {
    try {
      await browser.storage.local.set({ settings });
      sendMessage({ type: "SETTINGS_UPDATED", payload: settings });
      eventBus.emit("settings-updated", settings);
    } catch (error) {
      console.error("Error setting settings:", error);
    }
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loadSettings = async () => {
      const loadedSettings = await SettingsService.get();
      setSettings(loadedSettings);
    };
    loadSettings();

    const handleChange = (changes: {
      [key: string]: browser.Storage.StorageChange;
    }) => {
      if (changes.settings) {
        setSettings(changes.settings.newValue as Settings);
      }
    };

    browser.storage.local.onChanged.addListener(handleChange);

    const handleLocalChange = (newSettings: unknown) => {
      setSettings(newSettings as Settings);
    };
    eventBus.on("settings-updated", handleLocalChange);

    return () => {
      browser.storage.local.onChanged.removeListener(handleChange);
      eventBus.off("settings-updated", handleLocalChange);
    };
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updated = { ...(await SettingsService.get()), ...newSettings };
    await SettingsService.set(updated);
    // No need to call setSettings here, the listener will handle it
  };

  return [settings, updateSettings] as const;
}
