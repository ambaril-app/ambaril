import { getIntegrationsData } from "./actions";
import { IntegrationsClient } from "./components/integrations-client";

export const metadata = { title: "Integrações — Ambaril" };

export default async function IntegrationsPage() {
  const providers = await getIntegrationsData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-bright">Integrações</h1>
        <p className="mt-1 text-sm text-text-muted">
          Conecte as plataformas que sua loja já usa. Os módulos do Ambaril
          usarão essas conexões automaticamente.
        </p>
      </div>
      <IntegrationsClient initialProviders={providers} />
    </div>
  );
}
