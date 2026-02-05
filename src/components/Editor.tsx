import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { db } from "../db";
import { LocalAIService } from "../services/ai/local";

interface EditorProps {
  noteId: string;
  content: string;
  onClose: () => void;
}

export function Editor({ noteId, content, onClose }: EditorProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isAiAvailable, setIsAiAvailable] = useState(false);

  useEffect(() => {
    async function checkAi() {
      const { isAvailable } = await LocalAIService.canCreateTextSession();
      setIsAiAvailable(isAvailable);
    }
    checkAi();
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        strike: false,
        code: false,
        link: {
          openOnClick: false,
        },
      }),
    ],
    content: content,
    autofocus: true,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl m-5 focus:outline-none dark:prose-invert",
      },
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => {
      setIsFocused(false);
      void saveContent();
      onClose();
    },
  });

  const saveContent = useCallback(async () => {
    if (!editor) return;
    await db.notes.update(noteId, {
      "content.html": editor.getHTML(),
      "content.text": editor.getText(),
      updatedAt: Date.now(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [editor, noteId]);

  const [debouncedEditor] = useDebounce(editor?.state.doc.content, 500);

  useEffect(() => {
    if (debouncedEditor) {
      void saveContent();
    }
  }, [debouncedEditor, saveContent]);

  const toggleLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    if (previousUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const url = window.prompt("URL");
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  const summarize = async () => {
    if (!editor) return;
    const text = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
    );
    if (!text) return;

    try {
      const stream = await LocalAIService.summarize(text);
      let fullResponse = "";
      editor.chain().focus().insertContentAt(0, "Summary: ").run();
      const initialInsertionPoint = "Summary: ".length;
      for await (const chunk of stream) {
        fullResponse += chunk;
        editor
          .chain()
          .focus()
          .insertContentAt(initialInsertionPoint, fullResponse)
          .run();
      }
    } catch (error) {
      console.error("Error summarizing:", error);
    }
  };

  const preventAndStop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="relative">
      {editor && isFocused && (
        <div className="flex p-1 space-x-1 bg-gray-100 rounded dark:bg-gray-700">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1 rounded ${
              editor.isActive("bold")
                ? "bg-gray-300 dark:bg-gray-600"
                : "hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            onMouseDown={preventAndStop}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1 rounded ${
              editor.isActive("italic")
                ? "bg-gray-300 dark:bg-gray-600"
                : "hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            onMouseDown={preventAndStop}
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1 rounded ${
              editor.isActive("bulletList")
                ? "bg-gray-300 dark:bg-gray-600"
                : "hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            onMouseDown={preventAndStop}
          >
            Bullet List
          </button>
          <button
            onClick={toggleLink}
            className={`p-1 rounded ${
              editor.isActive("link")
                ? "bg-gray-300 dark:bg-gray-600"
                : "hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
            onMouseDown={preventAndStop}
          >
            Link
          </button>
          {isAiAvailable && (
            <button
              onClick={summarize}
              className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600`}
              onMouseDown={preventAndStop}
            >
              Summarize
            </button>
          )}
        </div>
      )}
      <EditorContent editor={editor} />
      {isSaved && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          Saved
        </div>
      )}
    </div>
  );
}
