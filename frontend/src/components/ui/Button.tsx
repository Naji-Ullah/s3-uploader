import { ButtonHTMLAttributes } from "react";

import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ children, className, loading, disabled, ...props }: ButtonProps): JSX.Element {
  return (
    <button
      className={clsx(
        "inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
        "bg-gradient-to-r from-sky to-ink shadow-soft hover:translate-y-[-1px] hover:shadow-panel",
        "disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}
