"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { Loader2, Mail } from "lucide-react";
import { sendMagicLinkAction, loginWithPasswordAction } from "./actions";

type Tab = "magic" | "password";

function MagicLinkForm() {
  const [state, action, isPending] = useActionState(sendMagicLinkAction, null);

  if (state?.sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-raised">
            <Mail className="h-6 w-6 text-text-secondary" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Verifique seu email</p>
          <p className="mt-1 text-sm text-text-muted">
            Enviamos um link para <span className="font-medium">{state.email}</span>.
            Expira em 15 minutos.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-text-muted underline underline-offset-4 hover:text-text-primary"
        >
          Usar outro email
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
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
        <p className="text-sm text-danger">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Enviar link de acesso"
        )}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [state, action, isPending] = useActionState(loginWithPasswordAction, null);

  return (
    <form action={action} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="email@empresa.com.br"
        autoComplete="email"
        required
        disabled={isPending}
      />
      <Input
        name="password"
        type="password"
        label="Senha"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        disabled={isPending}
      />
      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-text-muted underline underline-offset-4 hover:text-text-primary"
        >
          Esqueci minha senha
        </Link>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>("password");

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg-void px-4">
      {/* Silmaril — breathing light artifact */}
      <div className="login-silmaril" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Wordmark — no subtitle */}
        <div className="text-center">
          <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-text-white">
            Ambaril
          </h1>
        </div>

        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-border-default p-1">
            <button
              type="button"
              onClick={() => setActiveTab("magic")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "magic"
                  ? "bg-bg-base text-text-primary shadow-[var(--shadow-sm)]"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Link de acesso
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "password"
                  ? "bg-bg-base text-text-primary shadow-[var(--shadow-sm)]"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Senha
            </button>
          </div>

          {activeTab === "magic" ? <MagicLinkForm /> : <PasswordForm />}

          <p className="text-center text-sm text-text-muted">
            Novo por aqui?{" "}
            <Link
              href="/signup"
              className="font-medium text-text-primary underline underline-offset-4 hover:text-text-bright"
            >
              Criar workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
