import { PropsWithChildren, ReactNode } from "react";

interface AuthShellProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps): JSX.Element {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-14 sm:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-dune/70 blur-3xl" />
        <div className="absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-sky/20 blur-3xl" />
      </div>

      <section className="relative z-10 w-full max-w-md animate-floatIn rounded-3xl border border-white/80 bg-white/80 p-6 shadow-panel backdrop-blur-lg sm:p-8">
        <header className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="text-sm text-ink/70">{subtitle}</p>
        </header>

        <div className="space-y-4">{children}</div>

        <footer className="mt-6 text-sm text-ink/70">{footer}</footer>
      </section>
    </main>
  );
}
