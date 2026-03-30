"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataTable, type DataTableColumn } from "@ambaril/ui/components/data-table";
import { Avatar } from "@ambaril/ui/components/avatar";
import { StatusBadge } from "@ambaril/ui/components/status-badge";
import { Badge } from "@ambaril/ui/components/badge";
import { Button } from "@ambaril/ui/components/button";
import { EmptyState } from "@ambaril/ui/components/empty-state";
import { Modal } from "@ambaril/ui/components/modal";
import { FormTextarea } from "@ambaril/ui/components/form-textarea";
import { Users, Plus, CheckCircle, Ban } from "lucide-react";
import { CreatorSummaryCards, type CreatorStats } from "./creator-summary-cards";
import { CreatorFilters, type CreatorFiltersState, type TierOption } from "./creator-filters";
import { listCreators } from "@/app/actions/creators/crud";
import { approveCreator, suspendCreator } from "@/app/actions/creators/lifecycle";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreatorRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "pending" | "active" | "suspended" | "inactive";
  tierName: string | null;
  commissionRate: string;
  totalSalesAmount: string;
  totalSalesCount: number;
  totalPoints: number;
  managedByStaff: boolean;
  couponCode: string | null;
  createdAt: Date;
}

interface CreatorsTableProps {
  initialData: {
    creators: CreatorRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  tiers: TierOption[];
  stats: CreatorStats;
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function buildColumns(): DataTableColumn<Record<string, unknown>>[] {
  return [
    {
      key: "name",
      label: "Creator",
      sortable: true,
      render: (_value, row) => {
        const name = row["name"] as string;
        const id = row["id"] as string;
        return (
          <Link
            href={`/admin/creators/${id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar name={name} size="sm" />
            <span className="text-sm font-medium text-text-bright">{name}</span>
          </Link>
        );
      },
    },
    {
      key: "couponCode",
      label: "Cupom",
      render: (value) => {
        const code = value as string | null;
        return code ? (
          <span className="font-mono text-xs text-text-secondary">{code}</span>
        ) : (
          <span className="text-text-ghost">-</span>
        );
      },
    },
    {
      key: "tierName",
      label: "Tier",
      sortable: true,
      render: (value) => {
        const tier = value as string | null;
        return tier ? <Badge variant="secondary">{tier}</Badge> : <span className="text-text-ghost">-</span>;
      },
    },
    {
      key: "status",
      label: "Status",
      render: (value) => <StatusBadge status={value as string} />,
    },
    {
      key: "totalSalesAmount",
      label: "Vendas",
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm text-text-primary">
          R$ {Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "totalPoints",
      label: "Pontos",
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm text-text-primary">
          {Number(value).toLocaleString("pt-BR")}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Criado em",
      sortable: true,
      render: (value) => {
        const date = value instanceof Date ? value : new Date(value as string);
        return (
          <span className="text-xs text-text-secondary">
            {date.toLocaleDateString("pt-BR")}
          </span>
        );
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CreatorsTable({ initialData, tiers, stats }: CreatorsTableProps) {
  const router = useRouter();
  const [data, setData] = React.useState(initialData);
  const [isLoading, setIsLoading] = React.useState(false);
  const [page, setPage] = React.useState(initialData.page);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [filters, setFilters] = React.useState<CreatorFiltersState>({
    status: "",
    tierId: "",
    managed: undefined,
    search: "",
  });
  const [sortKey, setSortKey] = React.useState<string>("created_at");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");

  // Bulk action state
  const [bulkAction, setBulkAction] = React.useState<"approve" | "suspend" | null>(null);
  const [suspendReason, setSuspendReason] = React.useState("");
  const [bulkProcessing, setBulkProcessing] = React.useState(false);

  // Debounced search
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState(filters.search);

  React.useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [filters.search]);

  // Fetch data when filters/page/sort change
  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const sortMap: Record<string, string> = {
        name: "name",
        totalSalesAmount: "total_sales",
        totalPoints: "total_points",
        tierName: "tier",
        createdAt: "created_at",
      };
      const result = await listCreators({
        page,
        per_page: 25,
        status: filters.status || undefined,
        tierId: filters.tierId || undefined,
        managed: filters.managed,
        search: debouncedSearch || undefined,
        sortBy: sortMap[sortKey] ?? "created_at",
      });

      if (result.data) {
        setData(result.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, filters.status, filters.tierId, filters.managed, debouncedSearch, sortKey, sortDirection]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters.status, filters.tierId, filters.managed, debouncedSearch]);

  // Sort handler
  function handleSort(key: string, direction: "asc" | "desc") {
    setSortKey(key);
    setSortDirection(direction);
  }

  // Bulk approve
  async function handleBulkApprove() {
    setBulkProcessing(true);
    try {
      const promises = Array.from(selectedKeys).map((id) => approveCreator(id));
      await Promise.allSettled(promises);
      setSelectedKeys(new Set());
      setBulkAction(null);
      await fetchData();
    } finally {
      setBulkProcessing(false);
    }
  }

  // Bulk suspend
  async function handleBulkSuspend() {
    if (suspendReason.trim().length === 0) return;
    setBulkProcessing(true);
    try {
      const promises = Array.from(selectedKeys).map((id) =>
        suspendCreator(id, suspendReason.trim()),
      );
      await Promise.allSettled(promises);
      setSelectedKeys(new Set());
      setBulkAction(null);
      setSuspendReason("");
      await fetchData();
    } finally {
      setBulkProcessing(false);
    }
  }

  const columns = React.useMemo(() => buildColumns(), []);

  // Transform data for DataTable (needs Record<string, unknown>)
  const tableData = React.useMemo(
    () =>
      data.creators.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        tierName: c.tierName,
        commissionRate: c.commissionRate,
        totalSalesAmount: c.totalSalesAmount,
        totalSalesCount: c.totalSalesCount,
        totalPoints: c.totalPoints,
        managedByStaff: c.managedByStaff,
        couponCode: c.couponCode,
        createdAt: c.createdAt,
      })) as Record<string, unknown>[],
    [data.creators],
  );

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <CreatorSummaryCards stats={stats} />

      {/* Filter bar */}
      <CreatorFilters
        tiers={tiers}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Bulk actions bar */}
      {selectedKeys.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border-default bg-bg-raised px-4 py-3">
          <span className="text-sm text-text-secondary">
            {selectedKeys.size} selecionado(s)
          </span>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setBulkAction("approve")}
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Aprovar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onPress={() => setBulkAction("suspend")}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Suspender
          </Button>
        </div>
      )}

      {/* Data table */}
      <DataTable
        columns={columns}
        data={tableData}
        isLoading={isLoading}
        selectable
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={handleSort}
        pagination={{
          page,
          pageSize: data.pageSize,
          total: data.total,
          onPageChange: setPage,
        }}
        emptyState={
          <EmptyState
            icon={Users}
            title="Nenhum creator encontrado"
            description="Ajuste os filtros ou cadastre um novo creator."
          />
        }
      />

      {/* Bulk approve modal */}
      <Modal
        isOpen={bulkAction === "approve"}
        onClose={() => setBulkAction(null)}
        title="Aprovar Creators"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Confirma a aprovação de {selectedKeys.size} creator(s)? Cada um
            receberá um cupom e será ativado automaticamente.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onPress={() => setBulkAction(null)}>
              Cancelar
            </Button>
            <Button
              onPress={handleBulkApprove}
              disabled={bulkProcessing}
            >
              {bulkProcessing ? "Aprovando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk suspend modal */}
      <Modal
        isOpen={bulkAction === "suspend"}
        onClose={() => {
          setBulkAction(null);
          setSuspendReason("");
        }}
        title="Suspender Creators"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Suspender {selectedKeys.size} creator(s). Informe o motivo:
          </p>
          <FormTextarea
            label="Motivo da suspensão"
            placeholder="Descreva o motivo..."
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onPress={() => {
                setBulkAction(null);
                setSuspendReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onPress={handleBulkSuspend}
              disabled={bulkProcessing || suspendReason.trim().length === 0}
            >
              {bulkProcessing ? "Suspendendo..." : "Suspender"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export { CreatorsTable };
