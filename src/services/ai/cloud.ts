import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { SettingsService } from "../../utils/settings";

export interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export const CloudAIService = {
  async ask(highlight: string, history: ChatMessage[]): Promise<string> {
    const settings = await SettingsService.get();
    if (!settings.apiKey || !settings.aiProvider) {
      throw new Error("API key or provider not set.");
    }

    let model;
    if (settings.aiProvider === "openai") {
      model = new ChatOpenAI({
        apiKey: settings.apiKey,
        modelName: settings.aiModelId || "gpt-3.5-turbo",
      });
    } else if (settings.aiProvider === "anthropic") {
      model = new ChatAnthropic({
        apiKey: settings.apiKey,
        modelName: settings.aiModelId || "claude-2",
      });
    } else if (settings.aiProvider === "gemini") {
      model = new ChatGoogleGenerativeAI({
        apiKey: settings.apiKey,
        model: settings.aiModelId || "gemini-pro",
      });
    } else {
      throw new Error("Invalid AI provider.");
    }

    const messages = [
      new SystemMessage(
        `You are a helpful study assistant. The user is reading: '${highlight}'.`,
      ),
      ...history.map((msg) => {
        if (msg.sender === "user") {
          return new HumanMessage(msg.text);
        } else {
          return new AIMessage(msg.text);
        }
      }),
    ];

    const response = await model.invoke(messages);
    return response.content.toString();
  },
};
