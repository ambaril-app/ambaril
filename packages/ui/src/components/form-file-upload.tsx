"use client";

import * as React from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { cn } from "../lib/utils";

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface FormFileUploadProps {
  name?: string;
  label?: string;
  errorMessage?: string;
  className?: string;
  accept?: string;
  maxSize?: number;
  onUpload?: (file: File) => Promise<string>;
  value?: string;
  preview?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FormFileUpload({
  name,
  label,
  errorMessage,
  className,
  accept,
  maxSize = DEFAULT_MAX_SIZE,
  onUpload,
  value,
  preview = true,
}: FormFileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    value ?? null,
  );
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreviewUrl(value ?? null);
  }, [value]);

  const displayError = errorMessage ?? internalError;

  const isImage = React.useMemo(() => {
    if (!previewUrl) return false;
    return (
      accept?.startsWith("image/") ||
      /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(previewUrl)
    );
  }, [previewUrl, accept]);

  const validateFile = React.useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `Arquivo muito grande. Maximo: ${formatFileSize(maxSize)}`;
      }
      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim());
        const fileType = file.type;
        const fileExt = `.${file.name.split(".").pop()?.toLowerCase()}`;

        const isAccepted = acceptedTypes.some((accepted) => {
          if (accepted.endsWith("/*")) {
            return fileType.startsWith(accepted.replace("/*", "/"));
          }
          if (accepted.startsWith(".")) {
            return fileExt === accepted.toLowerCase();
          }
          return fileType === accepted;
        });

        if (!isAccepted) {
          return "Tipo de arquivo nao permitido";
        }
      }
      return null;
    },
    [maxSize, accept],
  );

  const handleFile = React.useCallback(
    async (file: File) => {
      setInternalError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setInternalError(validationError);
        return;
      }

      if (onUpload) {
        setIsUploading(true);
        try {
          const url = await onUpload(file);
          setPreviewUrl(url);
        } catch {
          setInternalError("Erro ao enviar arquivo. Tente novamente.");
        } finally {
          setIsUploading(false);
        }
      } else {
        // No upload handler — show local preview
        const localUrl = URL.createObjectURL(file);
        setPreviewUrl(localUrl);
      }
    },
    [onUpload, validateFile],
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [],
  );

  const handleDragLeave = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    [],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        void handleFile(file);
      }
    },
    [handleFile],
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleFile(file);
      }
    },
    [handleFile],
  );

  const handleClear = React.useCallback(() => {
    setPreviewUrl(null);
    setInternalError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const handleClick = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm text-text-secondary">{label}</label>
      )}

      {preview && previewUrl && isImage ? (
        <div className="relative rounded-lg border border-border-default bg-bg-raised p-2">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-32 w-full rounded-md object-contain"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-bg-elevated text-text-secondary transition-colors duration-150 hover:text-text-primary"
            aria-label="Remover arquivo"
          >
            <X size={14} />
          </button>
        </div>
      ) : previewUrl && !isImage ? (
        <div className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-raised px-3 py-2">
          <FileIcon size={16} className="text-text-muted" />
          <span className="flex-1 truncate text-sm text-text-primary">
            {previewUrl.split("/").pop() ?? "Arquivo enviado"}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="flex h-5 w-5 items-center justify-center rounded-full text-text-secondary transition-colors duration-150 hover:text-text-primary"
            aria-label="Remover arquivo"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 transition-colors duration-200",
            isDragging
              ? "border-border-strong bg-bg-surface"
              : "border-border-default bg-bg-raised hover:border-border-strong hover:bg-bg-surface",
            isUploading && "pointer-events-none opacity-60",
          )}
        >
          <Upload
            size={24}
            className={cn(
              "transition-colors duration-150",
              isDragging ? "text-text-primary" : "text-text-muted",
            )}
          />
          <div className="text-center">
            <span className="text-sm text-text-secondary">
              {isUploading
                ? "Enviando..."
                : "Arraste um arquivo ou clique para selecionar"}
            </span>
            <p className="mt-0.5 text-xs text-text-ghost">
              Max. {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {name && <input type="hidden" name={name} value={previewUrl ?? ""} />}

      {displayError && (
        <span className="text-xs text-danger">{displayError}</span>
      )}
    </div>
  );
}
FormFileUpload.displayName = "FormFileUpload";

export { FormFileUpload };
