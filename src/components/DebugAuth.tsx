import { useAuth } from "@/contexts/AuthContext";

export const DebugAuth = () => {
  const { user, session, loading } = useAuth();
  
  return (
    <div className="p-4 bg-gray-100 m-4 rounded">
      <h2 className="text-lg font-bold mb-2">Auth Debug Info</h2>
      <div className="space-y-2 text-sm">
        <div>Loading: {loading ? "true" : "false"}</div>
        <div>User: {user ? "authenticated" : "not authenticated"}</div>
        <div>Session: {session ? "exists" : "null"}</div>
        <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</div>
        <div>Has Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? "yes" : "no"}</div>
        <div>Has Gemini Key: {import.meta.env.VITE_GEMINI_API_KEY ? "yes" : "no"}</div>
      </div>
    </div>
  );
};
