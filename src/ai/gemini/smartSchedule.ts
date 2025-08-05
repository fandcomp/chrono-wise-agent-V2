import { geminiPrompt } from "src/ai/gemini/client";

export async function suggestSchedule(tasks: string[], preferences: string) {
  const prompt = `
    Berdasarkan daftar tugas berikut: ${tasks.join(", ")} 
    dan preferensi user: ${preferences}, 
    buatkan jadwal harian ringkas yang optimal.
  `;
  return geminiPrompt(prompt);
}