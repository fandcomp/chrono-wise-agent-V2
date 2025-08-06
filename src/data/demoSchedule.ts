// Demo data untuk testing - dipisah untuk code splitting
export const DEMO_SCHEDULE_TEXT = `
Academic Schedule - Semester Genap 2024/2025

KELAS III RPLK (Rekayasa Perangkat Lunak dan Gim):
Senin 08:00 - 10:00 Pemrograman Web Lanjutan Mr. Budi Ruang Lab 301
Selasa 10:30 - 12:30 Database Management System Ms. Sari Ruang Lab 302
Rabu 14:00 - 16:00 Mobile App Development Mr. Andi Ruang Lab 303
Kamis 09:00 - 11:00 Software Engineering Dr. Rini Ruang 304
Jumat 13:00 - 15:00 Game Development Mr. Doni Ruang Lab 305

KELAS III TKJ (Teknik Komputer dan Jaringan):
Senin 10:00 - 12:00 Network Security Mr. Agus Ruang Lab 201
Selasa 08:00 - 10:00 Server Administration Ms. Dewi Ruang Lab 202
Rabu 13:00 - 15:00 Wireless Technology Dr. Hadi Ruang Lab 203

KELAS III MM (Multimedia):
Senin 13:00 - 15:00 Video Editing Ms. Eka Ruang Studio A
Selasa 14:00 - 16:00 3D Animation Mr. Fajar Ruang Studio B
`;

export const DEMO_EVENTS = [
  {
    id: "1",
    title: "Pemrograman Web Lanjutan",
    date: "2025-08-06",
    startTime: "08:00",
    endTime: "10:00",
    location: "Lab 301",
    instructor: "Mr. Budi",
    category: "RPLK - Practical",
    confidence: 0.9
  },
  {
    id: "2", 
    title: "Database Management System",
    date: "2025-08-07",
    startTime: "10:30",
    endTime: "12:30",
    location: "Lab 302",
    instructor: "Ms. Sari",
    category: "RPLK - Theory",
    confidence: 0.85
  },
  {
    id: "3",
    title: "Mobile App Development", 
    date: "2025-08-08",
    startTime: "14:00",
    endTime: "16:00",
    location: "Lab 303",
    instructor: "Mr. Andi",
    category: "RPLK - Practical",
    confidence: 0.88
  },
  {
    id: "4",
    title: "Network Security",
    date: "2025-08-06",
    startTime: "10:00",
    endTime: "12:00",
    location: "Lab 201",
    instructor: "Mr. Agus",
    category: "TKJ - Theory",
    confidence: 0.9
  },
  {
    id: "5",
    title: "Video Editing",
    date: "2025-08-06",
    startTime: "13:00",
    endTime: "15:00",
    location: "Studio A",
    instructor: "Ms. Eka",
    category: "MM - Practical",
    confidence: 0.87
  }
];

export interface ExtractedEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  instructor?: string;
  category: string;
  confidence: number;
}
