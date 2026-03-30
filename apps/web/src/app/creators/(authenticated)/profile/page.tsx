import { requireCreatorSession } from "@/lib/creator-auth";
import { getCreator } from "@/app/actions/creators/crud";
import { ProfileForm } from "./components/profile-form";
import { SocialAccountsForm } from "./components/social-accounts-form";
import { TaxProfileSection } from "./components/tax-profile-section";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function ProfilePage() {
  const session = await requireCreatorSession();
  const creatorId = session.creatorId;

  const creatorResult = await getCreator(creatorId);
  if (creatorResult.error || !creatorResult.data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-danger">{creatorResult.error ?? "Creator não encontrado"}</p>
      </div>
    );
  }

  const creator = creatorResult.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-display font-medium leading-tight tracking-tight text-text-bright">Meu Perfil</h1>
        <p className="text-sm text-text-secondary">
          Gerencie suas informações pessoais, redes sociais e dados fiscais.
        </p>
      </div>

      {/* Profile form */}
      <ProfileForm
        creatorId={creatorId}
        initialData={{
          name: creator.name,
          email: creator.email,
          cpf: creator.cpf,
          bio: creator.bio,
          pixKey: creator.pixKey,
          pixKeyType: creator.pixKeyType,
          clothingSize: creator.clothingSize,
          address: creator.address,
          tierName: creator.tierName,
          commissionRate: creator.commissionRate,
          joinedAt: creator.joinedAt
            ? creator.joinedAt instanceof Date
              ? creator.joinedAt.toISOString()
              : String(creator.joinedAt)
            : null,
          profileImageUrl: creator.profileImageUrl,
        }}
      />

      {/* Social accounts */}
      <SocialAccountsForm
        creatorId={creatorId}
        initialAccounts={creator.socialAccounts.map((sa) => ({
          id: sa.id,
          platform: sa.platform,
          handle: sa.handle,
          url: sa.url,
          isPrimary: sa.isPrimary,
        }))}
      />

      {/* Tax profile (read-only) */}
      <TaxProfileSection
        taxpayerType={null}
        cpf={creator.cpf}
        cnpj={null}
        municipalityName={null}
      />
    </div>
  );
}
