// Browser-native Google Calendar integration using gapi + Google Identity Services (GIS)
import { loadGapiClient } from './gapiLoader';

interface GoogleAuthConfig {
  clientId: string;
  discoveryDoc: string;
  scopes: string;
}

interface CalendarEvent {
  id?: string;
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

class GoogleCalendarService {
  private gapi: any = null;
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private isInitialized = false;
  private isSignedIn = false;

  private config: GoogleAuthConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    scopes: 'https://www.googleapis.com/auth/calendar',
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (!this.config.clientId) {
      throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in environment variables.');
    }
    try {
      this.gapi = await loadGapiClient();
      await new Promise<void>((resolve, reject) => {
        this.gapi.load('client', async () => {
          try {
            await this.gapi.client.init({
              discoveryDocs: [this.config.discoveryDoc],
            });
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
      await this.loadGisScript();
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: this.config.clientId,
        scope: this.config.scopes,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.accessToken = tokenResponse.access_token;
            this.gapi.client.setToken({ access_token: this.accessToken });
            this.isSignedIn = true;
          }
        },
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google APIs:', error);
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  private async loadGisScript(): Promise<void> {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
      document.head.appendChild(script);
    });
  }

  private async ensureSignedIn(promptConsent = false): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (this.accessToken) return true;
    return new Promise<boolean>((resolve, reject) => {
      try {
        this.tokenClient.callback = (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            this.accessToken = tokenResponse.access_token;
            this.gapi.client.setToken({ access_token: this.accessToken });
            this.isSignedIn = true;
            resolve(true);
          } else if (tokenResponse && tokenResponse.error) {
            console.error('Token error:', tokenResponse.error);
            resolve(false);
          } else {
            resolve(false);
          }
        };
        this.tokenClient.requestAccessToken({ prompt: promptConsent ? 'consent' : 'none' });
      } catch (e) {
        console.error('Failed to request access token:', e);
        reject(e);
      }
    });
  }

  async signIn(): Promise<boolean> {
    return this.ensureSignedIn(true);
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;
    try {
      if (this.accessToken && window.google?.accounts?.oauth2?.revoke) {
        await new Promise<void>((resolve) => {
          window.google.accounts.oauth2.revoke(this.accessToken!, () => resolve());
        });
      }
    } catch (e) {
      console.warn('Token revoke failed:', e);
    } finally {
      this.accessToken = null;
      this.isSignedIn = false;
      if (this.gapi?.client?.setToken) this.gapi.client.setToken(null);
    }
  }

  async createEvent(eventData: CalendarEvent): Promise<CalendarEvent> {
    const ok = await this.ensureSignedIn(false);
    if (!ok) throw new Error('User must be signed in to create calendar events');
    try {
      const response = await this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: eventData,
      });
      return response.result;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  async listEvents(timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    const ok = await this.ensureSignedIn(false);
    if (!ok) throw new Error('User must be signed in to list calendar events');
    try {
      const response = await this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      });
      return response.result.items || [];
    } catch (error) {
      console.error('Failed to list calendar events:', error);
      throw error;
    }
  }

  getAuthStatus(): { isInitialized: boolean; isSignedIn: boolean } {
    return {
      isInitialized: this.isInitialized,
      isSignedIn: this.isSignedIn,
    };
  }

  getCurrentUser(): any {
    return null;
  }
}

export const googleCalendarService = new GoogleCalendarService();

export const convertTaskToCalendarEvent = (task: Task): CalendarEvent => {
  return {
    summary: task.title,
    description: task.description || '',
    start: {
      dateTime: task.start_time,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    end: {
      dateTime: task.end_time,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
    location: task.location,
  };
};

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}