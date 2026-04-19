import { ButtonHTMLAttributes } from "react";

import clsx from "clsx";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-yellow-400 bg-yellow-400 text-zinc-950 hover:bg-yellow-300 hover:border-yellow-300 disabled:hover:bg-yellow-400",
  outline:
    "border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-yellow-400 hover:text-yellow-300",
  ghost: "border border-transparent bg-transparent text-zinc-200 hover:border-zinc-700 hover:text-yellow-300",
  danger: "border border-red-500/70 bg-red-500/10 text-red-300 hover:bg-red-500/20"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "rounded-md px-3 py-2 text-xs",
  md: "rounded-lg px-4 py-3 text-sm"
};

export function Button({
  children,
  className,
  loading,
  disabled,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button
      className={clsx(
        "inline-flex w-full items-center justify-center gap-2 font-semibold uppercase tracking-[0.16em] transition",
        "disabled:cursor-not-allowed disabled:opacity-60",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
