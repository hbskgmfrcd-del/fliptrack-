import { useState } from "react";

const PLATFORM_COLORS = {
  Vinted: "#09B1BA",
  Leboncoin: "#FF6E14",
};

export default function ImportURL({ onImport }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isValid = url.includes("vinted.fr") || url.includes("leboncoin.fr");
  const platform = url.includes("vinted.fr") ? "Vinted" : url.includes("leboncoin.fr") ? "Leboncoin" : null;

  async function handleImport() {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur d'import");
        setLoading(false);
        return;
      }

      setSuccess(`${data.plateforme} · ${data.nom?.slice(0, 40)}...`);
      onImport(data);
      setUrl("");
    } catch (e) {
      setError("Erreur réseau. Réessaie.");
    }
    setLoading(false);
  }

  return (
    <div style={{ background: "#0F0F0F", border: "1px solid #2A2A2A", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
      <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
        <span>🔗</span> IMPORT AUTOMATIQUE
        <span style={{ marginLeft: "auto", fontSize: "10px", color: "#333" }}>Vinted · Leboncoin</span>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="url"
            placeholder="Colle le lien de l'annonce..."
            value={url}
            onChange={e => { setUrl(e.target.value); setError(null); setSuccess(null); }}
            onKeyDown={e => e.key === "Enter" && handleImport()}
            style={{
              background: "#141414", border: `1px solid ${platform ? PLATFORM_COLORS[platform] + "60" : "#2A2A2A"}`,
              color: "#F0EDE8", padding: "10px 14px", borderRadius: "8px",
              fontFamily: "inherit", fontSize: "12px", width: "100%", outline: "none", transition: "border 0.2s"
            }}
          />
          {platform && (
            <span style={{
              position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
              fontSize: "10px", fontWeight: 600, color: PLATFORM_COLORS[platform],
              background: PLATFORM_COLORS[platform] + "20", padding: "2px 8px", borderRadius: "10px"
            }}>
              {platform}
            </span>
          )}
        </div>
        <button
          onClick={handleImport}
          disabled={!isValid || loading}
          style={{
            background: isValid ? "#FF6B35" : "#1A1A1A", color: isValid ? "#0A0A0A" : "#444",
            border: "none", padding: "10px 16px", borderRadius: "8px", cursor: isValid ? "pointer" : "not-allowed",
            fontFamily: "inherit", fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap", transition: "all 0.2s"
          }}>
          {loading ? "..." : "Importer"}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: "11px", color: "#FF4E4E", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ fontSize: "11px", color: "#06D6A0", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
          ✓ Importé : {success}
        </div>
      )}

      <div style={{ fontSize: "10px", color: "#333", marginTop: "8px" }}>
        Le formulaire sera pré-rempli automatiquement · Tu peux modifier avant de sauvegarder
      </div>
    </div>
  );
}
