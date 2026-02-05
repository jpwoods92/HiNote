import axios from "axios";

const cache = new Map<string, string[]>();

export async function getOpenAIModels(apiKey: string): Promise<string[]> {
  if (cache.has(apiKey)) {
    return cache.get(apiKey)!;
  }
  try {
    const response = await axios.get("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    const models = response.data.data
      .map((model: any) => model.id)
      .filter((name: string) => name.startsWith("gpt"))
      .sort();
    cache.set(apiKey, models);
    return models;
  } catch (error) {
    console.error("Error fetching OpenAI models:", error);
    return [];
  }
}

export async function getGoogleGenAIModels(apiKey: string): Promise<string[]> {
  if (cache.has(apiKey)) {
    return cache.get(apiKey)!;
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    const models = response.data.models
      .map((model: any) => model.name.replace("models/", ""))
      .filter((name: string) => name.startsWith("gemini"))
      .sort();
    cache.set(apiKey, models);
    return models;
  } catch (error) {
    console.error("Error fetching Google GenAI models:", error);
    return [];
  }
}

export async function getAnthropicModels(apiKey: string): Promise<string[]> {
  if (cache.has(apiKey)) {
    return cache.get(apiKey)!;
  }
  try {
    const response = await axios.get("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
    });
    const models = response.data.data
      .map((model: any) => model.id)
      .filter((name: string) => name.startsWith("claude"))
      .sort();
    cache.set(apiKey, models);
    return models;
  } catch (error) {
    console.error("Error fetching Anthropic models:", error);
    return [];
  }
}
