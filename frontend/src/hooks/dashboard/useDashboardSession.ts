import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { fetchDashboardMessage, logoutRequest } from "@/lib/auth-api";
import { clearStoredAuth, getStoredAuth } from "@/lib/auth-storage";
import { listCategoriesRequest, listNotificationsRequest, markNotificationReadRequest } from "@/lib/documents-api";
import { getErrorMessage } from "@/lib/error-message";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import {
  DashboardData,
  DocumentCategory,
  RealtimeConnectionStatus,
  RealtimeDocumentEvent,
  RealtimeNotification
} from "@/types/auth";

export type DashboardSocketStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseDashboardSessionOptions {
  onDocumentsSync: () => Promise<void>;
}

export interface UseDashboardSessionResult {
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string;
  data: DashboardData | null;
  categories: DocumentCategory[];
  notifications: RealtimeNotification[];
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  socketStatus: DashboardSocketStatus;
  socketMessage: string;
  toggleNotifications: () => void;
  closeNotifications: () => void;
  handleMarkNotificationAsRead: (notificationId: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  reloadDashboard: () => Promise<void>;
}

export function useDashboardSession({ onDocumentsSync }: UseDashboardSessionOptions): UseDashboardSessionResult {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState<DashboardSocketStatus>("connecting");
  const [socketMessage, setSocketMessage] = useState("Waiting for realtime events...");

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const auth = getStoredAuth();

    if (!auth?.accessToken) {
      setIsLoading(false);
      router.replace("/login");
      return;
    }

    try {
      const [result, categoriesResult, notificationsResult] = await Promise.all([
        fetchDashboardMessage(),
        listCategoriesRequest(),
        listNotificationsRequest()
      ]);

      setData(result);
      setCategories(categoriesResult);
      setNotifications(notificationsResult);
      await onDocumentsSync();

      const socket = connectSocket(auth.accessToken);
      setSocketStatus(socket.connected ? "connected" : "connecting");

      socket.off("system:hello");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("connection:status");
      socket.off("document:uploaded");
      socket.off("document:updated");
      socket.off("document:deleted");
      socket.off("notification:new");

      socket.on("system:hello", (payload: { message: string }) => {
        setSocketMessage(payload.message);
      });

      socket.on("connection:status", (payload: RealtimeConnectionStatus) => {
        setSocketStatus(payload.status);
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

      socket.on("document:uploaded", (payload: RealtimeDocumentEvent) => {
        toast.success(`Document uploaded: ${payload.name}`);
        void onDocumentsSync();
      });

      socket.on("document:updated", (payload: RealtimeDocumentEvent) => {
        toast.info(`Document updated: ${payload.name}`);
        void onDocumentsSync();
      });

      socket.on("document:deleted", () => {
        toast.info("A document was deleted");
        void onDocumentsSync();
      });

      socket.on("notification:new", (payload: RealtimeNotification) => {
        setNotifications((current) => [payload, ...current]);
        toast(payload.title, {
          description: payload.message
        });
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
  }, [onDocumentsSync, router]);

  useEffect(() => {
    void loadDashboard();

    return () => {
      disconnectSocket();
    };
  }, [loadDashboard]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await logoutRequest();
      disconnectSocket();
      router.replace("/login");
    } catch (logoutError) {
      toast.error(getErrorMessage(logoutError, "Logout failed."));
      setIsLoggingOut(false);
    }
  }, [router]);

  const handleMarkNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await markNotificationReadRequest(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification
        )
      );
    } catch (notificationError) {
      toast.error(getErrorMessage(notificationError, "Unable to update notification."));
    }
  }, []);

  return {
    isLoading,
    isLoggingOut,
    error,
    data,
    categories,
    notifications,
    unreadNotificationsCount,
    isNotificationsOpen,
    socketStatus,
    socketMessage,
    toggleNotifications: () => {
      setIsNotificationsOpen((current) => !current);
    },
    closeNotifications: () => {
      setIsNotificationsOpen(false);
    },
    handleMarkNotificationAsRead,
    handleLogout,
    reloadDashboard: loadDashboard
  };
}
