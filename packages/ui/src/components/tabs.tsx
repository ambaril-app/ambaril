"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TabItem {
  /** Unique identifier for the tab */
  key: string;
  /** Tab label displayed in the tab bar */
  label: string;
  /** Content rendered when the tab is active */
  content: React.ReactNode;
}

export interface TabsProps {
  /** Tab definitions */
  tabs: TabItem[];
  /** Controlled selected tab key */
  selectedKey?: string;
  /** Callback when active tab changes */
  onSelectionChange?: (key: string) => void;
  /** Additional className on the tabs wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Tabs({ tabs, selectedKey, onSelectionChange, className }: TabsProps) {
  const defaultValue = tabs[0]?.key;

  return (
    <TabsPrimitive.Root
      value={selectedKey}
      defaultValue={selectedKey ? undefined : defaultValue}
      onValueChange={onSelectionChange}
      className={cn("w-full", className)}
    >
      <TabsPrimitive.List className="flex gap-6 w-full border-b border-border-default px-0">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.key}
            value={tab.key}
            className={cn(
              "relative px-0 h-10 text-sm font-medium transition-colors duration-150",
              "text-text-secondary hover:text-text-primary",
              "data-[state=active]:text-text-bright",
              "border-b-2 border-transparent data-[state=active]:border-text-bright",
              "-mb-px cursor-pointer bg-transparent",
            )}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.key} value={tab.key} className="pt-4">
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

export { Tabs };
export type { TabItem as TabDefinition };
