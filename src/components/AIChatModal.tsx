import { useState, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import { Note } from "../db";
import { X } from "lucide-react";
import { CloudAIService, ChatMessage } from "../services/ai/cloud";
import { useSettings } from "../utils/settings";

interface AIChatModalProps {
  note: Note;
  onClose: () => void;
}

const md = new MarkdownIt();

export function AIChatModal({ note, onClose }: AIChatModalProps) {
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings] = useSettings();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleAskAI = async () => {
    if (!settings.apiKey || !query.trim()) return;

    const newHistory: ChatMessage[] = [
      ...chatHistory,
      { sender: "user", text: query },
    ];
    setChatHistory(newHistory);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await CloudAIService.ask(note.anchor.quote, newHistory);
      const aiResponse: ChatMessage = { sender: "ai", text: res };
      setChatHistory([...newHistory, aiResponse]);
    } catch (error) {
      console.error("AI request failed:", error);
      const errorResponse: ChatMessage = {
        sender: "ai",
        text: "Sorry, I encountered an error.",
      };
      setChatHistory([...newHistory, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-4/5 flex flex-col"
        style={{ maxHeight: "80vh", minHeight: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-bold">Ask AI</h3>
          <button onClick={onClose} className="p-1">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Context: "{note.anchor.quote}"
        </p>
        <div
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded"
        >
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 ${
                msg.sender === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(md.render(msg.text)),
                }}
              />
            </div>
          ))}
          {isLoading && (
            <div className="text-left">
              <div className="inline-block p-2 rounded-lg bg-gray-200 dark:bg-gray-600">
                Loading...
              </div>
            </div>
          )}
        </div>
        <div className="flex">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAskAI();
              }
            }}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Your question..."
            disabled={isLoading}
          />
          <button
            onClick={handleAskAI}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
