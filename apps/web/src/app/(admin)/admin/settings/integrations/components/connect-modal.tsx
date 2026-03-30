"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
import { cn } from "@ambaril/ui/lib/utils";
import type { ProviderWithStatus, ConfigField } from "../actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConnectModalProps {
  provider: ProviderWithStatus;
  open: boolean;
  onClose: () => void;
  onSave: (credentials: Record<string, string>) => Promise<void>;
}

type FormValues = Record<string, string>;

// ---------------------------------------------------------------------------
// Password field with show/hide toggle
// ---------------------------------------------------------------------------

interface PasswordFieldProps {
  field: ConfigField;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

function PasswordField({ field, value, error, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);

  return (
    <Input
      type={visible ? "text" : "password"}
      label={field.required ? `${field.label} *` : field.label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      autoComplete="off"
      endContent={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="text-text-muted hover:text-text-secondary transition-colors shrink-0"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      }
    />
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectModal({
  provider,
  open,
  onClose,
  onSave,
}: ConnectModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: provider.configSchema.reduce<FormValues>((acc, f) => {
      acc[f.key] = "";
      return acc;
    }, {}),
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: FormValues) => {
    await onSave(data);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={`Conectar ${provider.name}`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {provider.configSchema.map((field) => {
          const fieldError = errors[field.key]?.message;

          if (field.type === "password") {
            const currentValue = watch(field.key) ?? "";
            return (
              <PasswordField
                key={field.key}
                field={field}
                value={currentValue}
                error={fieldError}
                onChange={(val) => setValue(field.key, val)}
              />
            );
          }

          return (
            <Input
              key={field.key}
              type={field.type === "url" ? "url" : "text"}
              label={field.required ? `${field.label} *` : field.label}
              placeholder={field.type === "url" ? "https://" : undefined}
              error={fieldError}
              {...register(field.key, {
                required: field.required ? "Este campo é obrigatório" : false,
                validate: (val) => {
                  if (!val && !field.required) return true;
                  if (field.type === "url" && val) {
                    try {
                      new URL(val);
                      return true;
                    } catch {
                      return "URL inválida";
                    }
                  }
                  return true;
                },
              })}
            />
          );
        })}

        {provider.configSchema.length === 0 && (
          <p className="text-sm text-text-secondary">
            Nenhuma configuração necessária para este provedor.
          </p>
        )}

        {/* Security notice */}
        <p
          className={cn(
            "rounded-md border border-border-subtle bg-bg-raised px-3 py-2",
            "text-xs text-text-muted",
          )}
        >
          Suas credenciais são criptografadas com AES-256-GCM antes de serem
          salvas.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
