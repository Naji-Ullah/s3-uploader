import { InputHTMLAttributes } from "react";

import clsx from "clsx";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, className, ...props }: TextFieldProps): JSX.Element {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink/90">{label}</span>
      <input
        className={clsx(
          "w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-ink outline-none transition",
          "placeholder:text-ink/40 focus:border-sky focus:ring-4 focus:ring-sky/20",
          error && "border-ember focus:border-ember focus:ring-ember/20",
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-ember">{error}</span> : null}
    </label>
  );
}
