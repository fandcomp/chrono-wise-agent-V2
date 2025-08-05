import { useState } from "react";
import { geminiPrompt } from "src/ai/gemini/client";

export function useGeminiAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const askAI = async (prompt: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await geminiPrompt(prompt);
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return { askAI, loading, result, error };
}