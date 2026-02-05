// src/types/window.d.ts

interface AI {
  canCreateTextSession(): Promise<"readily" | "after-download" | "no">;
  createTextSession(options?: {
    topK?: number;
    temperature?: number;
  }): Promise<AITextSession>;
}

interface AITextSession {
  prompt(prompt: string): Promise<string>;
  promptStreaming(prompt: string): AsyncIterable<string>;
  destroy(): void;
  clone(): AITextSession;
}

export declare global {
  interface Window {
    ai: AI;
  }
}
