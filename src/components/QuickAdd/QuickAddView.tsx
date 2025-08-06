import { useState } from 'react';
import { geminiPrompt } from "@/ai/gemini/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { 
  PlusCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Tag,
  Brain,
  Zap,
  CheckCircle2,
  Loader2,
  AlertTriangle
} from "lucide-react";

interface ParsedEvent {
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

const nlpExamples = [
  "nanti sore saya akan mencuci",
  "besok pagi meeting dengan klien jam 9",
  "minggu depan Rabu deadline laporan",
  "hari Jumat gym session jam 5 sore", 
  "malam ini belajar untuk ujian",
  "lunch dengan tim besok jam 12:30",
  "presentasi project Senin depan pagi"
];

function extractJsonOnly(str: string): string {
  // Hilangkan blok markdown
  let res = str.trim();
  if (res.startsWith("```json")) res = res.replace(/^```json/, "").trim();
  if (res.startsWith("```")) res = res.replace(/^```/, "").trim();
  if (res.endsWith("```")) res = res.replace(/```$/, "").trim();
  // Ambil hanya bagian JSON (kurung kurawal awal hingga akhir)
  const firstCurly = res.indexOf("{");
  const lastCurly = res.lastIndexOf("}");
  if (firstCurly !== -1 && lastCurly !== -1 && firstCurly < lastCurly) {
    return res.substring(firstCurly, lastCurly + 1);
  }
  return res;
}

export const QuickAddView = () => {
  const [naturalInput, setNaturalInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedEvent, setParsedEvent] = useState<ParsedEvent | null>(null);
  const [manualMode, setManualMode] = useState(false);
  
  // Manual form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Personal',
    date: '',
    priority: 'medium',
    startTime: '',
    endTime: '',
    location: '',
    description: ''
  });
  
  const { toast } = useToast();
  const { createTask } = useTasks();

  const handleNaturalLanguageParse = async () => {
    if (!naturalInput.trim()) return;

    setIsProcessing(true);
    try {
      // Enhanced prompt untuk natural language Indonesia
      const currentDate = new Date();
      const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = currentDate.toTimeString().slice(0, 5); // HH:mm
      
      const prompt = `
Kamu adalah AI assistant yang ahli dalam memahami bahasa Indonesia dan mengubah input natural language menjadi data terstruktur untuk task/event.

INPUT USER: "${naturalInput}"

KONTEKS WAKTU:
- Hari ini: ${currentDateStr}
- Waktu sekarang: ${currentTime}

TUGAS: Analisis input dan ekstrak informasi berikut dalam format JSON:

PETUNJUK INTERPRETASI:
- "nanti sore" = hari ini sekitar 16:00-18:00
- "besok pagi" = hari berikutnya sekitar 08:00-10:00  
- "minggu depan" = 7 hari dari sekarang
- "jam 2 siang" = 14:00
- Jika tidak ada waktu spesifik, berikan waktu yang masuk akal sesuai konteks
- Jika tidak ada tanggal, asumsikan hari ini atau waktu terdekat yang masuk akal

FORMAT OUTPUT (JSON only, no explanation):
{
  "title": "nama kegiatan yang jelas",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm", 
  "endTime": "HH:mm",
  "location": "lokasi jika disebutkan",
  "category": "Personal/Work/Study/Health/Meeting",
  "priority": "high/medium/low",
  "confidence": 0.95
}

CONTOH:
Input: "nanti sore saya akan mencuci"
Output: {"title": "Mencuci", "date": "${currentDateStr}", "startTime": "16:00", "endTime": "17:00", "location": "", "category": "Personal", "priority": "medium", "confidence": 0.9}

Sekarang proses input user dan berikan JSON:
`;

      const aiResult = await geminiPrompt(prompt);
      console.log('AI Response:', aiResult);

      let parsed;
      try {
        const aiResultClean = extractJsonOnly(aiResult);
        console.log('Cleaned JSON:', aiResultClean);
        parsed = JSON.parse(aiResultClean);
        
        // Validasi dan normalisasi data
        if (!parsed.title || !parsed.date || !parsed.startTime) {
          throw new Error("Data tidak lengkap dari AI");
        }
        
        // Set default endTime jika tidak ada
        if (!parsed.endTime) {
          const startDate = new Date(`${parsed.date}T${parsed.startTime}`);
          const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 jam
          parsed.endTime = endDate.toTimeString().slice(0, 5);
        }
        
      } catch (parseError) {
        console.error('Parse error:', parseError);
        throw new Error("AI response format error: " + aiResult);
      }

      setParsedEvent(parsed);
      toast({
        title: "Event parsed successfully!",
        description: "AI has extracted the event details from your input",
      });
    } catch (e: any) {
      toast({
        title: "AI Error",
        description: e.message,
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  const handleSaveEvent = async () => {
    if (!parsedEvent) return;
    
    try {
      const startDateTime = new Date(`${parsedEvent.date}T${parsedEvent.startTime}`).toISOString();
      const endDateTime = parsedEvent.endTime 
        ? new Date(`${parsedEvent.date}T${parsedEvent.endTime}`).toISOString()
        : new Date(new Date(`${parsedEvent.date}T${parsedEvent.startTime}`).getTime() + 60 * 60 * 1000).toISOString();
      
      console.log('Saving task:', {
        title: parsedEvent.title,
        start_time: startDateTime,
        end_time: endDateTime,
        category: parsedEvent.category
      });
      
      const newTask = await createTask({
        title: parsedEvent.title,
        description: `AI Generated: "${naturalInput}"${parsedEvent.location ? ` | Lokasi: ${parsedEvent.location}` : ''}`,
        start_time: startDateTime,
        end_time: endDateTime,
        category: parsedEvent.category
      });
      
      if (newTask) {
        toast({
          title: "Task berhasil ditambahkan!",
          description: `"${parsedEvent.title}" telah ditambahkan ke jadwal Anda`,
        });
        
        // Reset form
        setNaturalInput('');
        setParsedEvent(null);
      } else {
        throw new Error("Gagal menyimpan task");
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan task. Silakan coba lagi.",
        variant: "destructive"
      });
    }
  };

  const handleManualSave = async () => {
    if (!formData.title || !formData.date || !formData.startTime) {
      toast({
        title: "Missing required fields",
        description: "Please fill in title, date, and start time.",
        variant: "destructive"
      });
      return;
    }

    const startDateTime = new Date(`${formData.date}T${formData.startTime}`).toISOString();
    const endDateTime = formData.endTime 
      ? new Date(`${formData.date}T${formData.endTime}`).toISOString()
      : new Date(new Date(`${formData.date}T${formData.startTime}`).getTime() + 60 * 60 * 1000).toISOString();
    
    await createTask({
      title: formData.title,
      description: formData.description,
      start_time: startDateTime,
      end_time: endDateTime,
      category: formData.category
    });
    
    // Reset form
    setFormData({
      title: '',
      category: 'Personal',
      date: '',
      priority: 'medium',
      startTime: '',
      endTime: '',
      location: '',
      description: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quick Add Event</h1>
        <p className="text-muted-foreground">
          Use natural language or manual input to quickly add events to your calendar
        </p>
      </div>

      {/* Input Mode Toggle */}
      <Card className="p-6 bg-gradient-card border-0 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Add New Event</h3>
          <div className="flex gap-2">
            <Button
              variant={!manualMode ? "default" : "outline"}
              onClick={() => setManualMode(false)}
              className={!manualMode ? "bg-gradient-primary text-primary-foreground" : ""}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Smart Input
            </Button>
            <Button
              variant={manualMode ? "default" : "outline"}
              onClick={() => setManualMode(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Manual Input
            </Button>
          </div>
        </div>

        {!manualMode ? (
          /* Natural Language Input */
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-primary" />
                <label className="block text-sm font-medium">
                  Tulis kegiatan Anda dalam bahasa natural
                </label>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="Contoh: 'nanti sore saya akan mencuci' atau 'besok pagi meeting dengan klien jam 9' atau 'minggu depan Rabu deadline laporan'"
                  value={naturalInput}
                  onChange={(e) => setNaturalInput(e.target.value)}
                  className="min-h-[100px] pr-12"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleNaturalLanguageParse}
                  disabled={!naturalInput.trim() || isProcessing}
                  className="absolute bottom-3 right-3 bg-gradient-primary text-primary-foreground"
                  size="sm"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Help Text */}
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Tips:</strong> AI akan otomatis menentukan waktu yang sesuai berdasarkan konteks. 
                  Misalnya "nanti sore" = sekitar 16:00, "besok pagi" = sekitar 08:00.
                </p>
              </div>
            </div>

            {/* Examples */}
            <div>
              <p className="text-sm font-medium mb-3">Try these examples:</p>
              <div className="flex flex-wrap gap-2">
                {nlpExamples.map((example, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => setNaturalInput(example)}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <div className="p-4 bg-gradient-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span className="font-semibold">AI Processing</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Analyzing your input and extracting event details...
                </p>
              </div>
            )}

            {/* Parsed Result */}
            {parsedEvent && !isProcessing && (
              <Card className="p-4 bg-background/50 border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <h4 className="font-semibold">AI Berhasil Memproses Input Anda</h4>
                    <Badge 
                      className={`text-xs ${
                        parsedEvent.confidence >= 0.8 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-warning text-warning-foreground'
                      }`}
                    >
                      {Math.round(parsedEvent.confidence * 100)}% Akurat
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setParsedEvent(null)}>
                    Edit Manual
                  </Button>
                </div>

                {/* Original Input */}
                <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Input Anda:</p>
                  <p className="text-sm font-medium italic">"{naturalInput}"</p>
                </div>

                {/* Parsed Details */}
                <div className="mb-4">
                  <h5 className="font-medium mb-3 text-center text-lg">📅 {parsedEvent.title}</h5>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-medium">Tanggal:</span>
                      <span className="text-foreground">
                        {new Date(parsedEvent.date).toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="font-medium">Waktu:</span>
                      <span className="text-foreground font-mono">
                        {parsedEvent.startTime}{parsedEvent.endTime && ` - ${parsedEvent.endTime}`}
                      </span>
                    </div>

                    {parsedEvent.location && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">Lokasi:</span>
                        <span className="text-foreground">{parsedEvent.location}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      <span className="font-medium">Kategori:</span>
                      <Badge variant="secondary" className="text-xs">
                        {parsedEvent.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      <span className="font-medium">Prioritas:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          parsedEvent.priority === 'high' ? 'border-destructive text-destructive' :
                          parsedEvent.priority === 'medium' ? 'border-warning text-warning' :
                          'border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        {parsedEvent.priority === 'high' ? 'Tinggi' : 
                         parsedEvent.priority === 'medium' ? 'Sedang' : 'Rendah'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    onClick={() => setParsedEvent(null)}
                    className="flex-1"
                  >
                    ✏️ Edit Manual
                  </Button>
                  <Button 
                    onClick={handleSaveEvent}
                    className="bg-gradient-primary text-primary-foreground flex-1 font-semibold"
                  >
                    ✅ Tambah ke Timeline
                  </Button>
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* Manual Input Form */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Event Title</label>
                <Input 
                  placeholder="Enter event title" 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Work">Work</SelectItem>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Break">Break</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <Input 
                  type="time" 
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <Input 
                  type="time" 
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location (Optional)</label>
              <Input 
                placeholder="Enter location" 
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <Textarea 
                placeholder="Add any additional details" 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormData({
                title: '',
                category: 'Personal',
                date: '',
                priority: 'medium',
                startTime: '',
                endTime: '',
                location: '',
                description: ''
              })}>
                Cancel
              </Button>
              <Button onClick={handleManualSave} className="bg-gradient-primary text-primary-foreground">
                Add Event
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* AI Features Info */}
      <Card className="p-6 bg-gradient-accent text-accent-foreground border-0 shadow-glow">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Smart Input Features</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-accent-foreground/10 rounded-lg p-3">
            <h4 className="font-semibold mb-2">🌐 Multi-Language</h4>
            <p className="text-accent-foreground/90">
              Supports Indonesian and English input
            </p>
          </div>
          
          <div className="bg-accent-foreground/10 rounded-lg p-3">
            <h4 className="font-semibold mb-2">⏰ Smart Time Detection</h4>
            <p className="text-accent-foreground/90">
              Understands relative times like "besok", "minggu depan"
            </p>
          </div>
          
          <div className="bg-accent-foreground/10 rounded-lg p-3">
            <h4 className="font-semibold mb-2">🎯 Context Awareness</h4>
            <p className="text-accent-foreground/90">
              Automatically categorizes and sets priority based on content
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};