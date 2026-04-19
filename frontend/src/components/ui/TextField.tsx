import { forwardRef, InputHTMLAttributes } from "react";

import clsx from "clsx";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, hint, className, ...props },
  ref
): JSX.Element {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">{label}</span>
      <input
        ref={ref}
        className={clsx(
          "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition",
          "placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30",
          error && "border-red-500/80 focus:border-red-500 focus:ring-red-500/30",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-300">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
});
