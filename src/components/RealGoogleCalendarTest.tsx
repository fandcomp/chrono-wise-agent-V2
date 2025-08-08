import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  CalendarPlus, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  User,
  ExternalLink,
  Settings
} from 'lucide-react';
import useGoogleCalendar from '@/hooks/useGoogleCalendar';

export const RealGoogleCalendarTest: React.FC = () => {
  const {
    isInitialized,
    isAuthenticated,
    isLoading,
    error,
    user,
    events,
    stats,
    initialize,
    signIn,
    signOut,
    syncEvents,
    createEventFromTask
  } = useGoogleCalendar();

  const [feedback, setFeedback] = useState<string>('');
  const [testEventCreated, setTestEventCreated] = useState(false);

  const showFeedback = (message: string, duration = 3000) => {
    setFeedback(message);
    setTimeout(() => setFeedback(''), duration);
  };

  const handleConnect = async () => {
    showFeedback('🔄 Initializing Google Calendar connection...');
    
    try {
      if (!isInitialized) {
        await initialize();
      }
      
      const success = await signIn();
      
      if (success) {
        showFeedback('✅ Successfully connected to your Google Calendar!');
      } else {
        showFeedback('❌ Failed to connect to Google Calendar', 5000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showFeedback(`❌ Connection error: ${errorMessage}`, 5000);
    }
  };

  const handleDisconnect = async () => {
    showFeedback('Disconnecting from Google Calendar...');
    
    try {
      await signOut();
      showFeedback('✅ Successfully disconnected from Google Calendar');
      setTestEventCreated(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showFeedback(`❌ Error disconnecting: ${errorMessage}`, 5000);
    }
  };

  const handleSync = async () => {
    showFeedback('🔄 Syncing your calendar events...');
    
    try {
      await syncEvents();
      showFeedback(`✅ Synced ${events.length} calendar events from your Google Calendar`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showFeedback(`❌ Sync error: ${errorMessage}`, 5000);
    }
  };

  const handleCreateTestEvent = async () => {
    showFeedback('🆕 Creating test event in your Google Calendar...');
    
    const testTask = {
      id: `chronowise-test-${Date.now()}`,
      title: '🚀 ChronoWise Test Event',
      description: 'This is a test event created by ChronoWise to verify Google Calendar integration is working correctly.',
      start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      location: 'ChronoWise App'
    };

    try {
      const createdEvent = await createEventFromTask(testTask);
      
      if (createdEvent) {
        showFeedback('✅ Test event created successfully! Check your Google Calendar.');
        setTestEventCreated(true);
      } else {
        showFeedback('❌ Failed to create test event', 5000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showFeedback(`❌ Error creating event: ${errorMessage}`, 5000);
    }
  };

  const getConnectionStatus = () => {
    if (isLoading) {
      return {
        icon: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
        text: 'Connecting...',
        variant: 'secondary' as const
      };
    }
    
    if (isAuthenticated) {
      return {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        text: 'Connected to Real Google Calendar',
        variant: 'default' as const
      };
    }
    
    return {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      text: 'Not Connected',
      variant: 'destructive' as const
    };
  };

  const status = getConnectionStatus();
  const hasGoogleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🌟 Real Google Calendar Integration</h1>
        <p className="text-muted-foreground">
          Connect to your actual Google Calendar and sync real events
        </p>
      </div>

      {/* Configuration Check */}
      {!hasGoogleClientId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Required:</strong> Google Client ID not found. Please configure VITE_GOOGLE_CLIENT_ID in your .env file.
            <br />
            <a href="#setup-guide" className="underline">See setup guide below</a>
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar Connection Status
          </CardTitle>
          <CardDescription>
            Real-time connection to your Google Calendar account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.icon}
              <div>
                <p className="font-medium">{status.text}</p>
                <p className="text-sm text-muted-foreground">
                  {isAuthenticated && user ? `${user.name} (${user.email})` : 'Not authenticated'}
                </p>
              </div>
            </div>
            <Badge variant={status.variant}>
              {isAuthenticated ? 'REAL' : 'OFFLINE'}
            </Badge>
          </div>

          {/* User Info */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
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
                <p className="text-xs text-green-500">Connected to Google Account</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Real Account</Badge>
            </div>
          )}

          {/* Stats */}
          {isAuthenticated && (
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{events.length}</p>
                <p className="text-sm text-blue-700">Real Events</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.todayEvents}</p>
                <p className="text-sm text-green-700">Today</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.upcomingEvents}</p>
                <p className="text-sm text-purple-700">Upcoming</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Google Calendar Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <Button 
                onClick={handleConnect} 
                disabled={isLoading || !hasGoogleClientId}
                className="flex-1 min-w-[200px]"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CalendarPlus className="h-4 w-4 mr-2" />
                )}
                Connect to Your Google Calendar
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleDisconnect}
                  disabled={isLoading}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
                <Button 
                  onClick={handleSync}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sync Real Events
                </Button>
                <Button 
                  onClick={handleCreateTestEvent}
                  disabled={isLoading || testEventCreated}
                  variant="secondary"
                >
                  {testEventCreated ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  {testEventCreated ? 'Test Event Created' : 'Create Test Event'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {feedback && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {feedback}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Real Events Display */}
      {isAuthenticated && events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Your Real Calendar Events ({events.length})
              <Badge variant="outline" className="ml-2">From Google Calendar</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.slice(0, 10).map((event, index) => (
                <div key={event.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{event.summary}</p>
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
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.start.dateTime).toLocaleString()}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {event.location && (
                      <Badge variant="outline" className="text-xs">
                        {event.location}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      Real Event
                    </Badge>
                  </div>
                </div>
              ))}
              {events.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... and {events.length - 10} more events from your Google Calendar
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Guide */}
      <Card id="setup-guide">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>To connect to your real Google Calendar:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Cloud Console</a></li>
              <li>Create a new project or select existing one</li>
              <li>Enable Google Calendar API</li>
              <li>Create OAuth 2.0 credentials (Web application)</li>
              <li>Add <code>http://localhost:8081</code> to authorized origins</li>
              <li>Copy Client ID and add to .env file as <code>VITE_GOOGLE_CLIENT_ID</code></li>
              <li>Restart development server</li>
            </ol>
            <p className="text-muted-foreground mt-2">
              See <code>GOOGLE_CALENDAR_SETUP.md</code> for detailed instructions.
            </p>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Current status:</strong> {hasGoogleClientId ? 
                '✅ Google Client ID configured' : 
                '❌ Google Client ID missing'
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealGoogleCalendarTest;
