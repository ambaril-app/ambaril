const metrics = [
  { label: "GMV hoje", value: "R$\u00a034.820", delta: "+12,4%", up: true },
  { label: "Pedidos", value: "218", delta: "+8,1%", up: true },
  { label: "Ticket médio", value: "R$\u00a0159,70", delta: "-1,2%", up: false },
  { label: "Taxa de conv.", value: "3,84%", delta: "+0,3pp", up: true },
  { label: "CAC Canal", value: "R$\u00a028,40", delta: "-4,7%", up: true },
  { label: "Estoque alerta", value: "7 SKUs", delta: "", up: false },
];

export function WarRoomMockup() {
  return (
    <div
      style={{
        background: "#0C0E13",
        padding: "20px",
        fontFamily: "var(--font-mono)",
        minHeight: "260px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #1E2129",
        }}
      >
        <span style={{ fontSize: "10px", color: "#5C6170", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          War Room · Hoje
        </span>
        <span style={{ fontSize: "10px", color: "#3ECF8E" }}>● Live</span>
      </div>

      {/* Metric grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
        }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "#101216",
              borderRadius: "8px",
              padding: "12px",
              border: "1px solid #1E2129",
            }}
          >
            <p style={{ fontSize: "9px", color: "#5C6170", marginBottom: "6px", letterSpacing: "0.06em" }}>
              {m.label}
            </p>
            <p
              style={{
                fontSize: "16px",
                color: "#E8EAF0",
                fontVariantNumeric: "tabular-nums",
                marginBottom: "4px",
              }}
            >
              {m.value}
            </p>
            {m.delta && (
              <p
                style={{
                  fontSize: "9px",
                  color: m.up ? "#3ECF8E" : "#EF4444",
                }}
              >
                {m.delta}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Alert bar */}
      <div
        style={{
          marginTop: "12px",
          padding: "8px 12px",
          background: "rgba(245,165,36,0.06)",
          borderRadius: "6px",
          border: "1px solid rgba(245,165,36,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "10px", color: "#F5A524" }}>Flare</span>
        <span style={{ fontSize: "10px", color: "#7C8293" }}>Camiseta Preta P — estoque crítico (3 un)</span>
      </div>
    </div>
  );
}
