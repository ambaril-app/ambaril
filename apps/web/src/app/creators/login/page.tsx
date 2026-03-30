"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, ArrowLeft, Loader2, Mail, KeyRound } from "lucide-react";
import { requestLoginCodeAction, verifyLoginCodeAction } from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "email" | "code";

// ---------------------------------------------------------------------------
// Login page — Two-step flow: email -> 6-digit code
// ---------------------------------------------------------------------------

export default function CreatorLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount and step change
  useEffect(() => {
    if (step === "email") {
      emailInputRef.current?.focus();
    } else {
      codeInputRef.current?.focus();
    }
  }, [step]);

  // ---------------------------------------------------------------------------
  // Step 1: Request login code
  // ---------------------------------------------------------------------------

  const handleRequestCode = useCallback(() => {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Digite seu email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Email invalido");
      return;
    }

    startTransition(async () => {
      const result = await requestLoginCodeAction(trimmedEmail);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setVerificationToken(result.data.verificationToken);
        setStep("code");
        setCode("");
      }
    });
  }, [email]);

  // ---------------------------------------------------------------------------
  // Step 2: Verify code
  // ---------------------------------------------------------------------------

  const handleVerifyCode = useCallback(() => {
    setError(null);
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setError("Digite o codigo de 6 digitos");
      return;
    }

    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("Codigo deve ter 6 digitos");
      return;
    }

    startTransition(async () => {
      const result = await verifyLoginCodeAction(
        trimmedCode,
        verificationToken,
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        router.push(result.data.redirectTo);
      }
    });
  }, [code, verificationToken, router]);

  // ---------------------------------------------------------------------------
  // Resend code
  // ---------------------------------------------------------------------------

  const handleResendCode = useCallback(() => {
    setError(null);
    setCode("");

    startTransition(async () => {
      const result = await requestLoginCodeAction(email.trim().toLowerCase());

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setVerificationToken(result.data.verificationToken);
        setError(null);
        codeInputRef.current?.focus();
      }
    });
  }, [email]);

  // ---------------------------------------------------------------------------
  // Go back to email step
  // ---------------------------------------------------------------------------

  const handleBack = useCallback(() => {
    setStep("email");
    setCode("");
    setVerificationToken("");
    setError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isPending) {
        if (step === "email") {
          handleRequestCode();
        } else {
          handleVerifyCode();
        }
      }
    },
    [step, isPending, handleRequestCode, handleVerifyCode],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-void px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1
            className="text-2xl font-semibold tracking-tight text-text-white"
          >
            Ambaril
          </h1>
          <p className="mt-1 text-sm text-text-muted">Portal do Creator</p>
        </div>

        {/* Card */}
        <div
          className="overflow-hidden rounded-xl border border-border-default p-6"
          style={{
            background:
              "linear-gradient(180deg, var(--color-bg-raised) 0%, var(--color-bg-surface) 100%)",
          }}
        >
          {/* Step header */}
          <div className="mb-6">
            {step === "code" && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isPending}
                className="mb-4 flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-text-bright disabled:opacity-50"
              >
                <ArrowLeft size={14} />
                Voltar
              </button>
            )}

            <h2 className="text-base font-medium text-text-bright">
              {step === "email" ? "Entrar no portal" : "Verificar codigo"}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {step === "email"
                ? "Digite seu email para receber um codigo de acesso."
                : `Enviamos um codigo de 6 digitos para ${email}.`}
            </p>
          </div>

          {/* Form */}
          <div onKeyDown={handleKeyDown}>
            {step === "email" ? (
              /* Email step */
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="creator-email"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-[0.04em] text-text-muted"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-ghost"
                    />
                    <input
                      ref={emailInputRef}
                      id="creator-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      disabled={isPending}
                      className="w-full rounded-lg border border-border-default bg-bg-base py-2.5 pl-10 pr-4 text-sm text-text-white placeholder:text-text-ghost transition-colors focus:border-border-strong focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestCode}
                  disabled={isPending || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-text-white px-4 py-2.5 text-sm font-medium text-bg-void transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogIn size={16} />
                  )}
                  {isPending ? "Enviando..." : "Enviar codigo"}
                </button>
              </div>
            ) : (
              /* Code step */
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="creator-code"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-[0.04em] text-text-muted"
                  >
                    Codigo de acesso
                  </label>
                  <div className="relative">
                    <KeyRound
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-ghost"
                    />
                    <input
                      ref={codeInputRef}
                      id="creator-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={(e) => {
                        // Only allow digits
                        const filtered = e.target.value.replace(/\D/g, "");
                        setCode(filtered);
                        setError(null);
                      }}
                      placeholder="000000"
                      autoComplete="one-time-code"
                      disabled={isPending}
                      className="w-full rounded-lg border border-border-default bg-bg-base py-2.5 pl-10 pr-4 text-center font-mono text-lg tracking-[0.3em] text-text-white placeholder:text-text-ghost transition-colors focus:border-border-strong focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isPending || code.length !== 6}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-text-white px-4 py-2.5 text-sm font-medium text-bg-void transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <LogIn size={16} />
                  )}
                  {isPending ? "Verificando..." : "Entrar"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isPending}
                    className="text-xs text-text-secondary transition-colors hover:text-text-bright disabled:opacity-50"
                  >
                    Reenviar codigo
                  </button>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 rounded-lg border border-danger/20 bg-danger-muted px-3 py-2">
                <p className="text-xs text-danger">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-text-ghost">
          Quer ser creator?{" "}
          <a
            href="/creators/apply"
            className="text-text-secondary underline transition-colors hover:text-text-bright"
          >
            Inscreva-se aqui
          </a>
        </p>
      </div>
    </div>
  );
}
