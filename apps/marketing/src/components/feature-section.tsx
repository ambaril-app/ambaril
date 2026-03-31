import type { ReactNode } from "react";

interface FeatureSectionProps {
  dark?: boolean;
  flip?: boolean;
  anchor: string;
  title: string;
  body: string;
  mockup: ReactNode;
}

export function FeatureSection({ dark = false, flip = false, anchor, title, body, mockup }: FeatureSectionProps) {
  const bg = dark ? "#07080B" : "#F7F8FA";
  const titleColor = dark ? "#E8EAF0" : "#0F172A";
  const anchorColor = dark ? "oklch(40% 0.025 220)" : "#94A3B8";
  const bodyColor = dark ? "oklch(50% 0.018 220)" : "#475569";

  return (
    <section
      style={{
        background: bg,
        padding: "120px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "80px",
          alignItems: "center",
          direction: flip ? "rtl" : "ltr",
        }}
      >
        {/* Text */}
        <div style={{ direction: "ltr" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: anchorColor,
              marginBottom: "16px",
            }}
          >
            {anchor}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 500,
              letterSpacing: "-0.022em",
              lineHeight: 1.1,
              color: titleColor,
              textWrap: "balance",
              marginBottom: "20px",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: bodyColor,
              maxWidth: "440px",
            }}
          >
            {body}
          </p>
        </div>

        {/* Mockup */}
        <div style={{ direction: "ltr" }}>
          <div className="mockup-frame">
            <div className="mockup-inner">{mockup}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
