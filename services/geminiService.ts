
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
      throw new Error("API endpoint not found. This service requires a backend proxy to function in production.");
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    // Security: Returning a generic error message to avoid leaking internal details or stack traces
    return 'An error occurred while contacting the AI service. Please try again later.';
  }
};
