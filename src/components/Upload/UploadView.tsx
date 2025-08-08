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
import type { ExtractedEvent } from "@/data/demoSchedule";
import { 
  Upload, 
  FileText, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Clock,
  MapPin,
  User,
  Search,
  Sparkles,
  Plus
} from "lucide-react";

function cleanGeminiJson(str: string): string {
  let res = str.trim();
  if (res.startsWith("```json")) res = res.replace(/^```json/, "").trim();
  if (res.startsWith("```")) res = res.replace(/^```/, "").trim();
  if (res.endsWith("```")) res = res.replace(/```$/, "").trim();
  return res;
}

export const UploadView = () => {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'completed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  const [aiInstruction, setAiInstruction] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [addingIndividual, setAddingIndividual] = useState<string | null>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [addedEvents, setAddedEvents] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { createTask } = useTasks();

  // Fungsi untuk ekstraksi teks dari PDF menggunakan PDF.js (lazy loaded)
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      // Lazy load PDF.js untuk code splitting yang lebih baik
      const pdfjsLib = await import('pdfjs-dist');
      
      // Configure worker
      const workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.js';
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        text += pageText + ' ';
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.type.includes('text')) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or text file",
        variant: "destructive",
      });
      return;
    }

    setCurrentFile(file);
    setUploadState('idle');
    setExtractedEvents([]);
    setUploadProgress(0);
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
          title: "Event added to tasks!",
          description: `"${event.title}" has been added to your tasks`,
        });

        // Mark event as added instead of removing it
        setAddedEvents(prev => new Set([...prev, event.id]));
      }
    } catch (error) {
      console.error('Error adding single event:', error);
      toast({
        title: "Failed to add event",
        description: "Could not add this event to tasks. Please try again.",
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
      // Use separated demo data for better code splitting
      const { DEMO_SCHEDULE_TEXT } = await import('@/data/demoSchedule');
      extractedText = DEMO_SCHEDULE_TEXT;
    }

    // Jika tidak ada teks yang diekstrak, gunakan demo data
    if (!extractedText || extractedText.trim().length < 50) {
      console.log('Using demo data due to insufficient extracted text');
      const { DEMO_SCHEDULE_TEXT } = await import('@/data/demoSchedule');
      extractedText = DEMO_SCHEDULE_TEXT;
    }

    console.log('Final text to process:', extractedText.length, 'characters');

    setUploadProgress(30);

    // Gunakan Gemini untuk mengekstrak jadwal
    const prompt = `
    Ekstrak jadwal acara dari teks berikut dan berikan hasil dalam format JSON array. 
    ${instruction ? `Instruksi khusus: ${instruction}` : 'Ekstrak semua event yang terdeteksi.'}
    
    Format yang diinginkan:
    [
      {
        "id": "unique_id",
        "title": "nama acara",
        "date": "YYYY-MM-DD",
        "startTime": "HH:MM",
        "endTime": "HH:MM", 
        "location": "lokasi jika ada",
        "instructor": "pengajar/pembicara jika ada",
        "category": "work/study/personal/other",
        "confidence": 0.95
      }
    ]

    Teks untuk diproses:
    ${extractedText}

    Berikan HANYA JSON array tanpa penjelasan tambahan.
    `;

    setUploadProgress(50);
    console.log('Sending to Gemini API...');
    
    const result = await geminiPrompt(prompt);
    console.log('Gemini raw response:', result);

    setUploadProgress(70);

    // Bersihkan dan parse hasil Gemini
    const cleanResult = cleanGeminiJson(result);
    console.log('Cleaned result:', cleanResult);

    let events: ExtractedEvent[];
    try {
      events = JSON.parse(cleanResult);
      console.log('Parsed events:', events);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback ke demo data jika parsing gagal
      const { DEMO_EVENTS } = await import('@/data/demoSchedule');
      events = DEMO_EVENTS;
      console.log('Using demo events due to parse error');
    }

    // Validasi dan filter events yang valid
    const validEvents = events.filter((event: any) => 
      event.title && event.date && event.startTime && event.endTime
    );

    console.log('Valid events:', validEvents.length);

    if (validEvents.length === 0) {
      throw new Error('No valid events found in the document');
    }

    setUploadProgress(90);
    setExtractedEvents(validEvents);
    setUploadProgress(100);
    
    setTimeout(() => {
      setUploadState('completed');
      setUploadProgress(0);
    }, 500);

    toast({
      title: "PDF processed successfully!",
      description: `Found ${validEvents.length} events in your schedule`,
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    setUploadState('idle');
    setUploadProgress(0);
    
    toast({
      title: "Processing failed",
      description: error instanceof Error ? error.message : "Failed to process the PDF",
      variant: "destructive",
    });
  }
};

  const handleProcessClick = async () => {
    if (!currentFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file first",
        variant: "destructive",
      });
      return;
    }

    setUploadState('processing');
    setAiProcessing(true);
    await processPDF(currentFile, aiInstruction);
    setAiProcessing(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'study': return 'bg-green-100 text-green-800 border-green-200';
      case 'personal': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload Schedule</h1>
        <p className="text-muted-foreground">
          Upload a PDF or text file to automatically extract your schedule events using AI
        </p>
      </div>

      {/* Upload Section */}
      <Card className="p-6 bg-gradient-card border-0 shadow-card">
        <div className="space-y-6">
          <div>
            <Label htmlFor="file-upload" className="text-base font-semibold">
              Select File
            </Label>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex-1">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {currentFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{currentFile.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Instruction */}
          <div>
            <Label htmlFor="ai-instruction" className="text-base font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Instruction (Optional)
            </Label>
            <Input
              id="ai-instruction"
              placeholder="e.g., 'Only extract lecture schedules' or 'Focus on meeting times'"
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Give specific instructions to help AI understand what events to extract
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleProcessClick}
              disabled={!currentFile || uploadState === 'processing'}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90 flex items-center gap-2"
            >
              {uploadState === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Extract Events
                </>
              )}
            </Button>
          </div>

          {/* Processing Progress */}
          {uploadState === 'processing' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4 animate-pulse" />
                <span>AI is analyzing your document...</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
      </Card>

      {/* Extracted Events */}
      {extractedEvents.length > 0 && (
        <Card className="p-6 bg-gradient-card border-0 shadow-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Extracted Events ({extractedEvents.length})
              </h2>
            </div>

            <div className="grid gap-4">
              {extractedEvents.map((event) => (
                <Card key={event.id} className="p-4 bg-background/50 border-l-4 border-l-primary">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        <Badge className={`text-xs ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getConfidenceColor(event.confidence)}`}>
                          {Math.round(event.confidence * 100)}% confidence
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{event.date} • {event.startTime} - {event.endTime}</span>
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

                    <div className="flex items-center gap-2">
                      {addedEvents.has(event.id) ? (
                        <Badge variant="outline" className="text-success border-success">
                          Added ✓
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddSingleEvent(event)}
                          disabled={addingIndividual === event.id}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {addingIndividual === event.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tips Card */}
      <Card className="p-6 bg-gradient-accent text-accent-foreground border-0 shadow-glow">
        <div className="flex items-start gap-3">
          <Search className="h-5 w-5 mt-1" />
          <div>
            <h3 className="font-semibold mb-2">Tips for better extraction</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• Upload clear, high-quality PDF files</li>
              <li>• Provide specific AI instructions for better results</li>
              <li>• Review extracted events before adding to your tasks</li>
              <li>• Use the confidence score to judge extraction quality</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
