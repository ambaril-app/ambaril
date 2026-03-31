import { Card, CardContent, CardHeader, CardTitle } from "@ambaril/ui/components/card";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaxProfileSectionProps {
  taxpayerType: string | null;
  cpf: string;
  cnpj: string | null;
  municipalityName: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TAXPAYER_LABELS: Record<string, string> = {
  pf: "Pessoa Fisica",
  mei: "MEI",
  pj: "Pessoa Juridica",
};

function formatCpf(cpf: string): string {
  if (cpf.length !== 11) return cpf;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

function formatCnpj(cnpj: string): string {
  if (cnpj.length !== 14) return cnpj;
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TaxProfileSection({ taxpayerType, cpf, cnpj, municipalityName }: TaxProfileSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-text-secondary">
          Dados Fiscais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-text-muted">Tipo de contribuinte</p>
            <p className="text-sm text-text-primary">
              {taxpayerType ? (TAXPAYER_LABELS[taxpayerType] ?? taxpayerType) : "Nao informado"}
            </p>
            {taxpayerType === "mei" && (
              <p className="text-[11px] text-text-muted">
                MEI: contribuição mensal fixa (DAS). Consulte seu contador sobre retenção de IRRF.
              </p>
            )}
            {taxpayerType === "pj" && (
              <p className="text-[11px] text-text-muted">
                PJ: IRRF e ISS retidos conforme regime tributário. Emita NF-e para cada pagamento.
              </p>
            )}
            {taxpayerType === "pf" && (
              <p className="text-[11px] text-text-muted">
                PF: IRRF retido na fonte conforme tabela progressiva. Declare na sua declaração anual.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs text-text-muted">CPF</p>
            <p className="font-['DM_Mono',monospace] text-sm text-text-primary">
              {formatCpf(cpf)}
            </p>
          </div>

          {cnpj && (
            <div className="space-y-1">
              <p className="text-xs text-text-muted">CNPJ</p>
              <p className="font-['DM_Mono',monospace] text-sm text-text-primary">
                {formatCnpj(cnpj)}
              </p>
            </div>
          )}

          {municipalityName && (
            <div className="space-y-1">
              <p className="text-xs text-text-muted">Municipio</p>
              <p className="text-sm text-text-primary">{municipalityName}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { TaxProfileSection };
