import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { geminiPrompt } from "@/ai/gemini/client";
import { Brain, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export const GeminiTestView = () => {
  const [testPrompt, setTestPrompt] = useState("Jelaskan apa itu AI dalam 50 kata");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState("");

  const testGeminiAPI = async () => {
    setLoading(true);
    setStatus('idle');
    setError("");
    setResponse("");

    try {
      const result = await geminiPrompt(testPrompt);
      setResponse(result);
      setStatus('success');
    } catch (err: any) {
      setError(err.message || "API call failed");
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Brain className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Ready</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Gemini API Test</h1>
        <p className="text-muted-foreground">
          Test koneksi dan konfigurasi API Gemini Anda
        </p>
      </div>

      {/* Status Card */}
      <Card className="p-6 bg-gradient-card border-0 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <h2 className="text-xl font-semibold">API Status</h2>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <Label className="text-muted-foreground">API Key</Label>
            <p className="font-mono">
              {import.meta.env.VITE_GEMINI_API_KEY 
                ? `${import.meta.env.VITE_GEMINI_API_KEY.substring(0, 10)}...` 
                : "Not configured"
              }
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground">Model</Label>
            <p>gemini-2.0-flash</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Endpoint</Label>
            <p className="font-mono text-xs">generativelanguage.googleapis.com</p>
          </div>
        </div>
      </Card>

      {/* Test Interface */}
      <Card className="p-6 bg-gradient-card border-0 shadow-card">
        <h3 className="text-lg font-semibold mb-4">Test API Call</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-prompt">Test Prompt</Label>
            <Input
              id="test-prompt"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Masukkan prompt untuk test..."
              className="mt-2"
            />
          </div>

          <Button 
            onClick={testGeminiAPI} 
            disabled={loading || !testPrompt.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Test API
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Response Card */}
      {(response || error) && (
        <Card className="p-6 bg-gradient-card border-0 shadow-card">
          <h3 className="text-lg font-semibold mb-4">Response</h3>
          
          {status === 'success' && response && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Success</span>
              </div>
              <p className="text-green-700 whitespace-pre-wrap">{response}</p>
            </div>
          )}

          {status === 'error' && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Error</span>
              </div>
              <p className="text-red-700">{error}</p>
              
              <div className="mt-3 text-sm text-red-600">
                <strong>Possible solutions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check if your API key is correct</li>
                  <li>Verify API key has proper permissions</li>
                  <li>Check network connectivity</li>
                  <li>Ensure you have Gemini API quota available</li>
                </ul>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Documentation Card */}
      <Card className="p-6 bg-gradient-accent text-accent-foreground border-0 shadow-glow">
        <h3 className="text-lg font-semibold mb-3">Quick Setup Guide</h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>1. Get API Key:</strong> Visit <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
          </div>
          <div>
            <strong>2. Configure:</strong> Add your API key to <code>.env</code> file as <code>VITE_GEMINI_API_KEY</code>
          </div>
          <div>
            <strong>3. Test:</strong> Use this page to verify connection
          </div>
          <div>
            <strong>4. Usage:</strong> API is used for AI suggestions, PDF extraction, and smart scheduling
          </div>
        </div>
      </Card>
    </div>
  );
};
