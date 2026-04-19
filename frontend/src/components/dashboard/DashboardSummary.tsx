import { DashboardData } from "@/types/auth";

export type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface DashboardSummaryProps {
  data: DashboardData | null;
  socketStatus: SocketStatus;
  socketMessage: string;
}

function getSocketStatusDotClass(status: SocketStatus): string {
  if (status === "connected") return "bg-yellow-400";
  if (status === "connecting") return "bg-zinc-400";
  if (status === "error") return "bg-red-400";
  return "bg-zinc-600";
}

export function DashboardSummary({ data, socketStatus, socketMessage }: DashboardSummaryProps): JSX.Element {
  return (
    <section className="mb-6 grid gap-4 lg:grid-cols-3">
      <article className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">System Message</p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-200">{data?.message ?? "No message received."}</p>
      </article>

      <article className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">Signed In</p>
        <p className="mt-3 text-lg font-semibold text-zinc-100">{data?.user?.name ?? "Unknown"}</p>
        <p className="text-sm text-zinc-400">{data?.user?.email ?? "N/A"}</p>
      </article>

      <article className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">Realtime Link</p>
        <div className="mt-3 flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${getSocketStatusDotClass(socketStatus)}`} />
          <p className="text-sm font-medium capitalize text-zinc-200">{socketStatus}</p>
        </div>
        <p className="mt-2 text-sm text-zinc-400">{socketMessage}</p>
      </article>
    </section>
  );
}
