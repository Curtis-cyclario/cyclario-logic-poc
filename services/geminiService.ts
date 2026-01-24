
export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ "parts": [{ "text": prompt }] }],
        systemInstruction: { "parts": [{ "text": "You are an expert in photonic logic, hardware description languages, and neuromorphic architecture. Generate concise, well-structured code or patterns based on the user's request." }] },
        generationConfig: {
            "temperature": 0.5
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Extract the text from the response, with checks for the nested structure.
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
