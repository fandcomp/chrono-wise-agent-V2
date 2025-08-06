import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";

interface RealtimeClockProps {
  className?: string;
  showSeconds?: boolean;
  showDate?: boolean;
  variant?: 'default' | 'minimal' | 'detailed';
}

export const RealtimeClock = ({ 
  className = "", 
  showSeconds = true, 
  showDate = true,
  variant = 'detailed'
}: RealtimeClockProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      ...(showSeconds && { second: '2-digit' }),
      hour12: false
    };
    return date.toLocaleTimeString('id-ID', options);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('id-ID', options);
  };

  const getTimeOfDay = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'Pagi';
    if (hour >= 12 && hour < 15) return 'Siang';
    if (hour >= 15 && hour < 18) return 'Sore';
    return 'Malam';
  };

  const getProgressToNextHour = (date: Date) => {
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return Math.round(((minutes * 60 + seconds) / 3600) * 100);
  };

  return (
    <Card className={`p-6 bg-gradient-card border-0 shadow-card ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Waktu Sekarang</h3>
          <p className="text-sm text-muted-foreground">
            Selamat {getTimeOfDay(currentTime)}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Digital Clock */}
        <div className="text-center">
          <div className="text-4xl font-bold font-mono tracking-wider text-foreground relative">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              {formatTime(currentTime)}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 blur-sm -z-10 rounded-lg"></div>
          </div>
          
          {showDate && (
            <div className="text-sm text-muted-foreground mt-2 capitalize font-medium">
              {formatDate(currentTime)}
            </div>
          )}
        </div>

        {/* Time Zone Info */}
        {variant === 'detailed' && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress ke jam berikutnya</span>
              <span>{getProgressToNextHour(currentTime)}%</span>
            </div>
            <Progress value={getProgressToNextHour(currentTime)} className="h-1" />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>WIB (UTC+7)</span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                Live
              </span>
            </div>
          </div>
        )}

        {variant === 'minimal' && (
          <div className="flex items-center justify-center text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              WIB Live
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

// Compact version for smaller spaces
export const CompactClock = ({ className = "" }: { className?: string }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-gradient-card rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <Clock className="h-4 w-4 text-primary animate-pulse" />
      <span className="text-lg font-bold font-mono text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        {formatTime(currentTime)}
      </span>
      <span className="text-xs text-muted-foreground font-medium">
        WIB
      </span>
    </div>
  );
};
