import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  User
} from 'lucide-react';

declare global {
  interface Window {
    gapi: any;
  }
}

export const RealCalendarConnection: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'signed-in' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/calendar';

  // Initialize Google API
  const initializeGoogleAPI = async () => {
    try {
      setStatus('loading');
      setError(null);

      // Load gapi script
      if (!window.gapi) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google API script'));
          document.head.appendChild(script);
        });
      }

      // Load auth2 and client
      await new Promise<void>((resolve) => {
        window.gapi.load('auth2:client', resolve);
      });

      // Initialize client
      await window.gapi.client.init({
        apiKey: '', // Not needed for OAuth flow
        clientId: CLIENT_ID,
        discoveryDocs: [DISCOVERY_DOC],
        scope: SCOPES
      });

      // Check if already signed in
      const authInstance = window.gapi.auth2.getAuthInstance();
      const isSignedIn = authInstance.isSignedIn.get();

      if (isSignedIn) {
        const currentUser = authInstance.currentUser.get();
        const profile = currentUser.getBasicProfile();
        setUser({
          name: profile.getName(),
          email: profile.getEmail(),
          imageUrl: profile.getImageUrl()
        });
        setStatus('signed-in');
        await loadCalendarEvents();
      } else {
        setStatus('ready');
      }

    } catch (err) {
      console.error('Google API initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Google API');
      setStatus('error');
    }
  };

  // Sign in to Google
  const signIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      const profile = user.getBasicProfile();
      setUser({
        name: profile.getName(),
        email: profile.getEmail(),
        imageUrl: profile.getImageUrl()
      });

      setStatus('signed-in');
      await loadCalendarEvents();

    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out from Google
  const signOut = async () => {
    try {
      setIsLoading(true);
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      
      setUser(null);
      setEvents([]);
      setStatus('ready');

    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  // Load calendar events
  const loadCalendarEvents = async () => {
    try {
      setIsLoading(true);
      
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        showDeleted: false,
        singleEvents: true,
        maxResults: 10,
        orderBy: 'startTime'
      });

      setEvents(response.result.items || []);
      console.log('Calendar events loaded:', response.result.items);

    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setError('Failed to load calendar events: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Create test event
  const createTestEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      const event = {
        summary: '🚀 ChronoWise Test Event',
        description: 'This is a test event created by ChronoWise to verify Google Calendar integration.',
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        location: 'ChronoWise App'
      };

      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });

      console.log('Test event created:', response.result);
      await loadCalendarEvents(); // Refresh events list

    } catch (err) {
      console.error('Failed to create test event:', err);
      setError('Failed to create test event: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    if (CLIENT_ID) {
      initializeGoogleAPI();
    } else {
      setError('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env file.');
      setStatus('error');
    }
  }, []);

  const getStatusDisplay = () => {
    switch (status) {
      case 'loading':
        return { color: 'blue', text: 'Initializing...', icon: <Loader2 className="h-4 w-4 animate-spin" /> };
      case 'ready':
        return { color: 'yellow', text: 'Ready to Connect', icon: <AlertCircle className="h-4 w-4" /> };
      case 'signed-in':
        return { color: 'green', text: 'Connected to Real Google Calendar', icon: <CheckCircle className="h-4 w-4" /> };
      case 'error':
        return { color: 'red', text: 'Connection Error', icon: <XCircle className="h-4 w-4" /> };
      default:
        return { color: 'gray', text: 'Unknown', icon: <AlertCircle className="h-4 w-4" /> };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Real Google Calendar Connection
          </CardTitle>
          <CardDescription>
            Direct connection to your Google Calendar account using real Google APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {statusDisplay.icon}
              <div>
                <p className="font-medium">{statusDisplay.text}</p>
                {user && (
                  <p className="text-sm text-gray-600">{user.name} ({user.email})</p>
                )}
              </div>
            </div>
            <Badge variant={statusDisplay.color === 'green' ? 'default' : 'outline'}>
              {statusDisplay.color === 'green' ? 'REAL CONNECTION' : 'OFFLINE'}
            </Badge>
          </div>

          {/* User Profile */}
          {user && status === 'signed-in' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-green-100">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-800">{user.name}</p>
                <p className="text-sm text-green-600">{user.email}</p>
                <p className="text-xs text-green-500">Connected to Real Google Account</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Configuration Check */}
          <Alert>
            <AlertDescription>
              <strong>Client ID Status:</strong> {CLIENT_ID ? 
                `✅ Configured (${CLIENT_ID.slice(0, 20)}...${CLIENT_ID.slice(-10)})` : 
                '❌ Missing - Please configure VITE_GOOGLE_CLIENT_ID in .env file'
              }
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {status === 'ready' && (
              <Button 
                onClick={signIn}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                Connect to Google Calendar
              </Button>
            )}

            {status === 'signed-in' && (
              <>
                <Button 
                  onClick={loadCalendarEvents}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                  Refresh Events
                </Button>

                <Button 
                  onClick={createTestEvent}
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                  Create Test Event
                </Button>

                <Button 
                  onClick={signOut}
                  disabled={isLoading}
                  variant="outline"
                >
                  Sign Out
                </Button>
              </>
            )}

            {(status === 'error' || status === 'loading') && (
              <Button 
                onClick={initializeGoogleAPI}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
                Retry Connection
              </Button>
            )}
          </div>

          {/* Calendar Events */}
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Real Calendar Events ({events.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {events.map((event, index) => (
                    <div key={event.id || index} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{event.summary || 'No Title'}</h4>
                          {event.description && (
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>
                              {event.start?.dateTime ? 
                                new Date(event.start.dateTime).toLocaleString() : 
                                'No start time'
                              }
                            </span>
                            {event.location && (
                              <span>📍 {event.location}</span>
                            )}
                          </div>
                        </div>
                        {event.htmlLink && (
                          <a 
                            href={event.htmlLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Google Cloud Console Link */}
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              <strong>Need to configure OAuth?</strong> 
              <a 
                href="https://console.cloud.google.com/apis/credentials?project=fluted-oasis-462504-e8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-2"
              >
                Open Google Cloud Console
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealCalendarConnection;
