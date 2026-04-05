/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { Badge } from "@ambaril/ui/components/badge";
import { Input } from "@ambaril/ui/components/input";
import { Button } from "@ambaril/ui/components/button";
import {
  Search,
  Send,
  Paperclip,
  Bot,
  MessageSquare,
  Mail,
  Instagram,
  Settings,
  Phone,
  MapPin,
  ShoppingBag,
  Clock,
  Tag,
  ChevronRight,
  Plus,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Channel = "whatsapp" | "email" | "instagram" | "sistema";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  channel: Channel;
  unread: boolean;
  avatarColor: string;
}

interface Message {
  id: string;
  sender: "customer" | "agent" | "system";
  text: string;
  time: string;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    name: "Lucas Ferreira",
    lastMessage: "Oi, queria saber sobre o rastreio do meu pedido...",
    timestamp: "2 min",
    channel: "whatsapp",
    unread: true,
    avatarColor: "bg-org-emerald-bg text-org-emerald-text",
  },
  {
    id: "2",
    name: "Ana Santos",
    lastMessage: "Obrigada! Recebi certinho.",
    timestamp: "15 min",
    channel: "whatsapp",
    unread: false,
    avatarColor: "bg-org-rose-bg text-org-rose-text",
  },
  {
    id: "3",
    name: "Tavares (interno)",
    lastMessage: "Produção da camiseta listrada atrasou...",
    timestamp: "1h",
    channel: "email",
    unread: true,
    avatarColor: "bg-org-orange-bg text-org-orange-text",
  },
  {
    id: "4",
    name: "Pedro Oliveira",
    lastMessage: "Tem previsão do drop de inverno?",
    timestamp: "3h",
    channel: "instagram",
    unread: false,
    avatarColor: "bg-org-violet-bg text-org-violet-text",
  },
  {
    id: "5",
    name: "Guilherme B2B",
    lastMessage: "Segue a planilha com os pedidos de atacado...",
    timestamp: "ontem",
    channel: "email",
    unread: false,
    avatarColor: "bg-org-blue-bg text-org-blue-text",
  },
  {
    id: "6",
    name: "ClawdBot",
    lastMessage: "Relatório diário gerado.",
    timestamp: "ontem",
    channel: "sistema",
    unread: false,
    avatarColor: "bg-org-cyan-bg text-org-cyan-text",
  },
  {
    id: "7",
    name: "Mariana Costa",
    lastMessage: "Vocês têm essa camiseta em M?",
    timestamp: "ontem",
    channel: "instagram",
    unread: false,
    avatarColor: "bg-org-orange-bg text-org-orange-text",
  },
  {
    id: "8",
    name: "Rafael Lima",
    lastMessage: "Quero trocar o tamanho da calça",
    timestamp: "2 dias",
    channel: "whatsapp",
    unread: false,
    avatarColor: "bg-org-slate-bg text-org-slate-text",
  },
];

const MESSAGES: Message[] = [
  {
    id: "m0",
    sender: "system",
    text: "Conversa iniciada via WhatsApp",
    time: "14:30",
  },
  {
    id: "m1",
    sender: "customer",
    text: "Oi, queria saber sobre o rastreio do meu pedido #AM-4821. Já tem atualização?",
    time: "14:32",
  },
  {
    id: "m2",
    sender: "agent",
    text: "Oi Lucas! Deixa eu verificar aqui. Um momento.",
    time: "14:33",
  },
  {
    id: "m3",
    sender: "agent",
    text: "Encontrei! Seu pedido foi postado ontem. O código de rastreio é LX938271504BR. Previsão de entrega: 2-3 dias úteis.",
    time: "14:34",
  },
  {
    id: "m4",
    sender: "customer",
    text: "Perfeito, muito obrigado! 🙏",
    time: "14:35",
  },
];

const CONTACT_PROFILE = {
  name: "Lucas Ferreira",
  email: "lucas.ferreira@gmail.com",
  phone: "(21) 99812-3456",
  city: "Rio de Janeiro, RJ",
  rfm: "Champion",
  ltv: "R$\u00a02.840",
  orders: 8,
  lastOrder: "28/03/2026",
  tags: ["VIP", "Recorrente"],
  timeline: [
    {
      event: "Pedido #AM-4821",
      date: "28 Mar",
      detail: "3 itens · R$\u00a0489,90",
    },
    {
      event: "Pedido #AM-4790",
      date: "14 Jan",
      detail: "1 item · R$\u00a0189,90",
    },
    { event: "Primeira compra", date: "08 Nov 2025", detail: "Via Instagram" },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHANNEL_CONFIG: Record<
  Channel,
  { label: string; variant: "emerald" | "blue" | "violet" | "cyan" }
> = {
  whatsapp: { label: "WhatsApp", variant: "emerald" },
  email: { label: "Email", variant: "blue" },
  instagram: { label: "Instagram", variant: "violet" },
  sistema: { label: "Sistema", variant: "cyan" },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DesignLabChatPage() {
  const [activeId, setActiveId] = useState("1");
  const [filterTab, setFilterTab] = useState<"all" | "unread">("all");
  const activeConv = CONVERSATIONS.find((c) => c.id === activeId)!;
  const channel = CHANNEL_CONFIG[activeConv.channel];
  const filtered =
    filterTab === "unread"
      ? CONVERSATIONS.filter((c) => c.unread)
      : CONVERSATIONS;

  return (
    <div className="flex flex-col">
      {/* 3-column layout: list + thread + profile (like chat-and-inbox-2) */}
      <div className="-mx-6 -mt-6 lg:-mx-8 grid h-[calc(100dvh-48px)] overflow-hidden lg:grid-cols-[280px_1fr_300px]">
        {/* ============================================================= */}
        {/* COL 1: Conversation list (narrow)                              */}
        {/* ============================================================= */}
        <aside className="flex flex-col border-r border-border-subtle bg-bg-base">
          <div className="border-b border-border-subtle px-4 py-3">
            <Input
              placeholder="Buscar conversa…"
              startContent={<Search className="h-3.5 w-3.5 text-text-ghost" />}
              className="border-none bg-bg-raised"
            />
          </div>
          {/* Filter tabs */}
          <div className="flex border-b border-border-subtle px-4">
            {(["all", "unread"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3 py-2 text-[12px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                  filterTab === tab
                    ? "border-text-white text-text-white"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab === "all"
                  ? `Todas (${CONVERSATIONS.length})`
                  : `Não lidas (${CONVERSATIONS.filter((c) => c.unread).length})`}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveId(conv.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150 cursor-pointer ${
                  conv.id === activeId
                    ? "border-l-2 border-border-strong bg-bg-raised"
                    : "border-l-2 border-transparent hover:bg-bg-raised/50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${conv.avatarColor}`}
                >
                  {conv.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`truncate text-[13px] ${conv.unread ? "font-medium text-text-white" : "text-text-primary"}`}
                    >
                      {conv.name}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-text-ghost">
                      {conv.timestamp}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-text-muted">
                    {conv.lastMessage}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge
                      variant={CHANNEL_CONFIG[conv.channel].variant}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {CHANNEL_CONFIG[conv.channel].label}
                    </Badge>
                    {conv.unread && (
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ============================================================= */}
        {/* COL 2: Thread (center, moderate width)                          */}
        {/* ============================================================= */}
        <main className="flex flex-col bg-bg-void">
          {/* Thread header */}
          <div className="flex items-center gap-3 border-b border-border-subtle bg-bg-base px-4 py-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${activeConv.avatarColor}`}
            >
              {activeConv.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-text-primary">
                  {activeConv.name}
                </span>
                <Badge
                  variant={channel.variant}
                  className="text-[10px] px-1.5 py-0"
                >
                  {channel.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-[11px] text-text-ghost">Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
            <div className="flex flex-col gap-3 stagger-children">
              {MESSAGES.map((msg) => {
                if (msg.sender === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center py-1">
                      <span className="rounded-full bg-bg-raised px-3 py-1 text-[10px] text-text-ghost">
                        {msg.text} · {msg.time}
                      </span>
                    </div>
                  );
                }
                const isAgent = msg.sender === "agent";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 ${
                        isAgent
                          ? "rounded-2xl rounded-br-sm bg-bg-surface"
                          : "rounded-2xl rounded-bl-sm bg-bg-raised"
                      }`}
                    >
                      <p className="text-[13px] leading-[1.65] text-text-primary">
                        {msg.text}
                      </p>
                      <p className="mt-0.5 text-right font-mono text-[10px] text-text-ghost">
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Typing indicator */}
          <div className="px-4 pb-2">
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-bg-raised px-4 py-3">
                <div
                  className="typing-indicator flex items-center gap-1"
                  aria-label="Digitando…"
                  role="status"
                >
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          </div>

          {/* AI suggestion (inline, compact) */}
          <div className="border-t border-border-subtle bg-bg-base px-4 py-3">
            <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info-muted px-3 py-2 animate-ai-hint">
              <Bot className="h-4 w-4 shrink-0 text-info mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] leading-[1.5] text-text-secondary">
                  Lucas é{" "}
                  <span className="font-medium text-text-primary">
                    Champion (RFM)
                  </span>
                  . Oferecer frete grátis no próximo pedido?
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-[11px] h-8"
              >
                Aplicar
              </Button>
            </div>
          </div>

          {/* Compose */}
          <div className="border-t border-border-subtle bg-bg-base px-4 py-3">
            <div className="flex items-center gap-2">
              {/* Quick replies (like chat-and-inbox-2 bottom bar) */}
              <div className="flex items-center gap-1 mr-1">
                {["Obrigado!", "Vou verificar", "Um momento"].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    className="rounded-md bg-bg-raised px-2.5 py-1.5 text-[11px] text-text-muted hover:bg-bg-surface hover:text-text-primary transition-colors cursor-pointer min-h-[28px]"
                  >
                    {quick}
                  </button>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <Input
                  placeholder="Escrever mensagem…"
                  aria-label="Escrever mensagem"
                  className="border-border-default bg-bg-raised text-[13px]"
                />
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-raised hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Anexar arquivo"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <Button
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Enviar mensagem"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </main>

        {/* ============================================================= */}
        {/* COL 3: Contact profile panel (right, like chat-and-inbox-2)     */}
        {/* ============================================================= */}
        <aside className="flex flex-col border-l border-border-subtle bg-bg-base overflow-y-auto scrollbar-thin animate-slide-in-right">
          {/* Profile header */}
          <div className="flex flex-col items-center border-b border-border-subtle px-4 py-5">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full text-[20px] font-medium ${activeConv.avatarColor}`}
            >
              {activeConv.name.charAt(0)}
            </span>
            <p className="mt-2.5 text-[15px] font-medium text-text-white">
              {CONTACT_PROFILE.name}
            </p>
            <Badge variant={channel.variant} className="mt-1 text-[10px]">
              {channel.label}
            </Badge>
          </div>

          {/* Tags */}
          <div className="border-b border-border-subtle px-4 py-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="violet" className="text-[10px]">
                VIP
              </Badge>
              <Badge variant="emerald" className="text-[10px]">
                Recorrente
              </Badge>
              <Badge variant="info" className="text-[10px]">
                Champion
              </Badge>
              <button
                type="button"
                className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-border-default text-text-ghost hover:text-text-primary cursor-pointer"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Contact info */}
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-2">
              Contato
            </p>
            <div className="flex flex-col gap-2 stagger-children">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-text-ghost" />
                <span className="text-[12px] text-text-secondary">
                  {CONTACT_PROFILE.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-text-ghost" />
                <span className="font-mono text-[12px] text-text-secondary">
                  {CONTACT_PROFILE.phone}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-text-ghost" />
                <span className="text-[12px] text-text-secondary">
                  {CONTACT_PROFILE.city}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border-b border-border-subtle px-4 py-3">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-2">
              Métricas
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-bg-raised p-3">
                <p className="font-mono text-[14px] tabular-nums text-text-white">
                  {CONTACT_PROFILE.ltv}
                </p>
                <p className="text-[10px] text-text-muted">LTV</p>
              </div>
              <div className="rounded-md bg-bg-raised p-3">
                <p className="font-mono text-[14px] tabular-nums text-text-white">
                  {CONTACT_PROFILE.orders}
                </p>
                <p className="text-[10px] text-text-muted">Pedidos</p>
              </div>
            </div>
          </div>

          {/* Timeline (like chat-and-inbox-2 Profile > Timeline tab) */}
          <div className="px-4 py-3">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-2">
              Histórico
            </p>
            <div className="flex flex-col stagger-children">
              {CONTACT_PROFILE.timeline.map((item, i) => (
                <div key={item.event} className="flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${i === 0 ? "bg-info-muted" : "bg-bg-raised"}`}
                    >
                      <ShoppingBag
                        className={`h-2.5 w-2.5 ${i === 0 ? "text-info" : "text-text-ghost"}`}
                      />
                    </span>
                    {i < CONTACT_PROFILE.timeline.length - 1 && (
                      <div className="w-px flex-1 bg-border-subtle my-0.5" />
                    )}
                  </div>
                  <div className="pb-3 min-w-0">
                    <p className="text-[12px] font-medium text-text-primary">
                      {item.event}
                    </p>
                    <p className="text-[11px] text-text-muted">{item.detail}</p>
                    <p className="font-mono text-[10px] text-text-ghost mt-0.5">
                      {item.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
