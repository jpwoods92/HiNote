import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useCurrentTab } from "../hooks/useCurrentTab";
import { NoteCard } from "./NoteCard";
import {
  onMessage,
  Message,
  FocusNotePayload,
  EnterRelinkModePayload,
  RelinkSuccessPayload,
} from "../utils/messaging";
import { normalizeUrl } from "../utils/url";

export function NoteList() {
  const { tab: currentTab } = useCurrentTab();
  const [relinkingNoteId, setRelinkingNoteId] = useState<string | null>(null);

  const notes = useLiveQuery(
    () =>
      currentTab?.url
        ? db.notes
            .where("normalizedUrl")
            .equals(normalizeUrl(currentTab.url))
            .reverse()
            .sortBy("createdAt")
        : [],
    [currentTab],
  );
  const noteRefs = useRef<{ [key: string]: HTMLDivElement }>({});

  useEffect(() => {
    const cleanup = onMessage(
      (
        message: Message<
          FocusNotePayload | EnterRelinkModePayload | RelinkSuccessPayload
        >,
      ) => {
        if (message.type === "FOCUS_NOTE" && message?.payload?.id) {
          const noteElement = noteRefs.current[message.payload.id];
          if (noteElement) {
            noteElement.scrollIntoView({ behavior: "smooth", block: "center" });
            noteElement.classList.add("focused");
            setTimeout(() => {
              noteElement.classList.remove("focused");
            }, 1000);
          }
        } else if (
          message.type === "ENTER_RELINK_MODE" &&
          message?.payload?.id
        ) {
          setRelinkingNoteId(message.payload.id);
        } else if (message.type === "RELINK_SUCCESS") {
          setRelinkingNoteId(null);
        }
      },
    );
    return cleanup;
  }, []);

  if (!notes) {
    return <div>Loading notes...</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Highlight text on the page to add a note.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div
          key={note.id}
          ref={(el) => {
            if (el) {
              noteRefs.current[note.id] = el;
            }
          }}
          className={
            relinkingNoteId && relinkingNoteId !== note.id ? "opacity-50" : ""
          }
        >
          <NoteCard note={note} tabId={currentTab?.id} />
        </div>
      ))}
    </div>
  );
}
