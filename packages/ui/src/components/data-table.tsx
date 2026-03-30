"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "./checkbox";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataTableColumn<T> {
  /** Unique key matching a field in the data row */
  key: string;
  /** Column header label */
  label: string;
  /** Whether the column is sortable */
  sortable?: boolean;
  /** Custom cell renderer */
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface DataTablePagination {
  /** Current page (1-indexed) */
  page: number;
  /** Rows per page */
  pageSize: number;
  /** Total rows across all pages */
  total: number;
  /** Callback when user changes page */
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row data */
  data: T[];
  /** Pagination config -- omit for unpaginated tables */
  pagination?: DataTablePagination;
  /** Callback when a sortable column header is clicked */
  onSort?: (key: string, direction: "asc" | "desc") => void;
  /** Currently sorted column key */
  sortKey?: string;
  /** Current sort direction */
  sortDirection?: "asc" | "desc";
  /** Enable row selection checkboxes */
  selectable?: boolean;
  /** Controlled set of selected row keys */
  selectedKeys?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Extract a unique key from each row. Defaults to `row.id` */
  getRowKey?: (row: T) => string;
  /** Show a loading spinner overlay */
  isLoading?: boolean;
  /** Custom empty state when data is empty */
  emptyState?: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultGetRowKey = <T extends Record<string, unknown>>(row: T): string => {
  const id = row["id"];
  return String(id);
};

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function DataTableInner<T extends Record<string, unknown>>(
  {
    columns,
    data,
    pagination,
    onSort,
    sortKey,
    sortDirection,
    selectable = false,
    selectedKeys,
    onSelectionChange,
    getRowKey = defaultGetRowKey,
    isLoading = false,
    emptyState,
    className,
  }: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  // --- Sort handler --------------------------------------------------------
  const handleSortClick = React.useCallback(
    (key: string) => {
      if (!onSort) return;
      if (sortKey === key) {
        onSort(key, sortDirection === "asc" ? "desc" : "asc");
      } else {
        onSort(key, "asc");
      }
    },
    [onSort, sortKey, sortDirection],
  );

  // --- Selection -----------------------------------------------------------
  const allKeys = React.useMemo(
    () => new Set(data.map((row) => getRowKey(row))),
    [data, getRowKey],
  );

  const allSelected =
    selectable && selectedKeys
      ? data.length > 0 && data.every((row) => selectedKeys.has(getRowKey(row)))
      : false;

  const handleSelectAll = React.useCallback(
    (checked: boolean) => {
      if (!onSelectionChange) return;
      if (checked) {
        onSelectionChange(new Set(allKeys));
      } else {
        onSelectionChange(new Set());
      }
    },
    [onSelectionChange, allKeys],
  );

  const handleSelectRow = React.useCallback(
    (rowKey: string, checked: boolean) => {
      if (!onSelectionChange || !selectedKeys) return;
      const next = new Set(selectedKeys);
      if (checked) {
        next.add(rowKey);
      } else {
        next.delete(rowKey);
      }
      onSelectionChange(next);
    },
    [onSelectionChange, selectedKeys],
  );

  // --- Pagination ----------------------------------------------------------
  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1;

  const startRow = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1;
  const endRow = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : data.length;

  // --- Empty state ---------------------------------------------------------
  const defaultEmptyState = (
    <div className="flex flex-col items-center justify-center py-12 text-text-muted">
      <p className="text-sm">Nenhum registro encontrado</p>
    </div>
  );

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-base shadow-[var(--shadow-sm)]">
        <div className="relative">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-base/60">
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <svg
                  className="h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Carregando...
              </div>
            </div>
          )}

          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-default bg-table-header-bg">
                {selectable && (
                  <th className="w-12 px-3 py-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted",
                      col.sortable && "cursor-pointer select-none hover:text-text-secondary",
                    )}
                    onClick={col.sortable ? () => handleSortClick(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDirection === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && !isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                  >
                    {emptyState ?? defaultEmptyState}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => {
                  const rowKey = getRowKey(row);
                  const isSelected = selectedKeys?.has(rowKey) ?? false;
                  const isLast = rowIndex === data.length - 1;

                  return (
                    <tr
                      key={rowKey}
                      className={cn(
                        "transition-colors duration-150",
                        !isLast && "border-b border-border-subtle",
                        "hover:bg-table-row-hover",
                        isSelected && "bg-info-muted",
                      )}
                    >
                      {selectable && (
                        <td className="w-12 px-3 py-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectRow(rowKey, checked)
                            }
                            aria-label={`Selecionar linha ${rowKey}`}
                          />
                        </td>
                      )}
                      {columns.map((col) => {
                        const cellValue: unknown = row[col.key];
                        return (
                          <td
                            key={col.key}
                            className="min-w-0 px-4 py-3 text-sm text-text-primary"
                          >
                            {col.render
                              ? col.render(cellValue, row)
                              : renderValue(cellValue)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-1 py-3">
          <p className="text-xs text-text-muted tabular-nums">
            {pagination.total > 0
              ? `${startRow}\u2013${endRow} de ${pagination.total}`
              : "0 registros"}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm",
                "text-text-secondary hover:bg-bg-surface",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
              )}
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm text-text-primary tabular-nums">
              {pagination.page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm",
                "text-text-secondary hover:bg-bg-surface",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
              )}
              aria-label="Proxima pagina"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Cast forwardRef to preserve the generic parameter
const DataTable = React.forwardRef(DataTableInner) as <T extends Record<string, unknown>>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement | null;

export { DataTable };
