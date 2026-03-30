"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@ambaril/ui/components/avatar";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { Modal } from "@ambaril/ui/components/modal";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { Input } from "@ambaril/ui/components/input";
import { CheckCircle, XCircle, Ban, RotateCcw, Star, ExternalLink } from "lucide-react";
import { approveCreator, rejectCreator, suspendCreator, reactivateCreator } from "@/app/actions/creators/lifecycle";
import { adjustPoints } from "@/app/actions/creators/points";
import { previewCreatorPortal } from "@/app/actions/creators/preview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorHeaderProps {
  creator: {
    id: string;
    name: string;
    status: "pending" | "active" | "suspended" | "inactive";
    tierName: string | null;
    tierSlug: string | null;
    profileImageUrl: string | null;
    totalSalesAmount: string;
    totalPoints: number;
    commissionRate: string;
    couponCode: string | null;
  };
}

type ActionType = "approve" | "reject" | "suspend" | "reactivate" | "adjust-points" | null;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CreatorHeader({ creator }: CreatorHeaderProps) {
  const router = useRouter();
  const [actionType, setActionType] = React.useState<ActionType>(null);
  const [reason, setReason] = React.useState("");
  const [pointsAmount, setPointsAmount] = React.useState("");
  const [pointsReason, setPointsReason] = React.useState("");
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleAction() {
    setProcessing(true);
    setError(null);

    try {
      let result: { error?: string };

      switch (actionType) {
        case "approve":
          result = await approveCreator(creator.id);
          break;
        case "reject":
          result = await rejectCreator(creator.id, reason);
          break;
        case "suspend":
          result = await suspendCreator(creator.id, reason);
          break;
        case "reactivate":
          result = await reactivateCreator(creator.id);
          break;
        case "adjust-points": {
          const pts = parseInt(pointsAmount, 10);
          if (isNaN(pts) || pts === 0) {
            setError("Pontos devem ser um numero diferente de zero");
            setProcessing(false);
            return;
          }
          result = await adjustPoints(creator.id, {
            points: pts,
            reason: pointsReason,
          });
          break;
        }
        default:
          setProcessing(false);
          return;
      }

      if (result.error) {
        setError(result.error);
      } else {
        setActionType(null);
        setReason("");
        setPointsAmount("");
        setPointsReason("");
        router.refresh();
      }
    } finally {
      setProcessing(false);
    }
  }

  function closeModal() {
    setActionType(null);
    setReason("");
    setPointsAmount("");
    setPointsReason("");
    setError(null);
  }

  const needsReason = actionType === "reject" || actionType === "suspend";
  const isPointsAdjust = actionType === "adjust-points";

  const modalTitle: Record<string, string> = {
    approve: "Aprovar Creator",
    reject: "Rejeitar Creator",
    suspend: "Suspender Creator",
    reactivate: "Reativar Creator",
    "adjust-points": "Ajustar Pontos",
  };

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left side: Avatar + info */}
        <div className="flex items-center gap-4">
          <Avatar
            name={creator.name}
            src={creator.profileImageUrl ?? undefined}
            size="lg"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-medium text-text-bright">
                {creator.name}
              </h1>
              <StatusBadge status={creator.status} />
              {creator.tierName && (
                <Badge variant="secondary">{creator.tierName}</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {creator.couponCode && (
                <span>
                  Cupom: <span className="font-mono">{creator.couponCode}</span>
                </span>
              )}
              <span>
                Comissao: <span className="font-mono">{creator.commissionRate}%</span>
              </span>
              <span>
                Vendas:{" "}
                <span className="font-mono">
                  R$ {Number(creator.totalSalesAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </span>
              <span>
                Pontos: <span className="font-mono">{creator.totalPoints.toLocaleString("pt-BR")}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {creator.status === "pending" && (
            <>
              <Button onPress={() => setActionType("approve")}>
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Aprovar
              </Button>
              <Button variant="destructive" onPress={() => setActionType("reject")}>
                <XCircle className="mr-1.5 h-4 w-4" />
                Rejeitar
              </Button>
            </>
          )}
          {creator.status === "active" && (
            <Button variant="destructive" onPress={() => setActionType("suspend")}>
              <Ban className="mr-1.5 h-4 w-4" />
              Suspender
            </Button>
          )}
          {creator.status === "suspended" && (
            <Button onPress={() => setActionType("reactivate")}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reativar
            </Button>
          )}
          <Button variant="outline" onPress={() => setActionType("adjust-points")}>
            <Star className="mr-1.5 h-4 w-4" />
            Ajustar Pontos
          </Button>
          {creator.status === "active" && (
            <Button
              variant="outline"
              onPress={async () => {
                const result = await previewCreatorPortal(creator.id);
                if (result.redirectUrl) {
                  window.open(result.redirectUrl, "_blank");
                }
              }}
            >
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Pre-visualizar portal
            </Button>
          )}
        </div>
      </div>

      {/* Action modal */}
      <Modal
        isOpen={actionType !== null}
        onClose={closeModal}
        title={actionType ? modalTitle[actionType] ?? "" : ""}
        size="sm"
      >
        <div className="space-y-4">
          {/* Confirm message for simple actions */}
          {actionType === "approve" && (
            <p className="text-sm text-text-secondary">
              Confirma a aprovação de <strong>{creator.name}</strong>? Um cupom será gerado automaticamente e o creator será ativado.
            </p>
          )}
          {actionType === "reactivate" && (
            <p className="text-sm text-text-secondary">
              Confirma a reativação de <strong>{creator.name}</strong>? O status voltará para ativo.
            </p>
          )}

          {/* Reason input */}
          {needsReason && (
            <FormTextarea
              label="Motivo"
              placeholder="Descreva o motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          )}

          {/* Points adjustment */}
          {isPointsAdjust && (
            <>
              <Input
                label="Pontos (positivo para adicionar, negativo para remover)"
                type="number"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                placeholder="Ex: 100 ou -50"
                required
              />
              <FormTextarea
                label="Motivo do ajuste"
                placeholder="Descreva o motivo do ajuste manual..."
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                required
              />
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onPress={closeModal}>
              Cancelar
            </Button>
            <Button
              variant={
                actionType === "reject" || actionType === "suspend"
                  ? "destructive"
                  : "default"
              }
              onPress={handleAction}
              disabled={
                processing ||
                (needsReason && reason.trim().length === 0) ||
                (isPointsAdjust && (pointsAmount === "" || pointsReason.trim().length < 10))
              }
            >
              {processing ? "Processando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export { CreatorHeader };
