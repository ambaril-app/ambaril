import { Card, CardContent, CardHeader, CardTitle } from "@ambaril/ui/components/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BalanceCardProps {
  grossAmount: string;
  irrfWithheld: string;
  issWithheld: string;
  netAmount: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: string | number): string {
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function BalanceCard({ grossAmount, irrfWithheld, issWithheld, netAmount }: BalanceCardProps) {
  return (
    <Card className="border-border-strong">
      <CardHeader>
        <CardTitle className="text-sm text-text-secondary">Resumo de Ganhos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-text-muted">Bruto</p>
            <p className="font-display text-xl font-medium text-text-bright">
              R$ {formatCurrency(grossAmount)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-text-muted">IRRF retido</p>
            <p className="font-display text-xl font-medium text-warning">
              - R$ {formatCurrency(irrfWithheld)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-text-muted">ISS retido</p>
            <p className="font-display text-xl font-medium text-warning">
              - R$ {formatCurrency(issWithheld)}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-text-muted">Liquido</p>
            <p className="font-display text-2xl font-medium text-success">
              R$ {formatCurrency(netAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { BalanceCard };
