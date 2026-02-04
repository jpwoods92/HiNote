import React, { useState, useEffect } from "react";
import { db } from "../db";
import { PlusCircle, XCircle } from "lucide-react";
import { TagChip } from "./TagChip";

interface NoteTagsProps {
  noteId: string;
  initialTags: string[];
}

const NoteTags: React.FC<NoteTagsProps> = ({ noteId, initialTags }) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.length > 0) {
      const allTags = await db.notes.orderBy("content.tags").uniqueKeys();
      const filteredSuggestions = (allTags as string[]).filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !tags.includes(tag),
      );
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleInputKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        const newTags = [...tags, newTag];
        setTags(newTags);
        await db.notes.update(noteId, { "content.tags": newTags });
      }
      setInputValue("");
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      const newTags = [...tags, suggestion];
      setTags(newTags);
      await db.notes.update(noteId, { "content.tags": newTags });
    }
    setInputValue("");
    setSuggestions([]);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    await db.notes.update(noteId, { "content.tags": newTags });
  };

  return (
    <div className="p-2 mt-2 border-t border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {tags.map((tag) => (
          <TagChip key={tag} tag={tag} onRemove={handleRemoveTag} />
        ))}
        <button
          onClick={() => setShowInput(!showInput)}
          title={showInput ? "Stop adding tags" : "Add tag"}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showInput ? <XCircle size={18} /> : <PlusCircle size={18} />}
        </button>
      </div>
      {showInput && (
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Add a tag"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          {suggestions.length > 0 && (
            <ul className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 border-t-0 list-none m-0 p-0 w-full z-10 rounded-b-md shadow-lg">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NoteTags;
