
// 🚨 CRITICAL SECURITY WARNING 🚨
// This service uses a Vite proxy for development to secure the API key.
// This proxy is NOT SUITABLE FOR PRODUCTION. A proper server-side backend
// (e.g., a serverless function) is required to securely handle the API key
// in a deployed environment.
export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    // In a production environment, this fetch call would need to be directed
    // to a secure, server-side endpoint that manages the API key.
    const response = await fetch('/api/v1beta/models/gemini-pro:generateContent', {
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
        generationConfig: {
          temperature: 0.5,
        },
        // TODO: Add system instruction if the model supports it
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error.message || 'API request failed');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text || "No response generated.";
  } catch (error) {
    console.error("Error generating content from Gemini API:", error);
    if (error instanceof Error) {
      return `An error occurred while contacting the Gemini API: ${error.message}`;
    }
    return 'An unknown error occurred while contacting the Gemini API.';
  }
};
