import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import DOMPurify from "dompurify";
import { Note } from "../db";
import { sendTabMessage } from "../utils/messaging";
import { db } from "../db";
import { Editor } from "./Editor";
import { Trash2, Link2Off } from "lucide-react";
import { stripHtml } from "@/utils/sidepanel";
import NoteTags from "./NoteTags";


interface NoteCardProps {
  note: Note;
  tabId?: number;
}

const PLACEHOLDER = "Click to add a note...";

export function NoteCard({ note, tabId }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleScrollToHighlight = () => {
    if (note.isOrphaned || !tabId) return;
    void sendTabMessage(tabId, {
      type: "SCROLL_TO_HIGHLIGHT",
      payload: { id: note.id },
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await db.notes.delete(note.id);
    if (tabId) {
      void sendTabMessage(tabId, {
        type: "REMOVE_HIGHLIGHT",
        payload: { id: note.id },
      });
    }
  };

  const handleRelink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabId) {
      void sendTabMessage(tabId, {
        type: "ENTER_RELINK_MODE",
        payload: { id: note.id },
      });
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const sanitizedHtml = DOMPurify.sanitize(note.content.html);

  const hasTextContent = useMemo(() => stripHtml(sanitizedHtml).trim() !== "", [sanitizedHtml]);
  
  return (
    <div
      className="p-4 border rounded-lg shadow-sm cursor-pointer hover:shadow-md dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-lg"
      onClick={handleScrollToHighlight}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: note.anchor.color }}
          ></div>
          <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
          </div>
        </div>
        <button
          onClick={(e) => {
            void handleDelete(e);
          }}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div
        className="mt-2 text-base font-semibold text-gray-900 dark:text-gray-100"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {note.anchor.quote}
      </div>
      <div className="mt-2 text-gray-700 dark:text-gray-300">
        {isEditing ? (
          <Editor
            noteId={note.id}
            content={note.content.html}
            onClose={() => setIsEditing(false)}
          />
        ) : (
          <div
            onClick={handleEdit}
            dangerouslySetInnerHTML={{
              __html: hasTextContent ? sanitizedHtml : PLACEHOLDER,
            }}
          />
        )}
      </div>
      {note.isOrphaned && (
        <div className="mt-2 text-yellow-500 flex items-center">
          <Link2Off size={16} className="mr-2" />
          <span className="text-sm font-semibold">Broken Link</span>
          <button
            onClick={handleRelink}
            className="ml-4 px-2 py-1 text-xs text-white bg-yellow-500 rounded hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
          >
            Re-link
          </button>
        </div>
      )}
      <NoteTags noteId={note.id} initialTags={note.content.tags || []} />
    </div>
  );
}