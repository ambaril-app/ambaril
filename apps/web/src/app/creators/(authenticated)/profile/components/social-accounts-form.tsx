"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@ambaril/ui/components/card";
import { Input } from "@ambaril/ui/components/input";
import { FormSelect } from "@ambaril/ui/components/form-select";
import { Button } from "@ambaril/ui/components/button";
import { Plus, Trash2 } from "lucide-react";
import { upsertSocialAccounts } from "@/app/actions/creators/social-accounts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SocialAccount {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "pinterest" | "twitter" | "other";
  handle: string;
  url: string | null;
  isPrimary: boolean;
}

interface SocialAccountsFormProps {
  creatorId: string;
  initialAccounts: SocialAccount[];
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "pinterest", label: "Pinterest" },
  { value: "twitter", label: "Twitter" },
  { value: "other", label: "Outra" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function SocialAccountsForm({ creatorId, initialAccounts }: SocialAccountsFormProps) {
  const [accounts, setAccounts] = React.useState<SocialAccount[]>(initialAccounts);
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleAddAccount() {
    setAccounts([
      ...accounts,
      {
        id: `new-${Date.now()}`,
        platform: "instagram",
        handle: "",
        url: null,
        isPrimary: false,
      },
    ]);
  }

  function handleRemoveAccount(index: number) {
    setAccounts(accounts.filter((_, i) => i !== index));
  }

  function handleUpdateAccount(
    index: number,
    field: keyof SocialAccount,
    value: string | boolean,
  ) {
    const updated = [...accounts];
    const account = updated[index];
    if (!account) return;

    updated[index] = { ...account, [field]: value };
    setAccounts(updated);
  }

  async function handleSave() {
    setIsSaving(true);
    setFeedback(null);

    try {
      const validAccounts = accounts.filter((a) => a.handle.trim().length > 0);

      if (validAccounts.length === 0) {
        setFeedback({ type: "error", message: "Adicione pelo menos uma conta social." });
        setIsSaving(false);
        return;
      }

      const result = await upsertSocialAccounts(creatorId, {
        accounts: validAccounts.map((a) => ({
          platform: a.platform,
          handle: a.handle.trim(),
          url: a.url ?? undefined,
          isPrimary: a.isPrimary,
        })),
      });

      if (result.error) {
        setFeedback({ type: "error", message: result.error });
      } else {
        setFeedback({ type: "success", message: "Contas sociais atualizadas." });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-text-secondary">
          Redes Sociais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.map((account, index) => (
          <div key={account.id} className="flex items-end gap-3">
            <FormSelect
              label="Plataforma"
              options={PLATFORM_OPTIONS}
              value={account.platform}
              onChange={(value) => handleUpdateAccount(index, "platform", value)}
              className="min-w-[130px]"
            />
            <Input
              label="@handle"
              placeholder="@usuario"
              value={account.handle}
              onChange={(e) =>
                handleUpdateAccount(index, "handle", e.target.value)
              }
              className="flex-1"
            />
            <Input
              label="URL (opcional)"
              placeholder="https://..."
              value={account.url ?? ""}
              onChange={(e) =>
                handleUpdateAccount(index, "url", e.target.value)
              }
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onPress={() => handleRemoveAccount(index)}
              aria-label="Remover conta"
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        ))}

        <Button variant="ghost" size="sm" onPress={handleAddAccount}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Adicionar rede
        </Button>

        {feedback && (
          <p
            className={`text-sm ${
              feedback.type === "success" ? "text-success" : "text-danger"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <div className="flex justify-end">
          <Button onPress={handleSave} disabled={isSaving} size="sm">
            {isSaving ? "Salvando..." : "Salvar redes sociais"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export { SocialAccountsForm };
