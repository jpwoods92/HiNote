import { db, Note } from "@/db";

export const searchNotes = async (query: string): Promise<Note[]> => {
  if (!query) {
    return [];
  }

  const [notesByContent, notesByAnchor, notesByTags] = await Promise.all([
    db.notes.where("content.text").startsWithIgnoreCase(query).toArray(),
    db.notes.where("anchor.quote").startsWithIgnoreCase(query).toArray(),
    db.notes.where("content.tags").startsWithIgnoreCase(query).toArray(),
  ]);

  const allNotes = [...notesByContent, ...notesByAnchor, ...notesByTags];
  const uniqueNotes = allNotes.filter(
    (note, index, self) => index === self.findIndex((n) => n.id === note.id),
  );

  return uniqueNotes;
};
