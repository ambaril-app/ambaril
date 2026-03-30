import type { Metadata } from "next";
import { ApplicationForm } from "./components/application-form";

export const metadata: Metadata = {
  title: "Aplicar — Programa de Creators | Ambaril",
  description:
    "Inscreva-se no programa de creators e comece a ganhar comissoes.",
};

export default function CreatorApplyPage() {
  return (
    <main className="min-h-dvh bg-bg-void px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-medium text-text-bright">
            Programa de Creators
          </h1>
          <p className="text-sm text-text-secondary">
            Preencha o formulario abaixo para se candidatar ao nosso programa.
          </p>
        </div>

        {/* Form */}
        <ApplicationForm />
      </div>
    </main>
  );
}
