import React, { useState } from 'react';
import { searchNotes } from '@/utils/SearchService';
import { Note } from '@/db';
import { XCircle } from 'lucide-react';

interface SearchBarProps {
  onResults: (results: Note[]) => void;
  onQueryChange: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onResults, onQueryChange }) => {
  const [query, setQuery] = useState('');

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onQueryChange(newQuery);
    const results = await searchNotes(newQuery);
    onResults(results);
  };

  const handleClear = () => {
    setQuery('');
    onQueryChange('');
    onResults([]);
  };

  return (
    <div className="search-bar w-full relative">
      <input
        type="text"
        placeholder="Search by content, tags..."
        value={query}
        onChange={handleInputChange}
        className="w-full p-2 border rounded-md"
      />
      {query.length > 0 && (
        <button
          onClick={handleClear}
          className="absolute top-[2px] right-[2px] rounded-md p-[6px]"
          title="Clear search"
        >
          <XCircle size={18} />
        </button>
      )}
    </div>
  );
};
