/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import {
  Plus,
  X,
  Check,
  ShoppingBag,
  Package,
  Truck,
  ClipboardCheck,
  Store,
  Users,
  Database,
  Rocket,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@ambaril/ui/components/card";
import { Badge } from "@ambaril/ui/components/badge";
import { Modal } from "@ambaril/ui/components/modal";
import { cn } from "@ambaril/ui/lib/utils";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockItems = [
  { id: 1, name: "Camiseta Oversized CIENA Logo", qty: 2, price: 189.9 },
  { id: 2, name: "Calça Cargo Ripstop Preta", qty: 1, price: 349.9 },
  { id: 3, name: "Boné Dad Hat Bordado", qty: 3, price: 129.9 },
];

const mockTags = ["Atacado", "Prioridade", "SP Capital"];

// ---------------------------------------------------------------------------
// Section label component (Level 0 Workhorse)
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-3">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Onboarding Step Wizard — Level 2 Moment (refs: onboarding 2-6)
// ---------------------------------------------------------------------------

interface WizardStep {
  id: number;
  label: string;
  icon: React.ElementType;
  description: string;
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 0,
    label: "Conectar loja",
    icon: Store,
    description: "Conecte sua loja Shopify para importar produtos e pedidos.",
  },
  {
    id: 1,
    label: "Importar dados",
    icon: Database,
    description: "Vamos trazer seus produtos e pedidos existentes.",
  },
  {
    id: 2,
    label: "Configurar equipe",
    icon: Users,
    description: "Convide sua equipe e defina permissões por função.",
  },
  {
    id: 3,
    label: "Pronto",
    icon: Rocket,
    description: "Tudo configurado. Seu painel está pronto para uso.",
  },
];

function OnboardingWizard() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const step = WIZARD_STEPS[currentStep];

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-border-subtle bg-bg-base shadow-[var(--shadow-md)] overflow-hidden">
      {/* Step indicator bar */}
      <div className="flex items-center border-b border-border-subtle bg-bg-void px-5 py-3">
        {WIZARD_STEPS.map((s, i) => {
          const isComplete = i < currentStep;
          const isActive = i === currentStep;
          const isLast = i === WIZARD_STEPS.length - 1;
          const Icon = s.icon;

          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "text-text-white"
                    : isComplete
                      ? "text-success"
                      : "text-text-ghost"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-medium transition-all duration-200 ${
                    isComplete
                      ? "bg-success text-white animate-pop-in step-complete-glow"
                      : isActive
                        ? "bg-btn-primary-bg text-btn-primary-text shadow-[var(--shadow-sm)]"
                        : "bg-bg-raised text-text-ghost"
                  }`}
                >
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span
                  className={`text-[13px] font-medium hidden sm:inline ${
                    isActive
                      ? "text-text-white"
                      : isComplete
                        ? "text-text-primary"
                        : "text-text-ghost"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {!isLast && (
                <ChevronRight className="mx-2 h-3.5 w-3.5 shrink-0 text-text-ghost" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="px-6 py-6">
        {/* Step 0: Conectar loja */}
        {currentStep === 0 && (
          <div className="animate-[fade-in_300ms_ease-out]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-org-emerald-bg">
              <Store
                className="h-5 w-5 text-org-emerald-text"
                strokeWidth={1.75}
              />
            </div>
            <h3 className="font-display text-[18px] font-medium leading-[1.35] tracking-normal text-text-white mb-2">
              Conecte sua loja
            </h3>
            <p className="text-[14px] leading-[1.65] text-text-secondary mb-6 max-w-md">
              Conecte sua loja Shopify para importar automaticamente produtos,
              pedidos e clientes. Você pode conectar outras integrações depois.
            </p>

            <div className="flex flex-col gap-3 max-w-md">
              {[
                {
                  name: "Shopify",
                  desc: "E-commerce principal",
                  color: "bg-org-emerald-bg",
                  textColor: "text-org-emerald-text",
                  connected: false,
                },
                {
                  name: "Nuvemshop",
                  desc: "Alternativa BR",
                  color: "bg-org-blue-bg",
                  textColor: "text-org-blue-text",
                  connected: false,
                },
                {
                  name: "WooCommerce",
                  desc: "WordPress",
                  color: "bg-org-violet-bg",
                  textColor: "text-org-violet-text",
                  connected: false,
                },
              ].map((platform) => (
                <button
                  key={platform.name}
                  type="button"
                  className="flex items-center gap-3 rounded-lg border border-border-default px-4 py-3 text-left transition-all duration-150 hover:border-border-strong hover:shadow-[var(--shadow-sm)] cursor-pointer"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${platform.color}`}
                  >
                    <Store className={`h-4 w-4 ${platform.textColor}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-text-primary">
                      {platform.name}
                    </p>
                    <p className="text-[12px] text-text-muted">
                      {platform.desc}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-text-ghost" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Importar dados */}
        {currentStep === 1 && (
          <div className="animate-[fade-in_300ms_ease-out]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-org-blue-bg">
              <Database
                className="h-5 w-5 text-org-blue-text"
                strokeWidth={1.75}
              />
            </div>
            <h3 className="font-display text-[18px] font-medium leading-[1.35] tracking-normal text-text-white mb-2">
              Importar dados
            </h3>
            <p className="text-[14px] leading-[1.65] text-text-secondary mb-6 max-w-md">
              Vamos trazer seus produtos e pedidos existentes. Esse processo
              leva alguns minutos.
            </p>

            {/* Progress card */}
            <div className="max-w-md rounded-lg border border-border-default bg-bg-raised p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-medium text-text-primary">
                  Importando produtos
                </span>
                <span className="font-mono text-[13px] tabular-nums text-text-white">
                  1.247 <span className="text-text-muted">/ 2.340</span>
                </span>
              </div>

              {/* Progress bar with color gradient */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg-surface">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-info to-success transition-all duration-500"
                  style={{ width: "53%" }}
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-info" />
                <span className="text-[12px] text-text-muted">
                  Importando… ~3 min restantes
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Produtos", value: "1.247", status: "active" },
                  { label: "Pedidos", value: "—", status: "pending" },
                  { label: "Clientes", value: "—", status: "pending" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md border border-border-subtle bg-bg-base p-2.5 text-center"
                  >
                    <p className="text-[10px] font-display uppercase tracking-[0.15em] text-text-muted">
                      {item.label}
                    </p>
                    <p
                      className={`mt-0.5 font-mono text-[16px] tabular-nums ${item.status === "active" ? "text-text-white" : "text-text-ghost"}`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configurar equipe */}
        {currentStep === 2 && (
          <div className="animate-[fade-in_300ms_ease-out] flex flex-col items-center text-center">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-org-violet-bg">
              <Users
                className="h-5 w-5 text-org-violet-text"
                strokeWidth={1.75}
              />
            </div>
            <h3 className="font-display text-[18px] font-medium leading-[1.35] tracking-normal text-text-white mb-2">
              Configurar equipe
            </h3>
            <p className="text-[14px] leading-[1.65] text-text-secondary mb-6 max-w-md mx-auto [text-wrap:balance]">
              Convide sua equipe e defina permissões por função. Cada pessoa vê
              apenas o que precisa.
            </p>

            {/* Team list - Distilled from heavy cards to clean list rows */}
            <div className="w-full max-w-xl mx-auto text-left">
              <div className="divide-y divide-border-subtle border-y border-border-subtle">
                {[
                  {
                    role: "Operações",
                    desc: "ERP, PCP, estoque, logística",
                    color: "bg-org-amber-bg",
                    textColor: "text-org-amber-text",
                    count: "Tavares, Ana Clara",
                  },
                  {
                    role: "Marketing",
                    desc: "CRM, creators, campanhas",
                    color: "bg-org-rose-bg",
                    textColor: "text-org-rose-text",
                    count: "Caio, Yuri, Sick",
                  },
                  {
                    role: "Suporte",
                    desc: "Inbox, trocas, atendimento",
                    color: "bg-org-cyan-bg",
                    textColor: "text-org-cyan-text",
                    count: "Slimgust",
                  },
                  {
                    role: "Financeiro",
                    desc: "DRE, margens, fiscal",
                    color: "bg-org-emerald-bg",
                    textColor: "text-org-emerald-text",
                    count: "Pedro",
                  },
                ].map((team) => (
                  <div
                    key={team.role}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          team.color,
                        )}
                      >
                        <span
                          className={cn(
                            "text-[13px] font-bold uppercase tracking-wider",
                            team.textColor,
                          )}
                        >
                          {team.role.substring(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-text-primary">
                          {team.role}
                        </p>
                        <p className="text-[13px] text-text-muted">
                          {team.desc}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-text-secondary hidden sm:block">
                        {team.count}
                      </span>
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Button variant="ghost" size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Convidar por email
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Pronto */}
        {currentStep === 3 && (
          <div className="animate-[fade-in_300ms_ease-out] text-center py-8">
            {/* Delight: Celebratory completion icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-success-muted shadow-[0_0_40px_-10px_var(--success)]">
              <Check className="h-8 w-8 text-success" strokeWidth={2.5} />
            </div>

            <h3 className="font-display text-[32px] font-medium tracking-tight text-text-bright mb-3">
              Tudo pronto.
            </h3>

            <p className="text-[15px] leading-[1.65] text-text-secondary mx-auto max-w-md mb-10 [text-wrap:balance]">
              O núcleo do Ambaril está configurado e processando seus dados em
              segundo plano. Você já pode acessar seu painel.
            </p>

            {/* Summary checklist - Clean and spacious */}
            <div className="mx-auto max-w-[280px] text-left">
              {[
                { label: "Conta administrativa ativa" },
                { label: "Integração Shopify rodando" },
                { label: "2.340 produtos mapeados" },
                { label: "Equipe base convidada" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10">
                    <Check
                      className="h-3.5 w-3.5 text-success"
                      strokeWidth={2.5}
                    />
                  </div>
                  <span className="text-[14px] font-medium text-text-primary">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button
                size="lg"
                className="w-full sm:w-auto min-w-[200px] shadow-[var(--shadow-sm)]"
              >
                Ir para o painel
              </Button>
            </div>
          </div>
        )}

        {/* Navigation - Distilled to pure layout below content */}
        {currentStep < 3 && (
          <div className="mt-12 flex items-center justify-between border-t border-border-subtle pt-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className={
                currentStep === 0 ? "opacity-0 pointer-events-none" : ""
              }
            >
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-text-muted hover:text-text-primary"
              >
                Pular
              </Button>
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="shadow-[var(--shadow-sm)] min-w-[120px]"
              >
                Próximo passo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar at bottom - Removed gradients, using semantic success color */}
      <div className="h-1 w-full bg-bg-raised">
        <div
          className="h-full bg-success transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function DesignLabFormsPage() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
          Formulários
        </h1>
        <p className="mt-1 text-[14px] leading-[1.65] text-text-secondary">
          Form Shopify-style, modais, step wizard — Level 0 Workhorse + Level 2
          Moment patterns.
        </p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Section 1: Shopify-style Form                                     */}
      {/* ----------------------------------------------------------------- */}

      <section className="mb-12">
        <h2 className="text-[24px] font-medium leading-[1.25] text-text-bright mb-6">
          Shopify-style Form — Criar Pedido
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main area */}
          <div className="flex flex-col gap-6 stagger-children">
            {/* Dados do cliente */}
            <Card>
              <CardContent className="p-5">
                <SectionLabel>Dados do cliente</SectionLabel>
                <div className="flex flex-col gap-3">
                  <Input
                    label="Nome completo"
                    placeholder="Ex: João Silva Pereira"
                    autoComplete="name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="joao@email.com"
                    autoComplete="email"
                    defaultValue="joao.silva@"
                    error="Endereço de email incompleto. Ex: joao@email.com"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="CPF"
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      autoComplete="off"
                      defaultValue="123.456.789"
                      error="CPF deve ter 11 dígitos"
                    />
                    <Input
                      label="Telefone"
                      placeholder="(21) 99999-0000"
                      type="tel"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itens do pedido */}
            <Card>
              <CardContent className="p-5">
                <SectionLabel>Itens do pedido</SectionLabel>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-[14px] leading-[1.65]">
                    <thead>
                      <tr className="border-b border-border-subtle text-left">
                        <th className="pb-2 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                          Produto
                        </th>
                        <th className="pb-2 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted w-20 text-right">
                          Qtd
                        </th>
                        <th className="pb-2 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted w-28 text-right">
                          Preço unit.
                        </th>
                        <th className="pb-2 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted w-28 text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border-subtle last:border-0"
                        >
                          <td className="py-3 text-text-primary min-w-0">
                            <span className="block truncate max-w-[280px]">
                              {item.name}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-[13px] text-text-primary tabular-nums">
                            {item.qty}
                          </td>
                          <td className="py-3 text-right font-mono text-[13px] text-text-primary tabular-nums">
                            R$&nbsp;{item.price.toFixed(2)}
                          </td>
                          <td className="py-3 text-right font-mono text-[13px] text-text-white font-medium tabular-nums">
                            R$&nbsp;{(item.qty * item.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border-default">
                        <td
                          colSpan={3}
                          className="py-3 text-right text-[14px] font-medium text-text-primary"
                        >
                          Subtotal
                        </td>
                        <td className="py-3 text-right font-mono text-[14px] font-medium text-text-white tabular-nums">
                          R$&nbsp;
                          {mockItems
                            .reduce((sum, i) => sum + i.qty * i.price, 0)
                            .toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-3">
                  <Button variant="ghost" size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Adicionar item
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Endereço de entrega */}
            <Card>
              <CardContent className="p-5">
                <SectionLabel>Endereço de entrega</SectionLabel>
                <div className="flex flex-col gap-3">
                  <Input
                    label="CEP"
                    placeholder="00000-000"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                    <Input
                      label="Rua"
                      placeholder="Rua das Palmeiras"
                      autoComplete="address-line1"
                    />
                    <Input
                      label="Número"
                      placeholder="123"
                      inputMode="numeric"
                    />
                  </div>
                  <Input
                    label="Complemento"
                    placeholder="Apto, bloco, etc."
                    autoComplete="address-line2"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
                    <Input
                      label="Cidade"
                      placeholder="Rio de Janeiro"
                      autoComplete="address-level2"
                    />
                    <Input
                      label="Estado"
                      placeholder="RJ"
                      autoComplete="address-level1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button>Criar pedido</Button>
              <Button variant="ghost">Cancelar</Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start stagger-children">
            {/* Status */}
            <Card className="p-4">
              <CardTitle className="text-[14px]">Status</CardTitle>
              <div className="mt-3">
                <label htmlFor="order-status" className="sr-only">
                  Status do pedido
                </label>
                <select
                  id="order-status"
                  aria-label="Status do pedido"
                  className="w-full rounded-md border border-input-border bg-input-bg px-3 py-2 text-[14px] text-text-primary outline-none focus:border-input-focus transition-colors cursor-pointer"
                >
                  <option>Rascunho</option>
                  <option>Pendente</option>
                  <option>Confirmado</option>
                  <option>Enviado</option>
                  <option>Entregue</option>
                </select>
              </div>
            </Card>

            {/* Tags */}
            <Card className="p-4">
              <CardTitle className="text-[14px]">Tags</CardTitle>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {mockTags.map((tag, i) => {
                  const variants = ["violet", "orange", "blue"] as const;
                  return (
                    <Badge key={tag} variant={variants[i % variants.length]}>
                      {tag}
                      <button
                        type="button"
                        className="ml-1 inline-flex text-current opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                        aria-label={`Remover tag ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-border-default text-text-muted hover:text-text-primary hover:border-border-strong transition-all cursor-pointer"
                  aria-label="Adicionar tag"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>

            {/* Resumo rápido */}
            <Card className="p-4 bg-bg-void">
              <CardTitle className="text-[14px]">Resumo</CardTitle>
              <div className="mt-3 flex flex-col gap-2 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Itens</span>
                  <span className="font-mono tabular-nums text-text-primary">
                    3 produtos
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-mono tabular-nums text-text-primary">
                    R$&nbsp;1.119,40
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Frete</span>
                  <span className="text-text-ghost">A calcular</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border-subtle pt-2">
                  <span className="font-medium text-text-primary">Total</span>
                  <span className="font-mono text-[16px] font-medium tabular-nums text-text-white">
                    R$&nbsp;1.119,40
                  </span>
                </div>
              </div>
            </Card>

            {/* Metadados */}
            <Card className="p-4">
              <CardTitle className="text-[14px]">Metadados</CardTitle>
              <div className="mt-3 flex flex-col gap-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Criado em</span>
                  <span className="font-mono text-[13px] text-text-primary tabular-nums">
                    31/03/2026 14:22
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Atualizado em</span>
                  <span className="font-mono text-[13px] text-text-primary tabular-nums">
                    31/03/2026 14:22
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section 2: Modal Demo                                             */}
      {/* ----------------------------------------------------------------- */}

      <section className="mb-12">
        <h2 className="text-[24px] font-medium leading-[1.25] text-text-bright mb-6">
          Modal — Confirmação destrutiva
        </h2>

        <Button variant="outline" onClick={() => setModalOpen(true)}>
          Abrir modal de confirmação
        </Button>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="sm">
          {/* Centered Layout */}
          <div className="flex flex-col items-center px-6 pt-7 pb-6 text-center">
            {/* Delight: Red icon with subtle glow and pulse for destructive action */}
            <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-muted text-danger ring-8 ring-danger-muted/30">
              <AlertTriangle className="h-7 w-7" strokeWidth={1.5} />
              {/* Subtle warning ping */}
              <span className="absolute inset-0 rounded-full bg-danger/10 animate-ping opacity-75 duration-1000"></span>
            </div>

            <h3 className="font-display text-[20px] font-medium tracking-tight text-text-bright">
              Excluir pedido #AM-4821?
            </h3>

            <p className="mt-2.5 text-[14px] leading-[1.65] text-text-secondary [text-wrap:balance]">
              O pedido, itens, pagamentos e histórico de rastreio serão
              removidos permanentemente. Esta ação não pode ser desfeita.
            </p>

            {/* Contextual badge instead of a list */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-danger-muted/50 px-2.5 py-1 text-[12px] font-medium text-danger">
              <div className="h-1.5 w-1.5 rounded-full bg-danger"></div>
              NF-e vinculada será cancelada
            </div>
          </div>

          {/* Footer - Full width side-by-side buttons for centered modals */}
          <div className="flex items-center gap-3 border-t border-border-subtle bg-bg-surface/30 px-6 py-4">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Excluir pedido
            </Button>
          </div>
        </Modal>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Section 3: Onboarding Step Wizard — Level 2 Moment                */}
      {/* ----------------------------------------------------------------- */}

      <section className="mb-12">
        <h2 className="text-[24px] font-medium leading-[1.25] text-text-bright mb-2">
          Onboarding Wizard
        </h2>
        <p className="text-[14px] leading-[1.65] text-text-secondary mb-6">
          Fluxo de primeiro uso com 4 etapas interativas. Clique nos steps para
          navegar.
        </p>

        <OnboardingWizard />
      </section>
    </div>
  );
}
