export const generateDesign = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message ||
          `API request failed with status ${response.status}`,
      );
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.'
    );
  } catch (error) {
    console.error('Error generating content from Gemini API via proxy:', error);
    if (error instanceof Error) {
      return `An error occurred while contacting the Gemini API: ${error.message}`;
    }
    return 'An unknown error occurred while contacting the Gemini API.';
  }
};
