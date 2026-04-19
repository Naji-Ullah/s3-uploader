import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { RealtimeNotification } from "@/types/auth";

import { NotificationPopover } from "./NotificationPopover";

interface DashboardHeaderProps {
  isLoggingOut: boolean;
  notificationsOpen: boolean;
  notifications: RealtimeNotification[];
  unreadNotificationsCount: number;
  onToggleNotifications: () => void;
  onCloseNotifications: () => void;
  onMarkNotificationAsRead: (notificationId: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

export function DashboardHeader({
  isLoggingOut,
  notificationsOpen,
  notifications,
  unreadNotificationsCount,
  onToggleNotifications,
  onCloseNotifications,
  onMarkNotificationAsRead,
  onLogout
}: DashboardHeaderProps): JSX.Element {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-300">S3 Uploader</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Operations Console</h1>
        <p className="mt-1 text-sm text-zinc-400">Live documents, edits, and notification flow.</p>
        <p className="mt-1 text-xs text-zinc-500">{format(new Date(), "EEEE, dd MMMM yyyy - HH:mm")}</p>
      </div>

      <div className="relative ml-auto flex items-center gap-3">
        <NotificationPopover
          open={notificationsOpen}
          unreadCount={unreadNotificationsCount}
          notifications={notifications}
          onToggle={onToggleNotifications}
          onClose={onCloseNotifications}
          onMarkNotificationAsRead={onMarkNotificationAsRead}
        />

        <Button type="button" loading={isLoggingOut} onClick={() => void onLogout()} variant="outline" className="w-auto">
          Logout
        </Button>
      </div>
    </header>
  );
}
