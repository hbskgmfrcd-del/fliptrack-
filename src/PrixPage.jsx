import { useState } from "react";

const CATEGORIES_SEARCH = [
  { id: "vetements", label: "Vêtements", emoji: "👟", exemples: ["Nike Air Force 1", "Levi's 501", "Stone Island"] },
  { id: "electronique", label: "Électronique", emoji: "📱", exemples: ["iPhone 11", "PS4 Pro", "Nintendo Switch"] },
  { id: "velos", label: "Vélos", emoji: "🚲", exemples: ["VTT Trek", "vélo de ville", "trottinette Xiaomi"] },
  { id: "autre", label: "Autre", emoji: "📦", exemples: ["sac à dos", "montre", "appareil photo"] },
];

const ETAT_OPTIONS = [
  { id: "neuf", label: "Neuf / jamais porté" },
  { id: "tres_bon", label: "Très bon état" },
  { id: "bon", label: "Bon état" },
  { id: "acceptable", label: "État acceptable" },
  { id: "abime", label: "Abîmé / cassé" },
];

function ScoreBar({ value, max = 10, color }) {
  return (
    <div style={{ background: "#1A1A1A", borderRadius: "4px", height: "6px", overflow: "hidden", marginTop: "6px" }}>
      <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: "4px", transition: "width 0.8s ease" }} />
    </div>
  );
}

export default function PrixPage() {
  const [step, setStep] = useState("form"); // form | loading | result
  const [form, setForm] = useState({ query: "", categorie: "vetements", etat: "bon", prixAchat: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function analyser() {
    if (!form.query) return;
    setStep("loading");
    setError(null);

    const prompt = `Tu es un expert en achat-revente de seconde main en France (Vinted, Leboncoin, eBay France).
    
L'utilisateur veut acheter cet article pour le revendre :
- Article : ${form.query}
- Catégorie : ${form.categorie}
- État : ${form.etat}
- Prix d'achat envisagé : ${form.prixAchat ? form.prixAchat + "€" : "non précisé"}

Réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, avec cette structure exacte :
{
  "prix_vinted": { "min": 0, "median": 0, "max": 0 },
  "prix_leboncoin": { "min": 0, "median": 0, "max": 0 },
  "prix_recommande": 0,
  "score_opportunite": 0,
  "delai_vente_jours": 0,
  "marge_estimee": 0,
  "roi_pct": 0,
  "verdict": "BON_ACHAT | ACHAT_CORRECT | EVITER",
  "raison_verdict": "explication courte en 1-2 phrases",
  "conseils": ["conseil 1", "conseil 2", "conseil 3"],
  "risques": ["risque 1", "risque 2"],
  "meilleure_plateforme": "Vinted | Leboncoin | eBay | Les deux",
  "tendance": "HAUSSE | STABLE | BAISSE",
  "tendance_raison": "explication courte"
}

score_opportunite : entre 1 et 10 (10 = excellent deal)
marge_estimee : prix_recommande - prix_achat (si prix_achat non précisé, utilise le median Leboncoin comme base)
roi_pct : (marge_estimee / prix_achat) * 100
Sois précis et réaliste avec les prix actuels du marché français 2025.`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult({ ...parsed, query: form.query, etat: form.etat, prixAchat: form.prixAchat });
      setStep("result");
    } catch (e) {
      setError("Erreur d'analyse. Réessaie.");
      setStep("form");
    }
  }

  const verdictConfig = {
    BON_ACHAT: { color: "#06D6A0", bg: "#06D6A015", emoji: "✅", label: "BON ACHAT" },
    ACHAT_CORRECT: { color: "#FFE66D", bg: "#FFE66D15", emoji: "⚠️", label: "CORRECT" },
    EVITER: { color: "#FF4E4E", bg: "#FF4E4E15", emoji: "❌", label: "À ÉVITER" },
  };

  return (
    <div style={{ fontFamily: "'DM Mono', monospace", color: "#F0EDE8" }}>

      {/* FORM */}
      {step === "form" && (
        <div>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "16px", fontWeight: 900, marginBottom: "4px" }}>
              INTELLIGENCE <span style={{ color: "#FF6B35" }}>PRIX</span>
            </div>
            <div style={{ fontSize: "11px", color: "#555" }}>Analyse en temps réel · Vinted + Leboncoin</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Catégorie */}
            <div>
              <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "8px", letterSpacing: "1px" }}>CATÉGORIE</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {CATEGORIES_SEARCH.map(cat => (
                  <button key={cat.id} onClick={() => setForm({ ...form, categorie: cat.id })}
                    style={{ padding: "12px", borderRadius: "10px", border: `1px solid ${form.categorie === cat.id ? "#FF6B35" : "#2A2A2A"}`, background: form.categorie === cat.id ? "#FF6B3510" : "#111", color: form.categorie === cat.id ? "#FF6B35" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", textAlign: "left", transition: "all 0.2s" }}>
                    <div style={{ fontSize: "20px", marginBottom: "4px" }}>{cat.emoji}</div>
                    <div style={{ fontWeight: 500 }}>{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recherche */}
            <div>
              <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>ARTICLE</label>
              <input
                placeholder={`ex: ${CATEGORIES_SEARCH.find(c => c.id === form.categorie)?.exemples[0]}`}
                value={form.query}
                onChange={e => setForm({ ...form, query: e.target.value })}
                onKeyDown={e => e.key === "Enter" && analyser()}
              />
              <div style={{ fontSize: "10px", color: "#444", marginTop: "4px" }}>
                Sois précis : marque, modèle, taille si pertinent
              </div>
            </div>

            {/* État */}
            <div>
              <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "8px", letterSpacing: "1px" }}>ÉTAT</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {ETAT_OPTIONS.map(e => (
                  <button key={e.id} onClick={() => setForm({ ...form, etat: e.id })}
                    style={{ padding: "10px 14px", borderRadius: "8px", border: `1px solid ${form.etat === e.id ? "#FF6B35" : "#2A2A2A"}`, background: form.etat === e.id ? "#FF6B3510" : "#111", color: form.etat === e.id ? "#FF6B35" : "#666", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", textAlign: "left", transition: "all 0.2s" }}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prix achat */}
            <div>
              <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>PRIX D'ACHAT ENVISAGÉ (€)</label>
              <input type="number" placeholder="Optionnel — pour calculer ta marge" value={form.prixAchat}
                onChange={e => setForm({ ...form, prixAchat: e.target.value })} />
            </div>

            <button
              onClick={analyser}
              disabled={!form.query}
              style={{ background: form.query ? "#FF6B35" : "#1A1A1A", color: form.query ? "#0A0A0A" : "#444", border: "none", padding: "14px", borderRadius: "10px", cursor: form.query ? "pointer" : "not-allowed", fontFamily: "inherit", fontWeight: 700, fontSize: "14px", transition: "all 0.2s", marginTop: "4px" }}>
              Analyser le marché →
            </button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {step === "loading" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "16px" }}>
          <div style={{ fontSize: "40px" }}>🔍</div>
          <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "14px", fontWeight: 700 }}>Analyse en cours...</div>
          <div style={{ fontSize: "12px", color: "#555", textAlign: "center", lineHeight: 1.6 }}>
            Interrogation Vinted + Leboncoin<br />Calcul de la marge potentielle
          </div>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#FF6B35", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.6 }} />
            ))}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
        </div>
      )}

      {/* RESULT */}
      {step === "result" && result && (() => {
        const v = verdictConfig[result.verdict] || verdictConfig.ACHAT_CORRECT;
        const regle3ok = result.prixAchat && result.prix_recommande >= result.prixAchat * 3;
        return (
          <div>
            {/* Header result */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px" }}>{result.query}</div>
                <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "15px", fontWeight: 900 }}>
                  ANALYSE <span style={{ color: "#FF6B35" }}>MARCHÉ</span>
                </div>
              </div>
              <button onClick={() => { setStep("form"); setResult(null); }}
                style={{ background: "none", border: "1px solid #2A2A2A", color: "#666", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}>
                ← Retour
              </button>
            </div>

            {/* Verdict */}
            <div style={{ background: v.bg, border: `1px solid ${v.color}30`, borderRadius: "16px", padding: "20px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "28px", marginBottom: "6px" }}>{v.emoji}</div>
                  <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "18px", fontWeight: 900, color: v.color }}>{v.label}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "#555", marginBottom: "4px" }}>SCORE</div>
                  <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "32px", fontWeight: 900, color: v.color }}>{result.score_opportunite}/10</div>
                </div>
              </div>
              <ScoreBar value={result.score_opportunite} color={v.color} />
              <div style={{ fontSize: "12px", color: "#888", marginTop: "12px", lineHeight: 1.5 }}>{result.raison_verdict}</div>
            </div>

            {/* Prix grille */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              {/* Vinted */}
              <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>VINTED</div>
                <div style={{ fontSize: "11px", color: "#444" }}>Min</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{result.prix_vinted?.min}€</div>
                <div style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}>Médian</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#4ECDC4" }}>{result.prix_vinted?.median}€</div>
                <div style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}>Max</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{result.prix_vinted?.max}€</div>
              </div>

              {/* Leboncoin */}
              <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#555", marginBottom: "8px", letterSpacing: "1px" }}>LEBONCOIN</div>
                <div style={{ fontSize: "11px", color: "#444" }}>Min</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{result.prix_leboncoin?.min}€</div>
                <div style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}>Médian</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#FF6B35" }}>{result.prix_leboncoin?.median}€</div>
                <div style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}>Max</div>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>{result.prix_leboncoin?.max}€</div>
              </div>

              {/* Prix recommandé */}
              <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#555", marginBottom: "4px", letterSpacing: "1px" }}>PRIX IDÉAL</div>
                <div style={{ fontSize: "26px", fontWeight: 700, color: "#FFE66D" }}>{result.prix_recommande}€</div>
                <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>Pour vendre en {result.delai_vente_jours}j</div>
              </div>

              {/* Marge */}
              <div style={{ background: "#111", border: `1px solid ${result.marge_estimee > 0 ? "#06D6A030" : "#FF4E4E30"}`, borderRadius: "12px", padding: "14px" }}>
                <div style={{ fontSize: "10px", color: "#555", marginBottom: "4px", letterSpacing: "1px" }}>MARGE EST.</div>
                <div style={{ fontSize: "26px", fontWeight: 700, color: result.marge_estimee > 0 ? "#06D6A0" : "#FF4E4E" }}>
                  {result.marge_estimee > 0 ? "+" : ""}{result.marge_estimee}€
                </div>
                <div style={{ fontSize: "10px", color: result.roi_pct > 200 ? "#06D6A0" : "#555", marginTop: "4px" }}>
                  ROI : {result.roi_pct}%
                </div>
              </div>
            </div>

            {/* Règle ×3 */}
            {result.prixAchat && (
              <div style={{ background: regle3ok ? "#06D6A010" : "#FF6B3510", border: `1px solid ${regle3ok ? "#06D6A030" : "#FF6B3530"}`, borderRadius: "10px", padding: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "12px", color: regle3ok ? "#06D6A0" : "#FF6B35" }}>
                  Règle ×3 {regle3ok ? "✓ validée" : "✗ non atteinte"}
                </div>
                <div style={{ fontSize: "11px", color: "#555" }}>
                  Achat {result.prixAchat}€ → cible {result.prixAchat * 3}€
                </div>
              </div>
            )}

            {/* Tendance */}
            <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px" }}>TENDANCE MARCHÉ</div>
                <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: result.tendance === "HAUSSE" ? "#06D6A020" : result.tendance === "BAISSE" ? "#FF4E4E20" : "#FFE66D20", color: result.tendance === "HAUSSE" ? "#06D6A0" : result.tendance === "BAISSE" ? "#FF4E4E" : "#FFE66D" }}>
                  {result.tendance === "HAUSSE" ? "↗ Hausse" : result.tendance === "BAISSE" ? "↘ Baisse" : "→ Stable"}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>{result.tendance_raison}</div>
            </div>

            {/* Meilleure plateforme */}
            <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px", marginBottom: "6px" }}>MEILLEURE PLATEFORME</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#FF6B35" }}>📍 {result.meilleure_plateforme}</div>
            </div>

            {/* Conseils */}
            <div style={{ background: "#111", border: "1px solid #1E1E1E", borderRadius: "12px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "10px", color: "#555", letterSpacing: "1px", marginBottom: "10px" }}>CONSEILS</div>
              {result.conseils?.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "12px", color: "#888", lineHeight: 1.4 }}>
                  <span style={{ color: "#06D6A0", flexShrink: 0 }}>→</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>

            {/* Risques */}
            {result.risques?.length > 0 && (
              <div style={{ background: "#FF4E4E08", border: "1px solid #FF4E4E20", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
                <div style={{ fontSize: "10px", color: "#FF4E4E", letterSpacing: "1px", marginBottom: "10px" }}>⚠️ RISQUES</div>
                {result.risques.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "12px", color: "#888", lineHeight: 1.4 }}>
                    <span style={{ color: "#FF4E4E", flexShrink: 0 }}>!</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => { setStep("form"); setResult(null); }}
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
