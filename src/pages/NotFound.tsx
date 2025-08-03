import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="p-8 max-w-md text-center bg-gradient-card border-0 shadow-card">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="h-8 w-8 text-primary" />
        </div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
          404
        </h1>
        <h2 className="text-xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <a href="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/">
              <Calendar className="h-4 w-4 mr-2" />
              View Calendar
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
