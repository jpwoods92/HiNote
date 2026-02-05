/**
 * Service to interact with the built-in browser AI.
 */
export const LocalAIService = {
  /**
   * Checks if the browser's built-in AI is available.
   * @returns {Promise<{isAvailable: boolean}>} - A promise that resolves to an object indicating if the AI is available.
   */
  async canCreateTextSession(): Promise<{ isAvailable: boolean }> {
    if (window.ai && typeof window.ai.canCreateTextSession === "function") {
      const result = await window.ai.canCreateTextSession();
      return { isAvailable: result === "readily" };
    }
    return { isAvailable: false };
  },

  /**
   * Summarizes the given text using the local AI.
   * @param {string} text - The text to summarize.
   * @returns {Promise<AsyncIterable<string>>} - A promise that resolves to a streaming response from the AI.
   */
  async summarize(text: string): Promise<AsyncIterable<string>> {
    if (!window.ai) {
      throw new Error("AI is not available.");
    }
    const session = await window.ai.createTextSession();
    const prompt = `Summarize the following text in one concise sentence: ${text}`;
    return session.promptStreaming(prompt);
  },

  /**
   * Suggests tags for the given text using the local AI.
   * @param {string} text - The text to analyze.
   * @returns {Promise<string[]>} - A promise that resolves to an array of suggested tags.
   */
  async suggestTags(text: string): Promise<string[]> {
    if (!window.ai) {
      throw new Error("AI is not available.");
    }
    const session = await window.ai.createTextSession();
    const prompt = `Analyze this text and generate 3 relevant, single-word keyword tags. Format as CSV: ${text}`;
    const response = await session.prompt(prompt);
    return response.split(",").map((tag: string) => tag.trim());
  },
};
