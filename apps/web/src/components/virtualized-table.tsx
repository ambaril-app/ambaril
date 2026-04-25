"use client";

/**
 * VirtualizedTable — reference pattern for ERP data tables with 50+ rows.
 * Uses @tanstack/react-virtual for DOM virtualization.
 * Reference: CLAUDE.md P8, DS.md Section 5.2 (Data Table Row recipe)
 *
 * Usage:
 *   <VirtualizedTable
 *     data={orders}
 *     columns={columns}
 *     rowHeight={40}
 *     containerHeight={600}
 *     onRowClick={(row) => openSheet(row.id)}
 *   />
 */

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface Column<T> {
  key: keyof T & string;
  header: string;
  width: number;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  containerHeight?: number;
  onRowClick?: (row: T) => void;
  overscan?: number;
}

export function VirtualizedTable<T extends { id: string }>({
  data,
  columns,
  rowHeight = 40,
  containerHeight = 600,
  onRowClick,
  overscan = 10,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface">
      {/* Fixed header — DS recipe: Bricolage 9-10px uppercase */}
      <div className="sticky top-0 z-10 flex border-b border-border-default bg-bg-raised">
        {columns.map((col) => (
          <div
            key={col.key}
            className="px-3 py-2 font-heading text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted"
            style={{ width: col.width, flexShrink: 0 }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtualized rows */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index];
            return (
              <div
                key={row.id}
                className="absolute flex w-full items-center border-b border-border-subtle font-body text-sm text-text-body transition-colors hover:bg-bg-raised"
                style={{
                  height: rowHeight,
                  transform: `translateY(${virtualRow.start}px)`,
                  cursor: onRowClick ? "pointer" : undefined,
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="truncate px-3"
                    style={{
                      width: col.width,
                      flexShrink: 0,
                      minWidth: 0,
                    }}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? "")}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row count footer */}
      <div className="border-t border-border-subtle px-3 py-2 font-mono text-xs text-text-muted">
        {data.length} registros
      </div>
    </div>
  );
}
