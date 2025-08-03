import { 
  Calendar, 
  BarChart3, 
  FileUp, 
  PlusCircle, 
  Settings, 
  Clock,
  Target,
  Brain,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar, badge: null },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'upload', label: 'Upload Schedule', icon: FileUp, badge: 'New' },
    { id: 'add-task', label: 'Quick Add', icon: PlusCircle, badge: null },
  ];

  const aiFeatures = [
    { id: 'ai-optimize', label: 'AI Optimize', icon: Brain, badge: 'Beta' },
    { id: 'smart-suggestions', label: 'Smart Suggestions', icon: Zap, badge: '5' },
    { id: 'focus-time', label: 'Focus Time', icon: Target, badge: null },
  ];

  return (
    <aside className="w-64 bg-gradient-card border-r flex flex-col">
      {/* Main Navigation */}
      <div className="p-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Main Menu
        </h2>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={`w-full justify-start gap-3 ${
                activeView === item.id 
                  ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                  : "hover:bg-secondary/50"
              }`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge 
                  variant={item.badge === 'New' ? 'default' : 'secondary'} 
                  className="ml-auto text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* AI Features */}
      <div className="p-4 space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Features
        </h2>
        
        {aiFeatures.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={`w-full justify-start gap-3 ${
                activeView === item.id 
                  ? "bg-gradient-accent text-accent-foreground" 
                  : "hover:bg-accent/10"
              }`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <Badge 
                  variant={item.badge === 'Beta' ? 'outline' : 'default'} 
                  className="ml-auto text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Quick Stats Card */}
      <div className="p-4 mt-auto">
        <Card className="p-4 bg-gradient-accent text-accent-foreground">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">Today's Schedule</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Events</span>
              <span className="font-bold">8</span>
            </div>
            <div className="flex justify-between">
              <span>Free Time</span>
              <span className="font-bold">4h 30m</span>
            </div>
            <div className="flex justify-between">
              <span>Focus Blocks</span>
              <span className="font-bold">3</span>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
};