
/**
 * SECURITY FIX: Refactored to use a secure development proxy.
 * The API key is now handled on the server side via the Vite proxy in vite.config.ts,
 * preventing it from being leaked to the client bundle.
 */
export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        system_instruction: {
          parts: [{ text: "You are an expert in photonic logic, hardware description languages, and neuromorphic architecture. Generate concise, well-structured code or patterns based on the user's request." }]
        },
        generation_config: {
          temperature: 0.5,
        }
      }),
    });

    if (response.status === 404) {
      throw new Error("API endpoint not found. If you are in production, a backend proxy is required as the Vite dev proxy is only for local development.");
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    if (error instanceof Error) {
      return `An error occurred while contacting the Gemini API: ${error.message}`;
    }
    return 'An unknown error occurred while contacting the Gemini API.';
  }
};
