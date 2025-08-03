import { Calendar, Settings, User, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  return (
    <header className="border-b bg-gradient-card backdrop-blur-sm sticky top-0 z-50">
      <div className="flex h-16 items-center px-6 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Calendar className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Project Chronos
            </h1>
            <p className="text-xs text-muted-foreground">AI Scheduling Assistant</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search events, tasks..." 
            className="pl-10 bg-background/50 border-border/50 focus:bg-background"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
              3
            </Badge>
          </Button>
          
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};