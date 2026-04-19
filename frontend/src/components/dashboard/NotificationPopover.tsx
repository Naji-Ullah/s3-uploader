import { format } from "date-fns";

import { RealtimeNotification } from "@/types/auth";

interface NotificationPopoverProps {
  open: boolean;
  unreadCount: number;
  notifications: RealtimeNotification[];
  onToggle: () => void;
  onClose: () => void;
  onMarkNotificationAsRead: (notificationId: string) => Promise<void>;
}

function BellIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
      <path d="M14.9 17H9.1a2.8 2.8 0 0 1-2.7-3.5l.4-1.4c.3-.9.4-1.8.4-2.8V8.6a4.8 4.8 0 1 1 9.6 0v.7c0 1 .1 1.9.4 2.8l.4 1.4A2.8 2.8 0 0 1 14.9 17Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function NotificationPopover({
  open,
  unreadCount,
  notifications,
  onToggle,
  onClose,
  onMarkNotificationAsRead
}: NotificationPopoverProps): JSX.Element {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle notifications"
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 transition hover:border-yellow-400 hover:text-yellow-300"
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border border-zinc-900 bg-yellow-400 px-1 text-[10px] font-bold text-zinc-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">Notifications</p>
            <button type="button" onClick={onClose} className="text-xs font-medium text-zinc-400 transition hover:text-zinc-200">
              Close
            </button>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto p-3">
            {notifications.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-800 bg-zinc-900/60 px-3 py-6 text-center text-sm text-zinc-500">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-md border p-3 ${
                    notification.read
                      ? "border-zinc-800 bg-zinc-900/50 text-zinc-400"
                      : "border-yellow-400/40 bg-yellow-400/10 text-zinc-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="mt-1 text-sm leading-relaxed">{notification.message}</p>
                      <p className="mt-2 text-xs text-zinc-500">{format(new Date(notification.createdAt), "dd MMM yyyy, HH:mm")}</p>
                    </div>

                    {!notification.read ? (
                      <button
                        type="button"
                        onClick={() => void onMarkNotificationAsRead(notification.id)}
                        className="rounded-md border border-yellow-400/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-300 transition hover:bg-yellow-400/10"
                      >
                        Read
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
