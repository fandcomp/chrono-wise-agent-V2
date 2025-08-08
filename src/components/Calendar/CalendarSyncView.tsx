import { useMemo, useState } from 'react';
import useGoogleCalendar from '@/hooks/useGoogleCalendar';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, CheckCircle2, LogIn, LogOut, RefreshCcw } from 'lucide-react';

export const CalendarSyncView = () => {
  const { user } = useAuth();
  const { tasks, loading: tasksLoading } = useTasks();
  const {
    isInitialized,
    isAuthenticated,
    isLoading,
    error,
    user: googleUser,
    events,
    signIn,
    signOut,
    syncEvents,
    createEventFromTask,
  } = useGoogleCalendar();

  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const next7DaysTasks = useMemo(() => {
    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks.filter(t => {
      const start = new Date(t.start_time);
      return start >= now && start <= in7d;
    });
  }, [tasks]);

  const findExistingEvent = (task: { start_time: string; end_time: string; title: string }) => {
    const startIso = new Date(task.start_time).toISOString();
    const endIso = new Date(task.end_time).toISOString();
    return events.find(e =>
      e.summary === task.title &&
      new Date(e.start.dateTime).toISOString() === startIso &&
      new Date(e.end.dateTime).toISOString() === endIso
    );
  };

  const handleConnect = async () => {
    const ok = await signIn();
    if (ok) {
      toast({ title: 'Connected to Google Calendar' });
      await syncEvents();
    } else {
      toast({ title: 'Failed to connect', variant: 'destructive' });
    }
  };

  const handleDisconnect = async () => {
    await signOut();
    toast({ title: 'Disconnected from Google Calendar' });
  };

  const handleSyncWeek = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Please connect to Google Calendar first', variant: 'destructive' });
      return;
    }
    setSyncing(true);
    try {
      let created = 0;
      for (const task of next7DaysTasks) {
        const exists = findExistingEvent(task);
        if (exists) continue;
        const res = await createEventFromTask({
          id: task.id,
          title: task.title,
          description: task.description ?? undefined,
          start_time: task.start_time,
          end_time: task.end_time,
          location: undefined,
        } as any);
        if (res) created += 1;
      }
      toast({ title: 'Sync complete', description: `${created} new events created for the next 7 days.` });
      await syncEvents();
    } catch (e: any) {
      toast({ title: 'Sync failed', description: e?.message ?? String(e), variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="h-6 w-6" /> Calendar Sync
        </h1>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button variant="outline" onClick={syncEvents} disabled={isLoading}>
                <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <Button variant="destructive" onClick={handleDisconnect} disabled={isLoading}>
                <LogOut className="h-4 w-4 mr-2" /> Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={handleConnect} disabled={isLoading}>
              <LogIn className="h-4 w-4 mr-2" /> Connect to Google
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
              {isAuthenticated ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <Separator />
          <div className="text-sm">
            <div>Initialized: {isInitialized ? 'Yes' : 'No'}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            {googleUser && (
              <div className="mt-2">
                <div className="font-medium">{googleUser.name}</div>
                <div className="text-muted-foreground">{googleUser.email}</div>
              </div>
            )}
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
        </Card>

        <Card className="p-4 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Next 7 days</div>
              <div className="text-sm text-muted-foreground">{tasksLoading ? 'Loading tasks…' : `${next7DaysTasks.length} tasks`}</div>
            </div>
            <Button onClick={handleSyncWeek} disabled={!isAuthenticated || syncing || next7DaysTasks.length === 0}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Sync This Week
            </Button>
          </div>
          <Separator />
          <div className="space-y-2 max-h-80 overflow-auto pr-2">
            {next7DaysTasks.length === 0 && (
              <div className="text-sm text-muted-foreground">No upcoming tasks in the next 7 days.</div>
            )}
            {next7DaysTasks.map(t => {
              const exists = findExistingEvent(t);
              return (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-muted-foreground">
                      {new Date(t.start_time).toLocaleString()} → {new Date(t.end_time).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={exists ? 'secondary' : 'outline'}>{exists ? 'Already in Calendar' : 'Not Synced'}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CalendarSyncView;
