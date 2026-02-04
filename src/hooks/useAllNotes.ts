import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export function useAllNotes(query?: string) {
  return useLiveQuery(async () => {
    if (query) {
      const [notesByContent, notesByAnchor, notesByTags] = await Promise.all([
        db.notes.where("content.text").startsWithIgnoreCase(query).toArray(),
        db.notes.where("anchor.quote").startsWithIgnoreCase(query).toArray(),
        db.notes.where("content.tags").startsWithIgnoreCase(query).toArray(),
      ]);

      const allNotes = [...notesByContent, ...notesByAnchor, ...notesByTags];
      const uniqueNotes = allNotes.filter(
        (note, index, self) =>
          index === self.findIndex((n) => n.id === note.id),
      );

      return uniqueNotes;
    } else {
      return db.notes.orderBy("createdAt").reverse().toArray();
    }
  }, [query]);
}
