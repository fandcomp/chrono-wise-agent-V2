import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RealtimeClock, CompactClock } from "@/components/ui/realtime-clock";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { geminiPrompt } from "@/ai/gemini/client";
import { 
  Clock, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  MoreHorizontal,
  Brain,
  ArrowRight,
  User
} from "lucide-react";

interface DashboardEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  category: string;
  location?: string;
  status: 'upcoming' | 'current' | 'completed';
  is_completed: boolean;
}

const getEventStatusIcon = (status: DashboardEvent['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'current':
      return <Clock className="h-4 w-4 text-warning animate-pulse" />;
    case 'upcoming':
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category.toLowerCase()) {
    case 'work':
      return 'bg-primary text-primary-foreground';
    case 'study':
      return 'bg-accent text-accent-foreground';
    case 'personal':
      return 'bg-success text-success-foreground';
    case 'break':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
};

const getPriorityColor = (isUrgent: boolean) => {
  return isUrgent ? 'border-l-destructive' : 'border-l-primary';
};

interface DashboardViewProps {
  onViewChange?: (view: string) => void;
}

export const DashboardView = ({ onViewChange }: DashboardViewProps) => {
  const { tasks, loading, toggleComplete } = useTasks();
  const { user } = useAuth();
  
  const currentTime = new Date();

  // Transform tasks into dashboard events
  const todayEvents: DashboardEvent[] = tasks
    .filter(task => {
      const taskDate = new Date(task.start_time);
      const today = new Date();
      return taskDate.toDateString() === today.toDateString();
    })
    .map(task => {
      const startTime = new Date(task.start_time);
      const endTime = new Date(task.end_time);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      let status: 'upcoming' | 'current' | 'completed' = 'upcoming';
      if (task.is_completed) {
        status = 'completed';
      } else if (currentTime >= startTime && currentTime <= endTime) {
        status = 'current';
      }

      return {
        id: task.id,
        title: task.title,
        time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration: duration >= 60 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : `${duration}m`,
        category: task.category,
        status,
        is_completed: task.is_completed,
        location: task.description?.includes('at ') ? task.description.split('at ').pop() : undefined
      };
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const completedTasks = tasks.filter(task => task.is_completed).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Quick Add navigation handler
  const handleQuickAdd = () => {
    if (onViewChange) {
      onViewChange('add-task');
    }
  };

  // === Gemini AI Suggestions integration ===
  const [aiSuggestions, setAiSuggestions] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setAiLoading(true);
      try {
        // You can adjust this prompt for more relevant suggestions
        const prompt = `Berikut adalah daftar task harian saya: ${JSON.stringify(todayEvents)}. 
Berdasarkan data ini, berikan 3 saran produktivitas yang actionable dan personal. 
Jawab dalam format bullet point singkat dan dalam bahasa Indonesia.`;
        const result = await geminiPrompt(prompt);
        setAiSuggestions(result);
      } catch (e: any) {
        setAiSuggestions("Gagal memuat saran AI.");
      }
      setAiLoading(false);
    };

    if (todayEvents.length > 0) fetchSuggestions();
    else setAiSuggestions("");
  }, [JSON.stringify(todayEvents)]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Good morning, {user?.user_metadata?.full_name || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            You have {todayEvents.length} events today. Let's make it productive!
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <CompactClock />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 transition-all duration-200 hover:scale-105 hover:shadow-lg group"
                onClick={handleQuickAdd}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Quick Add</span>
                <span className="sm:hidden">Add</span>
                <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tambah task baru dengan cepat</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Events</p>
              <p className="text-2xl font-bold">{todayEvents.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Free Time</p>
              <p className="text-2xl font-bold">4h 30m</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Productivity</p>
              <p className="text-2xl font-bold">{completionRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Energy Level</p>
              <p className="text-2xl font-bold">High</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timeline */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-gradient-card border-0 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Today's Timeline</h2>
              <Badge variant="outline" className="bg-gradient-accent text-accent-foreground border-0">
                {todayEvents.length} events
              </Badge>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading your tasks...</p>
                </div>
              ) : todayEvents.length > 0 ? (
                todayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${getPriorityColor(false)} ${
                      event.status === 'current' ? 'bg-gradient-accent/10 border-accent' : 'bg-background/50'
                    }`}
                  >
                    {getEventStatusIcon(event.status)}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${event.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {event.title}
                        </h3>
                        <Badge className={`text-xs ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{event.time} • {event.duration}</span>
                        {event.location && (
                          <span>📍 {event.location}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleComplete(event.id)}
                        className="h-8 w-8 p-0"
                      >
                        {event.is_completed ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tasks scheduled for today.</p>
                  <p className="text-sm text-muted-foreground mt-1">Add some tasks to get started!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Real-time Clock Widget */}
          <RealtimeClock />

          {/* Upcoming Priority Tasks */}
          <Card className="p-6 bg-gradient-card border-0 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Priority Tasks</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                <div className="w-2 h-2 bg-destructive rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Finish presentation slides</p>
                  <p className="text-xs text-muted-foreground">Due in 2 hours</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Review client feedback</p>
                  <p className="text-xs text-muted-foreground">Due tomorrow</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Update portfolio</p>
                  <p className="text-xs text-muted-foreground">Due this week</p>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Suggestions */}
          <Card className="p-6 bg-gradient-accent text-accent-foreground border-0 shadow-glow">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5" />
              <h3 className="text-lg font-semibold">AI Suggestions</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              {aiLoading ? (
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 animate-spin" />
                  <span>Loading AI suggestions...</span>
                </div>
              ) : aiSuggestions ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: aiSuggestions.replace(/\n/g, "<br/>"),
                  }}
                />
              ) : (
                <div className="text-muted-foreground">
                  Tambahkan beberapa task hari ini untuk mendapatkan saran AI!
                </div>
              )}
            </div>
          </Card>

          {/* Weekly Progress */}
          <Card className="p-6 bg-gradient-card border-0 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tasks Completed</span>
                  <span className="font-semibold">{completedTasks}/{totalTasks}</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Focus Time</span>
                  <span className="font-semibold">18h/25h</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Work-Life Balance</span>
                  <span className="font-semibold">Good</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
