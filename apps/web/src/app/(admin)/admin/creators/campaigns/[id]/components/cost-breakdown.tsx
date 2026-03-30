import { Card, CardHeader, CardTitle, CardContent } from "@ambaril/ui/components/card";
import { Package, Truck, Users, Coins } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CostBreakdownProps {
  totalProductCost: string;
  totalShippingCost: string;
  totalFeeCost: string;
  totalRewardCost: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: string): string {
  const num = parseFloat(value || "0");
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CostBreakdown({
  totalProductCost,
  totalShippingCost,
  totalFeeCost,
  totalRewardCost,
}: CostBreakdownProps) {
  const totalCost =
    parseFloat(totalProductCost || "0") +
    parseFloat(totalShippingCost || "0") +
    parseFloat(totalFeeCost || "0") +
    parseFloat(totalRewardCost || "0");

  const cards = [
    {
      label: "Custo de Produto",
      value: totalProductCost,
      icon: Package,
    },
    {
      label: "Custo de Frete",
      value: totalShippingCost,
      icon: Truck,
    },
    {
      label: "Custo do Creator",
      value: totalFeeCost,
      icon: Users,
    },
    {
      label: "Outros Custos",
      value: totalRewardCost,
      icon: Coins,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-medium text-text-bright">Custos</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-text-muted" />
                  <span className="text-xs text-text-secondary">{card.label}</span>
                </div>
              </CardHeader>
              <CardContent>
                <span className="font-mono text-lg font-medium text-text-bright">
                  R$ {formatCurrency(card.value)}
                </span>
              </CardContent>
            </Card>
          );
        })}

        <Card className="border-border-strong bg-bg-raised">
          <CardHeader>
            <CardTitle className="text-xs text-text-secondary">Custo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-mono text-lg font-medium text-text-bright">
              R$ {formatCurrency(totalCost.toFixed(2))}
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
