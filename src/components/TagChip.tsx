import React from "react";

interface TagChipProps {
  tag: string;
  count?: number;
  onRemove?: (tag: string) => void;
  onClick?: (tag: string) => void;
}

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
};

export const TagChip: React.FC<TagChipProps> = ({
  tag,
  count,
  onRemove,
  onClick,
}) => {
  const bgColor = stringToColor(tag);
  // Check if the color is too dark and adjust the text color
  const r = parseInt(bgColor.substring(1, 3), 16);
  const g = parseInt(bgColor.substring(3, 5), 16);
  const b = parseInt(bgColor.substring(5, 7), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  const textColor = yiq >= 128 ? "black" : "white";

  return (
    <div
      className="flex items-center rounded-full py-1 px-3 text-xs"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        cursor: "pointer",
      }}
      title={count ? `${count} notes` : undefined}
      onClick={() => onClick?.(tag)}
    >
      {tag}
      {count && <span className="ml-1.5">{count}</span>}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className={`ml-1.5 -mr-1 w-4 h-4 p-[0px] flex items-center justify-center bg-transparent ${
            textColor === "white" ? "text-white" : "text-black"
          }`}
        >
          x
        </button>
      )}
    </div>
  );
};
