import {
  onMessage,
  Message,
  CreateNotePayload,
  GetNotesForUrlPayload,
  GetNotePayload,
  UpdateNoteAnchorPayload,
  UpdateNoteStatusPayload,
  UpdateSettingsPayload,
  MapsToNotePayload,
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
      | UpdateSettingsPayload
      | MapsToNotePayload
    >,
    _sender,
    sendResponse,
  ) => {
    const payload = message.payload;
    if (message.type === "CREATE_NOTE" && payload) {
      void db.notes.add(payload as Note);
    } else if (message.type === "GET_NOTES_FOR_URL" && payload) {
      db.notes
        .where("normalizedUrl")
        .equals(normalizeUrl((payload as GetNotesForUrlPayload).url))
        .toArray()
        .then((notes) => {
          sendResponse(notes);
        });
      return true; // Indicates that the response is sent asynchronously
    } else if (message.type === "UPDATE_NOTE_STATUS" && payload) {
      const { id, isOrphaned } = payload as UpdateNoteStatusPayload;
      void db.notes.update(id, {
        isOrphaned: isOrphaned,
      });
    } else if (message.type === "GET_NOTE" && payload) {
      db.notes.get((payload as GetNotePayload).id).then((note) => {
        sendResponse(note);
      });
      return true;
    } else if (message.type === "UPDATE_NOTE_ANCHOR" && payload) {
      const { id, anchor } = payload as UpdateNoteAnchorPayload;
      void db.notes.update(id, {
        anchor: anchor,
        isOrphaned: false,
      });
    } else if (message.type === "SETTINGS_UPDATED") {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, message);
          }
        });
      });
    } else if (message.type === "MAP_TO_NOTE" && payload) {
      const { url, noteId } = payload as MapsToNotePayload;
      const newUrl = `${url}#ext-focus=${noteId}`;
      chrome.tabs.query({ url: url }, (tabs) => {
        if (tabs.length > 0) {
          const tab = tabs[0];
          if (tab.id) {
            chrome.tabs.update(tab.id, { active: true, url: newUrl });
          }
        } else {
          chrome.tabs.create({ url: newUrl });
        }
      });
    }
  },
);
