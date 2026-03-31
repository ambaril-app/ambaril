"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { Loader2, Mail } from "lucide-react";
import { signupAction } from "./actions";

export default function SignupPage() {
  const [state, action, isPending] = useActionState(signupAction, null);

  if (state?.sent) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg-void px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-raised">
              <Mail className="h-6 w-6 text-text-secondary" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Verifique seu email</p>
            <p className="mt-1 text-sm text-text-muted">
              Enviamos um link de confirmação para{" "}
              <span className="font-medium">{state.email}</span>.
              Expira em 15 minutos.
            </p>
          </div>
          <Link
            href="/login"
            className="block text-sm text-text-muted underline underline-offset-4 hover:text-text-primary"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-void px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-text-bright">
            Ambaril
          </h1>
          <p className="mt-1 text-sm text-text-muted">Criar seu workspace</p>
        </div>

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
            name="companyName"
            type="text"
            label="Nome da empresa"
            placeholder="Nome da empresa"
            autoComplete="organization"
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
                Criando workspace...
              </>
            ) : (
              "Criar workspace"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="font-medium text-text-primary underline underline-offset-4 hover:text-text-bright"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
