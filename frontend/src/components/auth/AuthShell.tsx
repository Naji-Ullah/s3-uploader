import { PropsWithChildren, ReactNode } from "react";

interface AuthShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps): JSX.Element {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(39,39,42,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(39,39,42,0.18)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-yellow-300/5 blur-3xl" />
      </div>

      <section className="relative z-10 w-full max-w-md animate-floatIn rounded-xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl shadow-black/40 sm:p-8">
        <header className="mb-6 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-yellow-300">S3 Uploader</p>
          <h1 className="text-3xl font-semibold text-zinc-100">{title}</h1>
          <p className="text-sm text-zinc-400">{subtitle}</p>
        </header>

        <div className="space-y-4">{children}</div>

        <footer className="mt-6 border-t border-zinc-800 pt-4 text-sm text-zinc-500">{footer}</footer>
      </section>
    </main>
  );
}
