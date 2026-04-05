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
  decimals,
  format,
  enabled,
  delay,
  duration,
}: {
  value: number;
  decimals: number;
  format: (formatted: string) => string;
  enabled: boolean;
  delay?: number;
  duration?: number;
}) {
  const current = useCountUp({
    end: value,
    duration: duration ?? 1200,
    delay: delay ?? 0,
    enabled,
  });
  return <>{format(formatBR(current, decimals))}</>;
}

const metrics = [
  {
    label: "GMV hoje",
    value: 34820,
    decimals: 0,
    format: (v: string) => `R$\u00a0${v}`,
    delta: 12.4,
    dd: 1,
    df: (v: string) => `+${v}%`,
    up: true,
  },
  {
    label: "Pedidos",
    value: 218,
    decimals: 0,
    format: (v: string) => v,
    delta: 8.1,
    dd: 1,
    df: (v: string) => `+${v}%`,
    up: true,
  },
  {
    label: "Ticket médio",
    value: 159.7,
    decimals: 2,
    format: (v: string) => `R$\u00a0${v}`,
    delta: 1.2,
    dd: 1,
    df: (v: string) => `-${v}%`,
    up: false,
  },
  {
    label: "Taxa de conv.",
    value: 3.84,
    decimals: 2,
    format: (v: string) => `${v}%`,
    delta: 0.3,
    dd: 1,
    df: (v: string) => `+${v}pp`,
    up: true,
  },
  {
    label: "CAC Canal",
    value: 28.4,
    decimals: 2,
    format: (v: string) => `R$\u00a0${v}`,
    delta: 4.7,
    dd: 1,
    df: (v: string) => `-${v}%`,
    up: true,
  },
  {
    label: "Estoque alerta",
    value: 7,
    decimals: 0,
    format: (v: string) => `${v} SKUs`,
    delta: 0,
    dd: 0,
    df: () => "",
    up: false,
  },
];

export function WarRoomMockup() {
  const { ref, inView } = useInView({ threshold: 0.3 });

  return (
    <div
      ref={ref}
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
        <span
          style={{
            fontSize: "10px",
            color: "#5C6170",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          War Room · Hoje
        </span>
        <span
          className="live-dot"
          style={{ fontSize: "10px", color: "#3ECF8E" }}
        >
          ● Live
        </span>
      </div>

      {/* Metric grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
        }}
      >
        {metrics.map((m, i) => (
          <div
            key={m.label}
            style={{
              background: "#101216",
              borderRadius: "8px",
              padding: "12px",
              border: "1px solid #1E2129",
            }}
          >
            <p
              style={{
                fontSize: "9px",
                color: "#5C6170",
                marginBottom: "6px",
                letterSpacing: "0.06em",
              }}
            >
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
              <AnimatedValue
                value={m.value}
                decimals={m.decimals}
                format={m.format}
                enabled={inView}
                delay={i * 80}
              />
            </p>
            {m.delta > 0 && (
              <p
                style={{ fontSize: "9px", color: m.up ? "#3ECF8E" : "#EF4444" }}
              >
                <AnimatedValue
                  value={m.delta}
                  decimals={m.dd}
                  format={m.df}
                  enabled={inView}
                  delay={i * 80 + 400}
                  duration={800}
                />
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
        <span
          className="flare-label"
          style={{ fontSize: "10px", color: "#F5A524" }}
        >
          Flare
        </span>
        <span style={{ fontSize: "10px", color: "#7C8293" }}>
          Camiseta Preta P — estoque crítico (3 un)
        </span>
      </div>
    </div>
  );
}
