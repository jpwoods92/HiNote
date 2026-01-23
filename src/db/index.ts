import Dexie, { type Table } from "dexie";

export interface NoteAnchor {
  xpath: string;
  text: string;
  prefix: string;
  suffix: string;
  color: string;
}

export interface Note {
  id: string;
  url: string;
  anchor: NoteAnchor;
  createdAt: number;
}

export class HighlightNoteDB extends Dexie {
  notes!: Table<Note>;

  constructor() {
    super("HighlightNoteDB");
    this.version(1).stores({
      notes: "id, url, createdAt",
    });
  }
}

export const db = new HighlightNoteDB();
