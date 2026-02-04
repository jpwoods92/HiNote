import browser from "webextension-polyfill";

import { Note } from "../db";

export type Message<T = unknown> = {
  type: string;
  payload?: T;
};

export type CreateNotePayload = Note;

export type GetNotesForUrlPayload = {
  url: string;
};

export type GetNotePayload = {
  id: string;
};

export type GetNoteResponse = Note | undefined;

export type UpdateNoteAnchorPayload = {
  id: string;
  anchor: Note["anchor"];
};

export type UpdateNoteStatusPayload = {
  id: string;
  isOrphaned: boolean;
};

export type RelinkSuccessPayload = {
  id: string;
};

export type ScrollToHighlightPayload = {
  id: string;
};

export type RemoveHighlightPayload = {
  id: string;
};

export type EnterRelinkModePayload = {
  id: string;
};

export type FocusNotePayload = {
  id: string;
};

export type MapsToNotePayload = {
  url: string;
  noteId: string;
};

export type UpdateSettingsPayload = {
  theme: "light" | "dark" | "system";
  defaultOpacity: number; // 0.1 to 1.0
  customPalette: string[]; // Array of HEX codes
};

export function sendMessage<T, U = void>(message: Message<T>): Promise<U> {
  return browser.runtime.sendMessage(message);
}

export function sendTabMessage<T, U = void>(
  tabId: number,
  message: Message<T>,
): Promise<U> {
  return browser.tabs.sendMessage(tabId, message);
}

export function onMessage<T>(
  callback: (
    message: Message<T>,
    sender: browser.Runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => void | boolean | Promise<unknown>,
) {
  const listener = (
    message: Message<T>,
    sender: browser.Runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    return callback(message, sender, sendResponse);
  };
  // @ts-expect-error ignore listener type mismatch
  browser.runtime.onMessage.addListener(listener);
  return () => {
    // @ts-expect-error ignore listener type mismatch
    browser.runtime.onMessage.removeListener(listener);
  };
}
