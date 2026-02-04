import React from "react";
import { Note } from "@/db";

interface ClusterBubblesProps {
  notes: Note[];
  x: number;
  y: number;
  onDotClick: (noteId: string) => void;
  onDotHover: (noteId: string | null) => void;
  onDotRightClick: (noteId: string) => void;
}

export function ClusterBubbles({
  notes,
  x,
  y,
  onDotClick,
  onDotHover,
  onDotRightClick,
}: ClusterBubblesProps) {
  return (
    <div
      className="absolute bg-white shadow-lg rounded-lg p-2 flex items-center gap-2"
      style={{ left: x, top: y }}
    >
      {notes.map((note) => (
        <div
          key={note.id}
          className="w-5 h-5 rounded-full border-2 border-white cursor-pointer"
          style={{ backgroundColor: note.anchor.color }}
          onMouseEnter={() => onDotHover(note.id)}
          onMouseLeave={() => onDotHover(null)}
          onClick={() => onDotClick(note.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            onDotRightClick(note.id);
          }}
        />
      ))}
    </div>
  );
}
