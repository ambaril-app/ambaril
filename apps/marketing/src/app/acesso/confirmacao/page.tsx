import Link from "next/link";

export default function ConfirmacaoPage() {
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

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "400px",
          width: "100%",
        }}
      >
        {/* Accent line */}
        <div
          className="confirm-fade-1"
          aria-hidden="true"
          style={{
            width: "24px",
            height: "1px",
            background: "oklch(50% 0.044 215)",
            marginBottom: "16px",
          }}
        />
        <h1
          className="confirm-fade-1"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "32px",
            fontWeight: 600,
            letterSpacing: "-0.022em",
            color: "#E8EAF0",
            marginBottom: "20px",
          }}
        >
          Recebemos.
        </h1>
        <p
          className="confirm-fade-2"
          style={{
            fontSize: "15px",
            lineHeight: 1.75,
            color: "oklch(44% 0.020 220)",
            maxWidth: "340px",
          }}
        >
          Quando houver uma abertura compatível com o seu perfil, você será o
          primeiro a saber. Não há prazo definido.
        </p>
      </div>

      <Link
        href="/"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          fontFamily: "var(--font)",
          fontSize: "12px",
          color: "oklch(32% 0.016 220)",
          textDecoration: "none",
          letterSpacing: "0.04em",
          zIndex: 10,
        }}
      >
        ambaril.com
      </Link>
    </main>
  );
}
