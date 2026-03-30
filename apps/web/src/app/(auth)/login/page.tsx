"use client";

import { useActionState } from "react";
import { Checkbox } from "@ambaril/ui/components/checkbox";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { LogIn } from "lucide-react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-void px-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-text-bright">
            Ambaril
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Plataforma de gestão
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border-default bg-bg-base p-6 shadow-[var(--shadow-lg)]">
          <form action={formAction} className="space-y-4">
            <Input
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
            />

            <Input
              name="password"
              type="password"
              label="Senha"
              autoComplete="current-password"
              required
            />

            <Checkbox
              name="remember"
              label="Lembrar de mim"
            />

            {state?.error && (
              <div className="rounded-md bg-[var(--danger-muted)] px-3 py-2">
                <p className="text-sm text-danger">{state.error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                "Entrando..."
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
