import { useState } from 'react';
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

const mockExtractedEvents: ExtractedEvent[] = [
  {
    id: '1',
    title: 'Algoritma dan Struktur Data',
    date: '2024-08-05',
    startTime: '08:00',
    endTime: '10:00',
    location: 'Lab Komputer 1',
    instructor: 'Dr. Budi Santoso',
    category: 'Kuliah',
    confidence: 0.95
  },
  {
    id: '2',
    title: 'Presentasi Project UI/UX',
    date: '2024-08-05',
    startTime: '13:00',
    endTime: '15:00',
    location: 'Ruang Seminar A',
    instructor: 'Prof. Sarah Ahmad',
    category: 'Kuliah',
    confidence: 0.88
  },
  {
    id: '3',
    title: 'Meeting Client - Logo Design',
    date: '2024-08-06',
    startTime: '10:30',
    endTime: '11:30',
    location: 'Coffee Shop Central',
    category: 'Pekerjaan',
    confidence: 0.92
  }
];

export const UploadView = () => {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'completed'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  const { toast } = useToast();

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

    // Simulate upload and processing
    setUploadState('uploading');
    setUploadProgress(0);

    // Upload simulation
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setUploadState('processing');
          
          // Processing simulation
          setTimeout(() => {
            setExtractedEvents(mockExtractedEvents);
            setUploadState('completed');
            toast({
              title: "Schedule extracted successfully!",
              description: `Found ${mockExtractedEvents.length} events in your PDF`,
            });
          }, 3000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 200);
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
                <span className="ml-2">92%</span>
              </div>
              <div>
                <span className="font-semibold">Processing Time:</span>
                <span className="ml-2">3.2s</span>
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