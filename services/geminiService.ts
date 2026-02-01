
export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    // SECURITY FIX: Using a secure development proxy to avoid exposing the API key on the client.
    // NOTE: This proxy is only available in development via Vite. In production,
    // a proper backend/proxy service is required to handle these requests securely.
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

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("API endpoint not found. If you are in production, a backend proxy is required.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    // FIX: Extracting text from the REST API response format.
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    // FIX: Added type checking for the caught error to safely access the message property.
    if (error instanceof Error) {
      return `An error occurred while contacting the Gemini API: ${error.message}`;
    }
    return 'An unknown error occurred while contacting the Gemini API.';
  }
};
