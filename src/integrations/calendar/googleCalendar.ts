// Client-side Google Calendar integration untuk React
interface GoogleAuthConfig {
  clientId: string;
  discoveryDoc: string;
  scopes: string;
}

interface CalendarEvent {
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
}

interface Task {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
}

class GoogleCalendarService {
  private gapi: any = null;
  private isInitialized = false;
  private isSignedIn = false;

  private config: GoogleAuthConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    scopes: 'https://www.googleapis.com/auth/calendar'
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Validate required config
    if (!this.config.clientId) {
      throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in environment variables.');
    }

    return new Promise((resolve, reject) => {
      // Load Google APIs script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = async () => {
        try {
          await this.loadGoogleAPIs();
          this.isInitialized = true;
          resolve();
        } catch (error) {
          console.error('Failed to initialize Google APIs:', error);
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google APIs script'));
      document.head.appendChild(script);
    });
  }

  private async loadGoogleAPIs(): Promise<void> {
    return new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', async () => {
        try {
          // Initialize without API key - OAuth provides sufficient access
          await window.gapi.client.init({
            clientId: this.config.clientId,
            discoveryDocs: [this.config.discoveryDoc],
            scope: this.config.scopes
          });

          this.gapi = window.gapi;
          
          // Check if user is already signed in
          const authInstance = this.gapi.auth2.getAuthInstance();
          this.isSignedIn = authInstance.isSignedIn.get();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async signIn(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      
      if (!this.isSignedIn) {
        await authInstance.signIn();
        this.isSignedIn = true;
      }
      
      return true;
    } catch (error) {
      console.error('Google sign-in failed:', error);
      return false;
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const authInstance = this.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      this.isSignedIn = false;
    } catch (error) {
      console.error('Google sign-out failed:', error);
    }
  }

  async createEvent(eventData: CalendarEvent): Promise<any> {
    if (!this.isSignedIn) {
      const signedIn = await this.signIn();
      if (!signedIn) {
        throw new Error('User must be signed in to create calendar events');
      }
    }

    try {
      const request = this.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: eventData
      });

      const response = await request.execute();
      return response;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  async listEvents(timeMin?: string, timeMax?: string): Promise<any[]> {
    if (!this.isSignedIn) {
      const signedIn = await this.signIn();
      if (!signedIn) {
        throw new Error('User must be signed in to list calendar events');
      }
    }

    try {
      const request = this.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const response = await request.execute();
      return response.items || [];
    } catch (error) {
      console.error('Failed to list calendar events:', error);
      throw error;
    }
  }

  getAuthStatus(): { isInitialized: boolean; isSignedIn: boolean } {
    return {
      isInitialized: this.isInitialized,
      isSignedIn: this.isSignedIn
    };
  }

  getCurrentUser(): any {
    if (!this.isSignedIn || !this.gapi) return null;
    
    const authInstance = this.gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    const profile = user.getBasicProfile();
    
    return {
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      imageUrl: profile.getImageUrl()
    };
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();

// Helper function untuk convert task ke Google Calendar event format
export const convertTaskToCalendarEvent = (task: Task): CalendarEvent => {
  return {
    summary: task.title,
    description: task.description || '',
    start: {
      dateTime: task.start_time,
      timeZone: 'Asia/Jakarta'
    },
    end: {
      dateTime: task.end_time,
      timeZone: 'Asia/Jakarta'
    },
    location: task.location
  };
};

// Types for global window
declare global {
  interface Window {
    gapi: any;
  }
}

// Legacy server-side code (kept for compatibility)
export interface GoogleCalendarCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  refresh_token: string;
}