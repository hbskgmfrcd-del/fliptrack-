import { useState, useRef } from "react";

const SCORE_COLORS = {
  high: "#06D6A0",
  mid: "#FFE66D",
  low: "#FF4E4E",
};

function getScoreColor(score) {
  if (score >= 7) return SCORE_COLORS.high;
  if (score >= 4) return SCORE_COLORS.mid;
  return SCORE_COLORS.low;
}

function ScoreCircle({ score }) {
  const color = getScoreColor(score);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1A1A1A" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
        style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "20px", fontWeight: 900, fill: color }}>
        {score}
      </text>
    </svg>
  );
}

export default function AssistantPage() {
  const [mode, setMode] = useState("text"); // text | photo
  const [query, setQuery] = useState("");
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prixAchat, setPrixAchat] = useState("");
  const [step, setStep] = useState("form"); // form | loading | result
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageData(reader.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  async function analyser() {
    if (mode === "text" && !query) return;
    if (mode === "photo" && !imageData) return;
    setStep("loading");
    setError(null);

    const systemPrompt = `Tu es un expert en achat-revente de seconde main (flipping) en France. Tu analyses des articles pour aider des flippers à décider quoi acheter. Réponds UNIQUEMENT en JSON valide sans texte avant ou après ni backticks.`;

    const jsonSchema = `{
  "nom_article": "nom détecté ou inféré",
  "categorie": "vetements|electronique|velos|autre",
  "etat_estime": "description courte de l'état",
  "score": 0,
  "score_raison": "pourquoi ce score en 1 phrase",
  "prix_achat_max": 0,
  "prix_revente_estime": 0,
  "marge_potentielle": 0,
  "roi_pct": 0,
  "regle_x3": true,
  "delai_vente_jours": 0,
  "meilleure_plateforme": "Vinted|Leboncoin|eBay|Les deux",
  "decision": "ACHETER|NEGOCIER|EVITER",
  "decision_raison": "explication courte",
  "points_forts": ["point 1", "point 2"],
  "points_faibles": ["point 1", "point 2"],
  "conseils_negociation": "conseil concret pour négocier le prix",
  "conseils_vente": "conseil concret pour vendre vite et bien",
  "alerte": null
}`;

    try {
      let messages;

      if (mode === "photo" && imageData) {
        const textPart = `Tu vois un article en photo. ${prixAchat ? `Prix d'achat envisagé : ${prixAchat}€.` : ""} Analyse cet article pour un flipper bordelais et retourne ce JSON exact : ${jsonSchema}`;
        messages = [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageData } },
            { type: "text", text: textPart }
          ]
        }];
      } else {
        const textPart = `Article à analyser : "${query}". ${prixAchat ? `Prix d'achat envisagé : ${prixAchat}€.` : ""} Analyse cet article pour un flipper bordelais et retourne ce JSON exact : ${jsonSchema}`;
        messages = [{ role: "user", content: textPart }];
      }

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages
        })
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStep("result");
    } catch (e) {
      setError("Erreur d'analyse. Réessaie.");
      setStep("form");
    }
  }

  function reset() {
    setStep("form");
    setResult(null);
    setQuery("");
    setImageData(null);
    setImagePreview(null);
    setPrixAchat("");
  }

  const decisionConfig = {
    ACHETER: { color: "#06D6A0", bg: "#06D6A015", emoji: "✅", label: "ACHETER" },
    NEGOCIER: { color: "#FFE66D", bg: "#FFE66D15", emoji: "💬", label: "NÉGOCIER" },
    EVITER: { color: "#FF4E4E", bg: "#FF4E4E15", emoji: "❌", label: "ÉVITER" },
  };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", color: "#F0EDE8" }}>

      {/* FORM */}
      {step === "form" && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "16px", fontWeight: 900, marginBottom: "4px" }}>
              FLIPPER'S <span style={{ color: "#FF6B35" }}>ASSISTANT</span>
            </div>
            <div style={{ fontSize: "11px", color: "#555" }}>IA · Photo ou description → score d'achat</div>
          </div>

          {/* Mode switch */}
          <div style={{ display: "flex", background: "#111", borderRadius: "10px", padding: "4px", marginBottom: "24px" }}>
            {[["text", "✍️ Description"], ["photo", "📷 Photo"]].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: 500, transition: "all 0.2s", background: mode === m ? "#FF6B35" : "transparent", color: mode === m ? "#0A0A0A" : "#555" }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Texte */}
            {mode === "text" && (
              <div>
                <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>DÉCRIS L'ARTICLE</label>
                <textarea rows={3} placeholder="ex: Nike Air Force 1 blanc T42, semelle un peu jaunie, dessus propre. Vu au marché Saint-Michel."
                  value={query} onChange={e => setQuery(e.target.value)}
                  style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#F0EDE8", padding: "12px 14px", borderRadius: "8px", fontFamily: "inherit", fontSize: "13px", width: "100%", outline: "none", resize: "none", lineHeight: 1.5 }} />
                <div style={{ fontSize: "10px", color: "#444", marginTop: "4px" }}>Plus tu es précis, plus l'analyse est fiable</div>
              </div>
            )}

            {/* Photo */}
            {mode === "photo" && (
              <div>
                <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "8px", letterSpacing: "1px" }}>PHOTO DE L'ARTICLE</label>
                {imagePreview ? (
                  <div style={{ position: "relative", marginBottom: "8px" }}>
                    <img src={imagePreview} alt="Article" style={{ width: "100%", borderRadius: "12px", maxHeight: "200px", objectFit: "cover" }} />
                    <button onClick={() => { setImageData(null); setImagePreview(null); }}
                      style={{ position: "absolute", top: "8px", right: "8px", background: "#0A0A0ACC", border: "none", color: "#fff", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "14px" }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current.click()}
                    style={{ width: "100%", padding: "32px", background: "#111", border: "2px dashed #2A2A2A", borderRadius: "12px", cursor: "pointer", color: "#555", fontFamily: "inherit", fontSize: "13px", transition: "all 0.2s" }}>
                    <div style={{ fontSize: "32px", marginBottom: "8px" }}>📷</div>
                    <div>Appuie pour prendre une photo ou choisir une image</div>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />
              </div>
            )}

            {/* Prix achat */}
            <div>
              <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>PRIX DEMANDÉ (€)</label>
              <input type="number" placeholder="Combien le vendeur demande-t-il ?" value={prixAchat}
                onChange={e => setPrixAchat(e.target.value)}
                style={{ background: "#141414", border: "1px solid #2A2A2A", color: "#F0EDE8", padding: "10px 14px", borderRadius: "8px", fontFamily: "inherit", fontSize: "14px", width: "100%", outline: "none" }} />
            </div>

            <button onClick={analyser}
              disabled={mode === "text" ? !query : !imageData}
              style={{ background: (mode === "text" ? query : imageData) ? "#FF6B35" : "#1A1A1A", color: (mode === "text" ? query : imageData) ? "#0A0A0A" : "#444", border: "none", padding: "14px", borderRadius: "10px", cursor: (mode === "text" ? query : imageData) ? "pointer" : "not-allowed", fontFamily: "inherit", fontWeight: 700, fontSize: "14px", transition: "all 0.2s" }}>
              Analyser cet article →
            </button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {step === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", gap: "16px" }}>
          {imagePreview && <img src={imagePreview} alt="" style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", opacity: 0.6 }} />}
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "14px", fontWeight: 700 }}>Analyse IA en cours...</div>
          <div style={{ fontSize: "12px", color: "#555", textAlign: "center", lineHeight: 1.6 }}>
            {mode === "photo" ? "Identification de l'article" : "Analyse du marché"}<br />
            Calcul de la marge potentielle<br />
            Évaluation du risque
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B35", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
        </div>
      )}

      {/* RESULT */}
      {step === "result" && result && (() => {
        const d = decisionConfig[result.decision] || decisionConfig.NEGOCIER;
        const scoreColor = getScoreColor(result.score);
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}>{result.nom_article}</div>
                <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "14px", fontWeight: 900 }}>
                  RÉSULTAT <span style={{ color: "#FF6B35" }}>IA</span>
                </div>
              </div>
              <button onClick={reset}
                style={{ background: "none", border: "1px solid #2A2A2A", color: "#666", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}>
                ← Retour
              </button>
            </div>

            {/* Score + Decision */}
            <div style={{ background: d.bg, border: `1px solid ${d.color}30`, borderRadius: "16px", padding: "20px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "24px", fontWeight: 900, color: d.color, marginBottom: "4px" }}>
                  {d.emoji} {d.label}
                </div>
                <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.5, maxWidth: "200px" }}>{result.decision_raison}</div>
              </div>
              <ScoreCircle score={result.score} />
            </div>

            <div style={{ fontSize: "11px", color: "#555", marginBottom: "8px" }}>{result.score_raison}</div>

            {/* Preview photo si dispo */}
            {imagePreview && (
              <img src={imagePreview} alt="" style={{ width: "100%", borderRadius: "12px", maxHeight: "160px", objectFit: "cover", marginBottom: "16px" }} />
            )}

            {/* Chiffres clés */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px" }}>ACHAT MAX</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#FF6B35" }}>{result.prix_achat_max}€</div>
                <div style={{ fontSize: "10px", color: "#444" }}>Ne pas dépasser</div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px" }}>REVENTE EST.</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#4ECDC4" }}>{result.prix_revente_estime}€</div>
                <div style={{ fontSize: "10px", color: "#444" }}>Prix de vente cible</div>
              </div>
              <div style={{ background: "#111", border: `1px solid ${result.marge_potentielle > 0 ? "#06D6A030" : "#FF4E4E30"}`, borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px" }}>MARGE</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: result.marge_potentielle > 0 ? "#06D6A0" : "#FF4E4E" }}>
                  {result.marge_potentielle > 0 ? "+" : ""}{result.marge_potentielle}€
                </div>
                <div style={{ fontSize: "10px", color: result.roi_pct > 200 ? "#06D6A0" : "#555" }}>ROI : {result.roi_pct}%</div>
              </div>
              <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px" }}>VENDU EN</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#FFE66D" }}>{result.delai_vente_jours}j</div>
                <div style={{ fontSize: "10px", color: "#444" }}>Délai estimé</div>
              </div>
            </div>

            {/* Règle ×3 */}
            <div style={{ background: result.regle_x3 ? "#06D6A010" : "#FF6B3510", border: `1px solid ${result.regle_x3 ? "#06D6A030" : "#FF6B3530"}`, borderRadius: "10px", padding: "12px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: result.regle_x3 ? "#06D6A0" : "#FF6B35" }}>
                Règle ×3 {result.regle_x3 ? "✓ validée" : "✗ non atteinte"}
              </div>
            </div>

            {/* Plateforme */}
            <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px" }}>VENDRE SUR</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#FF6B35" }}>📍 {result.meilleure_plateforme}</div>
            </div>

            {/* Points forts / faibles */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: "#111", border: "1px solid #06D6A020", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#06D6A0", letterSpacing: "1px", marginBottom: "8px" }}>POINTS FORTS</div>
                {result.points_forts?.map((p, i) => (
                  <div key={i} style={{ fontSize: "11px", color: "#888", marginBottom: "6px", lineHeight: 1.4 }}>✓ {p}</div>
                ))}
              </div>
              <div style={{ background: "#111", border: "1px solid #FF4E4E20", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#FF4E4E", letterSpacing: "1px", marginBottom: "8px" }}>POINTS FAIBLES</div>
                {result.points_faibles?.map((p, i) => (
                  <div key={i} style={{ fontSize: "11px", color: "#888", marginBottom: "6px", lineHeight: 1.4 }}>✗ {p}</div>
                ))}
              </div>
            </div>

            {/* Conseils */}
            {result.conseils_negociation && (
              <div style={{ background: "#FFE66D10", border: "1px solid #FFE66D30", borderRadius: "12px", padding: "14px", marginBottom: "10px" }}>
                <div style={{ fontSize: "10px", color: "#FFE66D", letterSpacing: "1px", marginBottom: "6px" }}>💬 NÉGOCIATION</div>
                <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.5 }}>{result.conseils_negociation}</div>
              </div>
            )}

            {result.conseils_vente && (
              <div style={{ background: "#4ECDC410", border: "1px solid #4ECDC430", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", color: "#4ECDC4", letterSpacing: "1px", marginBottom: "6px" }}>🚀 VENTE</div>
                <div style={{ fontSize: "12px", color: "#888", lineHeight: 1.5 }}>{result.conseils_vente}</div>
              </div>
            )}

            {result.alerte && (
              <div style={{ background: "#FF4E4E10", border: "1px solid #FF4E4E30", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", color: "#FF4E4E", letterSpacing: "1px", marginBottom: "6px" }}>⚠️ ALERTE</div>
                <div style={{ fontSize: "12px", color: "#888" }}>{result.alerte}</div>
              </div>
            )}

            <button onClick={reset}
              style={{ width: "100%", background: "#FF6B35", color: "#0A0A0A", border: "none", padding: "14px", borderRadius: "10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: "14px" }}>
              Analyser un autre article
            </button>
          </div>
        );
      })()}

      {error && (
        <div style={{ padding: "12px", background: "#FF4E4E15", border: "1px solid #FF4E4E40", borderRadius: "8px", fontSize: "12px", color: "#FF4E4E", marginTop: "12px" }}>
          {error}
        </div>
      )}
    </div>
  );
}
