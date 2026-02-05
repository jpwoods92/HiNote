import { db, Note } from "@/db";
import { normalizeUrl } from "./url";

export const searchNotes = async (
  query: string,
  url?: string,
): Promise<Note[]> => {
  if (!query) {
    return [];
  }

  const lowerCaseQuery = query.toLowerCase();

  const filteredNotes = await db.notes
    .filter((note) => {
      const isUrlMatch = url ? note.normalizedUrl === normalizeUrl(url) : true;
      if (!isUrlMatch) {
        return false;
      }

      const isQueryMatch =
        note.content.text.toLowerCase().includes(lowerCaseQuery) ||
        (note.anchor?.truncatedQuote &&
          note.anchor.truncatedQuote.toLowerCase().includes(lowerCaseQuery)) ||
        note.content.tags.some((tag) =>
          tag.toLowerCase().includes(lowerCaseQuery),
        );

      return isQueryMatch;
    })
    .toArray();

  const uniqueNotes = filteredNotes.filter(
    (note, index, self) => index === self.findIndex((n) => n.id === note.id),
  );

  return uniqueNotes;
};
