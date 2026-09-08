import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-green)] text-[var(--color-bg)] hover:bg-[var(--color-green-deep)]",
  secondary:
    "bg-[var(--color-brown)] text-white hover:opacity-90",
  outline:
    "border border-[var(--color-ink)]/20 text-[var(--color-ink)] hover:border-[var(--color-ink)]/50 bg-transparent",
  ghost: "text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-3 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
