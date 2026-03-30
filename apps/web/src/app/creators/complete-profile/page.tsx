import { requireCreatorSession } from "@/lib/creator-auth";
import { CompleteProfileForm } from "./components/complete-profile-form";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function CompleteProfilePage() {
  await requireCreatorSession();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-void px-4 py-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-text-bright">
            Complete seu perfil
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Preencha as informacoes abaixo para ativar todas as funcoes do portal.
          </p>
        </div>

        <CompleteProfileForm />
      </div>
    </div>
  );
}
