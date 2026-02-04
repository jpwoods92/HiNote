import React from "react";

interface HighlightEditorProps {
  x: number;
  y: number;
  palette: string[];
  onColorSelect: (color: string) => void;
  onClose: () => void;
}

export function HighlightEditor({
  x,
  y,
  palette,
  onColorSelect,
  onClose,
}: HighlightEditorProps) {
  return (
    <div
      className="absolute bg-white shadow-lg rounded-lg p-2 flex items-center gap-2"
      style={{ left: x, top: y }}
    >
      {palette.map((color) => (
        <button
          key={color}
          style={{ backgroundColor: color, width: "20px", height: "20px" }}
          onClick={() => onColorSelect(color)}
          className="rounded-full border border-gray-300"
        />
      ))}
      <button onClick={onClose} className="p-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
