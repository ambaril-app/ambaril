"use client";

import { useEffect, useState } from "react";
import { useInView } from "@/hooks/use-in-view";

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

const schedule = [
  { showAt: 0 },
  { typingAt: 500, showAt: 1400 },
  { showAt: 2100 },
  { typingAt: 2600, showAt: 3500 },
];

export function AiMockup() {
  const { ref, inView } = useInView({ threshold: 0.3 });
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!inView) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleCount(messages.length);
      return;
    }

    const timeouts: number[] = [];

    for (let i = 0; i < schedule.length; i++) {
      const s = schedule[i];
      if (s && "typingAt" in s && typeof s.typingAt === "number") {
        timeouts.push(window.setTimeout(() => setTyping(true), s.typingAt));
      }
      if (s) {
        timeouts.push(
          window.setTimeout(() => {
            setTyping(false);
            setVisibleCount(i + 1);
          }, s.showAt),
        );
      }
    }

    return () => timeouts.forEach(clearTimeout);
  }, [inView]);

  return (
    <div
      ref={ref}
      style={{
        background: "#0C0E13",
        padding: "16px",
        fontFamily: "var(--font-mono)",
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transform: inView
          ? "rotateX(2deg) rotateY(4deg) translateZ(0)"
          : "rotateX(8deg) rotateY(12deg) translateZ(0)",
        transition: "transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
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
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at 44% 42%, oklch(88% 0.028 212 / 0.8) 0%, transparent 70%)",
            filter: "blur(2px)",
          }}
        />
        <div>
          <p style={{ fontSize: "11px", color: "#D0D4DE" }}>ClawdBot</p>
          <p style={{ fontSize: "9px", color: "#5C6170" }}>
            Telegram · @ambaril_bot
          </p>
        </div>
        <span
          className="live-dot"
          style={{ marginLeft: "auto", fontSize: "9px", color: "#3ECF8E" }}
        >
          ● online
        </span>
      </div>

      {/* Messages — appear sequentially */}
      {messages.slice(0, visibleCount).map((m, i) => (
        <div
          key={i}
          className="chat-msg-enter"
          style={{
            display: "flex",
            justifyContent: m.from === "user" ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              maxWidth: "82%",
              padding: "8px 12px",
              borderRadius:
                m.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
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

      {/* Typing indicator */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          opacity: typing ? 1 : 0,
          transform: typing ? "translateY(0)" : "translateY(4px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
          height: typing ? "auto" : 0,
          overflow: "hidden",
        }}
      >
        <div
          className="typing-indicator"
          style={{
            padding: "10px 16px",
            borderRadius: "12px 12px 12px 2px",
            background: "#16181F",
          }}
        >
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
