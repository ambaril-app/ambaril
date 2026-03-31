const timeline = [
  { date: "23 Mar", label: "Compra · Camiseta Preta P", value: "R$\u00a0189" },
  { date: "14 Jan", label: "Compra · Drop Inverno Vol.3", value: "R$\u00a0420" },
  { date: "08 Nov", label: "Compra · Cap Ambaril Khaki", value: "R$\u00a098" },
];

export function CrmMockup() {
  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "20px",
        fontFamily: "var(--font-mono)",
        minHeight: "260px",
        border: "1px solid rgba(15,23,42,0.06)",
      }}
    >
      {/* Customer header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #E8EAF0, #CBD5E1)",
            flexShrink: 0,
          }}
        />
        <div>
          <p style={{ fontSize: "13px", color: "#0F172A", fontWeight: 500, fontFamily: "var(--font)" }}>
            Lucas Ferreira
          </p>
          <p style={{ fontSize: "10px", color: "#94A3B8" }}>lucas@example.com</p>
        </div>
        {/* RFM badge */}
        <div
          style={{
            marginLeft: "auto",
            padding: "4px 8px",
            borderRadius: "6px",
            background: "rgba(22,163,74,0.08)",
            border: "1px solid rgba(22,163,74,0.2)",
          }}
        >
          <span style={{ fontSize: "10px", color: "#16A34A", letterSpacing: "0.06em" }}>RFM · Champion</span>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "16px",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        {[
          { label: "LTV", value: "R$\u00a01.824" },
          { label: "Pedidos", value: "11" },
          { label: "Recência", value: "7 dias" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "#0F172A", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
            <p style={{ fontSize: "9px", color: "#94A3B8", marginTop: "2px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <p style={{ fontSize: "9px", color: "#94A3B8", letterSpacing: "0.08em", marginBottom: "8px" }}>
        HISTÓRICO
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {timeline.map((t) => (
          <div
            key={t.date}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 8px",
              borderRadius: "6px",
              background: "#F9FAFB",
            }}
          >
            <span style={{ fontSize: "9px", color: "#94A3B8", minWidth: "38px" }}>{t.date}</span>
            <span style={{ fontSize: "10px", color: "#475569", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.label}
            </span>
            <span style={{ fontSize: "10px", color: "#334155", fontVariantNumeric: "tabular-nums" }}>
              {t.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
