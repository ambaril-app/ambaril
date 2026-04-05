import Link from "next/link";

export function CtaSection() {
  return (
    <section
      style={{
        background: "#07080B",
        padding: "160px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft glow behind text — breathes */}
      <div
        className="cta-glow"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(68% 0.080 216 / 0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4.5vw, 58px)",
            fontWeight: 600,
            letterSpacing: "-0.026em",
            lineHeight: 1.08,
            color: "#E8EAF0",
            textWrap: "balance",
            marginBottom: "16px",
          }}
        >
          Seu negócio opera 24h. Seu sistema, também.
        </h2>

        <p
          style={{
            fontSize: "16px",
            color: "oklch(50% 0.018 220)",
            lineHeight: 1.55,
            maxWidth: "440px",
            margin: "0 auto 36px",
            textWrap: "balance",
          }}
        >
          Age no lugar onde você não chega. Em tempo real. Sem esperar você
          lembrar.
        </p>

        <Link
          href="/acesso"
          className="cta-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--font)",
            fontSize: "14px",
            fontWeight: 500,
            padding: "13px 28px",
            borderRadius: "8px",
            background: "#F7F8FA",
            color: "#07080B",
            textDecoration: "none",
            letterSpacing: "-0.01em",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.12), 0 4px 20px rgba(0,0,0,0.28)",
          }}
        >
          Tem um código de acesso?
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>

        <div style={{ marginTop: "16px" }}>
          <Link
            href="/acesso#interesse"
            className="cta-secondary"
            style={{
              fontSize: "12px",
              color: "oklch(44% 0.020 220)",
              letterSpacing: "0.01em",
              textDecoration: "none",
            }}
          >
            Quero aumentar minhas chances
          </Link>
        </div>
      </div>
    </section>
  );
}
