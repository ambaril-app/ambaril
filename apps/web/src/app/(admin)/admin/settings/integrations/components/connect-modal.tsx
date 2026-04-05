"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Plug, ShieldCheck } from "lucide-react";
import { Modal } from "@ambaril/ui/components/modal";
import { Button } from "@ambaril/ui/components/button";
import { Input } from "@ambaril/ui/components/input";
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
          className="text-text-muted hover:text-text-secondary transition-colors shrink-0 cursor-pointer"
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

  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: FormValues) => {
    await onSave(data);
  };

  return (
    <Modal isOpen={open} onClose={onClose} size="md">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-info-muted">
          <Plug className="h-4 w-4 text-info" strokeWidth={1.75} />
        </div>
        <p className="text-[14px] font-semibold text-text-white">
          Conectar {provider.name}
        </p>
        <p className="mt-1 text-[13px] leading-[1.6] text-text-secondary">
          Insira as credenciais para ativar esta integração.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-3 px-5 pb-4">
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
                placeholder={field.type === "url" ? "https://…" : undefined}
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
            <p className="text-[13px] text-text-secondary">
              Nenhuma configuração necessária para este provedor.
            </p>
          )}
        </div>

        {/* Security notice */}
        <div className="border-t border-border-subtle bg-bg-raised/50 px-5 py-3">
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-text-ghost" />
            Credenciais criptografadas com AES-256-GCM antes de serem salvas.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Salvando…" : "Salvar e conectar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
