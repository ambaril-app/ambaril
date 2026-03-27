import * as React from "react";
import { Input as HeroInput } from "@heroui/react";
import { cn } from "../lib/utils";

export interface InputProps {
  name?: string;
  type?: string;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  className?: string;
  value?: string;
  defaultValue?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, errorMessage, disabled, readOnly, ...props }, ref) => {
    return (
      <HeroInput
        ref={ref}
        label={label}
        variant="bordered"
        size="sm"
        isInvalid={!!errorMessage}
        errorMessage={errorMessage}
        isDisabled={disabled}
        isReadOnly={readOnly}
        classNames={{
          inputWrapper: "border-border-default bg-bg-raised data-[hover=true]:border-border-strong data-[focus=true]:border-border-strong",
          input: "text-text-primary placeholder:text-text-ghost",
          label: "text-text-secondary",
        }}
        className={cn(className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
