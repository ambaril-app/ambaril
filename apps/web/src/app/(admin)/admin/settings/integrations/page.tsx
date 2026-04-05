import { getIntegrationsData } from "./actions";
import { IntegrationsClient } from "./components/integrations-client";

export const metadata = { title: "Integrações — Ambaril" };

export default async function IntegrationsPage() {
  const providers = await getIntegrationsData();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[32px] font-medium leading-[1.2] tracking-[-0.01em] text-text-white">
          Integrações
        </h1>
        <p className="mt-1 text-[14px] leading-[1.65] text-text-secondary">
          Conecte as plataformas que sua loja já usa. Os módulos do Ambaril
          usarão essas conexões automaticamente.
        </p>
      </div>
      <IntegrationsClient initialProviders={providers} />
    </div>
  );
}
