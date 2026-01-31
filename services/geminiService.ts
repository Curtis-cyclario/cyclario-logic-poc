
// 🛡️ Sentinel: Refactored to use standard fetch with a secure proxy to avoid exposing API keys on the client side.
// Removed dependency on @google/genai SDK for better security and smaller bundle size.

export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: {
          parts: [{ text: "You are an expert in photonic logic, hardware description languages, and neuromorphic architecture. Generate concise, well-structured code or patterns based on the user's request." }]
        },
        generationConfig: {
          temperature: 0.5,
        }
      }),
    });

    if (!response.ok) {
      // 🛡️ Sentinel: Secure error handling - don't leak HTTP status details in a way that reveals internals
      throw new Error(`Service temporarily unavailable`);
    }

    const data = await response.json();

    // Extract text from the Google AI REST API response format
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return generatedText || "No response generated.";
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    // 🛡️ Sentinel: Generic error message to prevent information leakage
    return 'An error occurred while processing your request. Please try again later.';
  }
};
