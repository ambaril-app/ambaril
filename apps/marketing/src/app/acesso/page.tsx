"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WaitlistForm } from "@/components/waitlist-form";

const VALID_CODES = (process.env.NEXT_PUBLIC_INVITE_CODES ?? "").split(",").filter(Boolean);

export default function AcessoPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Hash-based direct entry: /acesso#interesse
    if (window.location.hash === "#interesse") {
      setShowInterest(true);
    } else {
      inputRef.current?.focus();
    }
  }, []);

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      if (VALID_CODES.length === 0 || VALID_CODES.includes(trimmed)) {
        router.push("https://app.ambaril.com");
      } else {
        setCodeError("Código inválido.");
        inputRef.current?.focus();
      }
    }, 520);
  }

  if (showInterest) {
    return <WaitlistForm onBack={() => setShowInterest(false)} />;
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#07080B",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Silmaril */}
      <div aria-hidden="true" className="acesso-silmaril" />

      {/* Wordmark */}
      <Link
        href="/"
        style={{
          position: "fixed",
          top: "24px",
          left: "24px",
          fontFamily: "var(--font)",
          fontSize: "13px",
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: "oklch(34% 0.018 220)",
          textDecoration: "none",
          zIndex: 10,
        }}
      >
        Ambaril
      </Link>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "380px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "48px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 500,
              letterSpacing: "-0.022em",
              color: "#E8EAF0",
              marginBottom: "10px",
            }}
          >
            Código de acesso
          </h1>
          <p style={{ fontSize: "14px", color: "oklch(56% 0.020 220)", lineHeight: 1.6 }}>
            Insira o código se você recebeu um convite.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCodeSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setCodeError(""); }}
              placeholder="AMBARIL-XXXX"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={scanning}
              style={{
                width: "100%",
                padding: "13px 16px",
                borderRadius: "8px",
                border: codeError
                  ? "1px solid oklch(52% 0.18 25)"
                  : scanning
                  ? "1px solid oklch(68% 0.052 215)"
                  : "1px solid oklch(30% 0.016 220)",
                background: "oklch(9% 0.010 220 / 0.7)",
                fontFamily: "var(--font-mono)",
                fontSize: "16px",
                letterSpacing: "0.08em",
                color: "#E8EAF0",
                outline: "none",
                transition: "border-color 200ms ease",
                textTransform: "uppercase",
              }}
              onFocus={(e) => {
                if (!codeError && !scanning)
                  e.currentTarget.style.borderColor = "oklch(56% 0.030 220)";
              }}
              onBlur={(e) => {
                if (!codeError && !scanning)
                  e.currentTarget.style.borderColor = "oklch(30% 0.016 220)";
              }}
            />
            {/* Scan sweep line */}
            {scanning && <div className="code-scan-line" aria-hidden="true" />}
            {codeError && (
              <p style={{ marginTop: "6px", fontSize: "12px", color: "oklch(62% 0.16 25)" }}>
                {codeError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={scanning || !code.trim()}
            style={{
              padding: "13px",
              borderRadius: "8px",
              border: "none",
              background: scanning || !code.trim() ? "oklch(18% 0.013 220)" : "#F7F8FA",
              color: scanning || !code.trim() ? "oklch(36% 0.018 220)" : "#07080B",
              fontFamily: "var(--font)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: scanning || !code.trim() ? "not-allowed" : "pointer",
              transition: "background 200ms ease, color 200ms ease",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              if (!scanning && code.trim())
                e.currentTarget.style.background = "#E8EAF0";
            }}
            onMouseLeave={(e) => {
              if (!scanning && code.trim())
                e.currentTarget.style.background = "#F7F8FA";
            }}
          >
            {scanning ? "Verificando..." : "Entrar"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "32px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "oklch(24% 0.014 220)" }} />
          <span style={{ fontSize: "11px", color: "oklch(46% 0.020 220)", letterSpacing: "0.01em" }}>
            sem convite?
          </span>
          <div style={{ flex: 1, height: "1px", background: "oklch(24% 0.014 220)" }} />
        </div>

        <button
          id="interesse"
          onClick={() => setShowInterest(true)}
          style={{
            width: "100%",
            padding: "8px 0",
            border: "none",
            background: "transparent",
            color: "oklch(44% 0.020 220)",
            fontFamily: "var(--font)",
            fontSize: "12px",
            cursor: "pointer",
            letterSpacing: "0.01em",
            transition: "color 200ms ease",
            textAlign: "center",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "oklch(60% 0.024 220)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "oklch(44% 0.020 220)"; }}
        >
          Não tenho convite mas quero aumentar minhas chances
        </button>
      </div>
    </main>
  );
}
