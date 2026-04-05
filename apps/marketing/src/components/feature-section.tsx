"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/use-in-view";

interface FeatureSectionProps {
  dark?: boolean;
  flip?: boolean;
  anchor: string;
  title: string;
  body: string;
  mockup: ReactNode;
}

export function FeatureSection({
  dark = false,
  flip = false,
  anchor,
  title,
  body,
  mockup,
}: FeatureSectionProps) {
  const { ref, inView } = useInView({ threshold: 0.15 });

  const bg = dark ? "#07080B" : "#F7F8FA";
  const titleColor = dark ? "#E8EAF0" : "#0F172A";
  const anchorColor = dark ? "oklch(48% 0.025 220)" : "#7C8293";
  const bodyColor = dark ? "oklch(50% 0.018 220)" : "#475569";

  const v = inView ? " in-view" : "";

  return (
    <section
      ref={ref}
      style={{
        background: bg,
        padding: "120px 24px",
      }}
    >
      <div className="feature-grid" style={{ direction: flip ? "rtl" : "ltr" }}>
        {/* Text */}
        <div style={{ direction: "ltr" }}>
          <p
            className={`scroll-reveal-text${v}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: anchorColor,
              marginBottom: "16px",
            }}
          >
            {anchor}
          </p>
          <h2
            className={`scroll-reveal-text delay-1${v}`}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 42px)",
              fontWeight: 600,
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
            className={`scroll-reveal-text delay-2${v}`}
            style={{
              fontSize: "16px",
              lineHeight: 1.55,
              color: bodyColor,
              maxWidth: "440px",
            }}
          >
            {body}
          </p>
        </div>

        {/* Mockup */}
        <div style={{ direction: "ltr" }}>
          <div className={`mockup-frame scroll-reveal-mockup${v}`}>
            <div className="mockup-inner">{mockup}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
