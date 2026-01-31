import { useState } from 'react';
import { NoteList } from '@/components/NoteList';
import { TagDashboard } from '@/components/TagDashboard';
import { TagFilteredList } from '@/components/TagFilteredList';
import { SearchBar } from '@/components/SearchBar';
import { Note } from '@/db';
import { SearchResults } from '@/components/SearchResults';
import clsx from 'clsx';

type View = 'notes' | 'tags' | 'tagFiltered';

function App() {
  const [view, setView] = useState<View>('notes');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    setView('tagFiltered');
  };

  const handleBackToTags = () => {
    setSelectedTag(null);
    setView('tags');
  }

  const handleResults = (results: Note[]) => {
    setSearchResults(results);
  };

  const handleQueryChange = (query: string) => {
    setIsSearching(query.length > 0);
  };

  return (
    <div className="p-4 w-full h-screen flex flex-col gap-4">
      <SearchBar onResults={handleResults} onQueryChange={handleQueryChange} />
      {isSearching ? (
        <SearchResults results={searchResults} />
      ) : (
        <>
          <div className="flex justify-center gap-4">
            { view !== 'tagFiltered' && (
              <>
                <button
                  onClick={() => setView('notes')}
                  className={clsx(
                    'px-4 py-2 rounded-md text-sm font-medium',
                    view === 'notes'
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  Notes
                </button>
                <button
                  onClick={() => setView('tags')}
                  className={clsx(
                    'px-4 py-2 rounded-md text-sm font-medium',
                    view === 'tags'
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  Tags
                </button>
              </>
            )}
            { view === 'tagFiltered' && (
              <button onClick={handleBackToTags}>
                Back to Tags
              </button>
            )}
          </div>
          {view === 'notes' && <NoteList />}
          {view === 'tags' && <TagDashboard onTagSelect={handleTagSelect} />}
          {view === 'tagFiltered' && selectedTag && <TagFilteredList tag={selectedTag} />}
        </>
      )}
    </div>
  );
}

export default App;
