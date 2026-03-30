"use client";

import * as React from "react";
import {
  ShoppingBag,
  CreditCard,
  Camera,
  Mail,
  HardDrive,
  CheckCircle2,
  Circle,
  Loader2,
  Plug,
  Unplug,
  RefreshCw,
} from "lucide-react";
import { Button } from "@ambaril/ui/components/button";
import { Badge } from "@ambaril/ui/components/badge";
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

type IconName =
  | "shopify"
  | "yever"
  | "instagram"
  | "resend"
  | "cloudflare-r2";

const ICON_MAP: Record<IconName, React.ElementType> = {
  shopify: ShoppingBag,
  yever: CreditCard,
  instagram: Camera,
  resend: Mail,
  "cloudflare-r2": HardDrive,
};

function getProviderIcon(icon: string | null): React.ElementType {
  if (icon && icon in ICON_MAP) {
    return ICON_MAP[icon as IconName];
  }
  return Plug;
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
// Provider Card
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

  return (
    <div
      className={cn(
        "rounded-lg border p-5 transition-opacity",
        provider.isConnected
          ? "bg-bg-surface border-border-subtle"
          : "bg-bg-elevated border-border-subtle opacity-75",
      )}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-md border border-border-subtle bg-bg-raised">
            <Icon className="h-4 w-4 text-text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-bright">
              {provider.name}
            </p>
          </div>
        </div>

        {/* Status badge */}
        {provider.isConnected ? (
          <Badge variant="success" className="shrink-0 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Conectado
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0 gap-1">
            <Circle className="h-3 w-3" />
            Não conectado
          </Badge>
        )}
      </div>

      {/* Description */}
      {provider.description && (
        <p className="mt-3 text-xs text-text-muted line-clamp-2 min-w-0">
          {provider.description}
        </p>
      )}

      {/* Last tested timestamp */}
      {provider.isConnected && provider.lastTestedAt && (
        <p className="mt-2 text-xs text-text-ghost">
          Testado em{" "}
          {new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(provider.lastTestedAt))}
        </p>
      )}

      {/* Test result inline feedback */}
      {testResult && (
        <p
          className={cn(
            "mt-3 rounded-md px-3 py-2 text-xs",
            testResult.success
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-danger-muted text-danger",
          )}
        >
          {testResult.message}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        {provider.isConnected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onTest}
              disabled={isTesting}
              className="gap-1.5"
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {isTesting ? "Testando..." : "Testar"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              className="gap-1.5 text-danger hover:text-danger hover:bg-danger-muted"
            >
              <Unplug className="h-3.5 w-3.5" />
              Desconectar
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={onConnect} className="gap-1.5">
            <Plug className="h-3.5 w-3.5" />
            Conectar
          </Button>
        )}
      </div>
    </div>
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
  const [disconnectState, setDisconnectState] =
    React.useState<DisconnectState>({ open: false, capability: "", name: "" });

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
    // Add any capabilities not in the predefined order
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
      // Keep modal open — let form show the error
      throw new Error(result.error ?? "Erro ao salvar integração");
    }

    // Optimistic update: mark as connected
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
    // Clear previous result
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
      // Update lastTestedAt optimistically
      setProviders((prev) =>
        prev.map((p) =>
          p.capability === capability
            ? { ...p, lastTestedAt: new Date() }
            : p,
        ),
      );
      // Auto-clear success message after 5s
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

    // Optimistic update
    setProviders((prev) =>
      prev.map((p) =>
        p.capability === capability
          ? { ...p, isConnected: false, isActive: false, lastTestedAt: null }
          : p,
      ),
    );
    // Clear any test result for this capability
    setTestResultMap((prev) => {
      const next = { ...prev };
      delete next[capability];
      return next;
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-8">
        {orderedCapabilities.map((capability) => {
          const capabilityProviders = grouped.get(capability) ?? [];
          const label =
            CAPABILITY_LABELS[capability] ??
            capability.charAt(0).toUpperCase() + capability.slice(1);

          return (
            <section key={capability}>
              <h2 className="mb-3 text-sm font-medium text-text-secondary">
                {label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="rounded-lg border border-border-subtle bg-bg-surface px-6 py-12 text-center">
            <Plug className="mx-auto mb-3 h-8 w-8 text-text-ghost" />
            <p className="text-sm font-medium text-text-secondary">
              Nenhuma integração disponível
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Integrações serão exibidas aqui conforme forem habilitadas.
            </p>
          </div>
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
        title="Desconectar integração"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Tem certeza que deseja desconectar o{" "}
            <span className="font-medium text-text-primary">
              {disconnectState.name}
            </span>
            ? Os módulos que dependem desta integração deixarão de funcionar.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
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
        </div>
      </Modal>
    </>
  );
}
