// HoldingsTab — the Holdings dashboard. 9 holdings + comparison view.
// All data (the 9 companies, META, GROUPS, THEMES, SECTIONS, SUBS, DIMENSIONS,
// HEATMAP_THEMES, AI_TIERS) comes from src/data/holdings.json.
//
// The dark/light theme toggle was intentionally removed — the dashboard is
// fixed in dark mode to match the rest of the app.

import { useState, useEffect, useRef } from 'react';
import holdingsData from '../../data/holdings.json';
import { useT } from '../../lib/i18n.jsx';

// Reconstitute the named consts the original code expects. holdings.json was
// produced from those consts during Phase 3 extraction; here we read them back
// out by the same names.
const { companies, HOLDING_COMPANIES_ORDER, META, GROUPS, THEMES, SECTIONS, SUBS, DIMENSIONS, HEATMAP_THEMES, AI_TIERS } = holdingsData;

// Reassemble the ordered HOLDING_COMPANIES array. Company objects in JSON are
// keyed by their uppercase id (SOFTBANK, BROOKFIELD, ...); the order array
// gives the canonical display sequence (lowercase ids).
const HOLDING_COMPANIES = HOLDING_COMPANIES_ORDER.map((id) => companies[id.toUpperCase()]);

function Source({ C, children, text, tip, placement = "top" }) {
  const [show, setShow] = useState(false);
  const hasContent = !!tip;
  const bg = C.isDark ? "#000" : "#262421";
  return (
    <span style={{ position: "relative", zIndex: show && hasContent ? 40 : "auto", cursor: hasContent ? "help" : "default", borderBottom: hasContent ? `1px dotted ${C.inkFaint}` : "none" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && hasContent && (
        <span style={{ position: "absolute", ...(placement === "bottom" ? { top: "calc(100% + 8px)" } : { bottom: "calc(100% + 8px)" }), left: 0, zIndex: 30, width: 240, maxWidth: "78vw", background: bg, color: "#fff", fontSize: 11.5, lineHeight: 1.5, padding: "10px 12px", borderRadius: 7, fontFamily: "var(--sans)", border: `1px solid ${C.line}`, boxShadow: "0 8px 28px rgba(0,0,0,.45)", textAlign: "left", whiteSpace: "normal", fontWeight: 400, textTransform: "none", letterSpacing: "normal" }}>
          {tip.what && <span style={{ display: "block", color: "#fff", fontWeight: 500, marginBottom: tip.sector || tip.since || tip.why ? 6 : 0 }}>{tip.what}</span>}
          {tip.sector && <span style={{ display: "inline-block", fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase", color: "#fff", background: "rgba(255,255,255,.14)", padding: "2px 7px", borderRadius: 4, marginBottom: tip.since || tip.why ? 7 : 0 }}>{tip.sector}</span>}
          {tip.since && <span style={{ display: "block", color: "rgba(255,255,255,.82)", marginBottom: tip.why ? 4 : 0 }}><span style={{ color: "rgba(255,255,255,.5)" }}>Held: </span>{tip.since}</span>}
          {tip.why && <span style={{ display: "block", color: "rgba(255,255,255,.82)" }}><span style={{ color: "rgba(255,255,255,.5)" }}>Why: </span>{tip.why}</span>}
        </span>
      )}
    </span>
  );
}

function Bar({ C, label, note, pct, color, display }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7 }}>
      <div style={{ width: 160, flexShrink: 0 }}><span style={{ fontSize: 13, color: C.ink }}>{label}</span>{note && <span style={{ fontSize: 11, color: C.inkFaint, marginLeft: 6 }}>{note}</span>}</div>
      <div style={{ flex: 1, height: 16, background: C.track, borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: color }} /></div>
      <div style={{ width: 48, textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, color: C.ink }}>{display}</div>
    </div>
  );
}

function Drawer({ C, rows }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const preview = rows.map((r) => r[0]).join(" · ");
  return (
    <div style={{ marginTop: 18, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
      <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left", display: "flex", alignItems: "baseline", gap: 8, fontFamily: "var(--sans)", color: C.teal, maxWidth: "100%" }}>
        <span style={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{open ? t('− Скрыть детали', '− Hide details') : t('+ Подробнее', '+ Show more')}</span>
        {!open && <span style={{ fontSize: 12, color: C.inkFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</span>}
      </button>
      {open && <div style={{ marginTop: 12 }}>{rows.map((r, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14, padding: "9px 0", borderTop: i ? `1px solid ${C.lineSoft}` : "none" }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{r[0]}</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6 }}>{r[1]} {r[2] && <span style={{ color: C.inkFaint, fontStyle: "italic" }}>· {r[2]}</span>}</div>
        </div>))}</div>}
    </div>
  );
}

function SectionHead({ C, n, title, sub, action }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: C.teal, marginBottom: 4 }}>Layer {n}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 27, fontWeight: 500, color: C.ink, margin: 0, letterSpacing: "-.01em" }}>{title}</h2>
        <span style={{ fontSize: 13, color: C.inkFaint, fontStyle: "italic" }}>— {sub}</span>
        {action && <div style={{ marginLeft: "auto" }}>{action}</div>}
      </div>
      <div style={{ height: 1, background: C.line, marginTop: 14 }} />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMPARE MODE
// ═════════════════════════════════════════════════════════════════════════════

function CompareView({ C, META, dim, setDim, excluded, toggle, included }) {
  const t = useT();
  const d = DIMENSIONS.find((x) => x.id === dim);
  const mono = (c) => (
    <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 6, background: META[c.id].color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: META[c.id].mono.length > 2 ? 8.5 : 10.5, fontWeight: 600, color: "#fff" }}>{META[c.id].mono}</span>
  );

  // which companies have a usable value for this dimension
  const valueFor = (c) => {
    switch (dim) {
      case "scale": return c.compare.scale;
      case "dryPowder": return c.compare.dryPowder?.value ?? null;
      case "fees": return c.compare.feeCapital;
      case "concentration": return c.compare.concentration;
      case "discount": return c.compare.discount;
      default: return null;
    }
  };

  const applicable = included.filter((c) => {
    if (d.kind === "bar") return valueFor(c) != null;
    if (dim === "ai") return c.compare.aiTier && c.compare.aiTier !== "none";
    return true;
  });
  const notApplicable = HOLDING_COMPANIES.filter((c) => !excluded.includes(c.id) && !applicable.includes(c));

  const fmtVal = (v) => (d.unit === "%" ? `${v}%` : v >= 1000 ? `$${(v / 1000).toFixed(1)}T` : `$${v}B`);

  return (
    <div>
      {/* dimension toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {DIMENSIONS.map((x) => {
          const on = x.id === dim;
          return (
            <button key={x.id} onClick={() => setDim(x.id)} style={{ fontSize: 12.5, fontWeight: on ? 600 : 400, padding: "8px 14px", borderRadius: 8, border: `1px solid ${on ? C.teal : C.line}`, background: on ? C.teal : C.card, color: on ? (C.isDark ? "#100F0D" : "#fff") : C.inkSoft, cursor: "pointer", transition: "all .15s" }}>{x.label}</button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, padding: "12px 16px", background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid ${C.teal}`, borderRadius: 8 }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: C.inkFaint, marginBottom: 2 }}>{t('Сравниваем', 'Comparing')}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, lineHeight: 1.1 }}>{d.measures}</div>
        </div>
        {d.axis && <div style={{ flexShrink: 0, fontFamily: "var(--mono)", fontSize: 11.5, color: C.teal, background: C.isDark ? "#16241F" : "#E2EFE9", padding: "4px 9px", borderRadius: 5 }}>{d.axis}</div>}
        <div style={{ fontSize: 12, color: C.inkFaint, fontStyle: "italic", lineHeight: 1.4, borderLeft: `1px solid ${C.line}`, paddingLeft: 14 }}>{d.note}</div>
      </div>

      {/* asset include/exclude chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 26, paddingBottom: 18, borderBottom: `1px solid ${C.line}` }}>
        <span style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: C.inkFaint, alignSelf: "center", marginRight: 4 }}>{t('Холдинги:', 'Holdings:')}</span>
        {HOLDING_COMPANIES.map((c) => {
          const off = excluded.includes(c.id);
          return (
            <button key={c.id} onClick={() => toggle(c.id)} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, padding: "5px 10px 5px 5px", borderRadius: 20, border: `1px solid ${off ? C.line : META[c.id].color}`, background: off ? "transparent" : C.card, color: off ? C.inkFaint : C.ink, cursor: "pointer", opacity: off ? 0.5 : 1 }}>
              <span style={{ width: 20, height: 20, borderRadius: 5, background: off ? C.line : META[c.id].color, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: META[c.id].mono.length > 2 ? 7.5 : 9, fontWeight: 600, color: "#fff" }}>{META[c.id].mono}</span>
              {c.name}
            </button>
          );
        })}
      </div>

      {/* ── BAR dimensions ── */}
      {d.kind === "bar" && (
        applicable.length === 0
          ? <div style={{ fontSize: 14, color: C.inkSoft, padding: "40px 0", textAlign: "center" }}>{t('Ни один из выбранных холдингов не раскрывает этот показатель.', 'None of the selected holdings disclose this metric.')}</div>
          : (() => {
            const max = Math.max(...applicable.map(valueFor));
            const ranked = [...applicable].sort((a, b) => valueFor(b) - valueFor(a));
            return (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div style={{ width: 26 }} />
                  <div style={{ width: 150, flexShrink: 0, fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.inkFaint }}>{t('Холдинг', 'Holding')}</div>
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkFaint }}><span>{d.measures} →</span><span style={{ fontFamily: "var(--mono)", textTransform: "none", letterSpacing: "normal" }}>0 — {fmtVal(max)}</span></div>
                  <div style={{ width: 70, textAlign: "right", fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkFaint }}>{d.unit === "%" ? "%" : "$B"}</div>
                </div>
                {ranked.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 26 }}>{mono(c)}</div>
                    <div style={{ width: 150, flexShrink: 0 }}>
                      <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 10.5, color: C.inkFaint }}>{c.type}</div>
                    </div>
                    <div style={{ flex: 1, height: 26, background: C.track, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(valueFor(c) / max) * 100}%`, height: "100%", background: META[c.id].color, borderRadius: 4, transition: "width .4s cubic-bezier(.2,.7,.2,1)" }} />
                    </div>
                    <div style={{ width: 70, textAlign: "right", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 500, color: C.ink }}>{fmtVal(valueFor(c))}</div>
                  </div>
                ))}
                {dim === "dryPowder" && (
                  <div style={{ marginTop: 18 }}>
                    {ranked.map((c) => (
                      <div key={c.id} style={{ fontSize: 11.5, color: C.inkFaint, marginBottom: 4 }}><b style={{ color: C.inkSoft }}>{c.name}:</b> {c.compare.dryPowder.earmark}</div>
                    ))}
                  </div>
                )}
                {notApplicable.length > 0 && (
                  <div style={{ marginTop: 22, fontSize: 12, color: C.inkFaint }}>{t('Неприменимо', 'Not applicable')}: {notApplicable.map((c) => c.name).join(", ")} — {dim === "fees" ? "не управляющие активами / нет сопоставимого показателя fee-капитала" : dim === "concentration" ? "диверсифицированы, нет концентрации топ-2" : dim === "discount" ? "не торгуются с дисконтом к NAV / расчётной стоимости" : "нет данных"}.</div>
                )}
              </div>
            );
          })()
      )}

      {/* ── AI dimension: tiered, with commitment bars ── */}
      {d.kind === "ai" && (
        <div>
          {AI_TIERS.map((tier) => {
            const members = included.filter((c) => c.compare.aiTier === tier.id);
            if (!members.length) return null;
            const max = Math.max(...HOLDING_COMPANIES.filter((c) => c.compare.aiCommitment).map((c) => c.compare.aiCommitment.value), 1);
            return (
              <div key={tier.id} style={{ marginBottom: 22 }}>
                <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: tier.id === "pure-play" ? C.teal : C.inkSoft, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  {tier.label}
                  <span style={{ flex: 1, height: 1, background: C.line }} />
                </div>
                {members.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 26 }}>{mono(c)}</div>
                    <div style={{ width: 150, flexShrink: 0 }}>
                      <div style={{ fontSize: 13.5, color: C.ink, fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 10.5, color: C.inkFaint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{c.compare.aiCommitment?.label || "—"}</div>
                    </div>
                    <div style={{ flex: 1, height: 22, background: C.track, borderRadius: 4, overflow: "hidden" }}>
                      {c.compare.aiCommitment && <div style={{ width: `${(c.compare.aiCommitment.value / max) * 100}%`, height: "100%", background: META[c.id].color, borderRadius: 4 }} />}
                    </div>
                    <div style={{ width: 70, textAlign: "right", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, color: C.ink }}>{c.compare.aiCommitment ? `$${c.compare.aiCommitment.value}B` : "—"}</div>
                  </div>
                ))}
              </div>
            );
          })}
          <div style={{ fontSize: 11.5, color: C.inkFaint, fontStyle: "italic", marginTop: 6 }}>{t('Полосы показывают вложенный / заявленный капитал в AI-инфраструктуру. Уровни отражают, насколько AI централен для тезиса каждого холдинга.', 'The bars show capital deployed or committed to AI infrastructure. The tiers reflect how central AI is to each holding\'s thesis.')}</div>
        </div>
      )}

      {/* ── FORWARD THEME: cards ── */}
      {d.kind === "theme" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {included.map((c) => (
            <div key={c.id} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px", borderLeft: `3px solid ${META[c.id].color}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>{mono(c)}<div><div style={{ fontSize: 14, fontWeight: 500, color: C.ink }}>{c.name}</div><div style={{ fontSize: 10.5, color: C.inkFaint }}>{c.type}</div></div></div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 17, color: C.ink, lineHeight: 1.4 }}>{c.compare.forwardTheme}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── HEATMAP ── */}
      {d.kind === "heatmap" && (
        <div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "0 12px 10px 0", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkFaint, fontWeight: 500 }}>{t('Холдинг', 'Holding')}</th>
                  {HEATMAP_THEMES.map((t) => <th key={t.id} style={{ padding: "0 6px 10px", fontSize: 11, letterSpacing: ".04em", textTransform: "uppercase", color: C.inkFaint, fontWeight: 500, textAlign: "center" }}>{t.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {included.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: "5px 12px 5px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>{mono(c)}<span style={{ fontSize: 13, color: C.ink, fontWeight: 500, whiteSpace: "nowrap" }}>{c.name}</span></div>
                    </td>
                    {HEATMAP_THEMES.map((th) => {
                      const v = c.compare.themes[th.id];
                      const map = { in: { bg: C.teal, tx: C.isDark ? "#0B130F" : "#fff", lab: t('В фокусе', 'In focus') }, neutral: { bg: C.track, tx: C.inkSoft, lab: t('Нейтрально', 'Neutral') }, avoid: { bg: C.clay, tx: "#fff", lab: t('Избегает', 'Avoiding') } };
                      const cell = v ? map[v] : { bg: "transparent", tx: C.inkFaint, lab: "—" };
                      return (
                        <td key={th.id} style={{ padding: 4, textAlign: "center" }}>
                          <div style={{ height: 38, borderRadius: 6, background: cell.bg, border: v ? "none" : `1px dashed ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: cell.tx }}>{cell.lab}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 11.5, color: C.inkSoft, flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: C.teal }} />{' '}{t('В фокусе', 'In focus')}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: C.track }} />{' '}{t('Нейтрально', 'Neutral')}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: C.clay }} />{' '}{t('Избегает', 'Avoiding')}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: 3, border: `1px dashed ${C.line}` }} />{' '}{t('н/д', 'n/d')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ExtendedHoldings ──────────────────────────────────────────────────────
// Full inventory of named holdings for a single company. Reached via the
// "Все позиции →" button in the Snapshot section header. Only renders if the
// company has an `extendedHoldings` field on its data object.

function ExtendedHoldings({ C, company, onBack }) {
  const t = useT();
  const eh = company.extendedHoldings;
  const [openRow, setOpenRow] = useState(null);  // "gIdx-rIdx" string
  const [filterTier, setFilterTier] = useState("all");      // all | ring1 | ring2
  const [filterVehicle, setFilterVehicle] = useState("all");
  const [filterListing, setFilterListing] = useState("all"); // all | public | private
  const [search, setSearch] = useState("");
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const vehicleRef = useRef(null);

  // Close vehicle dropdown when clicking outside
  useEffect(() => {
    if (!vehicleOpen) return;
    const onClick = (e) => { if (vehicleRef.current && !vehicleRef.current.contains(e.target)) setVehicleOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [vehicleOpen]);

  // Build vehicle options dynamically from data
  const vehicleOptions = ["all", ...Array.from(new Set(eh.groups.flatMap((g) => g.rows.map((r) => r.vehicle).filter(Boolean))))];

  // Filter groups + rows
  const visibleGroups = eh.groups.map((g) => {
    if (filterTier !== "all") {
      const gTier = g.tier === "ring1-aggregated" ? "ring1" : g.tier;
      if (gTier !== filterTier) return { ...g, rows: [], hidden: true };
    }
    const rows = g.rows.filter((r) => {
      if (filterVehicle !== "all" && r.vehicle !== filterVehicle) return false;
      if (filterListing !== "all" && r.listing !== filterListing) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    return { ...g, rows, hidden: rows.length === 0 };
  });
  const totalVisible = visibleGroups.reduce((sum, g) => sum + g.rows.length, 0);

  const tierBadge = (tier) => {
    if (tier === "ring1" || tier === "ring1-aggregated") return { label: t('С опубликованной оценкой', 'With a published valuation'), bg: C.teal + "22", fg: C.teal, border: C.teal };
    if (tier === "ring2") return { label: t('Без опубликованной оценки', 'Without a published valuation'), bg: C.gold + "22", fg: C.gold, border: C.gold };
    return null;
  };

  const statusBadge = (status) => {
    if (status === "Pending") return { label: "PENDING", bg: C.clay + "22", fg: C.clay, border: C.clay };
    return null;
  };

  const listingLabel = (l) => l === "public" ? t('Публ.', 'Pub.') : l === "private" ? t('Частн.', 'Priv.') : (l || "—");

  const chip = (active, onClick, label, count) => (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 16, border: `1px solid ${active ? C.teal : C.line}`,
      background: active ? C.teal + "18" : "transparent", color: active ? C.teal : C.inkSoft,
      cursor: "pointer", fontSize: 12, fontFamily: "var(--sans)", fontWeight: active ? 600 : 400,
      transition: "all .15s",
    }}>{label}{count != null && <span style={{ marginLeft: 6, fontFamily: "var(--mono)", fontSize: 11, opacity: .7 }}>{count}</span>}</button>
  );

  const ring1Count = eh.groups.filter((g) => g.tier === "ring1" || g.tier === "ring1-aggregated").reduce((s, g) => s + g.rows.length, 0);
  const ring2Count = eh.groups.filter((g) => g.tier === "ring2").reduce((s, g) => s + g.rows.length, 0);

  return (
    <main style={{ padding: "40px 44px 80px", maxWidth: 1080, margin: "0 auto" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", padding: 0, cursor: "pointer",
        color: C.teal, fontSize: 13, fontFamily: "var(--sans)", marginBottom: 20,
        display: "inline-flex", alignItems: "center", gap: 6,
      }}>← {t('Назад к профилю', 'Back to the profile of')} {company.name}</button>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 500, lineHeight: 1.1, letterSpacing: "-.01em", margin: "0 0 10px", color: C.ink }}>
          {t('Все позиции', 'All positions')} — {company.name}
        </h1>
        <p style={{ fontSize: 13, color: C.inkSoft, margin: "0 0 16px", lineHeight: 1.55, maxWidth: 720 }}>
          {ring1Count + ring2Count} {t('названных холдингов на', 'named holdings as of')} {eh.asOf}.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ padding: "10px 16px", border: `1px solid ${C.teal}`, borderRadius: 8, background: C.teal + "10" }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.teal, marginBottom: 3 }}>{t('С опубликованной оценкой', 'With a published valuation')}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 500, color: C.ink }}>{ring1Count}</div>
          </div>
          <div style={{ padding: "10px 16px", border: `1px solid ${C.gold}`, borderRadius: 8, background: C.gold + "10" }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.gold, marginBottom: 3 }}>{t('Без опубликованной оценки', 'Without a published valuation')}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 500, color: C.ink }}>{ring2Count}</div>
          </div>
          <div style={{ padding: "10px 16px", border: `1px solid ${C.line}`, borderRadius: 8 }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 3 }}>{t('Покрытие NAV', 'NAV coverage')}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 500, color: C.ink }}>{eh.totals.navCovered}</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 10, padding: "12px 16px", background: C.card, border: `1px solid ${C.line}`, borderRadius: 10 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", rowGap: 10 }}>
          {/* Tier group */}
          {chip(filterTier === "all", () => setFilterTier("all"), t('Все', 'All'), ring1Count + ring2Count)}
          {chip(filterTier === "ring1", () => setFilterTier("ring1"), t('С оценкой', 'Valued'), ring1Count)}
          {chip(filterTier === "ring2", () => setFilterTier("ring2"), t('Без оценки', 'Unvalued'), ring2Count)}

          {/* Divider */}
          <span style={{ width: 1, height: 20, background: C.line, margin: "0 4px" }} />

          {/* Listing group */}
          {chip(filterListing === "public", () => setFilterListing(filterListing === "public" ? "all" : "public"), t('Публичные', 'Public'))}
          {chip(filterListing === "private", () => setFilterListing(filterListing === "private" ? "all" : "private"), t('Частные', 'Private'))}

          {/* Search pushed right */}
          <div style={{ marginLeft: "auto" }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Поиск по имени…', 'Search by name…')} style={{
              padding: "7px 12px", borderRadius: 16, border: `1px solid ${C.line}`,
              background: C.paper, color: C.ink, fontSize: 12, fontFamily: "var(--sans)",
              width: 200, outline: "none",
            }} />
          </div>
        </div>
      </div>

      {/* Counter + Vehicle dropdown sit OUTSIDE the card so the card stays compact */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, padding: "0 4px" }}>
        <div style={{ fontSize: 11.5, color: C.inkFaint }}>
          {t('Показано', 'Showing')} <span style={{ fontFamily: "var(--mono)", color: C.ink }}>{totalVisible}</span> {t('из', 'of')} <span style={{ fontFamily: "var(--mono)" }}>{ring1Count + ring2Count}</span>
          {filterVehicle !== "all" && <span> · {t('фильтр vehicle', 'vehicle filter')}: <span style={{ color: C.teal }}>{filterVehicle}</span></span>}
        </div>
        <div ref={vehicleRef} style={{ position: "relative" }}>
          <button onClick={() => setVehicleOpen(!vehicleOpen)} style={{
            background: "none", border: `1px solid ${filterVehicle !== "all" ? C.teal : C.line}`, padding: "5px 12px",
            borderRadius: 16, cursor: "pointer", fontSize: 11.5, fontFamily: "var(--sans)",
            color: filterVehicle !== "all" ? C.teal : C.inkSoft, display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ letterSpacing: ".06em", textTransform: "uppercase", fontSize: 10.5 }}>Vehicle</span>
            <span>{vehicleOpen ? "▴" : "▾"}</span>
          </button>
          {vehicleOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 40,
              minWidth: 240, maxWidth: 320, padding: 6, background: C.card,
              border: `1px solid ${C.line}`, borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,.25)",
            }}>
              {vehicleOptions.map((v) => {
                const active = filterVehicle === v;
                return (
                  <button key={v} onClick={() => { setFilterVehicle(v); setVehicleOpen(false); }} style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "7px 10px", borderRadius: 5, border: "none",
                    background: active ? C.teal + "18" : "transparent",
                    color: active ? C.teal : C.ink, fontSize: 12.5, fontFamily: "var(--sans)",
                    cursor: "pointer", fontWeight: active ? 600 : 400, marginBottom: 1,
                  }}>
                    {v === "all" ? t('Все vehicles', 'All vehicles') : v}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {visibleGroups.map((g, gIdx) => {
        if (g.hidden) return null;
        const tb = tierBadge(g.tier);
        const isAggregated = g.tier === "ring1-aggregated";

        return (
          <section key={gIdx} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C.line}` }}>
              {tb && <span style={{
                fontSize: 10, padding: "2px 8px", borderRadius: 10, border: `1px solid ${tb.border}`,
                background: tb.bg, color: tb.fg, fontWeight: 600, letterSpacing: ".08em",
              }}>{tb.label}</span>}
              <h3 style={{ fontFamily: "var(--sans)", fontSize: 14, fontWeight: 600, color: C.ink, margin: 0, letterSpacing: ".02em" }}>{g.label}</h3>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: C.inkFaint }}>{g.rows.length} {g.rows.length === 1 ? t('имя', 'name') : g.rows.length < 5 ? t('имени', 'names') : t('имён', 'names')}</span>
              {g.aggregatedValue && <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 12, color: C.teal }}>{g.aggregatedValue}</span>}
            </div>
            {g.subLabel && <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 10, fontStyle: "italic" }}>{g.subLabel}</div>}
            {g.aggregateNote && (
              <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 12, padding: "10px 12px", background: C.teal + "10", border: `1px solid ${C.teal}33`, borderRadius: 6, lineHeight: 1.55 }}>
                ⓘ {g.aggregateNote}
              </div>
            )}

            {isAggregated ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
                {g.rows.map((r, rIdx) => (
                  <div key={rIdx} style={{ background: C.card, padding: "10px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginBottom: 3 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: C.inkSoft }}>
                      <span style={{ fontFamily: "var(--mono)" }}>{r.vehicle}</span> · {r.sector}
                    </div>
                    {r.description && <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 4, lineHeight: 1.5 }}>{r.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: "hidden" }}>
                {g.rows.map((r, rIdx) => {
                  const key = `${gIdx}-${rIdx}`;
                  const isOpen = openRow === key;
                  const sb = statusBadge(r.status);
                  return (
                    <div key={rIdx} style={{ borderTop: rIdx ? `1px solid ${C.lineSoft}` : "none", background: isOpen ? C.cardAlt : C.card }}>
                      <div onClick={() => setOpenRow(isOpen ? null : key)} style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 110px 130px 70px 110px 24px",
                        gap: 12, alignItems: "center", padding: "11px 14px", cursor: "pointer",
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                          {r.ticker && <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: C.inkFaint, marginTop: 2 }}>{r.ticker}</div>}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: C.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.vehicle || "—"}</div>
                        <div style={{ fontSize: 12, color: C.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.sector || "—"}</div>
                        <div style={{ fontSize: 11.5, color: C.inkFaint }}>{listingLabel(r.listing)}</div>
                        <div style={{ textAlign: "right" }}>
                          {r.value && <span style={{ fontFamily: "var(--mono)", fontSize: 12.5, fontWeight: 500, color: C.ink }}>{r.value}</span>}
                          {sb && (
                            <span style={{
                              fontSize: 9.5, padding: "2px 7px", borderRadius: 8, border: `1px solid ${sb.border}`,
                              background: sb.bg, color: sb.fg, fontWeight: 600, letterSpacing: ".08em",
                            }}>{sb.label}</span>
                          )}
                          {!r.value && !sb && <span style={{ color: C.inkFaint, fontSize: 12 }}>—</span>}
                        </div>
                        <div style={{ fontSize: 11, color: C.inkFaint, textAlign: "right" }}>{isOpen ? "▾" : "▸"}</div>
                      </div>

                      {isOpen && (
                        <div style={{ padding: "0 14px 14px 14px", borderTop: `1px solid ${C.lineSoft}` }}>
                          <div style={{ marginTop: 12 }}>
                            {r.description && (
                              <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6, marginBottom: (r.qoq || r.holdings) ? 12 : 0 }}>{r.description}</div>
                            )}
                            {r.qoq && (
                              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6, background: r.qoqDir === "up" ? C.teal + "12" : C.clay + "12", border: `1px solid ${r.qoqDir === "up" ? C.teal + "44" : C.clay + "44"}`, marginBottom: r.holdings ? 12 : 0 }}>
                                <span style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.inkFaint }}>{t('Изм. за квартал', 'Change this quarter')}</span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, color: r.qoqDir === "up" ? C.teal : C.clay }}>{r.qoq}</span>
                              </div>
                            )}
                            {r.holdings && r.holdings.length > 0 && (
                              <div style={{ marginTop: 4, padding: "10px 14px", background: C.cardAlt, border: `1px solid ${C.line}`, borderRadius: 8 }}>
                                <div style={{ fontSize: 10.5, letterSpacing: ".1em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>{t('Известные компании внутри фонда', 'Known companies inside the fund')}</div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {r.holdings.map((h, hi) => (
                                    <span key={hi} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 14, border: `1px solid ${C.line}`, color: C.ink, background: C.card }}>{h}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}

      {totalVisible === 0 && (
        <div style={{ padding: "30px", textAlign: "center", color: C.inkSoft, fontSize: 13, border: `1px dashed ${C.line}`, borderRadius: 8 }}>
          {t('Нет позиций под текущие фильтры.', 'No positions match the current filters.')} <button onClick={() => { setFilterTier("all"); setFilterVehicle("all"); setFilterListing("all"); setSearch(""); }} style={{ background: "none", border: "none", color: C.teal, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" }}>Сбросить фильтры</button>
        </div>
      )}

      <footer style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.line}` }}>
        {eh.unnameable && (
          <div style={{ padding: "12px 14px", background: C.cardAlt, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12, color: C.inkSoft, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: C.ink }}>{t('Чего здесь нет', 'What is not here')}: </span>{eh.unnameable}
          </div>
        )}
      </footer>
    </main>
  );
}

export default function HoldingsTab() {
  const t = useT();
  const [mode, setMode] = useState("dark");
  const [view, setView] = useState("profile"); // "profile" | "compare"
  const [showHoldings, setShowHoldings] = useState(false); // Extended Holdings sub-view
  const [dim, setDim] = useState("scale");
  const [excluded, setExcluded] = useState([]);
  const [cid, setCid] = useState(HOLDING_COMPANIES[0].id);
  const [active, setActive] = useState("snapshot");
  const [openHolding, setOpenHolding] = useState(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const refs = useRef({});
  const C = THEMES[mode];
  const s = HOLDING_COMPANIES.find((c) => c.id === cid);
  const included = HOLDING_COMPANIES.filter((c) => !excluded.includes(c.id));
  const toggleExcluded = (id) => setExcluded((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: "-30% 0px -60% 0px" });
    SECTIONS.forEach((sec) => { const el = refs.current[sec.id]; if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [cid]);

  const go = (id) => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const switchCompany = (id) => { setCid(id); setOpenHolding(null); setActive("snapshot"); setSwitcherOpen(false); setShowHoldings(false); window.scrollTo({ top: 0 }); };

  const fmt = (v, unit) => (unit === "%" ? `${v}%` : `$${v}B`);
  const maxHold = Math.max(...s.snapshot.holdings.map((h) => h.value));
  const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" };
  const subLabel = { fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 10 };

  const SecondaryBlock = ({ children }) => <div>{children}</div>;

  return (
    <div style={{ background: C.paper, minHeight: "100vh", fontFamily: "var(--sans)", color: C.ink, transition: "background .25s" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Hanken+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        :root{ --serif:'Newsreader',Georgia,serif; --sans:'Hanken Grotesk',system-ui,sans-serif; --mono:'IBM Plex Mono',ui-monospace,monospace; }
        *{box-sizing:border-box;} body{margin:0;}
        @keyframes rise{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}} .rise{animation:rise .5s cubic-bezier(.2,.7,.2,1) both;}
        .navlink{transition:color .15s,border-color .15s;cursor:pointer;}
        select.co{appearance:none;-webkit-appearance:none;}`}</style>


      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "224px 1fr" }}>

        <aside style={{ position: "sticky", top: 0, height: "100vh", padding: "36px 22px 36px 30px", borderRight: `1px solid ${C.line}` }}>
          {/* mode toggle: Profile / Compare */}
          <div style={{ display: "flex", gap: 0, marginBottom: 24, background: C.track, borderRadius: 9, padding: 3 }}>
            {[["profile", t('Профиль', 'Profile')], ["compare", t('Сравнение', 'Comparison')]].map(([v, lab]) => {
              const on = view === v;
              return <button key={v} onClick={() => { setView(v); setShowHoldings(false); }} style={{ flex: 1, fontSize: 12.5, fontWeight: on ? 600 : 500, padding: "7px 0", borderRadius: 7, border: "none", background: on ? C.card : "transparent", color: on ? C.ink : C.inkSoft, cursor: "pointer", boxShadow: on ? "0 1px 4px rgba(0,0,0,.18)" : "none", transition: "all .15s" }}>{lab}</button>;
            })}
          </div>

          {view === "profile" && <>
          <div style={{ fontSize: 10.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.inkFaint, marginBottom: 8 }}>{t('Холдинг', 'Holding')}</div>
          <div style={{ position: "relative", marginBottom: 18, zIndex: 50 }}>
            {/* current selection — click to open */}
            <button onClick={() => setSwitcherOpen(!switcherOpen)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${switcherOpen ? C.teal : C.line}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "border-color .15s" }}>
              <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 7, background: META[cid].color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sans)", fontSize: META[cid].mono.length > 2 ? 10 : 12, fontWeight: 600, color: "#fff", letterSpacing: ".02em" }}>{META[cid].mono}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "var(--serif)", fontSize: 16, fontWeight: 500, color: C.ink, lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: 10, color: C.inkSoft }}>{s.ticker}</span>
              </span>
              <span style={{ flexShrink: 0, color: C.inkSoft, fontSize: 10, transform: switcherOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
            </button>

            {/* grouped popover */}
            {switcherOpen && (
              <>
                <div onClick={() => setSwitcherOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50, background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,.35)", padding: "6px", maxHeight: "70vh", overflowY: "auto" }}>
                  {GROUPS.map((g) => {
                    const members = HOLDING_COMPANIES.filter((c) => META[c.id].group === g.id);
                    if (!members.length) return null;
                    return (
                      <div key={g.id} style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: C.inkFaint, padding: "8px 10px 5px" }}>{g.label}</div>
                        {members.map((c) => {
                          const on = c.id === cid;
                          return (
                            <button key={c.id} onClick={() => switchCompany(c.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, background: on ? C.cardAlt : "transparent", border: "none", borderRadius: 7, padding: "8px 10px", cursor: "pointer", textAlign: "left" }}
                              onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = C.cardAlt; }} onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                              <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 6, background: META[c.id].color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: META[c.id].mono.length > 2 ? 9 : 11, fontWeight: 600, color: "#fff" }}>{META[c.id].mono}</span>
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: "block", fontSize: 13.5, fontWeight: on ? 600 : 500, color: C.ink, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                                <span style={{ display: "block", fontSize: 10.5, color: C.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.type}</span>
                              </span>
                              {on && <span style={{ flexShrink: 0, color: C.teal, fontSize: 12 }}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 26, lineHeight: 1.4 }}>{s.type}</div>

          <nav>{SECTIONS.map((sec) => {
            const on = active === sec.id;
            return (<div key={sec.id} className="navlink" onClick={() => go(sec.id)} style={{ padding: "9px 0 9px 14px", borderLeft: `2px solid ${on ? C.teal : C.line}`, marginBottom: 2 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: on ? C.teal : C.inkFaint }}>{sec.n}</span>
                <span style={{ fontSize: 14, fontWeight: on ? 600 : 400, color: on ? C.ink : C.inkSoft }}>{sec.title}</span>
              </div></div>);
          })}</nav>
          </>}

          {view === "compare" && (
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: ".16em", textTransform: "uppercase", color: C.inkFaint, marginBottom: 10 }}>{t('Сравнение', 'Comparison')}</div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500, color: C.ink, lineHeight: 1.3, marginBottom: 12 }}>{t('Все холдинги, по одному измерению за раз', 'All holdings, one dimension at a time')}</div>
              <div style={{ fontSize: 12, color: C.inkSoft, lineHeight: 1.6 }}>{t('Выберите измерение над графиком. Включайте и исключайте холдинги с помощью чипов. Холдинги, к которым показатель неприменим, исчезают автоматически.', 'Pick a dimension above the chart. Toggle holdings in and out with the chips. Holdings the metric does not apply to drop out automatically.')}</div>
            </div>
          )}
        </aside>

        {view === "compare" ? (
          <main style={{ padding: "40px 44px 80px" }}>
            <header className="rise" style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 14 }}>{t('Сравнение холдингов', 'Holdings comparison')}</div>
              <h1 style={{ fontFamily: "var(--serif)", fontSize: 40, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-.02em", margin: "0 0 10px" }}>{t(`Как ${included.length} холдингов смотрятся друг против друга`, `How ${included.length} holdings stack up against each other`)}</h1>
            </header>
            <div className="rise"><CompareView C={C} META={META} dim={dim} setDim={setDim} excluded={excluded} toggle={toggleExcluded} included={included} /></div>
          </main>
        ) : showHoldings && s.extendedHoldings ? (
          <div className="rise" key={`eh-${cid}`}><ExtendedHoldings C={C} company={s} onBack={() => { setShowHoldings(false); window.scrollTo({ top: 0 }); }} /></div>
        ) : (
        <main style={{ padding: "40px 44px 80px" }}>
          <header key={cid} className="rise" style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, letterSpacing: ".08em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 14 }}><span>{s.type}</span><span style={{ color: C.inkFaint }}>·</span><span>{s.asOf}</span></div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 44, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-.02em", margin: "0 0 14px" }}>{s.name}</h1>
            <p style={{ fontFamily: "var(--serif)", fontSize: 18, lineHeight: 1.55, color: C.inkSoft, maxWidth: 600, margin: "0 0 26px" }}>{s.tagline}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: C.line, border: `1px solid ${C.line}`, borderRadius: 10 }}>
              {s.kpis.map((k, i) => {
                const r = 9;
                const corner = i === 0 ? { borderRadius: `${r}px 0 0 ${r}px` } : i === s.kpis.length - 1 ? { borderRadius: `0 ${r}px ${r}px 0` } : {};
                return (<div key={i} style={{ background: C.card, padding: "14px 16px", position: "relative", ...corner }}>
                <div style={{ fontSize: 11.5, letterSpacing: ".06em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 6 }}><Source C={C} text={k.source} tip={k.tip} placement="bottom">{k.label}</Source></div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 500, lineHeight: 1, color: C.ink }}>{k.value}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: C.inkFaint, marginTop: 4 }}>{k.sub}</div>
              </div>);
              })}
            </div>
          </header>

          {/* 01 SNAPSHOT */}
          <section id="snapshot" ref={(e) => (refs.current.snapshot = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead C={C} n="01" title={t('Текущий портфель', 'Current portfolio')} sub={SUBS.snapshot} action={
              s.extendedHoldings ? (
                <button onClick={() => { setShowHoldings(true); window.scrollTo({ top: 0 }); }} style={{
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  color: C.teal, fontSize: 13, fontFamily: "var(--sans)", fontWeight: 500,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                  {t('Все позиции', 'All positions')}
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: C.inkFaint, fontWeight: 400 }}>({s.extendedHoldings.totals.ring1 + s.extendedHoldings.totals.ring2})</span>
                  <span>→</span>
                </button>
              ) : null
            } />
            <div style={subLabel}>{s.snapshot.holdingsLabel}</div>
            <div style={{ marginBottom: 26 }}>
              {s.snapshot.holdings.map((h, i) => {
                const ex = !!h.breakdown, isOpen = openHolding === i;
                return (<div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 7, cursor: ex ? "pointer" : "default" }} onClick={ex ? () => setOpenHolding(isOpen ? null : i) : undefined}>
                    <div style={{ width: 160, flexShrink: 0 }}>
                      {ex
                        ? (h.tip
                            ? <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{isOpen ? "▾" : "▸"} <Source C={C} text={h.source} tip={h.tip}>{h.name}</Source></span>
                            : <span style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{isOpen ? "▾" : "▸"} {h.name}</span>)
                        : <span style={{ fontSize: 13, color: C.ink }}><Source C={C} text={h.source} tip={h.tip}>{h.name}</Source></span>}
                      {h.note && <span style={{ fontSize: 11, color: ex ? C.teal : C.inkFaint, marginLeft: 6 }}>{h.note}</span>}
                    </div>
                    <div style={{ flex: 1, height: 16, background: C.track, borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${(h.value / maxHold) * 100}%`, height: "100%", background: C.violet }} /></div>
                    <div style={{ width: 48, textAlign: "right", fontFamily: "var(--mono)", fontSize: 12, color: C.ink }}>{fmt(h.value, s.snapshot.unit)}</div>
                  </div>
                  {ex && isOpen && (<div style={{ margin: "0 58px 12px 18px", padding: "10px 14px", background: C.cardAlt, border: `1px solid ${C.line}`, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: C.inkSoft, marginBottom: 8 }}>{t('Что внутри', 'What is inside')}</div>
                    {h.breakdown.map((b, j) => (b[0] === "— note —"
                      ? (<div key={j} style={{ fontSize: 11, fontStyle: "italic", color: C.inkFaint, paddingTop: 8, marginTop: 4, borderTop: `1px solid ${C.lineSoft}`, lineHeight: 1.5 }}>{b[1]}</div>)
                      : (<div key={j} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0", borderTop: j ? `1px solid ${C.lineSoft}` : "none" }}><span style={{ fontSize: 13, color: C.ink }}>{b[0]}</span><span style={{ fontFamily: "var(--mono)", fontSize: 12, color: C.inkSoft }}>{b[1]}</span></div>)))}
                  </div>)}
                </div>);
              })}
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 8 }}>
                {s.snapshot.concentration ? <>{t('Концентрация — топ-2', 'Concentration — top 2')} <b style={{ fontFamily: "var(--mono)", color: C.ink }}>{s.snapshot.concentration.top2}</b>, топ-5 <b style={{ fontFamily: "var(--mono)", color: C.ink }}>{s.snapshot.concentration.top5}</b>.</> : s.snapshot.concentrationNote}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 26 }}>
              {s.snapshot.geo && (<SecondaryBlock><div style={subLabel}>{s.snapshot.geo.label}</div>
                {s.snapshot.geo.items.map((g, i) => {
                  const gmax = Math.max(...s.snapshot.geo.items.flatMap((x) => [x.from ?? 0, x.to ?? 0, x.value ?? 0]));
                  return (<div key={i} style={{ marginBottom: 9 }}><div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 3 }}>{g.region}</div>
                    {g.to !== undefined ? (<div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: `${(g.from / gmax) * 64}px`, height: 9, background: C.inkFaint, borderRadius: 2 }} /><span style={{ color: C.inkFaint, fontSize: 11 }}>→</span>
                      <div style={{ width: `${(g.to / gmax) * 64}px`, height: 9, background: C.blue, borderRadius: 2 }} /><span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: C.ink }}>{g.from}→{g.to}%</span></div>
                    ) : (<div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, height: 9, background: C.track, borderRadius: 2, overflow: "hidden" }}><div style={{ width: `${(g.value / gmax) * 100}%`, height: "100%", background: C.blue }} /></div><span style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: C.ink, width: 34, textAlign: "right" }}>{g.value}%</span></div>)}
                  </div>);
                })}
                <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 6, fontStyle: "italic" }}>{s.snapshot.geo.note}</div></SecondaryBlock>)}

              {s.snapshot.listed && (<SecondaryBlock><div style={subLabel}>{t('Публичные и непубличные активы', 'Public and private assets')}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 96 }}>{s.snapshot.listed.items.map((l, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "100%", height: 78, background: C.unlisted, borderRadius: "3px 3px 0 0", display: "flex", flexDirection: "column-reverse", overflow: "hidden", border: `1px solid ${C.line}` }}>
                      <div style={{ height: `${l.pct}%`, background: C.blue, display: "flex", justifyContent: "center", paddingTop: 3 }}><span style={{ fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 500, color: "#fff" }}>{l.pct}%</span></div></div>
                    <span style={{ fontSize: 10.5, color: C.inkFaint, marginTop: 4 }}>{l.period}</span></div>))}</div>
                <div style={{ display: "flex", gap: 14, fontSize: 11, color: C.inkSoft, marginTop: 8 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.blue }} />{' '}{t('публичные', 'public')}</span><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: C.unlisted, border: `1px solid ${C.line}` }} />{' '}{t('непубличные', 'private')}</span></div>
                <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 6, fontStyle: "italic", lineHeight: 1.5 }}>{s.snapshot.listed.note}</div></SecondaryBlock>)}

              {s.snapshot.mix && (<SecondaryBlock><div style={subLabel}>{s.snapshot.mix.label}</div>
                {s.snapshot.mix.items.map((m, i) => { const mmax = Math.max(...s.snapshot.mix.items.map((x) => x.value));
                  return (<Bar key={i} C={C} label={m.name} pct={(m.value / mmax) * 100} color={C.teal} display={fmt(m.value, s.snapshot.mix.unit)} />); })}
                <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 6, fontStyle: "italic" }}>{s.snapshot.mix.note}</div></SecondaryBlock>)}
            </div>

            {s.snapshot.themes && (<><div style={subLabel}>Theme exposure</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{s.snapshot.themes.map((t, i) => <span key={i} style={{ fontSize: 12.5, padding: "5px 12px", borderRadius: 20, border: `1px solid ${C.line}`, color: C.inkSoft }}>{t}</span>)}</div></>)}
            {s.snapshot.details && <Drawer C={C} rows={s.snapshot.details} />}
          </section>

          {/* 02 CHANGES */}
          <section id="changes" ref={(e) => (refs.current.changes = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead C={C} n="02" title={t('Недавние изменения', 'Recent changes')} sub={SUBS.changes} />
            {s.changes.bigStat && (<div style={{ ...card, marginBottom: 22 }}><div style={subLabel}>{s.changes.bigStat.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}><span style={{ fontFamily: "var(--mono)", fontSize: 24, color: C.inkFaint }}>{s.changes.bigStat.from}</span><span style={{ color: C.inkFaint }}>→</span><span style={{ fontFamily: "var(--mono)", fontSize: 40, fontWeight: 500, color: C.teal, lineHeight: 1 }}>{s.changes.bigStat.to}</span><span style={{ fontSize: 13, color: C.inkSoft, fontStyle: "italic" }}>{s.changes.bigStat.period}</span></div></div>)}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={card}><div style={{ fontSize: 12, fontWeight: 600, color: C.teal, marginBottom: 12 }}>{s.changes.into.title}</div>
                {s.changes.into.items.map((d, i) => { const m = Math.max(...s.changes.into.items.map((x) => x.value)); return <Bar key={i} C={C} label={d.name} pct={(d.value / m) * 100} color={C.teal} display={fmt(d.value, s.changes.into.unit)} />; })}
                {s.changes.into.note && <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 6, fontStyle: "italic" }}>{s.changes.into.note}</div>}</div>
              <div style={card}><div style={{ fontSize: 12, fontWeight: 600, color: C.clay, marginBottom: 12 }}>{s.changes.out.title}</div>
                {s.changes.out.items.map((d, i) => { const m = Math.max(...s.changes.out.items.map((x) => x.value)); return <Bar key={i} C={C} label={d.name} pct={(d.value / m) * 100} color={C.clay} display={fmt(d.value, s.changes.out.unit)} />; })}
                {s.changes.out.note && <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 6, fontStyle: "italic" }}>{s.changes.out.note}</div>}</div>
            </div>

            {s.changes.dryPowder && (<div style={card}><div style={subLabel}>Dry powder</div>
              <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>{s.changes.dryPowder.items.map((d, i) => <div key={i}><span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 500, color: C.ink }}>{d[0]}</span> <span style={{ fontSize: 12.5, color: C.inkSoft }}>{d[1]}</span></div>)}</div>
              <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 10 }}>{s.changes.dryPowder.earmark}</div></div>)}
            {s.changes.details && <Drawer C={C} rows={s.changes.details} />}
          </section>

          {/* 03 STRATEGY */}
          <section id="strategy" ref={(e) => (refs.current.strategy = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead C={C} n="03" title={t('Заявленная стратегия', 'Stated strategy')} sub={SUBS.strategy} />
            <p style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.55, color: C.inkSoft, margin: "0 0 18px", maxWidth: 620 }}>{s.strategy.edge}</p>
            <div style={{ marginBottom: 20 }}>{s.strategy.stack.map((row, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 16px", background: i % 2 ? C.cardAlt : C.card, border: `1px solid ${C.line}`, borderRadius: 8, marginBottom: 4 }}><div style={{ width: 170, fontSize: 13, fontWeight: 600, color: C.teal }}>{row.layer}</div><div style={{ flex: 1, fontSize: 13.5, color: C.ink }}>{row.items}</div></div>))}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{s.strategy.rules.map((r, i) => <span key={i} style={{ fontSize: 12.5, padding: "7px 13px", borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink }}>{r}</span>)}</div>
            {s.strategy.details && <Drawer C={C} rows={s.strategy.details} />}
          </section>

          {/* 04 PIPELINE */}
          <section id="pipeline" ref={(e) => (refs.current.pipeline = e)} style={{ marginBottom: 54, scrollMarginTop: 24 }}>
            <SectionHead C={C} n="04" title={t('Будущие сделки', 'Future deals')} sub={SUBS.pipeline} />
            <div style={subLabel}>{t('Календарь сделок', 'Deal calendar')}</div>
            <div style={{ position: "relative", marginBottom: 24, paddingLeft: 4 }}>{s.pipeline.timeline.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ width: 64, textAlign: "right", fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 500, color: C.inkSoft, paddingTop: 1 }}>{t.when}</div>
                <div style={{ position: "relative", paddingTop: 2 }}><div style={{ width: 12, height: 12, borderRadius: "50%", background: t.done ? C.blue : C.paper, border: `2px solid ${C.blue}` }} />{i < s.pipeline.timeline.length - 1 && <div style={{ position: "absolute", left: 5, top: 14, width: 2, height: 24, background: C.line }} />}</div>
                <div style={{ fontSize: 13.5, color: C.ink }}>{t.label}{t.done && <span style={{ color: C.blue, marginLeft: 6 }}>✓</span>}</div></div>))}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{s.pipeline.targets.map((t, i) => (<div key={i} style={{ ...card, flex: 1, minWidth: 150, padding: "12px 16px" }}><div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 5 }}>{t.label}</div><div style={{ fontFamily: "var(--mono)", fontSize: 19, fontWeight: 500, color: C.ink }}>{t.value}</div></div>))}</div>
            {s.pipeline.details && <Drawer C={C} rows={s.pipeline.details} />}
          </section>

          {/* 05 WORLDVIEW */}
          <section id="worldview" ref={(e) => (refs.current.worldview = e)} style={{ marginBottom: 40, scrollMarginTop: 24 }}>
            <SectionHead C={C} n="05" title={t('Взгляд на рынок', 'Market view')} sub={SUBS.worldview} />
            {s.worldview.thesis && (<><div style={subLabel}>{s.worldview.thesisLabel}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>{s.worldview.thesis.map((t, i) => (<div key={i} style={{ flex: 1, minWidth: 150, ...card, padding: "13px 15px" }}><div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 500, color: C.blue }}>{t.when}</div><div style={{ fontSize: 13, color: C.inkSoft, marginTop: 4 }}>{t.what}</div></div>))}</div></>)}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={card}><div style={{ fontSize: 12, fontWeight: 600, color: C.teal, marginBottom: 8 }}>{t('В фокусе', 'In focus')}</div><div style={{ fontSize: 13.5, lineHeight: 1.7, color: C.ink }}>{s.worldview.leaningInto}</div></div>
              <div style={card}><div style={{ fontSize: 12, fontWeight: 600, color: C.clay, marginBottom: 8 }}>{t('Избегает / выходит', 'Avoiding / exiting')}</div><div style={{ fontSize: 13.5, lineHeight: 1.7, color: C.ink }}>{s.worldview.avoiding}</div></div>
            </div>
            <div style={{ ...card, marginBottom: 18 }}><div style={{ fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 8 }}>{t('⚑ Под наблюдением', '⚑ On watch')}</div><div style={{ fontSize: 13.5, lineHeight: 1.7, color: C.ink }}>{s.worldview.watching}</div></div>
            {s.worldview.quote && (<blockquote style={{ borderLeft: `3px solid ${C.teal}`, margin: 0, padding: "6px 0 6px 18px" }}><div style={{ fontFamily: "var(--serif)", fontSize: 20, fontStyle: "italic", lineHeight: 1.45, color: C.ink }}>“{s.worldview.quote.text}”</div><div style={{ fontSize: 12, color: C.inkFaint, marginTop: 6 }}>— {s.worldview.quote.who}</div></blockquote>)}
            {s.worldview.details && <Drawer C={C} rows={s.worldview.details} />}
          </section>
        </main>
        )}
      </div>
    </div>
  );
}
