// Anda bisa pakai library js/pdf-parse untuk ambil teks, lalu kirim ke Gemini
import { geminiPrompt } from "src/ai/gemini/client";

export async function extractAndSummarizePDF(pdfText: string) {
  const prompt = `Baca dan ringkas isi dokumen berikut:\n\n${pdfText}`;
  return geminiPrompt(prompt);
}