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
  "Meeting dengan klien besok jam 2 siang di Starbucks",
  "Deadline laporan Jumat depan pukul 23:59",
  "Gym session hari Senin 17:00-18:00",
  "Presentasi project minggu depan Rabu jam 10 pagi",
  "Lunch dengan tim marketing tomorrow 12:30"
];

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
      // Prompt Gemini
      const prompt = `Extract meeting/event details from: "${naturalInput}". Reply with JSON including fields: title, date (YYYY-MM-DD), startTime (HH:mm), endTime (optional, HH:mm), location, category, priority (high/medium/low).`;

      const aiResult = await geminiPrompt(prompt);

      let parsed;
      try {
        parsed = JSON.parse(aiResult);
      } catch {
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
    
    const startDateTime = new Date(`${parsedEvent.date}T${parsedEvent.startTime}`).toISOString();
    const endDateTime = parsedEvent.endTime 
      ? new Date(`${parsedEvent.date}T${parsedEvent.endTime}`).toISOString()
      : new Date(new Date(`${parsedEvent.date}T${parsedEvent.startTime}`).getTime() + 60 * 60 * 1000).toISOString();
    
    await createTask({
      title: parsedEvent.title,
      description: `Parsed from: "${naturalInput}"${parsedEvent.location ? ` at ${parsedEvent.location}` : ''}`,
      start_time: startDateTime,
      end_time: endDateTime,
      category: parsedEvent.category
    });
    
    // Reset form
    setNaturalInput('');
    setParsedEvent(null);
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
              <label className="block text-sm font-medium mb-2">
                Describe your event naturally
              </label>
              <div className="relative">
                <Textarea
                  placeholder="Try: 'Meeting dengan klien besok jam 2 siang di Starbucks' or 'Deadline project Jumat depan pukul 23:59'"
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
                    <h4 className="font-semibold">Extracted Event Details</h4>
                    <Badge 
                      className={`text-xs ${
                        parsedEvent.confidence >= 0.8 
                          ? 'bg-success text-success-foreground' 
                          : 'bg-warning text-warning-foreground'
                      }`}
                    >
                      {Math.round(parsedEvent.confidence * 100)}% Confidence
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit Details
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Date:</span>
                    <span>{new Date(parsedEvent.date).toLocaleDateString('id-ID')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Time:</span>
                    <span>{parsedEvent.startTime} {parsedEvent.endTime && `- ${parsedEvent.endTime}`}</span>
                  </div>

                  {parsedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Location:</span>
                      <span>{parsedEvent.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Category:</span>
                    <Badge variant="outline" className="text-xs">
                      {parsedEvent.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setParsedEvent(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveEvent}
                    className="bg-gradient-primary text-primary-foreground"
                  >
                    Add to Calendar
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