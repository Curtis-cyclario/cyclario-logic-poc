
// 🛡️ SENTINEL SECURITY WARNING 🛡️
// The use of `process.env.API_KEY` here is a placeholder for development
// and is NOT secure for production. This key will be exposed on the client-side.
// See the `vite.config.ts` file for details on the vulnerability and
// instructions on how to implement a secure backend proxy for production.

import { GoogleGenAI } from "@google/genai";

// FIX: Aligned with SDK guidelines to assume process.env.API_KEY is always available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    // FIX: Using gemini-3-pro-preview for complex coding and hardware logic tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert in photonic logic, hardware description languages, and neuromorphic architecture. Generate concise, well-structured code or patterns based on the user's request.",
        temperature: 0.5,
      }
    });
    // FIX: Directly accessing .text property (not a function) as per latest guidelines.
    return response.text || "No response generated.";
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    // FIX: Added type checking for the caught error to safely access the message property.
    if (error instanceof Error) {
      return `An error occurred while contacting the Gemini API: ${error.message}`;
    }
    return 'An unknown error occurred while contacting the Gemini API.';
  }
};
