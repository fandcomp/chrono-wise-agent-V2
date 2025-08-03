import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  MoreHorizontal
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  time: string;
  duration: string;
  category: 'work' | 'personal' | 'study' | 'break';
  priority: 'high' | 'medium' | 'low';
  location?: string;
  status: 'upcoming' | 'current' | 'completed';
}

const todayEvents: Event[] = [
  {
    id: '1',
    title: 'Morning Standup Meeting',
    time: '09:00',
    duration: '30m',
    category: 'work',
    priority: 'high',
    location: 'Conference Room A',
    status: 'completed'
  },
  {
    id: '2', 
    title: 'UI Design Review',
    time: '10:30',
    duration: '1h',
    category: 'work',
    priority: 'high',
    status: 'current'
  },
  {
    id: '3',
    title: 'Lunch Break',
    time: '12:00',
    duration: '45m',
    category: 'break',
    priority: 'low',
    status: 'upcoming'
  },
  {
    id: '4',
    title: 'Client Presentation Prep',
    time: '14:00',
    duration: '2h',
    category: 'work',
    priority: 'high',
    status: 'upcoming'
  },
  {
    id: '5',
    title: 'Gym Session',
    time: '17:00',
    duration: '1h',
    category: 'personal',
    priority: 'medium',
    location: 'Fitness Center',
    status: 'upcoming'
  }
];

const getEventStatusIcon = (status: Event['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'current':
      return <Clock className="h-4 w-4 text-warning animate-pulse" />;
    case 'upcoming':
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getCategoryColor = (category: Event['category']) => {
  switch (category) {
    case 'work':
      return 'bg-primary text-primary-foreground';
    case 'study':
      return 'bg-accent text-accent-foreground';
    case 'personal':
      return 'bg-success text-success-foreground';
    case 'break':
      return 'bg-muted text-muted-foreground';
  }
};

const getPriorityColor = (priority: Event['priority']) => {
  switch (priority) {
    case 'high':
      return 'border-l-destructive';
    case 'medium':
      return 'border-l-warning';
    case 'low':
      return 'border-l-success';
  }
};

export const DashboardView = () => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Good morning, Alex!</h1>
          <p className="text-muted-foreground">
            You have 5 events today. Let's make it productive!
          </p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Quick Add
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-card border-0 shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Events</p>
              <p className="text-2xl font-bold">8</p>
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
              <p className="text-2xl font-bold">87%</p>
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
                5 events
              </Badge>
            </div>
            
            <div className="space-y-4">
              {todayEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${getPriorityColor(event.priority)} ${
                    event.status === 'current' ? 'bg-gradient-accent/10 border-accent' : 'bg-background/50'
                  }`}
                >
                  {getEventStatusIcon(event.status)}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${event.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
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
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
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
              <div className="bg-accent-foreground/10 rounded-lg p-3">
                <p className="font-medium">Schedule a 15-min break</p>
                <p className="text-accent-foreground/80">After your 2-hour work block</p>
              </div>
              
              <div className="bg-accent-foreground/10 rounded-lg p-3">
                <p className="font-medium">Move gym session earlier</p>
                <p className="text-accent-foreground/80">Avoid evening traffic</p>
              </div>
            </div>
          </Card>

          {/* Weekly Progress */}
          <Card className="p-6 bg-gradient-card border-0 shadow-card">
            <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tasks Completed</span>
                  <span className="font-semibold">12/15</span>
                </div>
                <Progress value={80} className="h-2" />
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