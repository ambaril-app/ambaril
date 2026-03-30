import { requireCreatorSession } from "@/lib/creator-auth";
import { getProducts } from "@/lib/stubs/products";
import { Package } from "lucide-react";
import { EmptyState } from "@ambaril/ui/components/empty-state";

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function ProductsPage() {
  await requireCreatorSession();

  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-text-bright">Produtos</h1>
        <p className="text-sm text-text-secondary">
          Catalogo de produtos disponiveis para divulgacao.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Catalogo indisponivel"
          description="O catalogo de produtos estara disponivel em breve."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-border-default bg-bg-base p-4"
            >
              {/* Image placeholder */}
              <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-bg-surface">
                <Package className="h-8 w-8 text-text-muted" />
              </div>

              <h3 className="text-sm font-medium text-text-bright">
                {product.name}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                R$ {product.price}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
