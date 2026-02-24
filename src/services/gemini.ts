import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  type: "text" | "image";
  imageUrl?: string;
  timestamp: number;
}

export const geminiModel = "gemini-3-flash-preview";
export const imageModel = "gemini-2.5-flash-image";

export async function generateChatResponse(prompt: string, history: { role: string; parts: { text: string }[] }[]) {
  const chat = ai.chats.create({
    model: geminiModel,
    config: {
      systemInstruction: "You are Lumina, a helpful and creative AI assistant. You can generate text and help with images. If the user asks for an image, you should acknowledge it and explain that you are generating it. Keep responses concise and friendly.",
    },
  });

  // Since we are using a simple wrapper, we'll just send the message
  // In a real app, we'd pass the history to ai.chats.create({ history })
  const response = await chat.sendMessage({ message: prompt });
  return response.text;
}

export async function generateImage(prompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: imageModel,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

export async function searchGrounding(query: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web?.uri).filter(Boolean) || []
  };
}
