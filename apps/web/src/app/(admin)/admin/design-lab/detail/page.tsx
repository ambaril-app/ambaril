/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Package,
  FileText,
  Truck,
  CheckCircle,
  Printer,
  Edit3,
  MapPin,
  Mail,
  Phone,
  Plus,
  Tag,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@ambaril/ui/components/card";
import { Badge } from "@ambaril/ui/components/badge";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { Button } from "@ambaril/ui/components/button";
import { ToastProvider, useToast } from "@ambaril/ui/components/toast";
import { cn } from "@ambaril/ui/lib/utils";

// ---------------------------------------------------------------------------
// Section label component (Level 0 Workhorse)
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted mb-2">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const ORDER_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "default" | "info";
  }
> = {
  delivered: { label: "Entregue", variant: "success" },
  shipped: { label: "Enviado", variant: "info" },
  processing: { label: "Em separação", variant: "warning" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

const PAYMENT_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "default" | "info";
  }
> = {
  approved: { label: "Aprovado", variant: "success" },
  pending: { label: "Pendente", variant: "warning" },
  rejected: { label: "Rejeitado", variant: "danger" },
};

interface TimelineEvent {
  id: number;
  label: string;
  timestamp: string;
  icon: React.ElementType;
  iconColor?: string;
  detail?: string;
  detailMono?: boolean;
}

const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 1,
    label: "Entregue",
    timestamp: "03/04/2026 14:00",
    icon: CheckCircle,
    iconColor: "text-success",
  },
  {
    id: 2,
    label: "Enviado",
    timestamp: "01/04/2026 10:30",
    icon: Truck,
    detail: "BR123456789LP",
    detailMono: true,
  },
  {
    id: 3,
    label: "NF-e emitida",
    timestamp: "01/04/2026 09:15",
    icon: FileText,
    detail: "NF 000.123.456",
    detailMono: true,
  },
  {
    id: 4,
    label: "Em separação",
    timestamp: "31/03/2026 16:00",
    icon: Package,
  },
  {
    id: 5,
    label: "Pagamento confirmado",
    timestamp: "31/03/2026 14:25",
    icon: CreditCard,
    iconColor: "text-success",
  },
  {
    id: 6,
    label: "Pedido criado",
    timestamp: "31/03/2026 14:22",
    icon: ShoppingBag,
  },
];

interface OrderItem {
  id: number;
  name: string;
  qty: number;
  unitPrice: number;
}

const ORDER_ITEMS: OrderItem[] = [
  { id: 1, name: "Camiseta Oversized Noir", qty: 1, unitPrice: 189.9 },
  { id: 2, name: "Bucket Hat Concrete", qty: 1, unitPrice: 129.9 },
  { id: 3, name: "Meia Pack x3 Essentials", qty: 1, unitPrice: 89.9 },
];

const SUBTOTAL = 409.7;
const SHIPPING = 19.9;
const TOTAL = 429.6;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): React.ReactNode {
  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <span className="font-mono text-[13px] tabular-nums">
      R$&nbsp;{formatted}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Timeline component
// ---------------------------------------------------------------------------

function TimelineItem({
  event,
  isLast,
}: {
  event: TimelineEvent;
  isLast: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Icon = event.icon;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex gap-3",
        visible ? "animate-fade-in" : "opacity-0",
      )}
    >
      {!isLast && (
        <div className="absolute left-[13px] top-7 bottom-0 w-px bg-border-subtle" />
      )}
      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-raised">
        <Icon
          className={`h-3.5 w-3.5 ${event.iconColor ?? "text-text-secondary"}`}
        />
      </div>
      <div className="flex flex-col gap-0.5 pb-6">
        <p className="text-[14px] text-text-primary leading-tight">
          {event.label}
        </p>
        {event.detail && (
          <p
            className={
              event.detailMono
                ? "font-mono text-[12px] tabular-nums text-text-secondary"
                : "text-[13px] text-text-secondary"
            }
          >
            {event.detail}
          </p>
        )}
        <p className="font-mono text-[12px] tabular-nums text-text-ghost">
          {event.timestamp}
        </p>
      </div>
    </div>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative flex flex-col gap-0">
      {events.map((event, index) => (
        <TimelineItem
          key={event.id}
          event={event}
          isLast={index === events.length - 1}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function OrderDetailContent() {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-6 pb-20 lg:pb-0">
      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <button
          className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary transition-colors cursor-pointer w-fit min-h-[36px]"
          aria-label="Voltar para pedidos"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Pedidos
        </button>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
              #AM-4821
            </h1>
            <StatusBadge status="delivered" statusMap={ORDER_STATUS_MAP} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({
                  variant: "success",
                  message: "NF-e enviada para impressão.",
                })
              }
            >
              <Printer className="mr-1.5 h-3.5 w-3.5" />
              Imprimir NF-e
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({ variant: "info", message: "Abrindo editor de pedido…" })
              }
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Editar pedido
            </Button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Two-column layout */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* ------------------------------------------------------------- */}
        {/* Left column — main content */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Timeline / Activity Log */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Atividade</SectionLabel>
            <Timeline events={TIMELINE_EVENTS} />
          </Card>

          {/* Order items */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Itens do pedido</SectionLabel>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-border-subtle">
                    <th className="pb-2 text-left text-[12px] font-medium text-text-muted">
                      Produto
                    </th>
                    <th className="pb-2 text-right text-[12px] font-medium text-text-muted w-16">
                      Qtd
                    </th>
                    <th className="pb-2 text-right text-[12px] font-medium text-text-muted w-28">
                      Preço unit.
                    </th>
                    <th className="pb-2 text-right text-[12px] font-medium text-text-muted w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ORDER_ITEMS.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border-subtle last:border-b-0"
                    >
                      <td className="py-2.5 text-[14px] text-text-primary">
                        {item.name}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[13px] tabular-nums text-text-secondary">
                        {item.qty}
                      </td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(item.qty * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex flex-col gap-1.5 border-t border-border-subtle pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">
                  Subtotal
                </span>
                {formatCurrency(SUBTOTAL)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-text-secondary">Frete</span>
                {formatCurrency(SHIPPING)}
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle">
                <span className="text-[14px] font-medium text-text-primary">
                  Total
                </span>
                <span className="font-mono text-[14px] font-semibold tabular-nums text-text-primary">
                  R$&nbsp;
                  {TOTAL.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Pagamento</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-text-ghost">Método</span>
                <span className="text-[14px] text-text-primary">
                  Cartão de crédito (Visa ****4821)
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-text-ghost">Parcelas</span>
                <span className="font-mono text-[13px] tabular-nums text-text-primary">
                  3x R$&nbsp;143,20
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-text-ghost">Status</span>
                <div>
                  <StatusBadge
                    status="approved"
                    statusMap={PAYMENT_STATUS_MAP}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-text-ghost">Gateway</span>
                <span className="text-[14px] text-text-primary">
                  Mercado Pago
                </span>
              </div>
            </div>
          </Card>

          {/* Shipping */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Envio</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-text-ghost">
                  Transportadora
                </span>
                <span className="text-[14px] text-text-primary">
                  Melhor Envio (PAC)
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-text-ghost">Rastreio</span>
                <a
                  href="#"
                  className="inline-flex items-center gap-1 font-mono text-[13px] tabular-nums text-info hover:underline"
                >
                  BR123456789LP
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-text-ghost">Previsão</span>
                <span className="font-mono text-[13px] tabular-nums text-text-primary">
                  03/04/2026
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[12px] text-text-ghost">Peso</span>
                <span className="font-mono text-[13px] tabular-nums text-text-primary">
                  0,8 kg
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Right column — sidebar */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          {/* Customer */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Cliente</SectionLabel>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-org-emerald-bg text-org-emerald-text text-[14px] font-semibold">
                L
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[14px] font-medium text-text-primary truncate">
                  Lucas Ferreira
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                <Mail className="h-3.5 w-3.5 shrink-0 text-text-ghost" />
                <span className="truncate">lucas.ferreira@email.com</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="h-3.5 w-3.5 shrink-0 text-text-ghost" />
                <span className="font-mono text-[13px] tabular-nums">
                  (21) 99876-5432
                </span>
              </div>
            </div>
            <a
              href="#"
              className="mt-3 inline-flex items-center gap-1 text-[13px] text-info hover:underline"
            >
              Ver perfil
              <ArrowLeft className="h-3 w-3 rotate-180" />
            </a>
          </Card>

          {/* Address */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Endereço</SectionLabel>
            <div className="flex gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-ghost" />
              <div className="flex flex-col gap-0.5 text-[13px] text-text-secondary leading-relaxed">
                <span>Rua das Palmeiras, 123</span>
                <span>Apto 401</span>
                <span>Rio de Janeiro - RJ</span>
                <span className="font-mono text-[12px] tabular-nums text-text-ghost">
                  22041-080
                </span>
              </div>
            </div>
          </Card>

          {/* Tags */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Tags</SectionLabel>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="violet">VIP</Badge>
              <Badge variant="emerald">Recorrente</Badge>
              <button className="inline-flex items-center gap-1 rounded-md border border-dashed border-border-default px-2 py-0.5 text-[12px] text-text-ghost hover:text-text-secondary hover:border-border-default transition-colors cursor-pointer">
                <Plus className="h-3 w-3" />
                add
              </button>
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-4 shadow-[var(--shadow-sm)]">
            <SectionLabel>Metadados</SectionLabel>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-text-ghost">Criado em</span>
                <span className="font-mono text-[12px] tabular-nums text-text-secondary">
                  31/03/2026 14:22
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-text-ghost">
                  Atualizado em
                </span>
                <span className="font-mono text-[12px] tabular-nums text-text-secondary">
                  03/04/2026 14:00
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-text-ghost">Canal</span>
                <div>
                  <Badge variant="slate">Site</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[12px] text-text-ghost">Origem</span>
                <span className="text-[13px] text-text-secondary">
                  Instagram Ad
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Mobile sticky CTA (DS §10 — Ana Clara mobile-only) */}
      {/* ----------------------------------------------------------------- */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border-default bg-bg-base px-4 py-3 lg:hidden">
        <Button
          className="w-full min-h-[44px]"
          onClick={() =>
            toast({
              variant: "success",
              message: "Pedido marcado como enviado.",
            })
          }
        >
          <Truck className="mr-1.5 h-4 w-4" />
          Marcar como enviado
        </Button>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Toast Demo */}
      {/* ----------------------------------------------------------------- */}
      <Card className="p-4 shadow-[var(--shadow-sm)]">
        <SectionLabel>Feedback — Toast demos</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() =>
              toast({
                variant: "success",
                message: "Pedido marcado como enviado.",
              })
            }
          >
            Success
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast({
                variant: "danger",
                message: "Falha ao emitir NF-e. Verifique a integração.",
                actionLabel: "Ver integrações",
                onAction: () => {},
              })
            }
          >
            Error + Action
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast({
                variant: "warning",
                message: "Estoque crítico: Camiseta Preta P — 3 unidades.",
              })
            }
          >
            Warning
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast({
                variant: "info",
                message: "Sincronizando dados do Shopify…",
                duration: 6000,
              })
            }
          >
            Info (6s)
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <ToastProvider>
      <OrderDetailContent />
    </ToastProvider>
  );
}
