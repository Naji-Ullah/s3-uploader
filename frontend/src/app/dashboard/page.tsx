"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { fetchDashboardMessage, logoutRequest } from "@/lib/auth-api";
import { clearStoredAuth, getStoredAuth } from "@/lib/auth-storage";
import { getErrorMessage } from "@/lib/error-message";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { DashboardData } from "@/types/auth";

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

function socketStatusColor(status: SocketStatus): string {
  if (status === "connected") return "bg-emerald-500";
  if (status === "connecting") return "bg-amber-500";
  return "bg-ember";
}

export default function DashboardPage(): JSX.Element {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("connecting");
  const [socketMessage, setSocketMessage] = useState("Waiting for realtime events...");

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const auth = getStoredAuth();

    if (!auth?.accessToken) {
      router.replace("/login");
      return;
    }

    try {
      const result = await fetchDashboardMessage();
      setData(result);

      const socket = connectSocket(auth.accessToken);

      setSocketStatus(socket.connected ? "connected" : "connecting");

      socket.off("system:hello");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");

      socket.on("system:hello", (payload: { message: string }) => {
        setSocketMessage(payload.message);
      });

      socket.on("connect", () => {
        setSocketStatus("connected");
      });

      socket.on("disconnect", () => {
        setSocketStatus("disconnected");
      });

      socket.on("connect_error", () => {
        setSocketStatus("error");
      });
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Unable to load dashboard.");
      setError(message);

      if (message.toLowerCase().includes("unauthorized")) {
        clearStoredAuth();
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadDashboard();

    return () => {
      disconnectSocket();
    };
  }, [loadDashboard]);

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);

    try {
      await logoutRequest();
      disconnectSocket();
      router.replace("/login");
    } catch (logoutError) {
      toast.error(getErrorMessage(logoutError, "Logout failed."));
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-14 sm:px-8">
        <section className="w-full animate-floatIn rounded-3xl border border-white/80 bg-white/80 p-8 shadow-panel backdrop-blur-lg">
          <div className="h-6 w-56 animate-pulse rounded bg-sky/20" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-sky/10" />
          <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-sky/10" />
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-14 sm:px-8">
      <section className="w-full animate-floatIn space-y-6 rounded-3xl border border-white/80 bg-white/80 p-6 shadow-panel backdrop-blur-lg sm:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink">Dashboard</h1>
            <p className="mt-1 text-sm text-ink/70">{format(new Date(), "EEEE, dd MMMM yyyy - HH:mm")}</p>
          </div>

          <Button type="button" loading={isLoggingOut} onClick={handleLogout} className="sm:w-auto">
            Logout
          </Button>
        </header>

        {error ? (
          <div className="rounded-2xl border border-ember/30 bg-ember/10 p-4">
            <p className="text-sm text-ember">{error}</p>
            <Button type="button" className="mt-3 sm:w-auto" onClick={() => void loadDashboard()}>
              Retry
            </Button>
          </div>
        ) : null}

        <article className="rounded-2xl border border-white/90 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">API Message</h2>
          <p className="mt-2 text-ink/80">{data?.message ?? "No dashboard data yet."}</p>
        </article>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/90 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/70">User</h3>
            <p className="mt-2 text-lg font-semibold text-ink">{data?.user?.name ?? "Unknown"}</p>
            <p className="text-sm text-ink/70">{data?.user?.email ?? "N/A"}</p>
          </article>

          <article className="rounded-2xl border border-white/90 bg-white p-5 shadow-soft">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/70">Realtime Status</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${socketStatusColor(socketStatus)}`} />
              <span className="text-sm font-medium text-ink/80">{socketStatus}</span>
            </div>
            <p className="mt-2 text-sm text-ink/70">{socketMessage}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
