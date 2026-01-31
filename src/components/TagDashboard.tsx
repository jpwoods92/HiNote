import React, { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";

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
    []
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
          })
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
        <ul className="space-y-2">
          {tags.map((tag) => (
            <li
              key={tag.name}
              onClick={() => onTagSelect(tag.name)}
              className="p-2 border rounded-md hover:bg-gray-100 flex justify-between items-center cursor-pointer"
            >
              <span className="font-medium">{tag.name}</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                {tag.count}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500">
          No tags added to notes yet...
        </div>
      )}
    </div>
  );
};
