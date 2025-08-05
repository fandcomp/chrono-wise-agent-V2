const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function callGeminiAPI(
  endpoint: string,
  body: any
): Promise<any> {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${GEMINI_API_KEY}`;
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
  return await response.json();
}

export async function geminiChat(prompt: string, history?: any[]) {
  return callGeminiAPI("gemini-pro:generateContent", {
    contents: [
      ...(history || []).map((h) => ({
        role: h.role,
        parts: [{ text: h.content }]
      })),
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
  });
}

// Siap untuk extend ke fitur lain (NLP, OCR, dsb)