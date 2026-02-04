import React from "react";
import { useSettings } from "../utils/settings";

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [settings, updateSettings] = useSettings();

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ ...settings, defaultOpacity: parseFloat(e.target.value) });
  };

  const handleColorChange = (index: number, newColor: string) => {
    const newPalette = [...settings.customPalette];
    newPalette[index] = newColor;
    updateSettings({ ...settings, customPalette: newPalette });
  };

  const addColor = () => {
    if (settings.customPalette.length < 8) {
      updateSettings({
        ...settings,
        customPalette: [...settings.customPalette, "#000000"],
      });
    }
  };

  const removeColor = (index: number) => {
    const newPalette = settings.customPalette.filter((_, i) => i !== index);
    updateSettings({ ...settings, customPalette: newPalette });
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

      <div>
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
    </div>
  );
}
