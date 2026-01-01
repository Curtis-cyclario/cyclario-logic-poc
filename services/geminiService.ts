
import { GoogleGenAI } from "@google/genai";

// 🛡️ Sentinel: Patched a critical security vulnerability.
// The API key is no longer exposed to the client-side.
// All API requests should be proxied through a secure backend service.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  throw new Error(
    "CRITICAL: GEMINI_API_KEY is not defined.\n" +
    "For security reasons, the API key can no longer be exposed on the client-side.\n" +
    "Please implement a backend proxy to handle Gemini API requests securely.\n" +
    "The proxy should read the API key from a server-side environment variable and forward requests to the Google GenAI API."
  );
}

const ai = new GoogleGenAI({ apiKey });

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
