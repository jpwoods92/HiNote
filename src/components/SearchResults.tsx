import React from 'react';
import { Note } from '@/db';
import { NoteCard } from './NoteCard';
import { useCurrentTab } from '@/hooks/useCurrentTab';

interface SearchResultsProps {
  results: Note[];
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  const { tab: currentTab } = useCurrentTab();
  return (
    <div className="search-results space-y-2">
      {results.map((note) => (
        <NoteCard key={note.id} note={note} tabId={currentTab?.id} />
      ))}
    </div>
  );
};
