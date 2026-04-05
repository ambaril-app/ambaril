"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { Loader2, Mail, ArrowRight, KeyRound } from "lucide-react";
import { sendMagicLinkAction, loginWithPasswordAction } from "./actions";

/* ─── Silmaril mouse parallax ─── */

function useSilmarilParallax() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 24;
    const y = (e.clientY / window.innerHeight - 0.5) * 24;
    el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, [handleMove]);

  return ref;
}

/* ─── Magic link sent confirmation ─── */

function SentConfirmation({ email }: { email: string }) {
  return (
    <div className="login-sent-enter text-center space-y-4 py-4">
      <div className="flex justify-center">
        <div className="login-sent-icon flex h-12 w-12 items-center justify-center rounded-full bg-bg-raised">
          <Mail className="h-6 w-6 text-text-secondary" />
        </div>
      </div>
      <div>
        <p className="text-base font-medium text-text-bright">
          Verifique seu email
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          Enviamos um link para <span className="font-medium">{email}</span>.
          Expira em 15 minutos.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
      >
        Usar outro email
      </button>
    </div>
  );
}

/* ─── Main login page ─── */

export default function LoginPage() {
  const silmarilRef = useSilmarilParallax();
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

  const [magicState, magicAction, magicPending] = useActionState(
    sendMagicLinkAction,
    null,
  );
  const [passState, passAction, passPending] = useActionState(
    loginWithPasswordAction,
    null,
  );

  const isPending = magicPending || passPending;
  const error = mode === "magic" ? magicState?.error : passState?.error;

  // Focus password field when switching to password mode
  useEffect(() => {
    if (mode === "password") {
      // Small delay to let the animation start before focusing
      const t = setTimeout(() => passwordRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [mode]);

  // Magic link was sent successfully
  if (magicState?.sent) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg-void px-4">
        <div ref={silmarilRef} className="login-silmaril" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="login-wordmark font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
              Ambaril
            </h1>
          </div>
          <SentConfirmation email={magicState.email ?? email} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg-void px-4">
      <div ref={silmarilRef} className="login-silmaril" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Wordmark — hero moment, generous space below */}
        <div className="login-fade-1 mb-10 text-center">
          <h1 className="login-wordmark font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
            Ambaril
          </h1>
          <p className="mt-3 text-base text-text-muted">Acesse seu workspace</p>
        </div>

        {/* Form area — rhythm: tight inputs, breathing button, separated secondary */}
        <div className="login-fade-2 flex flex-col">
          {/* Input group — tight siblings */}
          <div className="flex flex-col gap-3">
            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="email@empresa.com.br"
              autoComplete="email"
              required
              disabled={isPending}
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
            />

            {/* Password — slides in below email */}
            <div
              className={`login-password-reveal ${mode === "password" ? "open" : ""}`}
            >
              <Input
                ref={passwordRef}
                name="password"
                type="password"
                label="Senha"
                placeholder="••••••••"
                autoComplete="current-password"
                required={mode === "password"}
                disabled={isPending || mode !== "password"}
                tabIndex={mode === "password" ? 0 : -1}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="login-error-enter mt-3 text-sm text-danger">
              {error}
            </p>
          )}

          {/* Primary action — more weight, separated from inputs */}
          <div className="mt-5">
            {mode === "magic" ? (
              <form action={magicAction}>
                <input type="hidden" name="email" value={email} />
                <Button
                  type="submit"
                  className="login-btn w-full"
                  disabled={magicPending || !email.trim()}
                >
                  {magicPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar link de acesso
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form action={passAction}>
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="password" value={password} />
                <Button
                  type="submit"
                  className="login-btn w-full"
                  disabled={passPending || !email.trim() || !password}
                >
                  {passPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Secondary action — outline button, clear hierarchy below primary */}
          <div className="login-fade-3 mt-4">
            <Button
              variant="outline"
              type="button"
              className="login-btn login-btn-outline w-full"
              onClick={() => setMode(mode === "magic" ? "password" : "magic")}
              disabled={isPending}
            >
              {mode === "magic" ? (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Entrar com senha
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Usar link de acesso
                </>
              )}
            </Button>

            {mode === "password" && (
              <p className="login-forgot-enter mt-3 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-text-muted underline underline-offset-4 hover:text-text-primary"
                >
                  Esqueci minha senha
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Footer — tertiary, separated by divider */}
        <div className="login-fade-4 mt-10">
          <div className="mb-5 h-px bg-border-subtle" />
          <p className="text-center text-sm text-text-muted">Novo por aqui?</p>
          <p className="mt-2 text-center">
            <Link
              href="/signup"
              className="login-signup-link text-sm font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary"
            >
              Criar workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
