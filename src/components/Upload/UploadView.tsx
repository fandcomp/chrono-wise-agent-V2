import { useState } from 'react';
import { geminiPrompt } from "@/ai/gemini/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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
  User
} from "lucide-react";

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
  const { toast } = useToast();

  // Fungsi untuk ekstraksi teks dari PDF (implementasikan dengan pdf.js atau sesuai kebutuhan)
  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          // TODO: replace with real PDF parsing
          resolve("Isi teks hasil ekstrak PDF (implementasikan sesuai library PDF yang dipakai)");
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploadState('uploading');
    setUploadProgress(0);

    // Simulasi upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setUploadState('processing');
          processPDF(file);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const processPDF = async (file: File) => {
  // Fungsi pembersih blok kode markdown
  function cleanGeminiJson(str: string): string {
    let res = str.trim();
    if (res.startsWith("```json")) res = res.replace(/^```json/, "").trim();
    if (res.startsWith("```")) res = res.replace(/^```/, "").trim();
    if (res.endsWith("```")) res = res.replace(/```$/, "").trim();
    return res;
  }

  try {
    const extractedText = await extractTextFromPDF(file);

    // Prompt Gemini untuk field yang lengkap dan confidence
    const prompt = `
Extract all events from the following academic schedule text. 
Reply as a JSON array. Each event: 
{id: string, title: string, date: string (YYYY-MM-DD), startTime: string (HH:mm), endTime: string (HH:mm), location?: string, instructor?: string, category: string, confidence: number (0-1, how sure the AI is about this event)}. 
TEXT: """${extractedText}"""
`;

    const aiResult = await geminiPrompt(prompt);

    let parsed: ExtractedEvent[];
    try {
      // Bersihkan blok kode sebelum parse JSON
      const aiResultClean = cleanGeminiJson(aiResult);
      parsed = JSON.parse(aiResultClean);
      // Jika AI tidak memberikan id, generate id sendiri
      parsed = parsed.map((ev, idx) => ({
        ...ev,
        id: ev.id || (idx + 1).toString(),
      }));
      setExtractedEvents(parsed);
      setUploadState("completed");
      toast({
        title: "Schedule extracted successfully!",
        description: `Found ${parsed.length} events in your PDF`,
      });
    } catch {
      throw new Error("AI response format error: " + aiResult);
    }
  } catch (e: any) {
    setUploadState("idle");
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
              />
              <Button 
                size="lg" 
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 w-full"
                disabled={uploadState !== 'idle'}
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

      {/* Extracted Events */}
      {uploadState === 'completed' && extractedEvents.length > 0 && (
        <Card className="p-6 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Extracted Events</h3>
              <p className="text-muted-foreground">
                Review and confirm the events extracted from your PDF
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Edit All</Button>
              <Button className="bg-gradient-primary text-primary-foreground">
                Add to Calendar
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold">Events Found:</span>
                <span className="ml-2">{extractedEvents.length}</span>
              </div>
              <div>
                <span className="font-semibold">Avg Confidence:</span>
                <span className="ml-2">
                  {Math.round(
                    extractedEvents.reduce((a, b) => a + b.confidence, 0) /
                      extractedEvents.length *
                      100
                  ) / 100}%
                </span>
              </div>
              <div>
                <span className="font-semibold">Processing Time:</span>
                <span className="ml-2">~3s</span>
              </div>
              <div>
                <span className="font-semibold">Format Detected:</span>
                <span className="ml-2">University Schedule</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* How it Works */}
      <Card className="p-6 bg-gradient-card border-0 shadow-card">
        <h3 className="text-lg font-semibold mb-4">How Our AI Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">1. PDF Analysis</h4>
            <p className="text-sm text-muted-foreground">
              Advanced OCR and NLP extract text and understand document structure
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="h-6 w-6 text-accent" />
            </div>
            <h4 className="font-semibold mb-2">2. Smart Recognition</h4>
            <p className="text-sm text-muted-foreground">
              AI identifies events, dates, times, locations, and instructors automatically
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <h4 className="font-semibold mb-2">3. Calendar Integration</h4>
            <p className="text-sm text-muted-foreground">
              Seamlessly adds events to your calendar with all relevant details
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};