// 🛡️ SENTINEL: Refactored to use a secure, server-side proxy instead of the @google/genai SDK.
// This prevents the API key from being exposed on the client.
export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
        systemInstruction: {
          parts: {
            text: "You are an expert in photonic logic, hardware description languages, and neuromorphic architecture. Generate concise, well-structured code or patterns based on the user's request."
          }
        },
        generationConfig: {
          temperature: 0.5,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error from Gemini API proxy:", errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return text || "No response generated.";
  } catch (error) {
    console.error("Error generating content via proxy:", error);
    if (error instanceof Error) {
      return `An error occurred while contacting the Gemini API: ${error.message}`;
    }
    return 'An unknown error occurred while contacting the Gemini API.';
  }
};
