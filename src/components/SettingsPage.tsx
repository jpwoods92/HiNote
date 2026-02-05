import React, { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { AIProvider, useSettings } from "../utils/settings";
import {
  getOpenAIModels,
  getGoogleGenAIModels,
  getAnthropicModels,
} from "@/services/ai/models";

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [settings, updateSettings] = useSettings();
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [debouncedApiKey] = useDebounce(settings.apiKey, 500);

  const fetchModels = useCallback(async () => {
    if (!settings.aiProvider || !debouncedApiKey) {
      setModels([]);
      return;
    }

    setIsLoadingModels(true);
    let fetchedModels: string[] = [];

    switch (settings.aiProvider) {
      case "openai":
        fetchedModels = await getOpenAIModels(debouncedApiKey);
        break;
      case "gemini":
        fetchedModels = await getGoogleGenAIModels(debouncedApiKey);
        break;
      case "anthropic":
        fetchedModels = await getAnthropicModels(debouncedApiKey);
        break;
      default:
        fetchedModels = [];
    }

    setModels(fetchedModels);
    setIsLoadingModels(false);
  }, [settings.aiProvider, debouncedApiKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchModels();
  }, [fetchModels]);
  
  const updateModelSelection = useCallback(() => {
    if (models.length > 0 && !models.includes(settings.aiModelId ?? "")) {
      updateSettings({ aiModelId: models[0] });
    }
  }, [models, settings.aiModelId, updateSettings]);

  useEffect(() => {
    updateModelSelection();
  }, [models, updateModelSelection]);

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ defaultOpacity: parseFloat(e.target.value) });
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newPalette = [...settings.customPalette];
    newPalette[index] = newColor;
    updateSettings({ customPalette: newPalette });
  };

  const addColor = () => {
    if (settings.customPalette.length < 8) {
      updateSettings({
        customPalette: [...settings.customPalette, "#000000"],
      });
    }
  };

  const removeColor = (index: number) => {
    const newPalette = settings.customPalette.filter((_, i) => i !== index);
    updateSettings({ customPalette: newPalette });
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provider = e.target.value as AIProvider;
    updateSettings({
      aiProvider: provider,
      aiModelId: undefined, // Will be set by useEffect
    });
  };

  return (
    <div className="p-4">
      <button onClick={onBack} className="mb-4">
        &larr; Back
      </button>
      <h2 className="text-lg font-bold mb-4">Settings</h2>

      <div className="mb-4">
        <label htmlFor="opacity" className="block mb-2">
          Default Opacity: {Math.round(settings.defaultOpacity * 100)}%
        </label>
        <input
          type="range"
          id="opacity"
          min="0.1"
          max="1.0"
          step="0.05"
          value={settings.defaultOpacity}
          onChange={handleOpacityChange}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <h3 className="text-md font-bold mb-2">Color Palette</h3>
        <div className="grid grid-cols-4 gap-2">
          {settings.customPalette.map((color, index) => (
            <div key={index} className="relative">
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(index, e.target.value)}
                className="w-full h-10 border-none cursor-pointer"
              />
              {settings.customPalette.length > 1 && (
                <button
                  onClick={() => removeColor(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center -mt-1 -mr-1"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          {settings.customPalette.length < 8 && (
            <button
              onClick={addColor}
              className="w-full h-10 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400"
            >
              +
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-md font-bold mb-2">AI Provider</h3>
        <div className="mb-2">
          <label htmlFor="aiProvider" className="block mb-1">
            Provider
          </label>
          <select
            id="aiProvider"
            value={settings.aiProvider}
            onChange={handleProviderChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select Provider</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
        {settings.aiProvider && (
          <>
            <div className="mb-2">
              <label htmlFor="apiKey" className="block mb-1">
                API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={settings.apiKey}
                onChange={(e) =>
                  updateSettings({ apiKey: e.target.value })
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="mb-2">
              <label htmlFor="aiModel" className="block mb-1">
                Model
              </label>
              <select
                id="aiModel"
                value={settings.aiModelId}
                onChange={(e) =>
                  updateSettings({ aiModelId: e.target.value })
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={isLoadingModels || !settings.apiKey}
              >
                {isLoadingModels ? (
                  <option>Loading models...</option>
                ) : models.length > 0 ? (
                  models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))
                ) : (
                  <option>Enter API key to load models</option>
                )}
              </select>
            </div>
          </>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Keys are stored only on this device and communicate directly with the
          provider.
        </p>
      </div>
    </div>
  );
}

