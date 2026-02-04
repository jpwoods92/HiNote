import { useState, useEffect } from "react";
import { sendMessage } from "./messaging";
import { eventBus } from "./eventBus";

export interface Settings {
  theme: "light" | "dark" | "system";
  defaultOpacity: number; // 0.1 to 1.0
  customPalette: string[]; // Array of HEX codes
}

const defaultSettings: Settings = {
  theme: "system",
  defaultOpacity: 0.5,
  customPalette: ["#FFFF00", "#FF00FF", "#00FF00", "#00FFFF"],
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const storedSettings = localStorage.getItem("settings");
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error("Error reading settings from localStorage:", error);
    }
    return defaultSettings;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "settings" && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Error parsing settings from storage event:", error);
        }
      }
    };

    const handleInternalUpdate = () => {
      try {
        const storedSettings = localStorage.getItem("settings");
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }
      } catch (error) {
        console.error("Error reading settings from localStorage:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    eventBus.on("settings-updated-internal", handleInternalUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      eventBus.off("settings-updated-internal", handleInternalUpdate);
    };
  }, []);

  const updateSettings = (newSettings: Settings) => {
    try {
      const settingsString = JSON.stringify(newSettings);
      localStorage.setItem("settings", settingsString);
      setSettings(newSettings);
      // Manually dispatch a storage event for the current window to ensure consistency
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "settings",
          newValue: settingsString,
        }),
      );
      sendMessage({ type: "SETTINGS_UPDATED", payload: newSettings });
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
    }
  };

  return [settings, updateSettings] as const;
}
