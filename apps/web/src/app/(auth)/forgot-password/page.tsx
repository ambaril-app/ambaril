"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { Loader2, Mail } from "lucide-react";
import { forgotPasswordAction } from "./actions";

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, null);

  if (state?.sent) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg-void px-4">
        <div className="login-silmaril" aria-hidden="true" />
        <div className="relative z-10 w-full max-w-sm">
          <div className="mb-10 text-center">
            <h1 className="login-wordmark font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
              Ambaril
            </h1>
          </div>
          <div className="login-sent-enter space-y-4 text-center py-4">
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
                Se este email está cadastrado, você receberá um link para
                redefinir sua senha.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block text-sm text-text-secondary underline underline-offset-4 hover:text-text-primary"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg-void px-4">
      <div className="login-silmaril" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Wordmark */}
        <div className="login-fade-1 mb-10 text-center">
          <h1 className="login-wordmark font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
            Ambaril
          </h1>
          <p className="mt-3 text-base text-text-muted">Redefinir senha</p>
        </div>

        {/* Form */}
        <form action={action} className="login-fade-2 flex flex-col">
          <Input
            name="email"
            type="email"
            label="Email"
            placeholder="email@empresa.com.br"
            autoComplete="email"
            required
            disabled={isPending}
          />
          {state?.error && (
            <p className="login-error-enter mt-3 text-sm text-danger">
              {state.error}
            </p>
          )}
          <div className="mt-5">
            <Button
              type="submit"
              className="login-btn w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar link de redefinição"
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="login-fade-3 mt-10">
          <div className="mb-5 h-px bg-border-subtle" />
          <p className="text-center text-sm text-text-muted">
            Lembrou sua senha?
          </p>
          <p className="mt-2 text-center">
            <Link
              href="/login"
              className="login-signup-link text-sm font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary"
            >
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
