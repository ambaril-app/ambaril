"use client";

/**
 * HoverPrefetchLink — prefetches route only on hover intent.
 * Prevents prefetching 20+ sidebar routes on viewport entry.
 * Reference: CLAUDE.md P11, Brotzky's hover-prefetch pattern.
 *
 * Usage (sidebar):
 *   <HoverPrefetchLink href="/orders">Pedidos</HoverPrefetchLink>
 *
 * Usage (data table row with API prefetch):
 *   <HoverPrefetchLink
 *     href={`/orders/${id}`}
 *     onPrefetch={() => queryClient.prefetchQuery({ queryKey: ['order', id], queryFn: ... })}
 *   >
 *     {orderNumber}
 *   </HoverPrefetchLink>
 */

import { useState, useCallback } from "react";
import Link, { type LinkProps } from "next/link";

interface HoverPrefetchLinkProps extends Omit<LinkProps, "prefetch"> {
  children: React.ReactNode;
  className?: string;
  onPrefetch?: () => void;
}

export function HoverPrefetchLink({
  children,
  className,
  onPrefetch,
  ...linkProps
}: HoverPrefetchLinkProps) {
  const [shouldPrefetch, setShouldPrefetch] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!shouldPrefetch) {
      setShouldPrefetch(true);
      onPrefetch?.();
    }
  }, [shouldPrefetch, onPrefetch]);

  return (
    <Link
      {...linkProps}
      prefetch={shouldPrefetch ? undefined : false}
      className={className}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </Link>
  );
}
