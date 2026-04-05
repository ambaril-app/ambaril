"use client";

import * as React from "react";
import {
  ShoppingBag,
  CreditCard,
  Camera,
  Mail,
  HardDrive,
  CheckCircle2,
  Check,
  Loader2,
  Plug,
  Unplug,
  RefreshCw,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@ambaril/ui/components/button";
import { Badge } from "@ambaril/ui/components/badge";
import { Card } from "@ambaril/ui/components/card";
import { Modal } from "@ambaril/ui/components/modal";
import { cn } from "@ambaril/ui/lib/utils";
import { ConnectModal } from "./connect-modal";
import {
  saveIntegration,
  disconnectIntegration,
  testConnection,
  type ProviderWithStatus,
} from "../actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CAPABILITY_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  checkout: "Checkout",
  social: "Redes Sociais",
  messaging: "Mensageria",
  storage: "Armazenamento",
};

const CAPABILITY_ORDER = [
  "ecommerce",
  "checkout",
  "social",
  "messaging",
  "storage",
];

type IconName = "shopify" | "yever" | "instagram" | "resend" | "cloudflare-r2";

const ICON_MAP: Record<IconName, React.ElementType> = {
  shopify: ShoppingBag,
  yever: CreditCard,
  instagram: Camera,
  resend: Mail,
  "cloudflare-r2": HardDrive,
};

const PROVIDER_STYLE: Record<
  IconName,
  { bg: string; text: string; stripe: string }
> = {
  shopify: {
    bg: "bg-org-emerald-bg",
    text: "text-org-emerald-text",
    stripe: "from-org-emerald-bg",
  },
  yever: {
    bg: "bg-org-blue-bg",
    text: "text-org-blue-text",
    stripe: "from-org-blue-bg",
  },
  instagram: {
    bg: "bg-org-violet-bg",
    text: "text-org-violet-text",
    stripe: "from-org-violet-bg",
  },
  resend: {
    bg: "bg-org-cyan-bg",
    text: "text-org-cyan-text",
    stripe: "from-org-cyan-bg",
  },
  "cloudflare-r2": {
    bg: "bg-org-orange-bg",
    text: "text-org-orange-text",
    stripe: "from-org-orange-bg",
  },
};

// Capabilities each provider enables (for benefit display)
const PROVIDER_CAPABILITIES: Record<string, string[]> = {
  shopify: [
    "Sync de produtos e estoque",
    "Importação de pedidos",
    "Webhooks em tempo real",
  ],
  yever: ["Dados de vendas para Dashboard", "Tracking de conversão"],
  instagram: [
    "Monitoramento de menções",
    "UGC automático",
    "Métricas de engajamento",
  ],
  resend: [
    "Emails transacionais",
    "Campanhas de marketing",
    "Templates personalizados",
  ],
  "cloudflare-r2": [
    "Fotos de produto",
    "Assets de marketing",
    "Backup automático",
  ],
};

function getProviderIcon(icon: string | null): React.ElementType {
  if (icon && icon in ICON_MAP) return ICON_MAP[icon as IconName];
  return Plug;
}

function getProviderStyle(icon: string | null): {
  bg: string;
  text: string;
  stripe: string;
} {
  if (icon && icon in PROVIDER_STYLE) return PROVIDER_STYLE[icon as IconName];
  return {
    bg: "bg-org-slate-bg",
    text: "text-org-slate-text",
    stripe: "from-org-slate-bg",
  };
}

function getProviderCapabilities(icon: string | null): string[] {
  if (icon && icon in PROVIDER_CAPABILITIES)
    return PROVIDER_CAPABILITIES[icon] ?? [];
  return [];
}

// ---------------------------------------------------------------------------
// Section label (DS pattern)
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-3">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestResult {
  capability: string;
  success: boolean;
  message: string;
}

interface DisconnectState {
  open: boolean;
  capability: string;
  name: string;
}

interface IntegrationsClientProps {
  initialProviders: ProviderWithStatus[];
}

// ---------------------------------------------------------------------------
// Provider Card — rich card layout inspired by empty-states upsell pattern
// ---------------------------------------------------------------------------

interface ProviderCardProps {
  provider: ProviderWithStatus;
  isTesting: boolean;
  testResult: TestResult | null;
  onConnect: () => void;
  onTest: () => void;
  onDisconnect: () => void;
}

function ProviderCard({
  provider,
  isTesting,
  testResult,
  onConnect,
  onTest,
  onDisconnect,
}: ProviderCardProps) {
  const Icon = getProviderIcon(provider.icon);
  const style = getProviderStyle(provider.icon);
  const capabilities = getProviderCapabilities(provider.icon);

  return (
    <Card className="p-0 overflow-hidden shadow-[var(--shadow-sm)]">
      {/* Top color stripe — like empty-states upsell cards */}
      <div
        className={cn(
          "h-1 w-full bg-gradient-to-r to-transparent",
          style.stripe,
        )}
      />

      <div className="p-5">
        {/* Header: icon + name + status */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              style.bg,
            )}
          >
            <Icon className={cn("h-5 w-5", style.text)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[15px] font-medium text-text-white">
                {provider.name}
              </p>
              {provider.isConnected ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-text-muted">
                  Disponível
                </Badge>
              )}
            </div>
            {provider.description && (
              <p className="text-[12px] text-text-muted mt-0.5">
                {provider.description}
              </p>
            )}
          </div>
        </div>

        {/* Capabilities list — like empty-states CRM upsell checklist */}
        {capabilities.length > 0 && (
          <ul className="flex flex-col gap-1.5 mb-4">
            {capabilities.map((cap) => (
              <li
                key={cap}
                className="flex items-center gap-2 text-[13px] text-text-primary"
              >
                <Check
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    provider.isConnected ? "text-success" : "text-text-ghost",
                  )}
                />
                <span
                  className={
                    provider.isConnected ? undefined : "text-text-secondary"
                  }
                >
                  {cap}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Test result inline feedback */}
        {testResult && (
          <div
            className={cn(
              "mb-4 rounded-lg px-3 py-2 text-[12px]",
              testResult.success
                ? "bg-success-muted text-success"
                : "bg-danger-muted text-danger",
            )}
          >
            {testResult.message}
          </div>
        )}

        {/* Footer: actions + metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {provider.isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTest}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isTesting ? "Testando…" : "Testar conexão"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDisconnect}
                  className="text-danger hover:text-danger hover:bg-danger-muted"
                >
                  <Unplug className="mr-1.5 h-3.5 w-3.5" />
                  Desconectar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={onConnect}>
                <Plug className="mr-1.5 h-3.5 w-3.5" />
                Conectar
              </Button>
            )}
          </div>

          {/* Last tested timestamp */}
          {provider.isConnected && provider.lastTestedAt && (
            <div className="flex items-center gap-1.5 text-[11px] text-text-ghost">
              <Clock className="h-3 w-3" />
              <span className="font-mono tabular-nums">
                {new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(provider.lastTestedAt))}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function IntegrationsClient({
  initialProviders,
}: IntegrationsClientProps) {
  const [providers, setProviders] =
    React.useState<ProviderWithStatus[]>(initialProviders);

  // Modal state
  const [connectingProvider, setConnectingProvider] =
    React.useState<ProviderWithStatus | null>(null);
  const [disconnectState, setDisconnectState] = React.useState<DisconnectState>(
    { open: false, capability: "", name: "" },
  );

  // Per-provider loading state (keyed by capability)
  const [testingMap, setTestingMap] = React.useState<Record<string, boolean>>(
    {},
  );
  const [testResultMap, setTestResultMap] = React.useState<
    Record<string, TestResult>
  >({});

  // ── Group providers by capability ─────────────────────────────────────────

  const grouped = React.useMemo(() => {
    const map = new Map<string, ProviderWithStatus[]>();
    for (const p of providers) {
      const group = map.get(p.capability) ?? [];
      group.push(p);
      map.set(p.capability, group);
    }
    return map;
  }, [providers]);

  const orderedCapabilities = React.useMemo(() => {
    const inOrder = CAPABILITY_ORDER.filter((c) => grouped.has(c));
    for (const key of grouped.keys()) {
      if (!inOrder.includes(key)) inOrder.push(key);
    }
    return inOrder;
  }, [grouped]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSave = async (credentials: Record<string, string>) => {
    if (!connectingProvider) return;
    const result = await saveIntegration(
      connectingProvider.providerId,
      connectingProvider.capability,
      credentials,
    );

    if (!result.success) {
      throw new Error(result.error ?? "Erro ao salvar integração");
    }

    setProviders((prev) =>
      prev.map((p) =>
        p.capability === connectingProvider.capability
          ? { ...p, isConnected: true, isActive: true }
          : p,
      ),
    );
    setConnectingProvider(null);
  };

  const handleTest = async (capability: string) => {
    setTestingMap((prev) => ({ ...prev, [capability]: true }));
    setTestResultMap((prev) => {
      const next = { ...prev };
      delete next[capability];
      return next;
    });

    const result = await testConnection(capability);

    setTestingMap((prev) => ({ ...prev, [capability]: false }));
    setTestResultMap((prev) => ({
      ...prev,
      [capability]: {
        capability,
        success: result.success,
        message: result.success
          ? "Conexão testada com sucesso."
          : (result.error ?? "Erro ao testar conexão"),
      },
    }));

    if (result.success) {
      setProviders((prev) =>
        prev.map((p) =>
          p.capability === capability ? { ...p, lastTestedAt: new Date() } : p,
        ),
      );
      setTimeout(() => {
        setTestResultMap((prev) => {
          const next = { ...prev };
          delete next[capability];
          return next;
        });
      }, 5000);
    }
  };

  const handleDisconnectConfirm = async () => {
    const { capability } = disconnectState;
    setDisconnectState({ open: false, capability: "", name: "" });

    const result = await disconnectIntegration(capability);
    if (!result.success) return;

    setProviders((prev) =>
      prev.map((p) =>
        p.capability === capability
          ? { ...p, isConnected: false, isActive: false, lastTestedAt: null }
          : p,
      ),
    );
    setTestResultMap((prev) => {
      const next = { ...prev };
      delete next[capability];
      return next;
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex flex-col gap-8">
        {orderedCapabilities.map((capability) => {
          const capabilityProviders = grouped.get(capability) ?? [];
          const label =
            CAPABILITY_LABELS[capability] ??
            capability.charAt(0).toUpperCase() + capability.slice(1);

          return (
            <section key={capability} className="flex flex-col gap-3">
              <SectionLabel>{label}</SectionLabel>
              {/* 2-col grid like empty-states upsell — not 3-col, gives cards room to breathe */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {capabilityProviders.map((provider) => (
                  <ProviderCard
                    key={provider.providerId}
                    provider={provider}
                    isTesting={testingMap[provider.capability] === true}
                    testResult={testResultMap[provider.capability] ?? null}
                    onConnect={() => setConnectingProvider(provider)}
                    onTest={() => handleTest(provider.capability)}
                    onDisconnect={() =>
                      setDisconnectState({
                        open: true,
                        capability: provider.capability,
                        name: provider.name,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}

        {orderedCapabilities.length === 0 && (
          <Card className="p-0 overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="flex flex-col items-center justify-center px-6 py-12">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-muted mb-3">
                <Plug className="h-5 w-5 text-info" />
              </div>
              <p className="text-[14px] font-medium text-text-primary mb-1">
                Nenhuma integração disponível
              </p>
              <p className="text-[12px] text-text-muted text-center max-w-xs">
                Integrações serão exibidas aqui conforme forem habilitadas pelo
                administrador.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Connect modal */}
      {connectingProvider && (
        <ConnectModal
          provider={connectingProvider}
          open={connectingProvider !== null}
          onClose={() => setConnectingProvider(null)}
          onSave={handleSave}
        />
      )}

      {/* Disconnect confirm modal */}
      <Modal
        isOpen={disconnectState.open}
        onClose={() =>
          setDisconnectState({ open: false, capability: "", name: "" })
        }
        size="sm"
      >
        <div className="px-5 pt-5 pb-4">
          <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-danger-muted">
            <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={1.75} />
          </div>
          <p className="text-[14px] font-semibold text-text-white">
            Desconectar {disconnectState.name}?
          </p>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-text-secondary">
            Os módulos que dependem desta integração deixarão de funcionar. Você
            pode reconectar a qualquer momento.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setDisconnectState({ open: false, capability: "", name: "" })
            }
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDisconnectConfirm}
          >
            Desconectar
          </Button>
        </div>
      </Modal>
    </>
  );
}
