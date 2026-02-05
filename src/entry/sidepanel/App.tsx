import { GlobalNoteList } from "@/components/GlobalNoteList";
import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { NoteList } from "@/components/NoteList";
import { TagDashboard } from "@/components/TagDashboard";
import { TagFilteredList } from "@/components/TagFilteredList";
import { SearchBar } from "@/components/SearchBar";
import { Note } from "@/db";
import { SearchResults } from "@/components/SearchResults";
import clsx from "clsx";

const SettingsPage = lazy(() =>
  import("@/components/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);

type View = "notes" | "tags" | "tagFiltered" | "settings" | "allNotes";

function App() {
  const [view, setView] = useState<View>("notes");
  const [previousView, setPreviousView] = useState<View>("notes");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchBarRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    setView("tagFiltered");
  };

  const handleBackToTags = () => {
    setSelectedTag(null);
    setView("tags");
  };

  const handleResults = (results: Note[]) => {
    if (view !== "allNotes") {
      setSearchResults(results);
    }
  };

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    setIsSearching(newQuery.length > 0);
  };

  const handleSettingsClick = () => {
    setPreviousView(view);
    setView("settings");
  };

  const handleBackFromSettings = () => {
    setView(previousView);
  };

  return (
    <div className="p-4 w-full h-screen flex flex-col gap-4">
      <div className="flex justify-between items-center gap-4">
        <SearchBar
          ref={searchBarRef}
          onResults={handleResults}
          onQueryChange={handleQueryChange}
        />
        <button onClick={handleSettingsClick} className="p-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {isSearching && view !== "allNotes" ? (
        <div className="flex-1 overflow-y-auto">
          <SearchResults results={searchResults} />
        </div>
      ) : view === "settings" ? (
        <Suspense fallback={<div>Loading...</div>}>
          <SettingsPage onBack={handleBackFromSettings} />
        </Suspense>
      ) : (
        <>
          <div className="flex justify-center gap-4">
            {view !== "tagFiltered" && (
              <>
                <button
                  onClick={() => setView("notes")}
                  className={clsx(
                    "px-4 py-2 rounded-md text-sm font-medium",
                    view === "notes"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  Notes
                </button>
                <button
                  onClick={() => setView("allNotes")}
                  className={clsx(
                    "px-4 py-2 rounded-md text-sm font-medium",
                    view === "allNotes"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  All Notes
                </button>
                <button
                  onClick={() => setView("tags")}
                  className={clsx(
                    "px-4 py-2 rounded-md text-sm font-medium",
                    view === "tags"
                      ? "bg-gray-200 text-gray-900"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  Tags
                </button>
              </>
            )}
            {view === "tagFiltered" && (
              <button onClick={handleBackToTags}>Back to Tags</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {view === "notes" && <NoteList />}
            {view === "allNotes" && <GlobalNoteList query={query} />}
            {view === "tags" && <TagDashboard onTagSelect={handleTagSelect} />}
            {view === "tagFiltered" && selectedTag && (
              <TagFilteredList tag={selectedTag} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
