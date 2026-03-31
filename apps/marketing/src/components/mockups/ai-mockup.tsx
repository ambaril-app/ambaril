const messages = [
  {
    from: "user",
    text: "Qual foi o GMV de ontem comparado com a semana passada?",
  },
  {
    from: "bot",
    text: "Ontem: R$ 34.820 (+12,4% vs semana passada)\nMelhor canal: Instagram Ads (R$ 18.340)\nPior produto: Calça Cargo Verde (3 un vendidas)",
  },
  {
    from: "user",
    text: "Quais SKUs têm estoque crítico?",
  },
  {
    from: "bot",
    text: "7 SKUs em alerta:\n→ Camiseta Preta P — 3 un\n→ Moletom Off-White M — 5 un\n→ Cap Khaki — 2 un",
  },
];

export function AiMockup() {
  return (
    <div
      style={{
        background: "#0C0E13",
        padding: "16px",
        fontFamily: "var(--font-mono)",
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingBottom: "12px",
          borderBottom: "1px solid #1E2129",
          marginBottom: "4px",
        }}
      >
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "radial-gradient(ellipse at 44% 42%, oklch(88% 0.028 212 / 0.8) 0%, transparent 70%)", filter: "blur(2px)" }} />
        <div>
          <p style={{ fontSize: "11px", color: "#D0D4DE" }}>ClawdBot</p>
          <p style={{ fontSize: "9px", color: "#5C6170" }}>Telegram · @ambaril_bot</p>
        </div>
        <span style={{ marginLeft: "auto", fontSize: "9px", color: "#3ECF8E" }}>● online</span>
      </div>

      {/* Messages */}
      {messages.map((m, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: m.from === "user" ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              maxWidth: "82%",
              padding: "8px 12px",
              borderRadius: m.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: m.from === "user" ? "#262A34" : "#16181F",
              fontSize: "10px",
              lineHeight: 1.6,
              color: m.from === "user" ? "#A8AEBB" : "#D0D4DE",
              whiteSpace: "pre-line",
            }}
          >
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}
