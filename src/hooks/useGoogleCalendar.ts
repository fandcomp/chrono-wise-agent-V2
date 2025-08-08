import { useState, useEffect, useCallback } from 'react';
import { googleCalendarService, convertTaskToCalendarEvent } from '@/integrations/calendar/googleCalendar';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  htmlLink?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
}

interface CalendarStats {
  totalEvents: number;
  todayEvents: number;
  upcomingEvents: number;
  lastSyncTime?: Date;
}

interface GoogleCalendarState {
  isInitialized: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  events: CalendarEvent[];
  stats: CalendarStats;
  user: any;
}

interface GoogleCalendarActions {
  initialize: () => Promise<void>;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  syncEvents: () => Promise<void>;
  createEventFromTask: (task: Task) => Promise<CalendarEvent | null>;
  listTodayEvents: () => Promise<CalendarEvent[]>;
  getCalendarStats: () => CalendarStats;
  refreshAuth: () => Promise<boolean>;
}

function useGoogleCalendar(): GoogleCalendarState & GoogleCalendarActions {
  const [state, setState] = useState<GoogleCalendarState>({
    isInitialized: false,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    events: [],
    stats: {
      totalEvents: 0,
      todayEvents: 0,
      upcomingEvents: 0
    },
    user: null
  });

  // Initialize Google Calendar service
  const initialize = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await googleCalendarService.initialize();
      const authStatus = googleCalendarService.getAuthStatus();
      
      setState(prev => ({
        ...prev,
        isInitialized: authStatus.isInitialized,
        isAuthenticated: authStatus.isSignedIn,
        user: authStatus.isSignedIn ? googleCalendarService.getCurrentUser() : null,
        isLoading: false
      }));

      if (authStatus.isSignedIn) {
        await syncEvents();
      }
    } catch (error) {
      console.error('Failed to initialize Google Calendar:', error);
      setState(prev => ({
        ...prev,
        error: `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false
      }));
    }
  }, []);

  // Sign in to Google Calendar
  const signIn = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const success = await googleCalendarService.signIn();
      
      if (success) {
        const user = googleCalendarService.getCurrentUser();
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
          isLoading: false
        }));
        
        // Sync events after successful sign in
        await syncEvents();
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: 'Sign in failed',
          isLoading: false
        }));
        return false;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({
        ...prev,
        error: `Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false
      }));
      return false;
    }
  }, []);

  // Sign out from Google Calendar
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await googleCalendarService.signOut();
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        events: [],
        stats: {
          totalEvents: 0,
          todayEvents: 0,
          upcomingEvents: 0
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Sign out error:', error);
      setState(prev => ({
        ...prev,
        error: `Sign out failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false
      }));
    }
  }, []);

  // Sync events from Google Calendar
  const syncEvents = useCallback(async () => {
    if (!state.isAuthenticated) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const now = new Date();
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const events = await googleCalendarService.listEvents(
        now.toISOString(),
        oneMonthFromNow.toISOString()
      );

      const calendarEvents: CalendarEvent[] = events.map(event => ({
        id: event.id || '',
        summary: event.summary || 'No Title',
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        htmlLink: event.htmlLink
      }));

      const stats = calculateStats(calendarEvents);
      
      setState(prev => ({
        ...prev,
        events: calendarEvents,
        stats: {
          ...stats,
          lastSyncTime: new Date()
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Sync events error:', error);
      setState(prev => ({
        ...prev,
        error: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false
      }));
    }
  }, [state.isAuthenticated]);

  // Create calendar event from task
  const createEventFromTask = useCallback(async (task: Task): Promise<CalendarEvent | null> => {
    if (!state.isAuthenticated) {
      setState(prev => ({ ...prev, error: 'Not authenticated with Google Calendar' }));
      return null;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const eventData = convertTaskToCalendarEvent(task);
      const response = await googleCalendarService.createEvent(eventData);
      
      const newEvent: CalendarEvent = {
        id: response.id || '',
        summary: response.summary || '',
        description: response.description,
        start: response.start,
        end: response.end,
        location: response.location,
        htmlLink: response.htmlLink
      };

      setState(prev => {
        const updatedEvents = [...prev.events, newEvent];
        return {
          ...prev,
          events: updatedEvents,
          stats: calculateStats(updatedEvents),
          isLoading: false
        };
      });

      return newEvent;
    } catch (error) {
      console.error('Create event error:', error);
      setState(prev => ({
        ...prev,
        error: `Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false
      }));
      return null;
    }
  }, [state.isAuthenticated, state.events]);

  // Get today's events
  const listTodayEvents = useCallback(async (): Promise<CalendarEvent[]> => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    return state.events.filter(event => {
      const eventStart = new Date(event.start.dateTime);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    });
  }, [state.events]);

  // Get calendar statistics
  const getCalendarStats = useCallback((): CalendarStats => {
    return state.stats;
  }, [state.stats]);

  // Refresh authentication
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const authStatus = googleCalendarService.getAuthStatus();
      if (authStatus.isSignedIn) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: googleCalendarService.getCurrentUser()
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh auth error:', error);
      return false;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-sync every 10 minutes if authenticated
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(() => {
      syncEvents();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [state.isAuthenticated, syncEvents]);

  return {
    ...state,
    initialize,
    signIn,
    signOut,
    syncEvents,
    createEventFromTask,
    listTodayEvents,
    getCalendarStats,
    refreshAuth
  };
}

// Helper function to calculate statistics
function calculateStats(events: CalendarEvent[]): CalendarStats {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start.dateTime);
    return eventDate >= today && eventDate < tomorrow;
  }).length;

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.start.dateTime);
    return eventDate > now;
  }).length;

  return {
    totalEvents: events.length,
    todayEvents,
    upcomingEvents
  };
}

// Export the useGoogleCalendar function
export default useGoogleCalendar;

