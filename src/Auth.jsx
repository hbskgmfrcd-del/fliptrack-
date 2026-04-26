import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setSuccess("Compte créé ! Vérifie ton email pour confirmer.");
    }
    setLoading(false);
  }

  return (
    <div style={{
      fontFamily: "'DM Mono', 'Courier New', monospace",
      background: "#0A0A0A", minHeight: "100vh", color: "#F0EDE8",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { background: #141414; border: 1px solid #2A2A2A; color: #F0EDE8; padding: 12px 14px; border-radius: 8px; font-family: inherit; font-size: 14px; width: 100%; outline: none; transition: border 0.2s; }
        input:focus { border-color: #FF6B35; }
      `}</style>

      {/* Logo */}
      <div style={{ marginBottom: "40px", textAlign: "center" }}>
        <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "28px", fontWeight: 900 }}>
          FLIP<span style={{ color: "#FF6B35" }}>TRACK</span>
        </div>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "4px" }}>Bordeaux · Suivi achat-revente</div>
      </div>

      {/* Card */}
      <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "16px", padding: "28px 24px", width: "100%", maxWidth: "380px" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {[["login", "Connexion"], ["signup", "Créer un compte"]].map(([m, label]) => (
            <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              style={{ flex: 1, padding: "9px", borderRadius: "8px", border: `1px solid ${mode === m ? "#FF6B35" : "#2A2A2A"}`, background: mode === m ? "#FF6B351A" : "transparent", color: mode === m ? "#FF6B35" : "#555", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: 500, transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>EMAIL</label>
            <input type="email" placeholder="ton@email.com" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div>
            <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>MOT DE PASSE</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          {error && (
            <div style={{ background: "#FF4E4E15", border: "1px solid #FF4E4E40", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#FF4E4E" }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ background: "#06D6A015", border: "1px solid #06D6A040", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#06D6A0" }}>
              ✓ {success}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading || !email || !password}
            style={{ background: "#FF6B35", color: "#0A0A0A", border: "none", padding: "13px", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: "14px", marginTop: "4px", opacity: (loading || !email || !password) ? 0.5 : 1, transition: "opacity 0.2s" }}>
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
          </button>
        </div>
      </div>

      <div style={{ fontSize: "11px", color: "#333", marginTop: "20px" }}>
        Accès privé · Sur invitation uniquement
      </div>
    </div>
  );
}
