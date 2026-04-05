/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { Card } from "@ambaril/ui/components/card";
import { Button } from "@ambaril/ui/components/button";
import { Badge } from "@ambaril/ui/components/badge";
import {
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  MessageCircle,
  Check,
  ChevronRight,
  Store,
  Database,
  Rocket,
  ArrowRight,
  Zap,
  TrendingUp,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Page — Asymmetric, varied empty states (NOT a grid of identical cards)
// ---------------------------------------------------------------------------

export default function DesignLabEmptyStatesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-10">
        <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
          Empty States & Onboarding
        </h1>
        <p className="mt-1 text-[14px] leading-[1.65] text-text-secondary">
          Cada situação de "sem dados" tem sua própria personalidade. Nada é
          genérico.
        </p>
      </div>

      {/* ================================================================= */}
      {/* 1. DASHBOARD ZERO STATE — like dashboards-5-empty-state            */}
      {/*    Shows the actual UI structure with zeros, not a centered card   */}
      {/* ================================================================= */}

      <section className="mb-12">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-4">
          Dashboard com zero dados
        </p>

        <Card className="p-0 shadow-[var(--shadow-sm)] overflow-hidden">
          {/* KPI strip with zeros */}
          <div className="grid grid-cols-2 divide-x divide-border-subtle sm:grid-cols-4 border-b border-border-subtle">
            {[
              { label: "Faturamento", value: "R$\u00a00" },
              { label: "Pedidos", value: "0" },
              { label: "Conversão", value: "—" },
              { label: "Ticket médio", value: "—" },
            ].map((kpi) => (
              <div key={kpi.label} className="px-4 py-3">
                <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-ghost">
                  {kpi.label}
                </p>
                <p className="mt-0.5 font-mono text-[18px] leading-tight text-text-ghost tabular-nums">
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          {/* Two-column: ghost chart + action prompt */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px]">
            {/* Ghost chart area */}
            <div className="p-6 border-r border-border-subtle">
              <p className="text-[12px] text-text-ghost mb-4">
                Faturamento últimos 30 dias
              </p>
              {/* Ghost chart bars */}
              <div className="stagger-children flex items-end gap-1.5 h-[120px]">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-bg-raised"
                    style={{
                      height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 10}%`,
                    }}
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-[13px] text-text-muted">
                Conecte sua loja para ver o faturamento aqui.
              </p>
            </div>

            {/* Right side — action prompt (asymmetric) */}
            <div className="p-6 flex flex-col justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info-muted mb-3">
                <Store className="h-5 w-5 text-info" />
              </div>
              <p className="text-[16px] font-medium leading-[1.35] text-text-white mb-1.5">
                Conecte sua loja
              </p>
              <p className="text-[13px] leading-[1.65] text-text-secondary mb-4">
                Importe seus produtos e pedidos do Shopify para começar a ver
                dados aqui.
              </p>
              <Button size="sm" className="self-start">
                Conectar Shopify
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* ================================================================= */}
      {/* 2. MODULE UPSELL — NOT centered. Left-aligned with benefit list   */}
      {/* ================================================================= */}

      <section className="mb-12">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-4">
          Módulo não ativado — Upsell
        </p>

        <div className="stagger-children grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
          {/* CRM upsell */}
          <Card className="p-0 overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="h-1 w-full bg-gradient-to-r from-org-violet-bg to-transparent" />
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-org-violet-bg">
                  <Users className="h-4 w-4 text-org-violet-text" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-text-white">CRM</p>
                  <p className="text-[12px] text-text-muted">
                    Módulo disponível
                  </p>
                </div>
              </div>
              <p className="text-[13px] leading-[1.65] text-text-secondary mb-4">
                Unifique sua base de clientes, segmente por RFM, e acompanhe o
                ciclo de vida de cada comprador.
              </p>
              <ul className="flex flex-col gap-2 mb-5">
                {[
                  "Segmentação por RFM automática",
                  "Timeline de compras por cliente",
                  "Automações de re-engajamento",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-[13px] text-text-primary"
                  >
                    <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <Button size="sm">Ativar CRM</Button>
                <span className="text-[11px] italic text-text-ghost">
                  Reduz churn em até 23%
                </span>
              </div>
            </div>
          </Card>

          {/* WhatsApp upsell — different layout than CRM (asymmetry) */}
          <Card className="p-0 overflow-hidden shadow-[var(--shadow-sm)]">
            <div className="h-1 w-full bg-gradient-to-r from-org-emerald-bg to-transparent" />
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-org-emerald-bg">
                  <MessageCircle className="h-4 w-4 text-org-emerald-text" />
                </div>
                <div>
                  <p className="text-[15px] font-medium text-text-white">
                    WhatsApp
                  </p>
                  <p className="text-[12px] text-text-muted">
                    Módulo disponível
                  </p>
                </div>
              </div>
              <p className="text-[13px] leading-[1.65] text-text-secondary mb-4">
                Envie notificações de rastreio, recupere carrinhos abandonados e
                converse com clientes direto no WhatsApp.
              </p>
              {/* Different presentation: stats preview instead of bullet list */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { value: "72%", label: "Taxa de abertura" },
                  { value: "3,2x", label: "vs Email" },
                  { value: "~R$8k", label: "Recuperado/mês" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md bg-bg-raised p-2 text-center"
                  >
                    <p className="font-mono text-[14px] font-medium tabular-nums text-text-white">
                      {stat.value}
                    </p>
                    <p className="text-[10px] text-text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
              <Button size="sm">Ativar WhatsApp</Button>
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 3. IMPORT PROGRESS — the one Marcus liked, with animation          */}
      {/* ================================================================= */}

      <section className="mb-12">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-4">
          Importação em andamento
        </p>

        <Card className="p-0 overflow-hidden shadow-[var(--shadow-md)]">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-org-blue-bg">
                <Database className="h-5 w-5 text-org-blue-text" />
              </div>
              <div>
                <p className="text-[16px] font-medium text-text-white">
                  Importando dados do Shopify
                </p>
                <p className="text-[12px] text-text-muted">
                  Iniciado há 2 minutos
                </p>
              </div>
            </div>

            {/* Progress items + log — 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
              {/* Left — progress items stacked */}
              <div className="flex flex-col gap-3">
                {/* Produtos — active, with animation */}
                <div className="rounded-lg border border-info/20 bg-info-muted p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-info" />
                      <span className="text-[13px] font-medium text-text-white">
                        Produtos
                      </span>
                    </div>
                    <span className="font-mono text-[14px] tabular-nums text-text-white">
                      1.247{" "}
                      <span className="text-text-muted text-[12px]">
                        / 2.340
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-surface">
                    <div
                      className="h-full rounded-full bg-info transition-all duration-1000 animate-progress-shimmer"
                      style={{ width: "53%" }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-text-muted">
                    ~3 min restantes
                  </p>
                </div>

                {/* Pedidos — pending */}
                <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-raised px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-text-ghost" />
                  <span className="text-[13px] text-text-muted flex-1">
                    Pedidos
                  </span>
                  <span className="font-mono text-[12px] text-text-ghost">
                    Aguardando
                  </span>
                </div>

                {/* Clientes — pending */}
                <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-bg-raised px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-text-ghost" />
                  <span className="text-[13px] text-text-muted flex-1">
                    Clientes
                  </span>
                  <span className="font-mono text-[12px] text-text-ghost">
                    Aguardando
                  </span>
                </div>
              </div>

              {/* Right — live log preview */}
              <div className="rounded-lg border border-border-subtle bg-bg-void p-3 font-mono text-[10px] leading-relaxed text-text-muted overflow-y-auto scrollbar-thin h-full">
                <p>
                  <span className="text-text-ghost">14:22:03</span> Importando
                  SKU CIENA-BLK-001... <span className="text-success">ok</span>
                </p>
                <p>
                  <span className="text-text-ghost">14:22:02</span> Importando
                  SKU CIENA-GRY-004... <span className="text-success">ok</span>
                </p>
                <p>
                  <span className="text-text-ghost">14:22:01</span> Importando
                  SKU CIENA-KHK-002... <span className="text-success">ok</span>
                </p>
                <p className="text-text-ghost">
                  14:22:00 Sync iniciada com api.shopify.com
                </p>
              </div>
            </div>
          </div>

          {/* Bottom progress bar */}
          <div className="h-1 w-full bg-bg-raised">
            <div className="h-full w-[35%] bg-gradient-to-r from-info to-info/60 transition-all duration-500" />
          </div>
        </Card>
      </section>

      {/* ================================================================= */}
      {/* 4. FIRST-RUN WELCOME — Measured-style (great-shadcn-usage-5)       */}
      {/*    Asymmetric: left text + right checklist card                    */}
      {/* ================================================================= */}

      <section className="mb-12">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-4">
          Primeiro acesso — Welcome
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
          {/* Left — greeting (not centered, left-aligned) */}
          <div className="py-4">
            <p className="text-[12px] text-text-muted mb-3">
              31 de março de 2026
            </p>
            <h2 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white mb-3">
              Bem-vindo,
              <br />
              Marcus.
            </h2>
            <p className="text-[15px] leading-[1.65] text-text-secondary mb-6 max-w-md">
              Seu painel está quase pronto. Complete a configuração abaixo para
              começar a ver dados de verdade.
            </p>

            {/* Team ready — avatar row */}
            <p className="text-[12px] text-text-muted mb-2">
              Equipe já convidada
            </p>
            <div className="stagger-children flex items-center -space-x-2">
              {["C", "T", "P", "Y", "S"].map((letter, i) => {
                const colors = [
                  "bg-org-violet-bg text-org-violet-text",
                  "bg-org-cyan-bg text-org-cyan-text",
                  "bg-org-emerald-bg text-org-emerald-text",
                  "bg-org-rose-bg text-org-rose-text",
                  "bg-org-blue-bg text-org-blue-text",
                ];
                return (
                  <span
                    key={letter}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-base text-[11px] font-medium ${colors[i]}`}
                  >
                    {letter}
                  </span>
                );
              })}
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-base bg-bg-raised text-[10px] font-medium text-text-muted">
                +4
              </span>
            </div>
          </div>

          {/* Right — setup checklist card (like onboarding.jpg) */}
          <Card className="p-0 overflow-hidden shadow-[var(--shadow-md)]">
            <div className="px-5 pt-5 pb-3 border-b border-border-subtle">
              <p className="text-[14px] font-medium text-text-white">
                Configuração inicial
              </p>
              <p className="text-[12px] text-text-muted mt-0.5">
                2 de 4 concluídos
              </p>
              {/* Mini progress */}
              <div className="mt-2 h-1 w-full rounded-full bg-bg-raised">
                <div className="h-full w-1/2 rounded-full bg-success transition-all" />
              </div>
            </div>
            <div className="stagger-children flex flex-col">
              {[
                {
                  label: "Criar conta",
                  done: true,
                  detail: "marcus@ciena.com.br",
                },
                {
                  label: "Conectar Shopify",
                  done: true,
                  detail: "ciena-official.myshopify.com",
                },
                {
                  label: "Importar produtos",
                  done: false,
                  detail: "2.340 produtos encontrados",
                },
                {
                  label: "Configurar alertas",
                  done: false,
                  detail: "Flare · Estoque e pedidos",
                },
              ].map((item, i) => (
                <button
                  key={item.label}
                  type="button"
                  className={`flex items-center gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer ${
                    i < 3 ? "border-b border-border-subtle" : ""
                  } ${item.done ? "bg-bg-base" : "hover:bg-bg-raised"}`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.done
                        ? "bg-success"
                        : "border-2 border-border-default"
                    }`}
                  >
                    {item.done && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[14px] leading-[1.4] ${item.done ? "text-text-muted line-through" : "text-text-primary font-medium"}`}
                    >
                      {item.label}
                    </p>
                    <p className="text-[11px] text-text-ghost mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                  {!item.done && (
                    <ChevronRight className="h-4 w-4 text-text-ghost shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 5. CONTEXTUAL EMPTY — inside a real page layout                    */}
      {/*    (like dashboards-5: actual widgets with zeros/placeholders)     */}
      {/* ================================================================= */}

      <section className="mb-12">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-4">
          Widgets contextuais vazios
        </p>

        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Widget 1: Recent orders — empty with ghost rows */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                Pedidos recentes
              </p>
              <Badge variant="secondary" className="text-[10px]">
                0
              </Badge>
            </div>
            {/* Ghost rows */}
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-full animate-ghost" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-3/4 rounded animate-ghost" />
                    <div className="h-2 w-1/2 rounded animate-ghost" />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[12px] text-text-ghost">
              Seus pedidos mais recentes aparecem aqui.
            </p>
          </Card>

          {/* Widget 2: Top produtos — empty with ghost bars */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-3">
              Top produtos
            </p>
            <div className="flex flex-col gap-3">
              {[85, 60, 40, 25].map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full animate-ghost text-[10px] text-text-ghost">
                    {i + 1}
                  </span>
                  <div
                    className="h-2 rounded animate-ghost"
                    style={{ width: `${w}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[12px] text-text-ghost">
              Ranking baseado em vendas da semana.
            </p>
          </Card>

          {/* Widget 3: Urgent to-dos — empty with call-to-action */}
          <Card className="p-4 shadow-[var(--shadow-sm)] flex flex-col">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-3">
              Tarefas urgentes
            </p>
            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-muted mb-2 icon-breathe">
                <Zap className="h-4 w-4 text-success" />
              </div>
              <p className="text-[13px] font-medium text-text-primary mb-0.5">
                Tudo em dia
              </p>
              <p className="text-[11px] text-text-muted text-center">
                Nenhuma tarefa urgente no momento.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 6. ERROR STATE — minimal, not a big dramatic card                  */}
      {/* ================================================================= */}

      <section className="mb-12">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-4">
          Estado de erro
        </p>

        <Card className="p-5 shadow-[var(--shadow-sm)] border-l-[3px] border-l-danger">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger-muted mt-0.5">
              <Shield className="h-4 w-4 text-danger" />
            </div>
            <div>
              <p className="text-[15px] font-medium text-text-white mb-1">
                Falha ao carregar pedidos
              </p>
              <p className="text-[13px] leading-[1.65] text-text-secondary mb-3">
                O Shopify está temporariamente indisponível. Isso geralmente se
                resolve em alguns minutos. Se persistir, verifique o status da
                integração em Configurações.
              </p>
              <div className="flex items-center gap-2">
                <Button size="sm">Tentar novamente</Button>
                <Button variant="ghost" size="sm">
                  Ver status das integrações
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
