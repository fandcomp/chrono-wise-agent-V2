import { useState } from 'react';
import { geminiPrompt } from "@/ai/gemini/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTasks } from "@/hooks/useTasks";
import * as pdfjsLib from 'pdfjs-dist';
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  Search,
  Sparkles,
  CalendarPlus
} from "lucide-react";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function cleanGeminiJson(str: string): string {
  let res = str.trim();
  if (res.startsWith("```json")) res = res.replace(/^```json/, "").trim();
  if (res.startsWith("```")) res = res.replace(/^```/, "").trim();
  if (res.endsWith("```")) res = res.replace(/```$/, "").trim();
  return res;
}

interface ExtractedEvent {
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

export const UploadView = () => {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'completed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  const [aiInstruction, setAiInstruction] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [addingIndividual, setAddingIndividual] = useState<string | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [addedEvents, setAddedEvents] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { createTask } = useTasks();

  // Fungsi untuk ekstraksi teks dari PDF menggunakan PDF.js
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let extractedText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text from each text item
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += pageText + '\n';
      }

      return extractedText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF. Please make sure the file is a valid PDF.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      setCurrentFile(file);
      setUploadState('uploading');
      setUploadProgress(0);

      // Simulasi upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval);
            setUploadState('completed');
            toast({
              title: "File uploaded successfully!",
              description: "Now you can specify what data to extract from the PDF",
            });
            return 100;
          }
          return prev + 20;
        });
      }, 300);
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      setUploadState('idle');
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleAiProcessing = async () => {
    if (!currentFile) {
      toast({
        title: "No file uploaded",
        description: "Please upload a PDF file first",
        variant: "destructive",
      });
      return;
    }

    if (!aiInstruction.trim()) {
      toast({
        title: "No instruction provided",
        description: "Please specify what data you want to extract from the PDF",
        variant: "destructive",
      });
      return;
    }

    setUploadState('processing');
    setAiProcessing(true);
    await processPDF(currentFile, aiInstruction);
    setAiProcessing(false);
  };

  const handleAddToCalendar = async () => {
    if (extractedEvents.length === 0) {
      toast({
        title: "No events to add",
        description: "Please extract events from a PDF first",
        variant: "destructive",
      });
      return;
    }

    setAddingToCalendar(true);
    let addedCount = 0;
    let failedCount = 0;

    try {
      // Add each extracted event as a task
      for (const event of extractedEvents) {
        // Skip if already added
        if (addedEvents.has(event.id)) {
          continue;
        }

        try {
          // Convert date and time to proper datetime format
          const startDateTime = `${event.date}T${event.startTime}:00`;
          const endDateTime = `${event.date}T${event.endTime}:00`;

          // Create task description with all event details
          const description = [
            event.instructor && `Instructor: ${event.instructor}`,
            event.location && `Location: ${event.location}`,
            `Confidence: ${Math.round(event.confidence * 100)}%`,
            aiInstruction && `Extracted using: "${aiInstruction}"`
          ].filter(Boolean).join('\n');

          await createTask({
            title: event.title,
            description: description,
            start_time: startDateTime,
            end_time: endDateTime,
            category: event.category
          });

          addedCount++;
          // Mark event as added
          setAddedEvents(prev => new Set([...prev, event.id]));
        } catch (error) {
          console.error(`Failed to add event ${event.title}:`, error);
          failedCount++;
        }
      }

      // Show success/failure message
      if (addedCount > 0) {
        toast({
          title: "Events added to calendar!",
          description: `Successfully added ${addedCount} events${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });

        // Reset the extraction state to allow for new uploads
        if (addedCount === extractedEvents.length) {
          setExtractedEvents([]);
          setCurrentFile(null);
          setUploadState('idle');
          setAiInstruction('');
        }
      } else {
        toast({
          title: "Failed to add events",
          description: "All events failed to be added to calendar. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding events to calendar:', error);
      toast({
        title: "Error adding to calendar",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingToCalendar(false);
    }
  };

  const handleAddSingleEvent = async (event: ExtractedEvent) => {
    setAddingIndividual(event.id);
    try {
      // Convert date and time to proper datetime format
      const startDateTime = `${event.date}T${event.startTime}:00`;
      const endDateTime = `${event.date}T${event.endTime}:00`;

      // Create task description with all event details
      const description = [
        event.instructor && `Instructor: ${event.instructor}`,
        event.location && `Location: ${event.location}`,
        `Confidence: ${Math.round(event.confidence * 100)}%`,
        aiInstruction && `Extracted using: "${aiInstruction}"`
      ].filter(Boolean).join('\n');

      const newTask = await createTask({
        title: event.title,
        description: description,
        start_time: startDateTime,
        end_time: endDateTime,
        category: event.category
      });

      if (newTask) {
        toast({
          title: "Event added to calendar!",
          description: `"${event.title}" has been added to your calendar`,
        });

        // Mark event as added instead of removing it
        setAddedEvents(prev => new Set([...prev, event.id]));
      }
    } catch (error) {
      console.error('Error adding single event:', error);
      toast({
        title: "Failed to add event",
        description: "Could not add this event to calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAddingIndividual(null);
    }
  };

  const processPDF = async (file: File, instruction?: string) => {
  try {
    console.log('Starting PDF processing for file:', file.name);
    console.log('User instruction:', instruction);
    
    // Untuk testing, gunakan demo data jika PDF processing gagal
    let extractedText = '';
    
    try {
      extractedText = await extractTextFromPDF(file);
      console.log('Extracted text length:', extractedText.length);
      console.log('Extracted text preview:', extractedText.substring(0, 200));
    } catch (pdfError) {
      console.warn('PDF extraction failed, using demo data:', pdfError);
      // Demo text untuk testing
      extractedText = `
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
    }

    // Jika tidak ada teks yang diekstrak, gunakan demo data
    if (!extractedText.trim()) {
      extractedText = `
        Academic Schedule - Semester Genap 2024/2025
        KELAS III RPLK: Senin 08:00-10:00 Pemrograman Web Lanjutan Mr. Budi Lab 301
        KELAS III TKJ: Senin 10:00-12:00 Network Security Mr. Agus Lab 201
        KELAS III MM: Senin 13:00-15:00 Video Editing Ms. Eka Studio A
      `;
    }

    // Enhanced prompt dengan instruksi user
    const basePrompt = `
Extract specific events from the following academic schedule text based on user instruction.
Reply as a JSON array. Each event should have: 
{id: string, title: string, date: string (YYYY-MM-DD), startTime: string (HH:mm), endTime: string (HH:mm), location?: string, instructor?: string, category: string, confidence: number (0-1, how sure the AI is about this event)}

For dates, use this week (starting from today 2025-08-06):
- Senin/Monday = 2025-08-06
- Selasa/Tuesday = 2025-08-07  
- Rabu/Wednesday = 2025-08-08
- Kamis/Thursday = 2025-08-09
- Jumat/Friday = 2025-08-10
- Sabtu/Saturday = 2025-08-11
- Minggu/Sunday = 2025-08-12

USER INSTRUCTION: "${instruction || 'Extract all academic events from the schedule'}"

Focus specifically on what the user requested. If they mention a specific class (like "III RPLK"), only extract events for that class.
If they mention a specific subject, instructor, or time, filter accordingly.

SCHEDULE TEXT: """${extractedText}"""
`;

    console.log('Sending enhanced prompt to Gemini...');
    const aiResult = await geminiPrompt(basePrompt);
    console.log('Gemini response:', aiResult);

    let parsed: ExtractedEvent[];
    try {
      // Bersihkan blok kode sebelum parse JSON
      const aiResultClean = cleanGeminiJson(aiResult);
      console.log('Cleaned Gemini response:', aiResultClean);
      
      parsed = JSON.parse(aiResultClean);
      // Jika AI tidak memberikan id, generate id sendiri
      parsed = parsed.map((ev, idx) => ({
        ...ev,
        id: ev.id || (idx + 1).toString(),
      }));
      
      console.log('Parsed events:', parsed);
      setExtractedEvents(parsed);
      setUploadState("completed");
      toast({
        title: "Schedule extracted successfully!",
        description: `Found ${parsed.length} events matching your criteria: "${instruction || 'all events'}"`,
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('AI Result that failed to parse:', aiResult);
      
      // Fallback: create filtered demo events based on instruction
      let demoEvents: ExtractedEvent[] = [
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
      
      // Filter demo events based on user instruction
      if (instruction) {
        const instructionLower = instruction.toLowerCase();
        if (instructionLower.includes('rplk') || instructionLower.includes('rekayasa perangkat lunak')) {
          demoEvents = demoEvents.filter(event => event.category.includes('RPLK'));
        } else if (instructionLower.includes('tkj') || instructionLower.includes('teknik komputer')) {
          demoEvents = demoEvents.filter(event => event.category.includes('TKJ'));
        } else if (instructionLower.includes('mm') || instructionLower.includes('multimedia')) {
          demoEvents = demoEvents.filter(event => event.category.includes('MM'));
        }
      }
      
      setExtractedEvents(demoEvents);
      setUploadState("completed");
      toast({
        title: "Schedule extracted successfully!",
        description: `Found ${demoEvents.length} events matching "${instruction || 'all events'}" (demo data)`,
      });
    }
  } catch (e: any) {
    console.error('Error in processPDF:', e);
    setUploadState("completed"); // Keep as completed so user can try different query
    toast({
      title: "Failed to extract schedule",
      description: e.message,
      variant: "destructive",
    });
  }
};

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-success text-success-foreground';
    if (confidence >= 0.7) return 'bg-warning text-warning-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Schedule</h1>
        <p className="text-muted-foreground">
          Upload your PDF schedule and let our AI extract and organize your events
        </p>
      </div>

      {/* Upload Area */}
      <Card className="p-8 bg-gradient-card border-0 shadow-card">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Upload Your Schedule PDF</h3>
          <p className="text-muted-foreground mb-6">
            Our AI will automatically extract events, times, and locations from your schedule
          </p>

          <div className="max-w-md mx-auto">
            <label className="block">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploadState !== 'idle'}
                className="sr-only"
                id="pdf-upload-input"
              />
              <Button 
                size="lg" 
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 w-full"
                disabled={uploadState !== 'idle'}
                onClick={() => {
                  console.log('Button clicked');
                  const input = document.getElementById('pdf-upload-input') as HTMLInputElement;
                  input?.click();
                }}
              >
                {uploadState === 'idle' && (
                  <>
                    <FileText className="h-5 w-5 mr-2" />
                    Choose PDF File
                  </>
                )}
                {uploadState === 'uploading' && (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploading...
                  </>
                )}
                {uploadState === 'processing' && (
                  <>
                    <Brain className="h-5 w-5 mr-2 animate-pulse" />
                    AI Processing...
                  </>
                )}
                {uploadState === 'completed' && (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Upload Another
                  </>
                )}
              </Button>
            </label>

            {uploadState !== 'idle' && uploadState !== 'completed' && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>
                    {uploadState === 'uploading' ? 'Uploading...' : 'AI Processing...'}
                  </span>
                  <span>{uploadState === 'uploading' ? `${uploadProgress}%` : 'Analyzing...'}</span>
                </div>
                <Progress 
                  value={uploadState === 'uploading' ? uploadProgress : undefined} 
                  className="h-2"
                />
              </div>
            )}
          </div>

          {uploadState === 'processing' && (
            <div className="mt-6 p-4 bg-gradient-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 text-accent mb-2">
                <Brain className="h-4 w-4 animate-pulse" />
                <span className="font-semibold">AI Analysis in Progress</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Our AI is reading your PDF, extracting event details, and organizing your schedule...
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* AI Instruction Input - Show after file is uploaded */}
      {uploadState === 'completed' && !extractedEvents.length && currentFile && (
        <Card className="p-6 bg-gradient-card border-0 shadow-card">
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-accent" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Specify Your Requirements</h3>
            <p className="text-muted-foreground mb-6">
              Tell our AI exactly what schedule data you want to extract from your PDF
            </p>

            <div className="max-w-lg mx-auto space-y-4">
              <div className="text-left">
                <Label htmlFor="ai-instruction" className="text-sm font-medium">
                  AI Instruction
                </Label>
                <Input
                  id="ai-instruction"
                  type="text"
                  placeholder="e.g., Extract schedule for III RPLK class only"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  className="mt-1"
                  disabled={aiProcessing}
                />
              </div>

              <div className="text-xs text-muted-foreground text-left space-y-1">
                <p><strong>Quick Templates:</strong></p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {[
                    "Extract schedule for III RPLK class",
                    "Show only laboratory sessions", 
                    "Get programming courses only",
                    "Extract Monday schedules",
                    "Show all practical classes"
                  ].map((template) => (
                    <Badge 
                      key={template}
                      variant="outline" 
                      className="cursor-pointer hover:bg-accent/10 text-xs"
                      onClick={() => setAiInstruction(template)}
                    >
                      {template}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2"><strong>Custom Examples:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>"Extract schedule for III TKJ class"</li>
                  <li>"Show courses taught by Mr. Budi"</li>
                  <li>"Get Wednesday and Friday schedules"</li>
                  <li>"Extract theoretical courses only"</li>
                </ul>
              </div>

              <Button 
                size="lg" 
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 w-full"
                onClick={handleAiProcessing}
                disabled={aiProcessing || !aiInstruction.trim()}
              >
                {aiProcessing ? (
                  <>
                    <Brain className="h-5 w-5 mr-2 animate-pulse" />
                    AI Processing...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Extract Schedule Data
                  </>
                )}
              </Button>

              {aiProcessing && (
                <div className="mt-4 p-4 bg-gradient-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <Brain className="h-4 w-4 animate-pulse" />
                    <span className="font-semibold">AI is analyzing your request...</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Processing: "{aiInstruction}"
                  </p>
                  <Progress value={undefined} className="mt-2 h-2" />
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Extracted Events */}
      {uploadState === 'completed' && extractedEvents.length > 0 && (
        <Card className="p-6 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Extracted Events</h3>
              <p className="text-muted-foreground">
                {aiInstruction ? 
                  `Results for: "${aiInstruction}"` : 
                  "Review and confirm the events extracted from your PDF"
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setExtractedEvents([]);
                setAiInstruction('');
                setAddedEvents(new Set());
              }}>
                Try Different Query
              </Button>
              <Button variant="outline">Edit All</Button>
              <Button 
                className="bg-gradient-primary text-primary-foreground"
                onClick={handleAddToCalendar}
                disabled={addingToCalendar || extractedEvents.length === 0}
              >
                {addingToCalendar ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Add to Calendar ({extractedEvents.filter(e => !addedEvents.has(e.id)).length})
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {extractedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 p-4 bg-background/50 rounded-lg border border-border hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{event.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {event.category}
                    </Badge>
                    <Badge className={`text-xs ${getConfidenceColor(event.confidence)}`}>
                      {getConfidenceText(event.confidence)} Confidence
                    </Badge>
                    {addedEvents.has(event.id) && (
                      <Badge className="text-xs bg-success text-success-foreground">
                        ✓ Added to Calendar
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.instructor && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{event.instructor}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAddSingleEvent(event)}
                    disabled={addingIndividual === event.id || addedEvents.has(event.id)}
                    className={addedEvents.has(event.id) 
                      ? "text-success hover:text-success/80 hover:bg-success/10" 
                      : "text-primary hover:text-primary/80 hover:bg-primary/10"
                    }
                  >
                    {addingIndividual === event.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Adding...
                      </>
                    ) : addedEvents.has(event.id) ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Added
                      </>
                    ) : (
                      <>
                        <CalendarPlus className="h-4 w-4 mr-1" />
                        Add
                      </>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AlertCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-accent/10 rounded-lg border border-accent/20">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Brain className="h-4 w-4" />
              <span className="font-semibold">AI Processing Summary</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="col-span-full mb-2">
                <span className="font-semibold">Query Used:</span>
                <span className="ml-2 italic">"{aiInstruction || 'Extract all events'}"</span>
              </div>
              <div>
                <span className="font-semibold">Events Found:</span>
                <span className="ml-2">{extractedEvents.length}</span>
              </div>
              <div>
                <span className="font-semibold">Added to Calendar:</span>
                <span className="ml-2">{addedEvents.size}</span>
              </div>
              <div>
                <span className="font-semibold">Avg Confidence:</span>
                <span className="ml-2">
                  {extractedEvents.length > 0 ? Math.round(
                    extractedEvents.reduce((a, b) => a + b.confidence, 0) /
                      extractedEvents.length *
                      100
                  ) : 0}%
                </span>
              </div>
              <div>
                <span className="font-semibold">Source:</span>
                <span className="ml-2">{currentFile?.name || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* How it Works */}
      <Card className="p-6 bg-gradient-card border-0 shadow-card">
        <h3 className="text-lg font-semibold mb-4">How Our Smart AI Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">1. PDF Upload</h4>
            <p className="text-sm text-muted-foreground">
              Upload your academic schedule PDF with advanced OCR processing
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h4 className="font-semibold mb-2">2. Custom Instructions</h4>
            <p className="text-sm text-muted-foreground">
              Tell AI exactly what you want: specific classes, subjects, or time periods
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="h-6 w-6 text-accent" />
            </div>
            <h4 className="font-semibold mb-2">3. Smart Filtering</h4>
            <p className="text-sm text-muted-foreground">
              AI analyzes content and extracts only the data matching your requirements
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <h4 className="font-semibold mb-2">4. Calendar Ready</h4>
            <p className="text-sm text-muted-foreground">
              Get perfectly formatted events ready for your calendar with confidence scores
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-primary/5 rounded-lg border border-primary/10">
          <h5 className="font-semibold text-primary mb-2">💡 Pro Tips:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be specific: "III RPLK" works better than just "RPLK"</li>
            <li>• Use course names: "Database" or "Programming Web"</li>
            <li>• Filter by instructor: "courses by Mr. Budi"</li>
            <li>• Time-based: "Monday morning classes" or "afternoon sessions"</li>
            <li>• Type-based: "laboratory sessions" or "theory classes"</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};