// 🛡️ SENTINEL: Refactored to use a secure proxy, removing the need for the @google/genai SDK
// and preventing the API key from being exposed on the client-side.
export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        // NOTE: The systemInstruction and temperature from the original SDK call
        // are now mapped to the REST API structure.
        systemInstruction: {
          parts: [{
            text: "You are an expert in photonic logic, hardware description languages, and neuromorphic architecture. Generate concise, well-structured code or patterns based on the user's request."
          }]
        },
        generationConfig: {
          temperature: 0.5,
        }
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    // 🛡️ SENTINEL: Safely access the generated text from the API response.
    // The response structure is based on the Google GenAI REST API.
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || "No response generated.";
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    if (error instanceof Error) {
      return `An error occurred while contacting the Gemini API: ${error.message}`;
    }
    return 'An unknown error occurred while contacting the Gemini API.';
  }
};
