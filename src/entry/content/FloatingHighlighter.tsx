import React, { useEffect, useState } from "react";
import { highlightManager } from "./HighlightManager";
import { useSettings } from "@/utils/settings";
import { HighlightEditor } from "@/components/HighlightEditor";
import { ClusterBubbles } from "@/components/ClusterBubbles";
import { sendMessage, GetNotePayload } from "@/utils/messaging";
import { Note } from "@/db";

export const FloatingHighlighter: React.FC = () => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [settings] = useSettings();
  const [editorState, setEditorState] = useState<{
    noteId: string;
    x: number;
    y: number;
  } | null>(null);
  const [clusterState, setClusterState] = useState<{
    notes: Note[];
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setPosition(null);
        return;
      }

      const anchorNode = selection.anchorNode;
      const element =
        anchorNode?.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as HTMLElement)
          : anchorNode?.parentElement;

      if (
        element &&
        (element.tagName === "INPUT" ||
          element.tagName === "TEXTAREA" ||
          element.isContentEditable)
      ) {
        setPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 50,
      });
    };

    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 10);
    };

    document.addEventListener("mouseup", handleMouseUp);

    const handleScroll = () => {
      setPosition(null);
      setEditorState(null);
      setClusterState(null);
    };
    document.addEventListener("scroll", handleScroll);

    const handleOpenEditor = (e: CustomEvent) => {
      const { noteId, x, y } = e.detail;
      setEditorState({ noteId, x, y });
      setClusterState(null);
    };

    document.addEventListener(
      "open-highlight-editor",
      handleOpenEditor as EventListener,
    );

    const handleShowCluster = (e: CustomEvent) => {
      const { notes, x, y } = e.detail;
      setClusterState({ notes, x, y });
    };

    document.addEventListener(
      "show-cluster-bubbles",
      handleShowCluster as EventListener,
    );

    const handleHideCluster = () => {
      setClusterState(null);
    };
    document.addEventListener("hide-cluster-bubbles", handleHideCluster);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("scroll", handleScroll);
      document.removeEventListener(
        "open-highlight-editor",
        handleOpenEditor as EventListener,
      );
      document.removeEventListener(
        "show-cluster-bubbles",
        handleShowCluster as EventListener,
      );
      document.removeEventListener("hide-cluster-bubbles", handleHideCluster);
    };
  }, []);

  const handleHighlight = async (color: string) => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      await highlightManager.createHighlight(
        "",
        selection.getRangeAt(0),
        color,
      );
    }
    setPosition(null);
    selection?.removeAllRanges();
  };

  const handleColorChange = async (newColor: string) => {
    if (!editorState) return;
    const noteToUpdate = await sendMessage<GetNotePayload, Note>({
      type: "GET_NOTE",
      payload: { id: editorState.noteId },
    });

    if (!noteToUpdate) return;
    const newAnchor = { ...noteToUpdate.anchor, color: newColor };
    await sendMessage({
      type: "UPDATE_NOTE_ANCHOR",
      payload: { id: editorState.noteId, anchor: newAnchor },
    });
    document
      .querySelectorAll(`[data-highlight-id="${editorState.noteId}"]`)
      .forEach((element) => {
        (element as HTMLElement).style.backgroundColor = newColor;
      });
    setEditorState(null);
  };

  const handleDotClick = (noteId: string) => {
    if (!clusterState) return;
    setEditorState({ noteId, x: clusterState.x, y: clusterState.y });
    setClusterState(null);
  };

  const handleDotHover = (noteId: string | null) => {
    document.querySelectorAll(".ext-highlight").forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (noteId && htmlEl.dataset.highlightId === noteId) {
        htmlEl.style.opacity = "1";
      } else {
        htmlEl.style.opacity = noteId ? "0.3" : "1";
      }
    });
  };

  const handleDotRightClick = async (noteId: string) => {
    const note = clusterState?.notes.find((n) => n.id === noteId);
    if (!note) return;
    const currentIndex = settings.customPalette.indexOf(note.anchor.color);
    const nextIndex = (currentIndex + 1) % settings.customPalette.length;
    const newColor = settings.customPalette[nextIndex];
    const newAnchor = { ...note.anchor, color: newColor };
    await sendMessage({
      type: "UPDATE_NOTE_ANCHOR",
      payload: { id: noteId, anchor: newAnchor },
    });
    const highlightElements = document.querySelectorAll(
      `[data-highlight-id="${noteId}"]`,
    );
    highlightElements.forEach((el) => {
      (el as HTMLElement).style.backgroundColor = newColor;
    });
    setClusterState((prevState) => {
      if (!prevState) return null;
      const newNotes = prevState.notes.map((n) =>
        n.id === noteId
          ? { ...n, anchor: { ...n.anchor, color: newColor } }
          : n,
      );
      return { ...prevState, notes: newNotes };
    });
  };

  return (
    <>
      {position && (
        <div
          style={{
            position: "absolute",
            left: position.x,
            top: position.y,
            transform: "translateX(-50%)",
            zIndex: 99999,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-lg">
            {settings.customPalette.map((color) => (
              <button
                key={color}
                style={{
                  backgroundColor: color,
                  width: "24px",
                  height: "24px",
                }}
                onClick={() => handleHighlight(color)}
                className="rounded-full border border-gray-300"
              />
            ))}
          </div>
        </div>
      )}
      {editorState && (
        <HighlightEditor
          x={editorState.x}
          y={editorState.y}
          palette={settings.customPalette}
          onColorSelect={handleColorChange}
          onClose={() => setEditorState(null)}
        />
      )}
      {clusterState && (
        <ClusterBubbles
          notes={clusterState.notes}
          x={clusterState.x}
          y={clusterState.y}
          onDotClick={handleDotClick}
          onDotHover={handleDotHover}
          onDotRightClick={handleDotRightClick}
        />
      )}
    </>
  );
};
