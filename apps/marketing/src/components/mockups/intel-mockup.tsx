const ads = [
  { brand: "Brand A", spend: "R$\u00a012k", format: "Carrossel", score: 84 },
  { brand: "Brand B", spend: "R$\u00a07k", format: "Reels", score: 91 },
  { brand: "Brand C", spend: "R$\u00a04k", format: "Stories", score: 67 },
  { brand: "Brand D", spend: "R$\u00a019k", format: "Carrossel", score: 78 },
];

const creators = [
  { handle: "@style.lucas", reach: "48k", ugc: "12 posts", score: 94 },
  { handle: "@moda.ana", reach: "22k", ugc: "8 posts", score: 88 },
];

export function IntelMockup() {
  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "20px",
        fontFamily: "var(--font-mono)",
        minHeight: "280px",
        border: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      {/* Competitor ads */}
      <p style={{ fontSize: "9px", color: "#94A3B8", letterSpacing: "0.08em", marginBottom: "10px" }}>
        META AD LIBRARY · CONCORRENTES
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "16px" }}>
        {ads.map((a) => (
          <div
            key={a.brand}
            style={{
              padding: "10px",
              borderRadius: "8px",
              background: "#F9FAFB",
              border: "1px solid rgba(15,23,42,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", color: "#334155" }}>{a.brand}</span>
              <span
                style={{
                  fontSize: "9px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: a.score >= 85 ? "rgba(22,163,74,0.08)" : "rgba(15,23,42,0.04)",
                  color: a.score >= 85 ? "#16A34A" : "#94A3B8",
                }}
              >
                {a.score}
              </span>
            </div>
            <span style={{ fontSize: "9px", color: "#94A3B8" }}>{a.format} · {a.spend}/sem</span>
          </div>
        ))}
      </div>

      {/* Creator watch */}
      <p style={{ fontSize: "9px", color: "#94A3B8", letterSpacing: "0.08em", marginBottom: "8px" }}>
        UGC MONITOR · DETECTADOS
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {creators.map((c) => (
          <div
            key={c.handle}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px",
              borderRadius: "6px",
              background: "#F9FAFB",
              border: "1px solid rgba(15,23,42,0.06)",
            }}
          >
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #E8EAF0, #CBD5E1)", flexShrink: 0 }} />
            <span style={{ fontSize: "10px", color: "#334155", flex: 1 }}>{c.handle}</span>
            <span style={{ fontSize: "9px", color: "#94A3B8" }}>{c.reach}</span>
            <span
              style={{
                fontSize: "9px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(22,163,74,0.08)",
                color: "#16A34A",
              }}
            >
              {c.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
