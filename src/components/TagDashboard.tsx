import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { TagChip } from "./TagChip";

interface TagWithCount {
  name: string;
  count: number;
}

interface TagDashboardProps {
  onTagSelect: (tag: string) => void;
}

export const TagDashboard: React.FC<TagDashboardProps> = ({ onTagSelect }) => {
  const [tags, setTags] = useState<TagWithCount[]>([]);

  const allTags = useLiveQuery(
    () => db.notes.orderBy("content.tags").uniqueKeys(),
    [],
  );

  useEffect(() => {
    if (allTags) {
      const getTagCounts = async () => {
        const tagCounts = await Promise.all(
          (allTags as string[]).map(async (tag) => {
            const count = await db.notes
              .where("content.tags")
              .equals(tag)
              .count();
            return { name: tag, count };
          }),
        );
        setTags(tagCounts);
      };
      void getTagCounts();
    }
  }, [allTags]);

  return (
    <div className="tag-dashboard p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">All Tags</h2>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.name}
              onClick={() => onTagSelect(tag.name)}
              className="cursor-pointer"
            >
              <TagChip tag={tag.name} count={tag.count} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500">
          No tags added to notes yet...
        </div>
      )}
    </div>
  );
};
