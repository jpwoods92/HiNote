import { Virtuoso } from "react-virtuoso";
import { useAllNotes } from "../hooks/useAllNotes";
import { Note } from "../db";
import { sendMessage } from "@/utils/messaging";
import DOMPurify from "dompurify";

const GlobalNoteListItem = ({ note }: { note: Note }) => {
  const handleClick = () => {
    sendMessage({
      type: "MAP_TO_NOTE",
      payload: {
        url: note.url,
        noteId: note.id,
      },
    });
  };

  const sanitizedHtml = DOMPurify.sanitize(note.content.html);

  return (
    <div
      className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={handleClick}
    >
      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
        {note.url}
      </div>
      <div
        className="font-semibold text-gray-800 dark:text-gray-100 my-1"
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {note.anchor.quote}
      </div>
      <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
      <div className="text-xs text-gray-400 dark:text-gray-500">
        {new Date(note.createdAt).toLocaleString()}
      </div>
    </div>
  );
};

export const GlobalNoteList = ({ query }: { query?: string }) => {
  const notes = useAllNotes(query);

  if (!notes) {
    return <div>Loading...</div>;
  }

  return (
    <Virtuoso
      style={{ height: "100%" }}
      data={notes}
      itemContent={(index, note) => (
        <GlobalNoteListItem key={index} note={note} />
      )}
    />
  );
};
