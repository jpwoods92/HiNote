import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { searchNotes } from "@/utils/SearchService";

export function useAllNotes(query?: string) {
  return useLiveQuery(async () => {
    if (query) {
      return searchNotes(query);
    } else {
      return db.notes.orderBy("createdAt").reverse().toArray();
    }
  }, [query]);
}
