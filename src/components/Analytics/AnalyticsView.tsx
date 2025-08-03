import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  Zap,
  Award,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export const AnalyticsView = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Track your productivity and schedule optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export Report</Button>
          <Button className="bg-gradient-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate AI Insights
          </Button>
        </div>
      </div>

      <Tabs defaultValue="week" className="space-y-6">
        <TabsList className="grid w-fit grid-cols-3">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="default" className="bg-success text-success-foreground">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +12%
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-bold">87%</p>
                <p className="text-sm text-muted-foreground">Task Completion Rate</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <Badge variant="default" className="bg-success text-success-foreground">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +8%
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-bold">34.5h</p>
                <p className="text-sm text-muted-foreground">Total Focus Time</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-warning" />
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  <ArrowDown className="h-3 w-3 mr-1" />
                  -3%
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-bold">2.3h</p>
                <p className="text-sm text-muted-foreground">Avg Break Time</p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-success" />
                </div>
                <Badge variant="default" className="bg-success text-success-foreground">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  +15%
                </Badge>
              </div>
              <div>
                <p className="text-2xl font-bold">9.2</p>
                <p className="text-sm text-muted-foreground">Productivity Score</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Allocation Chart */}
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <h3 className="text-lg font-semibold mb-6">Time Allocation This Week</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="font-medium">Work & Projects</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">24.5h</span>
                    <span className="text-muted-foreground ml-2">45%</span>
                  </div>
                </div>
                <Progress value={45} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-accent rounded"></div>
                    <span className="font-medium">Study & Learning</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">18.2h</span>
                    <span className="text-muted-foreground ml-2">33%</span>
                  </div>
                </div>
                <Progress value={33} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-success rounded"></div>
                    <span className="font-medium">Personal & Social</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">8.7h</span>
                    <span className="text-muted-foreground ml-2">16%</span>
                  </div>
                </div>
                <Progress value={16} className="h-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-muted rounded"></div>
                    <span className="font-medium">Rest & Breaks</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">3.2h</span>
                    <span className="text-muted-foreground ml-2">6%</span>
                  </div>
                </div>
                <Progress value={6} className="h-2" />
              </div>
            </Card>

            {/* Daily Productivity Trend */}
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <h3 className="text-lg font-semibold mb-6">Daily Productivity Trend</h3>
              
              <div className="space-y-4">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                  const scores = [9.2, 8.7, 9.5, 8.9, 9.1, 7.8, 8.4];
                  const score = scores[index];
                  const isToday = index === 2; // Wednesday for demo
                  
                  return (
                    <div key={day} className={`flex items-center justify-between p-3 rounded-lg ${isToday ? 'bg-gradient-accent/20 border border-accent' : 'bg-background/50'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`font-medium ${isToday ? 'text-accent' : ''}`}>{day}</span>
                        {isToday && <Badge variant="outline" className="text-xs">Today</Badge>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20">
                          <Progress value={score * 10} className="h-2" />
                        </div>
                        <span className="font-bold w-8">{score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* AI Insights */}
          <Card className="p-6 bg-gradient-accent text-accent-foreground border-0 shadow-glow">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent-foreground/10 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">AI Insights & Recommendations</h3>
                <p className="text-accent-foreground/80 text-sm">Based on your recent activity patterns</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-accent-foreground/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-semibold">Peak Performance</span>
                </div>
                <p className="text-sm text-accent-foreground/90">
                  Your productivity peaks between 10-11 AM and 2-4 PM. Schedule important tasks during these windows.
                </p>
              </div>
              
              <div className="bg-accent-foreground/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">Break Optimization</span>
                </div>
                <p className="text-sm text-accent-foreground/90">
                  Consider adding 5-minute micro-breaks every 45 minutes to maintain high energy levels throughout the day.
                </p>
              </div>
              
              <div className="bg-accent-foreground/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4" />
                  <span className="font-semibold">Task Batching</span>
                </div>
                <p className="text-sm text-accent-foreground/90">
                  Group similar tasks together. You complete design work 23% faster when batched versus scattered.
                </p>
              </div>
              
              <div className="bg-accent-foreground/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-semibold">Weekly Planning</span>
                </div>
                <p className="text-sm text-accent-foreground/90">
                  Your best planning sessions happen on Sunday evenings. Consider blocking this time for weekly reviews.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Monthly Analytics</h3>
            <p className="text-muted-foreground">Monthly analytics view coming soon...</p>
          </Card>
        </TabsContent>

        <TabsContent value="year">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Yearly Analytics</h3>
            <p className="text-muted-foreground">Yearly analytics view coming soon...</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};