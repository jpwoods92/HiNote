import Dexie, { type Table } from "dexie";

export interface Page {
  normalizedUrl: string;
  lastVisited: number; // Timestamp
}

export interface Note {
  id: string; // UUID
  url: string;
  content: string;
  tags: string[];
  createdAt: number;
}

export class ClickNoteDB extends Dexie {
  pages!: Table<Page, string>; // Primary key is string (normalizedUrl)
  notes!: Table<Note, string>; // Primary key is string (UUID)

  constructor() {
    super("ClickNoteDB");

    this.version(1).stores({
      pages: "normalizedUrl, lastVisited",
      notes: "id, url, *tags", // *tags indicates a multi-entry index
    });
  }
}

export const db = new ClickNoteDB();
