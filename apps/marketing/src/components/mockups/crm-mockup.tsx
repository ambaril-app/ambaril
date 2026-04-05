"use client";

import { useInView } from "@/hooks/use-in-view";
import { useCountUp } from "@/hooks/use-count-up";

function formatBR(n: number, decimals: number): string {
  const fixed = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  const parts = fixed.split(".");
  // eslint-disable-next-line security/detect-unsafe-regex
  const withDots = (parts[0] ?? "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts[1] ? `${withDots},${parts[1]}` : withDots;
}

function AnimatedValue({
  value,
  format,
  enabled,
  delay,
  duration,
}: {
  value: number;
  format: (n: number) => string;
  enabled: boolean;
  delay?: number;
  duration?: number;
}) {
  const current = useCountUp({
    end: value,
    duration: duration ?? 800,
    delay: delay ?? 0,
    enabled,
  });
  return <>{format(current)}</>;
}

const timelineData = [
  { date: "23 Mar", label: "Compra · Camiseta Preta P", value: 189 },
  { date: "14 Jan", label: "Compra · Drop Inverno Vol.3", value: 420 },
  { date: "08 Nov", label: "Compra · Cap Ambaril Khaki", value: 98 },
];

export function CrmMockup() {
  const { ref, inView } = useInView({ threshold: 0.3 });

  return (
    <div
      ref={ref}
      style={{
        background: "#FFFFFF",
        padding: "20px",
        fontFamily: "var(--font-mono)",
        minHeight: "260px",
        border: "1px solid rgba(15,23,42,0.06)",
        transform: inView
          ? "rotateX(2deg) rotateY(4deg) translateZ(0)"
          : "rotateX(8deg) rotateY(12deg) translateZ(0)",
        transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: "0 15px 40px rgba(15,23,42,0.08)",
      }}
    >
      {/* Customer header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
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
          <p
            style={{
              fontSize: "13px",
              color: "#0F172A",
              fontWeight: 500,
              fontFamily: "var(--font)",
            }}
          >
            Lucas Ferreira
          </p>
          <p style={{ fontSize: "10px", color: "#94A3B8" }}>
            lucas@example.com
          </p>
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
          <span
            style={{
              fontSize: "10px",
              color: "#16A34A",
              letterSpacing: "0.06em",
            }}
          >
            RFM · Champion
          </span>
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
          {
            label: "LTV",
            value: 1824,
            format: (n: number) => `R$\u00a0${formatBR(n, 0)}`,
          },
          {
            label: "Pedidos",
            value: 11,
            format: (n: number) => `${Math.round(n)}`,
          },
          {
            label: "Recência",
            value: 7,
            format: (n: number) => `${Math.round(n)} dias`,
          },
        ].map((s, i) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p
              style={{
                fontSize: "14px",
                color: "#0F172A",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <AnimatedValue
                value={s.value}
                format={s.format}
                enabled={inView}
                delay={i * 80}
              />
            </p>
            <p style={{ fontSize: "9px", color: "#94A3B8", marginTop: "2px" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <p
        style={{
          fontSize: "9px",
          color: "#94A3B8",
          letterSpacing: "0.08em",
          marginBottom: "8px",
        }}
      >
        HISTÓRICO
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {timelineData.map((t, i) => (
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
            <span
              style={{ fontSize: "9px", color: "#94A3B8", minWidth: "38px" }}
            >
              {t.date}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#475569",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </span>
            <span
              style={{
                fontSize: "10px",
                color: "#334155",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <AnimatedValue
                value={t.value}
                format={(n: number) => `R$\u00a0${formatBR(n, 0)}`}
                enabled={inView}
                delay={300 + i * 100}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
