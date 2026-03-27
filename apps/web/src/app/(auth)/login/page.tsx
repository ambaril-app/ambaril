"use client";

import { useActionState } from "react";
import { Checkbox } from "@heroui/react";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-void">
      <div className="w-full max-w-sm space-y-6 rounded-lg bg-bg-base p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-medium text-text-bright">Ambaril</h1>
          <p className="text-sm text-text-secondary">
            Plataforma de gestao
          </p>
        </div>

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
            size="sm"
            classNames={{
              label: "text-sm text-text-secondary",
            }}
          >
            Lembrar de mim
          </Checkbox>

          {state?.error && (
            <p className="text-sm text-danger">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
