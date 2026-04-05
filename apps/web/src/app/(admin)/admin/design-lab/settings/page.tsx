"use client";

import * as React from "react";
import {
  Building2,
  Users,
  CreditCard,
  Plug,
  Bell,
  Upload,
  Code,
  Shield,
  ScrollText,
  Store,
  Wallet,
  Truck,
  FileText,
  MessageCircle,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@ambaril/ui/components/card";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";

// ---------------------------------------------------------------------------
// Section label (Energy Level 0 — Workhorse)
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-3">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Toggle switch (inline)
// ---------------------------------------------------------------------------

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? "bg-success" : "bg-bg-surface"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sidebar navigation structure
// ---------------------------------------------------------------------------

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Geral",
    items: [
      { id: "perfil", label: "Perfil da empresa", icon: Building2 },
      { id: "equipe", label: "Equipe", icon: Users },
      { id: "plano", label: "Plano", icon: CreditCard },
    ],
  },
  {
    title: "Módulos",
    items: [
      { id: "integracoes", label: "Integrações", icon: Plug },
      { id: "notificacoes", label: "Notificações", icon: Bell },
      { id: "importacao", label: "Importação", icon: Upload },
    ],
  },
  {
    title: "Avançado",
    items: [
      { id: "api", label: "API", icon: Code },
      { id: "lgpd", label: "LGPD", icon: Shield },
      { id: "logs", label: "Logs", icon: ScrollText },
    ],
  },
];

// ---------------------------------------------------------------------------
// Integration data
// ---------------------------------------------------------------------------

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  connected: boolean;
  enabled: boolean;
}

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: "shopify",
    name: "Shopify",
    description: "E-commerce principal",
    icon: Store,
    iconBg: "bg-org-emerald-bg",
    iconColor: "text-org-emerald-text",
    connected: true,
    enabled: true,
  },
  {
    id: "mercado-pago",
    name: "Mercado Pago",
    description: "Pagamentos e conciliação",
    icon: Wallet,
    iconBg: "bg-org-blue-bg",
    iconColor: "text-org-blue-text",
    connected: true,
    enabled: true,
  },
  {
    id: "melhor-envio",
    name: "Melhor Envio",
    description: "Rastreio e etiquetas",
    icon: Truck,
    iconBg: "bg-org-cyan-bg",
    iconColor: "text-org-cyan-text",
    connected: false,
    enabled: false,
  },
  {
    id: "focus-nfe",
    name: "Focus NFe",
    description: "Emissão de NF-e",
    icon: FileText,
    iconBg: "bg-org-orange-bg",
    iconColor: "text-org-orange-text",
    connected: false,
    enabled: false,
  },
  {
    id: "meta-cloud-api",
    name: "Meta Cloud API",
    description: "WhatsApp Business",
    icon: MessageCircle,
    iconBg: "bg-org-violet-bg",
    iconColor: "text-org-violet-text",
    connected: false,
    enabled: false,
  },
];

// ---------------------------------------------------------------------------
// Notification data
// ---------------------------------------------------------------------------

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationSetting[] = [
  {
    id: "estoque-critico",
    label: "Estoque crítico",
    description: "Alertar quando SKU abaixo do mínimo",
    enabled: true,
  },
  {
    id: "pedido-atrasado",
    label: "Pedido atrasado",
    description: "Alertar quando envio passar 48h",
    enabled: true,
  },
  {
    id: "meta-vendas",
    label: "Meta de vendas",
    description: "Notificar quando meta diária for atingida",
    enabled: false,
  },
  {
    id: "erro-integracao",
    label: "Erro de integração",
    description: "Alertar quando sync falhar",
    enabled: true,
  },
];

interface DeliveryChannel {
  name: string;
  status: "active" | "inactive";
  variant: string;
}

const DELIVERY_CHANNELS: DeliveryChannel[] = [
  { name: "Discord", status: "active", variant: "emerald" },
  { name: "Email", status: "active", variant: "blue" },
  { name: "WhatsApp", status: "inactive", variant: "slate" },
];

// ---------------------------------------------------------------------------
// Tab: Perfil da empresa
// ---------------------------------------------------------------------------

function TabPerfil() {
  return (
    <div>
      <h2 className="text-[24px] font-medium leading-[1.25] text-text-bright mb-1">
        Perfil da empresa
      </h2>
      <p className="text-[14px] text-text-secondary mb-6">
        Informações básicas do seu negócio.
      </p>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <Input
              label="Nome da empresa"
              defaultValue="CIENA"
              autoComplete="organization"
            />
            <Input
              label="CNPJ"
              defaultValue="12.345.678/0001-90"
              inputMode="numeric"
              autoComplete="off"
            />
            <Input
              label="Email principal"
              defaultValue="contato@ciena.com.br"
              type="email"
              autoComplete="email"
            />
            <Input
              label="Telefone"
              defaultValue="(21) 99999-0000"
              type="tel"
              autoComplete="tel"
            />

            <div className="border-t border-border-subtle my-4" />

            <SectionLabel>Endereço</SectionLabel>

            <div className="flex flex-col gap-4">
              <Input
                label="CEP"
                defaultValue="20040-020"
                inputMode="numeric"
                autoComplete="postal-code"
                className="max-w-[200px]"
              />

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
                <Input
                  label="Rua"
                  defaultValue="Av. Rio Branco"
                  autoComplete="address-line1"
                />
                <Input label="Número" defaultValue="156" inputMode="numeric" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  defaultValue="Rio de Janeiro"
                  autoComplete="address-level2"
                />
                <Input
                  label="Estado"
                  defaultValue="RJ"
                  autoComplete="address-level1"
                  className="max-w-[100px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button>Salvar alterações</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Integrações
// ---------------------------------------------------------------------------

function TabIntegracoes() {
  const [integrations, setIntegrations] = React.useState(INITIAL_INTEGRATIONS);

  function handleToggle(id: string, value: boolean) {
    setIntegrations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled: value } : i)),
    );
  }

  return (
    <div>
      <h2 className="text-[24px] font-medium leading-[1.25] text-text-bright mb-1">
        Integrações
      </h2>
      <p className="text-[14px] text-text-secondary mb-6">
        Conecte serviços externos para sincronizar dados.
      </p>

      <div className="flex flex-col gap-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card
              key={integration.id}
              className={
                integration.connected
                  ? "border-l-2 border-l-success"
                  : undefined
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${integration.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${integration.iconColor}`} />
                  </div>

                  {/* Name + description */}
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-[14px] font-medium text-text-primary truncate">
                      {integration.name}
                    </span>
                    <span className="text-[12px] text-text-secondary truncate">
                      {integration.description}
                    </span>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0">
                    {integration.connected ? (
                      <Badge variant="success" className="gap-1">
                        <Check className="h-3 w-3" />
                        Conectado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-text-muted">
                        Desconectado
                      </Badge>
                    )}
                  </div>

                  {/* Toggle or Connect button */}
                  <div className="shrink-0">
                    {integration.connected ? (
                      <Toggle
                        checked={integration.enabled}
                        onChange={(v) => handleToggle(integration.id, v)}
                      />
                    ) : (
                      <Button variant="outline" size="sm">
                        Conectar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Notificações
// ---------------------------------------------------------------------------

function TabNotificacoes() {
  const [notifications, setNotifications] = React.useState(
    INITIAL_NOTIFICATIONS,
  );

  function handleToggle(id: string, value: boolean) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: value } : n)),
    );
  }

  return (
    <div>
      <h2 className="text-[24px] font-medium leading-[1.25] text-text-bright mb-1">
        Notificações
      </h2>
      <p className="text-[14px] text-text-secondary mb-6">
        Configure quando e como receber alertas.
      </p>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-0">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`flex items-center justify-between py-4 ${
                  index < notifications.length - 1
                    ? "border-b border-border-subtle"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[14px] font-medium text-text-primary">
                    {notification.label}
                  </span>
                  <span className="text-[12px] text-text-secondary">
                    {notification.description}
                  </span>
                </div>
                <div className="shrink-0 ml-4">
                  <Toggle
                    checked={notification.enabled}
                    onChange={(v) => handleToggle(notification.id, v)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border-subtle my-4" />

          <SectionLabel>Canais de entrega</SectionLabel>

          <div className="flex flex-wrap gap-2 mt-3">
            {DELIVERY_CHANNELS.map((channel) => (
              <Badge
                key={channel.name}
                variant={
                  channel.status === "active"
                    ? channel.variant === "emerald"
                      ? "emerald"
                      : "blue"
                    : "secondary"
                }
              >
                {channel.name}
                <span className="ml-1.5 text-[11px] opacity-70">
                  {channel.status === "active" ? "Ativo" : "Inativo"}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder tab for unimplemented sections
// ---------------------------------------------------------------------------

function TabPlaceholder({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-[24px] font-medium leading-[1.25] text-text-bright mb-1">
        {title}
      </h2>
      <p className="text-[14px] text-text-secondary mb-6">Em breve.</p>
      <Card>
        <CardContent className="p-6">
          <p className="text-[14px] text-text-muted">
            Esta seção ainda não foi implementada neste showcase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab label map (for placeholders)
// ---------------------------------------------------------------------------

const TAB_LABELS: Record<string, string> = {
  perfil: "Perfil da empresa",
  equipe: "Equipe",
  plano: "Plano",
  integracoes: "Integrações",
  notificacoes: "Notificações",
  importacao: "Importação",
  api: "API",
  lgpd: "LGPD",
  logs: "Logs",
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DesignLabSettingsPage() {
  const [activeTab, setActiveTab] = React.useState("perfil");

  function renderContent() {
    switch (activeTab) {
      case "perfil":
        return <TabPerfil />;
      case "integracoes":
        return <TabIntegracoes />;
      case "notificacoes":
        return <TabNotificacoes />;
      default:
        return <TabPlaceholder title={TAB_LABELS[activeTab] ?? activeTab} />;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div>
        <h1 className="text-[32px] font-display font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
          Configurações
        </h1>
        <p className="text-[14px] text-text-secondary mt-1">
          Gerencie seu workspace, integrações e preferências.
        </p>
      </div>

      {/* Settings layout: sidebar + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Left sidebar nav */}
        <nav className="flex flex-col gap-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <SectionLabel>{group.title}</SectionLabel>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2 text-left text-[13px] rounded-md px-3 py-2 transition-colors cursor-pointer ${
                        isActive
                          ? "bg-bg-raised text-text-white font-medium"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Right content area */}
        <div className="min-w-0">{renderContent()}</div>
      </div>
    </div>
  );
}
