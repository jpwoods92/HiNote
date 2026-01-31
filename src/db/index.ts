import Dexie, { type Table } from "dexie";

export interface NoteAnchor {
  xpath: string;
  text: string;
  quote: string;
  prefix: string;
  suffix: string;
  color: string;
  style: string;
}

export interface Note {
  id: string;
  url: string;
  normalizedUrl: string;
  anchor: NoteAnchor;
  content: {
    text: string;
    html: string;
    tags: string[];
  };
  isOrphaned?: boolean;
  isDeleted?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Page {
  normalizedUrl: string;
  title: string;
  favicon?: string;
  noteCount: number;
  lastVisit: number;
  tags: string[];
}

export class HighlightNoteDB extends Dexie {
  notes!: Table<Note>;
  pages!: Table<Page>;

  constructor() {
    super("HighlightNoteDB");
    this.version(1).stores({
      notes: "id, url, createdAt",
    });
    this.version(2).stores({
      notes: "id, url, normalizedUrl, createdAt, updatedAt, isDeleted",
    });
    this.version(4).stores({
      notes: "id, url, normalizedUrl, createdAt, updatedAt, isDeleted, *content.tags",
      pages: "normalizedUrl, lastVisit, *tags",
    });
    this.version(5).stores({
      notes: "id, url, normalizedUrl, createdAt, updatedAt, isDeleted, *content.tags, content.text, anchor.quote",
      pages: "normalizedUrl, lastVisit, *tags",
    });
  }
}

export const db = new HighlightNoteDB();
