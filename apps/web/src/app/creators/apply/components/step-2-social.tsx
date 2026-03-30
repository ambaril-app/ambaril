"use client";

import { Input } from "@ambaril/ui/components/input";
import type { RegistrationStep2Input } from "@ambaril/shared/schemas";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Step2SocialProps {
  data: Partial<RegistrationStep2Input>;
  errors: Partial<Record<keyof RegistrationStep2Input, string>>;
  onChange: (field: keyof RegistrationStep2Input, value: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Step2Social({ data, errors, onChange }: Step2SocialProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-text-bright">Redes Sociais</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Compartilhe seus perfis nas redes sociais.
        </p>
      </div>

      <Input
        label="Instagram"
        placeholder="@seuhandle"
        required
        value={data.instagram ?? ""}
        onChange={(e) => onChange("instagram", e.target.value)}
        errorMessage={errors.instagram}
      />

      <Input
        label="TikTok"
        placeholder="@seuhandle"
        required
        value={data.tiktok ?? ""}
        onChange={(e) => onChange("tiktok", e.target.value)}
        errorMessage={errors.tiktok}
      />

      <Input
        label="YouTube"
        placeholder="@seucanal (opcional)"
        value={data.youtube ?? ""}
        onChange={(e) => onChange("youtube", e.target.value)}
        errorMessage={errors.youtube}
      />

      <Input
        label="Pinterest"
        placeholder="@seuperfil (opcional)"
        value={data.pinterest ?? ""}
        onChange={(e) => onChange("pinterest", e.target.value)}
        errorMessage={errors.pinterest}
      />

      <Input
        label="Twitter / X"
        placeholder="@seuhandle (opcional)"
        value={data.twitter ?? ""}
        onChange={(e) => onChange("twitter", e.target.value)}
        errorMessage={errors.twitter}
      />

      <Input
        label="Outra plataforma"
        placeholder="Kwai, Threads, etc. (opcional)"
        value={data.otherPlatform ?? ""}
        onChange={(e) => onChange("otherPlatform", e.target.value)}
        errorMessage={errors.otherPlatform}
      />
    </div>
  );
}
