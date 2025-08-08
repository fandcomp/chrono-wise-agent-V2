import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Settings,
  Loader2,
  ExternalLink
} from 'lucide-react';

export const GoogleCalendarDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]);

  const addConsoleMessage = (message: string) => {
    setConsoleMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const checkEnvironment = () => {
    const info: any = {};
    
    // Check environment variables
    info.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    info.hasClientId = !!info.clientId;
    info.clientIdLength = info.clientId?.length || 0;
    
    // Check if running on correct port
    info.currentUrl = window.location.origin;
    info.expectedPorts = ['http://localhost:8083', 'http://localhost:5173', 'http://localhost:3000'];
    info.isCorrectPort = info.expectedPorts.includes(info.currentUrl);
    
    // Check if gapi script is loaded
    info.gapiAvailable = typeof window.gapi !== 'undefined';
    info.userAgent = navigator.userAgent;
    info.isHttps = window.location.protocol === 'https:';
    
    setDebugInfo(info);
    
    addConsoleMessage('Environment check completed');
    return info;
  };

  const testGapiLoad = async () => {
    addConsoleMessage('Testing gapi load...');
    setIsLoading(true);
    
    try {
      // Load gapi script if not loaded
      if (!window.gapi) {
        addConsoleMessage('Loading gapi script...');
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => addConsoleMessage('gapi script loaded successfully');
        script.onerror = () => addConsoleMessage('ERROR: Failed to load gapi script');
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Initialize gapi
      addConsoleMessage('Initializing gapi...');
      await new Promise<void>((resolve) => {
        window.gapi.load('auth2:client', () => {
          addConsoleMessage('gapi auth2:client loaded');
          resolve();
        });
      });

      // Initialize auth2
      addConsoleMessage('Initializing Google Auth...');
      const authInstance = await window.gapi.auth2.init({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar'
      });

      addConsoleMessage('Google Auth initialized successfully');
      addConsoleMessage(`Auth instance created: ${!!authInstance}`);
      
      const isSignedIn = authInstance.isSignedIn.get();
      addConsoleMessage(`Currently signed in: ${isSignedIn}`);
      
    } catch (error) {
      addConsoleMessage(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('gapi test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectSignIn = async () => {
    addConsoleMessage('Testing direct sign in...');
    setIsLoading(true);
    
    try {
      if (!window.gapi || !window.gapi.auth2) {
        addConsoleMessage('ERROR: gapi or auth2 not available');
        return;
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        addConsoleMessage('ERROR: No auth instance found');
        return;
      }

      addConsoleMessage('Attempting to sign in...');
      const user = await authInstance.signIn();
      
      addConsoleMessage('Sign in successful!');
      addConsoleMessage(`User: ${user.getBasicProfile().getName()}`);
      addConsoleMessage(`Email: ${user.getBasicProfile().getEmail()}`);
      
      // Test calendar API access
      addConsoleMessage('Testing calendar API access...');
      await window.gapi.client.init({
        apiKey: '', // Not needed for OAuth
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar'
      });

      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
      });

      addConsoleMessage(`Calendar events retrieved: ${response.result.items?.length || 0}`);
      
    } catch (error) {
      addConsoleMessage(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Direct sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConsole = () => {
    setConsoleMessages([]);
  };

  useEffect(() => {
    checkEnvironment();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Google Calendar Debug Tool
          </CardTitle>
          <CardDescription>
            Diagnose Google Calendar integration issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Environment Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Environment Status</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {debugInfo.hasClientId ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-red-500" />
                  }
                  <span>Client ID: {debugInfo.hasClientId ? 'Configured' : 'Missing'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {debugInfo.isCorrectPort ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  }
                  <span>Port: {debugInfo.currentUrl}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {debugInfo.gapiAvailable ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-red-500" />
                  }
                  <span>GAPI: {debugInfo.gapiAvailable ? 'Available' : 'Not loaded'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Configuration</h3>
              <div className="text-xs space-y-1">
                <div>Client ID Length: {debugInfo.clientIdLength}</div>
                <div>Protocol: {window.location.protocol}</div>
                <div>Browser: {debugInfo.userAgent?.split(' ').pop()}</div>
              </div>
            </div>
          </div>

          {/* Client ID Display */}
          {debugInfo.clientId && (
            <Alert>
              <AlertDescription>
                <strong>Client ID:</strong> {debugInfo.clientId.slice(0, 20)}...{debugInfo.clientId.slice(-20)}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={checkEnvironment} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Refresh Check
            </Button>
            
            <Button 
              onClick={testGapiLoad} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Calendar className="h-4 w-4 mr-2" />}
              Test GAPI Load
            </Button>
            
            <Button 
              onClick={testDirectSignIn} 
              disabled={isLoading || !debugInfo.hasClientId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Test Direct Sign In
            </Button>
            
            <Button onClick={clearConsole} variant="outline">
              Clear Console
            </Button>
          </div>

          {/* Google Cloud Console Link */}
          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              <strong>Need to update settings?</strong> 
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

          {/* Console Messages */}
          {consoleMessages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Debug Console</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-64 overflow-y-auto space-y-1">
                  {consoleMessages.map((message, index) => (
                    <div key={index}>{message}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleCalendarDebug;
