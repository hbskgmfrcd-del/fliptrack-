import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CATEGORIES = {
  vetements: { label: "Vêtements", emoji: "👟", color: "#FF6B35" },
  electronique: { label: "Électronique", emoji: "📱", color: "#4ECDC4" },
  velos: { label: "Vélos", emoji: "🚲", color: "#FFE66D" },
  autre: { label: "Autre", emoji: "📦", color: "#A8DADC" },
};

const STATUS = {
  achete: { label: "Acheté", color: "#FF6B35", bg: "#FF6B351A" },
  en_vente: { label: "En vente", color: "#FFE66D", bg: "#FFE66D1A" },
  vendu: { label: "Vendu ✓", color: "#06D6A0", bg: "#06D6A01A" },
};

function formatEur(n) {
  return `${Number(n || 0).toFixed(2)}€`;
}

const EMPTY_FORM = {
  nom: "", categorie: "vetements", prix_achat: "", prix_vente: "",
  status: "achete", note: "", date: new Date().toISOString().split("T")[0]
};

export default function App() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState("dashboard");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  }

  async function submitForm() {
    if (!form.nom || !form.prix_achat) return;
    setSaving(true);
    const payload = {
      nom: form.nom,
      categorie: form.categorie,
      prix_achat: Number(form.prix_achat),
      prix_vente: form.prix_vente ? Number(form.prix_vente) : null,
      status: form.status,
      note: form.note,
      date: form.date,
    };
    if (editId) {
      const { error } = await supabase.from("items").update(payload).eq("id", editId);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from("items").insert([payload]);
      if (error) setError(error.message);
    }
    await fetchItems();
    setForm(EMPTY_FORM);
    setEditId(null);
    setSaving(false);
    setView("liste");
  }

  async function deleteItem(id) {
    if (!confirm("Supprimer cet article ?")) return;
    await supabase.from("items").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
  }

  function startEdit(item) {
    setForm({
      nom: item.nom, categorie: item.categorie,
      prix_achat: item.prix_achat, prix_vente: item.prix_vente || "",
      status: item.status, note: item.note || "", date: item.date || EMPTY_FORM.date
    });
    setEditId(item.id);
    setView("ajouter");
  }

  // Stats
  const vendus = items.filter(i => i.status === "vendu");
  const enVente = items.filter(i => i.status === "en_vente");
  const totalInvesti = items.reduce((s, i) => s + Number(i.prix_achat || 0), 0);
  const totalVendu = vendus.reduce((s, i) => s + Number(i.prix_vente || 0), 0);
  const totalAchatVendus = vendus.reduce((s, i) => s + Number(i.prix_achat || 0), 0);
  const benefice = totalVendu - totalAchatVendus;
  const roiGlobal = totalAchatVendus > 0 ? ((benefice / totalAchatVendus) * 100).toFixed(0) : 0;
  const valeurStock = enVente.reduce((s, i) => s + Number(i.prix_achat || 0), 0);

  const filteredItems = items.filter(i => {
    if (filterCat !== "all" && i.categorie !== filterCat) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
    return true;
  });

  if (loading) return (
    <div style={{ background: "#0A0A0A", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#F0EDE8", fontFamily: "'DM Mono', monospace" }}>
      <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "24px", fontWeight: 900, marginBottom: "16px" }}>FLIP<span style={{ color: "#FF6B35" }}>TRACK</span></div>
      <div style={{ color: "#555", fontSize: "13px" }}>Chargement...</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", background: "#0A0A0A", minHeight: "100vh", color: "#F0EDE8", paddingBottom: "80px" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0A0A; }
        input, select, textarea { background: #141414; border: 1px solid #2A2A2A; color: #F0EDE8; padding: 10px 14px; border-radius: 8px; font-family: inherit; font-size: 14px; width: 100%; outline: none; transition: border 0.2s; }
        input:focus, select:focus, textarea:focus { border-color: #FF6B35; }
        select option { background: #141414; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0A0A0A; } ::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 2px; }
        .tab-btn { padding: 6px 14px; border-radius: 20px; border: none; cursor: pointer; font-family: inherit; font-size: 11px; font-weight: 500; transition: all 0.2s; white-space: nowrap; }
        .tab-btn.active { background: #FF6B35; color: #0A0A0A; }
        .tab-btn.inactive { background: #1A1A1A; color: #666; }
        .stat-card { background: #111; border: 1px solid #1E1E1E; border-radius: 16px; padding: 18px; }
        .item-card { background: #111; border: 1px solid #1E1E1E; border-radius: 12px; padding: 16px; margin-bottom: 10px; }
        .btn-primary { background: #FF6B35; color: #0A0A0A; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-family: inherit; font-weight: 600; font-size: 14px; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: #666; border: 1px solid #2A2A2A; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 12px; transition: all 0.2s; }
        .btn-ghost:hover { color: #F0EDE8; border-color: #444; }
        .nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; padding: 8px 20px; border-radius: 12px; background: none; border: none; font-family: inherit; transition: color 0.2s; color: #444; }
        .nav-item.active { color: #FF6B35; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 500; }
        .filter-row { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; }
        .filter-row::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #1A1A1A", position: "sticky", top: 0, background: "#0A0A0AEE", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "20px", fontWeight: 900, letterSpacing: "-0.5px" }}>
          FLIP<span style={{ color: "#FF6B35" }}>TRACK</span>
        </div>
        <div style={{ fontSize: "11px", color: "#444", marginTop: "2px" }}>Bordeaux · Suivi achat-revente</div>
      </div>

      {error && (
        <div style={{ margin: "16px 20px", padding: "12px", background: "#FF4E4E15", border: "1px solid #FF4E4E40", borderRadius: "8px", fontSize: "12px", color: "#FF4E4E" }}>
          ⚠️ {error} <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#FF4E4E", cursor: "pointer", float: "right" }}>✕</button>
        </div>
      )}

      <div style={{ padding: "20px" }}>

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {/* Bénéfice hero */}
              <div className="stat-card" style={{ gridColumn: "1 / -1", background: benefice >= 0 ? "#06D6A008" : "#FF4E4E08", borderColor: benefice >= 0 ? "#06D6A030" : "#FF4E4E30" }}>
                <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px", letterSpacing: "1px" }}>BÉNÉFICE NET</div>
                <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "34px", fontWeight: 900, color: benefice >= 0 ? "#06D6A0" : "#FF4E4E" }}>
                  {benefice >= 0 ? "+" : ""}{formatEur(benefice)}
                </div>
                <div style={{ fontSize: "11px", color: "#444", marginTop: "6px" }}>ROI global : {roiGlobal}% · {vendus.length} article{vendus.length > 1 ? "s" : ""} vendu{vendus.length > 1 ? "s" : ""}</div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px", letterSpacing: "1px" }}>INVESTI</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#FF6B35" }}>{formatEur(totalInvesti)}</div>
                <div style={{ fontSize: "10px", color: "#444" }}>{items.length} article{items.length > 1 ? "s" : ""}</div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px", letterSpacing: "1px" }}>EN VENTE</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#FFE66D" }}>{enVente.length}</div>
                <div style={{ fontSize: "10px", color: "#444" }}>Stock : {formatEur(valeurStock)}</div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px", letterSpacing: "1px" }}>ENCAISSÉ</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#06D6A0" }}>{formatEur(totalVendu)}</div>
                <div style={{ fontSize: "10px", color: "#444" }}>{vendus.length} vendu{vendus.length > 1 ? "s" : ""}</div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: "10px", color: "#666", marginBottom: "4px", letterSpacing: "1px" }}>EN STOCK</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#A8DADC" }}>{items.filter(i => i.status === "achete").length}</div>
                <div style={{ fontSize: "10px", color: "#444" }}>Pas encore listés</div>
              </div>
            </div>

            {/* Par catégorie */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", color: "#444", marginBottom: "12px", letterSpacing: "1px" }}>PAR CATÉGORIE</div>
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const catItems = items.filter(i => i.categorie === key);
                if (catItems.length === 0) return null;
                const catVendus = catItems.filter(i => i.status === "vendu");
                const catBenef = catVendus.reduce((s, i) => s + Number(i.prix_vente || 0) - Number(i.prix_achat || 0), 0);
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1A1A1A" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "20px" }}>{cat.emoji}</span>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500 }}>{cat.label}</div>
                        <div style={{ fontSize: "11px", color: "#444" }}>{catItems.length} article{catItems.length > 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: catBenef >= 0 ? "#06D6A0" : "#FF4E4E" }}>
                        {catBenef >= 0 ? "+" : ""}{formatEur(catBenef)}
                      </div>
                      <div style={{ fontSize: "10px", color: "#444" }}>{catVendus.length} vendu{catVendus.length > 1 ? "s" : ""}</div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div style={{ textAlign: "center", color: "#444", padding: "30px 0", fontSize: "13px" }}>
                  Aucun article — commence par en ajouter un !
                </div>
              )}
            </div>

            {/* Récents */}
            {items.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", color: "#444", marginBottom: "12px", letterSpacing: "1px" }}>RÉCENTS</div>
                {items.slice(0, 4).map(item => <MiniCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        )}

        {/* ── LISTE ── */}
        {view === "liste" && (
          <div>
            <div className="filter-row" style={{ marginBottom: "10px" }}>
              {["all", ...Object.keys(CATEGORIES)].map(k => (
                <button key={k} className={`tab-btn ${filterCat === k ? "active" : "inactive"}`} onClick={() => setFilterCat(k)}>
                  {k === "all" ? "Tout" : CATEGORIES[k].emoji + " " + CATEGORIES[k].label}
                </button>
              ))}
            </div>
            <div className="filter-row" style={{ marginBottom: "20px" }}>
              {["all", ...Object.keys(STATUS)].map(k => (
                <button key={k} className={`tab-btn ${filterStatus === k ? "active" : "inactive"}`} onClick={() => setFilterStatus(k)}>
                  {k === "all" ? "Tous" : STATUS[k].label}
                </button>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div style={{ textAlign: "center", color: "#444", padding: "40px 0", fontSize: "13px" }}>
                Aucun article<br />
                <button className="btn-primary" style={{ marginTop: "16px" }} onClick={() => setView("ajouter")}>+ Ajouter</button>
              </div>
            )}

            {filteredItems.map(item => {
              const cat = CATEGORIES[item.categorie] || CATEGORIES.autre;
              const st = STATUS[item.status] || STATUS.achete;
              const marge = item.status === "vendu" ? Number(item.prix_vente || 0) - Number(item.prix_achat || 0) : null;
              const roi = item.prix_achat > 0 && marge !== null ? ((marge / item.prix_achat) * 100).toFixed(0) : null;
              return (
                <div key={item.id} className="item-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "20px" }}>{cat.emoji}</span>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>{item.nom}</div>
                        <div style={{ fontSize: "11px", color: "#444" }}>{item.date}</div>
                      </div>
                    </div>
                    <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>

                  <div style={{ display: "flex", gap: "20px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.5px" }}>ACHETÉ</div>
                      <div style={{ fontSize: "17px", fontWeight: 700, color: "#FF6B35" }}>{formatEur(item.prix_achat)}</div>
                    </div>
                    {item.prix_vente && (
                      <div>
                        <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.5px" }}>VENDU</div>
                        <div style={{ fontSize: "17px", fontWeight: 700, color: "#06D6A0" }}>{formatEur(item.prix_vente)}</div>
                      </div>
                    )}
                    {marge !== null && (
                      <div>
                        <div style={{ fontSize: "10px", color: "#555", letterSpacing: "0.5px" }}>MARGE</div>
                        <div style={{ fontSize: "17px", fontWeight: 700, color: marge >= 0 ? "#06D6A0" : "#FF4E4E" }}>
                          {marge >= 0 ? "+" : ""}{formatEur(marge)} <span style={{ fontSize: "11px", opacity: 0.7 }}>({roi}%)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {item.note && <div style={{ fontSize: "12px", color: "#555", marginBottom: "12px", fontStyle: "italic", lineHeight: 1.4 }}>"{item.note}"</div>}

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="btn-ghost" onClick={() => startEdit(item)}>✏️ Modifier</button>
                    <button className="btn-ghost" style={{ borderColor: "#FF4E4E30", color: "#FF4E4E66" }} onClick={() => deleteItem(item.id)}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── AJOUTER / MODIFIER ── */}
        {view === "ajouter" && (
          <div>
            <div style={{ fontFamily: "'Unbounded', sans-serif", fontSize: "15px", fontWeight: 700, marginBottom: "24px", letterSpacing: "-0.3px" }}>
              {editId ? "MODIFIER L'ARTICLE" : "NOUVEL ARTICLE"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>NOM *</label>
                <input placeholder="ex: Nike Air Force 1 blanc T42" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>CATÉGORIE</label>
                <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>PRIX D'ACHAT (€) *</label>
                  <input type="number" step="0.01" placeholder="0.00" value={form.prix_achat} onChange={e => setForm({ ...form, prix_achat: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>PRIX DE VENTE (€)</label>
                  <input type="number" step="0.01" placeholder="0.00" value={form.prix_vente} onChange={e => setForm({ ...form, prix_vente: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "8px", letterSpacing: "1px" }}>STATUT</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <button key={k} onClick={() => setForm({ ...form, status: k })}
                      style={{ flex: 1, padding: "10px 6px", borderRadius: "8px", border: `1px solid ${form.status === k ? v.color : "#2A2A2A"}`, background: form.status === k ? v.bg : "transparent", color: form.status === k ? v.color : "#555", cursor: "pointer", fontSize: "11px", fontFamily: "inherit", fontWeight: 500, transition: "all 0.2s" }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>DATE</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>NOTE</label>
                <textarea rows={2} placeholder="Où acheté, état, plateforme de vente..." value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={{ resize: "none" }} />
              </div>

              {/* Aperçu marge */}
              {form.prix_achat && form.prix_vente && Number(form.prix_achat) > 0 && (
                <div style={{ background: "#141414", borderRadius: "10px", padding: "14px", border: "1px solid #2A2A2A" }}>
                  <div style={{ fontSize: "10px", color: "#555", marginBottom: "10px", letterSpacing: "1px" }}>APERÇU MARGE</div>
                  <div style={{ display: "flex", gap: "24px" }}>
                    {[
                      { label: "Marge brute", value: formatEur(Number(form.prix_vente) - Number(form.prix_achat)), color: (Number(form.prix_vente) - Number(form.prix_achat)) >= 0 ? "#06D6A0" : "#FF4E4E" },
                      { label: "ROI", value: `${((Number(form.prix_vente) - Number(form.prix_achat)) / Number(form.prix_achat) * 100).toFixed(0)}%`, color: "#FFE66D" },
                      { label: "Règle ×3", value: Number(form.prix_vente) >= Number(form.prix_achat) * 3 ? "✓ OK" : "✗ Non", color: Number(form.prix_vente) >= Number(form.prix_achat) * 3 ? "#06D6A0" : "#FF6B35" },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: "10px", color: "#555" }}>{s.label}</div>
                        <div style={{ fontSize: "18px", fontWeight: 700, color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={submitForm} disabled={saving}>
                  {saving ? "Enregistrement..." : editId ? "Modifier" : "Ajouter l'article"}
                </button>
                <button className="btn-ghost" onClick={() => { setView("liste"); setEditId(null); setForm(EMPTY_FORM); }}>Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0A0A0AF0", backdropFilter: "blur(12px)", borderTop: "1px solid #1A1A1A", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 100 }}>
        {[
          { id: "dashboard", emoji: "📊", label: "Stats" },
          { id: "liste", emoji: "📋", label: "Articles" },
          { id: "ajouter_new", emoji: "➕", label: "Ajouter" },
        ].map(tab => (
          <button key={tab.id} className={`nav-item ${view === tab.id || (tab.id === "ajouter_new" && view === "ajouter" && !editId) ? "active" : ""}`}
            onClick={() => {
              if (tab.id === "ajouter_new") { setEditId(null); setForm(EMPTY_FORM); setView("ajouter"); }
              else setView(tab.id);
            }}>
            <span style={{ fontSize: tab.id === "ajouter_new" ? "26px" : "20px" }}>{tab.emoji}</span>
            <span style={{ fontSize: "10px" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniCard({ item }) {
  const cat = CATEGORIES[item.categorie] || CATEGORIES.autre;
  const st = STATUS[item.status] || STATUS.achete;
  const marge = item.status === "vendu" ? Number(item.prix_vente || 0) - Number(item.prix_achat || 0) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #161616" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "18px" }}>{cat.emoji}</span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 500 }}>{item.nom}</div>
          <span className="badge" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: marge !== null ? (marge >= 0 ? "#06D6A0" : "#FF4E4E") : "#FF6B35" }}>
          {marge !== null ? `${marge >= 0 ? "+" : ""}${(marge).toFixed(2)}€` : `${Number(item.prix_achat).toFixed(2)}€`}
        </div>
      </div>
    </div>
  );
}
