import {
  onMessage,
  Message,
  CreateNotePayload,
  GetNotesForUrlPayload,
  GetNotePayload,
  UpdateNoteAnchorPayload,
  UpdateNoteStatusPayload,
} from "@/utils/messaging";
import { db, Note } from "@/db";
import { normalizeUrl } from "@/utils/url";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "click-note-context-menu",
    title: "Add Note",
    contexts: ["selection", "page"],
  });

  // Check if sidePanel API is available before calling it.
  // This prevents crashes in Firefox or environments where sidePanel is undefined.
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    void chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true,
    });
  }
});

onMessage(
  (
    message: Message<
      | CreateNotePayload
      | GetNotesForUrlPayload
      | UpdateNoteStatusPayload
      | GetNotePayload
      | UpdateNoteAnchorPayload
    >,
    _sender,
    sendResponse,
  ) => {
    const note = message.payload as Note;
    if (message.type === "CREATE_NOTE" && note) {
      void db.notes.add(note as Note);
    } else if (message.type === "GET_NOTES_FOR_URL" && note) {
      db.notes
        .where("normalizedUrl")
        .equals(normalizeUrl((note as Note).url))
        .toArray()
        .then((notes) => {
          sendResponse(notes);
        });
      return true; // Indicates that the response is sent asynchronously
    } else if (message.type === "UPDATE_NOTE_STATUS" && note) {
      void db.notes.update(note.id, {
        isOrphaned: note.isOrphaned,
      });
    } else if (message.type === "GET_NOTE" && note) {
      db.notes.get(note.id).then((note) => {
        sendResponse(note);
      });
      return true;
    } else if (message.type === "UPDATE_NOTE_ANCHOR" && note) {
      void db.notes.update(note.id, {
        anchor: note.anchor,
        isOrphaned: false,
      });
    }
  },
);
