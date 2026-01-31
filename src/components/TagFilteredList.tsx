import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { NoteCard } from './NoteCard';
import { useCurrentTab } from '@/hooks/useCurrentTab';

interface TagFilteredListProps {
  tag: string;
}

export const TagFilteredList: React.FC<TagFilteredListProps> = ({ tag }) => {
  const { tab: currentTab } = useCurrentTab();
  const notes = useLiveQuery(
    () => db.notes.where('content.tags').equals(tag).toArray(),
    [tag]
  );

  return (
    <div className="tag-filtered-list">
      <h3 className="text-lg font-bold mb-4">Notes tagged with "{tag}"</h3>
      <div className="flex flex-col gap-4">
        {notes?.map((note) => (
          <NoteCard key={note.id} note={note} tabId={currentTab?.id} />
        ))}
      </div>
    </div>
  );
};
