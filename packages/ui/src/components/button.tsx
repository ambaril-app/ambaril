import * as React from "react";
import { Button as HeroButton } from "@heroui/react";
import type { ButtonProps as HeroButtonProps } from "@heroui/react";
import { cn } from "../lib/utils";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onPress?: () => void;
  "aria-label"?: string;
}

const VARIANT_MAP: Record<ButtonVariant, { color: HeroButtonProps["color"]; variant: HeroButtonProps["variant"] }> = {
  default: { color: "primary", variant: "solid" },
  destructive: { color: "danger", variant: "solid" },
  outline: { color: "default", variant: "bordered" },
  secondary: { color: "default", variant: "flat" },
  ghost: { color: "default", variant: "light" },
  link: { color: "primary", variant: "light" },
};

const SIZE_MAP: Record<ButtonSize, HeroButtonProps["size"]> = {
  default: "md",
  sm: "sm",
  lg: "lg",
  icon: "sm",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", disabled, onPress, children, type, "aria-label": ariaLabel }, ref) => {
    const mapped = VARIANT_MAP[variant];
    const heroSize = SIZE_MAP[size];

    return (
      <HeroButton
        ref={ref}
        color={mapped.color}
        variant={mapped.variant}
        size={heroSize}
        isDisabled={disabled}
        onPress={onPress}
        type={type}
        aria-label={ariaLabel}
        className={cn(
          size === "icon" && "min-w-9 w-9 px-0",
          variant === "link" && "underline-offset-4 data-[hover=true]:underline",
          className,
        )}
      >
        {children}
      </HeroButton>
    );
  },
);
Button.displayName = "Button";

export { Button };
