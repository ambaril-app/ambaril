"use client";

import * as React from "react";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { Search } from "lucide-react";
import { cn } from "../lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  group?: string;
}

export interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;
  className?: string;
}

export function CommandPalette({
  items,
  placeholder = "Buscar...",
  className,
}: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Group items
  const groups = React.useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of items) {
      const group = item.group ?? "";
      const arr = map.get(group) ?? [];
      arr.push(item);
      map.set(group, arr);
    }
    return map;
  }, [items]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2",
            "rounded-xl border border-border-default bg-bg-base shadow-[var(--shadow-xl)]",
            "outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            className,
          )}
        >
          <Command className="flex flex-col" label="Command palette">
            <div className="flex items-center gap-2 border-b border-border-default px-3">
              <Search className="h-4 w-4 shrink-0 text-text-muted" />
              <Command.Input
                placeholder={placeholder}
                className="flex-1 bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-ghost"
              />
              <kbd className="hidden rounded bg-bg-raised px-1.5 py-0.5 text-[10px] font-medium text-text-muted sm:inline-block">
                ESC
              </kbd>
            </div>
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-text-muted">
                Nenhum resultado encontrado
              </Command.Empty>
              {[...groups.entries()].map(([group, groupItems]) => (
                <React.Fragment key={group}>
                  {group && (
                    <Command.Group
                      heading={group}
                      className="px-1 py-1.5 text-[10px] font-medium uppercase tracking-widest text-text-ghost"
                    >
                      {groupItems.map((item) => (
                        <Command.Item
                          key={item.id}
                          value={item.label}
                          onSelect={() => {
                            item.onSelect();
                            setOpen(false);
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary data-[selected=true]:bg-bg-surface data-[selected=true]:text-text-primary"
                        >
                          {item.icon && (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center text-text-muted">
                              {item.icon}
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {item.label}
                          </span>
                          {item.shortcut && (
                            <kbd className="ml-auto shrink-0 rounded bg-bg-raised px-1.5 py-0.5 text-[10px] text-text-ghost">
                              {item.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                  {!group &&
                    groupItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.label}
                        onSelect={() => {
                          item.onSelect();
                          setOpen(false);
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary data-[selected=true]:bg-bg-surface data-[selected=true]:text-text-primary"
                      >
                        {item.icon && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-text-muted">
                            {item.icon}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {item.shortcut && (
                          <kbd className="ml-auto shrink-0 rounded bg-bg-raised px-1.5 py-0.5 text-[10px] text-text-ghost">
                            {item.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    ))}
                </React.Fragment>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
