import { geminiPrompt } from "@/ai/gemini/client";
import { CalendarAPI } from "@/integrations/calendar";
import { getTasksForUser } from "@/hooks/useTasks";

export class AgentController {
  userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }

  async run() {
    // 1. Ambil semua task user yang belum dijadwalkan
    const tasks = await getTasksForUser(this.userId);
    // 2. Ambil jadwal kalender user
    const calendarEvents = await CalendarAPI.getEvents(this.userId);

    // 3. Minta LLM untuk membuat rencana penjadwalan otomatis
    const prompt = `
Berikut adalah daftar task: ${JSON.stringify(tasks)}
Berikut event di kalender: ${JSON.stringify(calendarEvents)}
Buatkan penjadwalan optimal, pastikan tidak bentrok. Balas sebagai array JSON, setiap item: {taskId, tanggal, waktuMulai, waktuSelesai}.
    `;
    const planRaw = await geminiPrompt(prompt);
    // Ekstrak JSON seperti teknik sebelumnya
    const plan = extractJsonOnly(planRaw);

    // 4. Eksekusi rencana: buat event di calendar
    for (const step of plan) {
      try {
        await CalendarAPI.createEvent(this.userId, step);
      } catch (e) {
        // Jika gagal, lakukan perbaikan otomatis (misal: cari waktu lain, update plan, dst)
        await this.handleFailure(step, e);
      }
    }
  }

  async handleFailure(step, err) {
    // Contoh: minta LLM pilih waktu lain, atau atur ulang langkah
    const prompt = `
Gagal membuat event dengan detail: ${JSON.stringify(step)}. Error: ${err}.
Cari solusi alternatif, balas dalam format seperti sebelumnya.
    `;
    const newStepRaw = await geminiPrompt(prompt);
    const newStep = extractJsonOnly(newStepRaw)[0];
    await CalendarAPI.createEvent(this.userId, newStep);
  }
}

// Fungsi ekstrak JSON (seperti sebelumnya)
function extractJsonOnly(str: string): any[] {
  let res = str.trim();
  if (res.startsWith("```json")) res = res.replace(/^```json/, "").trim();
  if (res.startsWith("```")) res = res.replace(/^```/, "").trim();
  if (res.endsWith("```")) res = res.replace(/```$/, "").trim();
  const firstCurly = res.indexOf("[");
  const lastCurly = res.lastIndexOf("]");
  if (firstCurly !== -1 && lastCurly !== -1 && firstCurly < lastCurly) {
    return JSON.parse(res.substring(firstCurly, lastCurly + 1));
  }
  return [];
}