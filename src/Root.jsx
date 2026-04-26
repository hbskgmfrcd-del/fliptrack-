import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import App from "./App.jsx";
import Auth from "./Auth.jsx";

export default function Root() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ background: "#0A0A0A", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#F0EDE8", fontFamily: "'DM Mono', monospace" }}>
      <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "24px", fontWeight: 900 }}>
        FLIP<span style={{ color: "#FF6B35" }}>TRACK</span>
      </div>
    </div>
  );

  return session ? <App session={session} /> : <Auth />;
}
