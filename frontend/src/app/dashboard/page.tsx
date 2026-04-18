"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { fetchDashboardMessage, logoutRequest } from "@/lib/auth-api";
import { clearStoredAuth, getStoredAuth } from "@/lib/auth-storage";
import {
  deleteDocumentRequest,
  getDocumentAccessUrlRequest,
  listCategoriesRequest,
  listDocumentsRequest,
  listNotificationsRequest,
  markNotificationReadRequest,
  updateDocumentRequest,
  uploadDocumentRequest
} from "@/lib/documents-api";
import { getErrorMessage } from "@/lib/error-message";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import {
  DashboardData,
  DocumentCategory,
  DocumentItem,
  PaginationData,
  RealtimeConnectionStatus,
  RealtimeDeletedDocumentEvent,
  RealtimeDocumentEvent,
  RealtimeNotification
} from "@/types/auth";

type SocketStatus = "connecting" | "connected" | "disconnected" | "error";

function socketStatusColor(status: SocketStatus): string {
  if (status === "connected") return "bg-emerald-500";
  if (status === "connecting") return "bg-amber-500";
  return "bg-rose-500";
}

const DEFAULT_PAGINATION: PaginationData = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

const DOCUMENTS_PAGE_LIMIT = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function DashboardPage(): JSX.Element {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("connecting");
  const [socketMessage, setSocketMessage] = useState("Waiting for realtime events...");
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>(DEFAULT_PAGINATION);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategoryId, setUploadCategoryId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [activePage, setActivePage] = useState(1);

  const activePageRef = useRef(1);
  const searchTermRef = useRef("");
  const filterCategoryIdRef = useRef("");

  const unreadNotificationsCount = notifications.filter((notification) => !notification.read).length;

  const loadDocuments = useCallback(async (page: number, search = searchTermRef.current, categoryId = filterCategoryIdRef.current) => {
    setIsDocumentsLoading(true);

    try {
      const response = await listDocumentsRequest({
        page,
        limit: DOCUMENTS_PAGE_LIMIT,
        search,
        categoryId
      });

      setDocuments(response.items);
      setPagination(response.pagination);
      setActivePage(response.pagination.page);
      activePageRef.current = response.pagination.page;
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, "Unable to load documents."));
    } finally {
      setIsDocumentsLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const auth = getStoredAuth();

    if (!auth?.accessToken) {
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
      await loadDocuments(activePageRef.current);

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
        void loadDocuments(activePageRef.current);
      });

      socket.on("document:updated", (payload: RealtimeDocumentEvent) => {
        toast.info(`Document updated: ${payload.name}`);
        void loadDocuments(activePageRef.current);
      });

      socket.on("document:deleted", (_payload: RealtimeDeletedDocumentEvent) => {
        toast.info("A document was deleted");
        void loadDocuments(activePageRef.current);
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
  }, [loadDocuments, router]);

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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);

    if (file && !uploadName) {
      setUploadName(file.name);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOverUpload(false);

    const file = event.dataTransfer.files?.[0] ?? null;

    if (!file) {
      return;
    }

    setSelectedFile(file);

    if (!uploadName) {
      setUploadName(file.name);
    }
  };

  const handleFileDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOverUpload(true);
  };

  const handleFileDragLeave = (): void => {
    setIsDragOverUpload(false);
  };

  const handleUploadDocument = async (): Promise<void> => {
    if (!selectedFile) {
      toast.error("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await uploadDocumentRequest({
        file: selectedFile,
        name: uploadName,
        description: uploadDescription,
        categoryId: uploadCategoryId || undefined,
        onUploadProgress: (percent) => {
          setUploadProgress(percent);
        }
      });

      toast.success("Document uploaded successfully");
      setSelectedFile(null);
      setUploadName("");
      setUploadDescription("");
      setUploadCategoryId("");
      setUploadProgress(100);
      await loadDocuments(1, searchTermRef.current, filterCategoryIdRef.current);
    } catch (uploadError) {
      toast.error(getErrorMessage(uploadError, "Upload failed."));
    } finally {
      setTimeout(() => {
        setUploadProgress(0);
      }, 400);
      setIsUploading(false);
    }
  };

  const handleSearchSubmit = async (): Promise<void> => {
    const nextSearch = searchInput.trim();
    searchTermRef.current = nextSearch;
    await loadDocuments(1, nextSearch, filterCategoryIdRef.current);
  };

  const handleCategoryFilterChange = async (value: string): Promise<void> => {
    setFilterCategoryId(value);
    filterCategoryIdRef.current = value;
    await loadDocuments(1, searchTermRef.current, value);
  };

  const openEditModal = (document: DocumentItem): void => {
    setEditingDocumentId(document.id);
    setEditName(document.name);
    setEditDescription(document.description ?? "");
    setEditCategoryId(document.category?.id ?? "");
  };

  const closeEditModal = (): void => {
    setEditingDocumentId(null);
    setEditName("");
    setEditDescription("");
    setEditCategoryId("");
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingDocumentId) {
      return;
    }

    setIsSavingEdit(true);

    try {
      await updateDocumentRequest(editingDocumentId, {
        name: editName,
        description: editDescription || null,
        categoryId: editCategoryId || null
      });

      toast.success("Document updated");
      closeEditModal();
      await loadDocuments(activePageRef.current);
    } catch (updateError) {
      toast.error(getErrorMessage(updateError, "Unable to update document."));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteDocument = async (document: DocumentItem): Promise<void> => {
    const confirmed = window.confirm(`Delete ${document.name}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteDocumentRequest(document.id);
      toast.success("Document deleted");
      await loadDocuments(activePageRef.current);
    } catch (deleteError) {
      toast.error(getErrorMessage(deleteError, "Unable to delete document."));
    }
  };

  const handleOpenDocument = async (document: DocumentItem): Promise<void> => {
    try {
      const access = await getDocumentAccessUrlRequest(document.id);
      window.open(access.url, "_blank", "noopener,noreferrer");
    } catch (accessError) {
      toast.error(getErrorMessage(accessError, "Unable to open document."));
    }
  };

  const handlePageChange = async (nextPage: number): Promise<void> => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === activePage) {
      return;
    }

    await loadDocuments(nextPage, searchTermRef.current, filterCategoryIdRef.current);
  };

  const handleMarkNotificationAsRead = async (notificationId: string): Promise<void> => {
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((current) => !current)}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white text-ink shadow-soft transition hover:border-sky/40"
              aria-label="Open notifications"
            >
              <span className="text-lg">🔔</span>
              {unreadNotificationsCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-xs font-semibold text-white">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              ) : null}
            </button>

            <Button type="button" loading={isLoggingOut} onClick={handleLogout} className="sm:w-auto">
              Logout
            </Button>
          </div>
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

        {isNotificationsOpen ? (
          <section className="rounded-2xl border border-white/90 bg-white p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Notifications</h3>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="text-sm font-medium text-ink/70 transition hover:text-ink"
              >
                Close
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="text-sm text-ink/60">No notifications yet.</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border p-3 ${
                      notification.read ? "border-slate-100 bg-slate-50" : "border-sky/20 bg-sky/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{notification.title}</p>
                        <p className="mt-1 text-sm text-ink/70">{notification.message}</p>
                        <p className="mt-1 text-xs text-ink/50">
                          {format(new Date(notification.createdAt), "dd MMM yyyy, HH:mm")}
                        </p>
                      </div>

                      {!notification.read ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkNotificationAsRead(notification.id)}
                          className="rounded-lg border border-sky/30 px-2 py-1 text-xs font-semibold text-sky transition hover:bg-sky/10"
                        >
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        <section className="rounded-2xl border border-white/90 bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Upload Document</h2>
          <p className="mt-1 text-sm text-ink/70">Supported: PDF, DOC, DOCX, TXT, PNG, JPG (max 10MB)</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-ink/80" htmlFor="upload-file">
                File
              </label>
              <div
                onDrop={handleFileDrop}
                onDragOver={handleFileDragOver}
                onDragLeave={handleFileDragLeave}
                className={`rounded-xl border-2 border-dashed p-4 transition ${
                  isDragOverUpload ? "border-sky bg-sky/5" : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-sm font-medium text-ink/80">Drag and drop a file here</p>
                <p className="mt-1 text-xs text-ink/60">or click below to browse files</p>
                <input
                  id="upload-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="mt-3 w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
                />
              </div>
              {selectedFile ? <p className="text-xs text-ink/70">Selected: {selectedFile.name}</p> : null}
              {isUploading || uploadProgress > 0 ? (
                <div className="space-y-1">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-gradient-to-r from-sky to-emerald-500 transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs font-medium text-ink/70">Upload progress: {uploadProgress}%</p>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-ink/80" htmlFor="upload-name">
                Document Name
              </label>
              <input
                id="upload-name"
                value={uploadName}
                onChange={(event) => setUploadName(event.target.value)}
                placeholder="Quarterly report"
                className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="block text-sm font-medium text-ink/80" htmlFor="upload-description">
                Description
              </label>
              <textarea
                id="upload-description"
                value={uploadDescription}
                onChange={(event) => setUploadDescription(event.target.value)}
                placeholder="Optional context about this file"
                rows={3}
                className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-ink/80" htmlFor="upload-category">
                Category
              </label>
              <select
                id="upload-category"
                value={uploadCategoryId}
                onChange={(event) => setUploadCategoryId(event.target.value)}
                className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button type="button" loading={isUploading} onClick={() => void handleUploadDocument()} className="sm:w-auto">
                Upload
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/90 bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Your Documents</h2>
              <p className="mt-1 text-sm text-ink/70">Manage and search your uploaded files.</p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSearchSubmit();
              }}
              className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            >
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by document name"
                className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
              />
              <select
                value={filterCategoryId}
                onChange={(event) => void handleCategoryFilterChange(event.target.value)}
                className="rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button type="submit" className="sm:w-auto">
                Search
              </Button>
            </form>
          </div>

          <div className="mt-5 overflow-x-auto">
            {isDocumentsLoading ? (
              <div className="grid gap-2">
                <div className="h-10 animate-pulse rounded bg-sky/10" />
                <div className="h-10 animate-pulse rounded bg-sky/10" />
                <div className="h-10 animate-pulse rounded bg-sky/10" />
              </div>
            ) : documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm text-ink/70">No documents found for current filters.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-ink/60">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2">Uploaded</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-ink/80">
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td className="px-3 py-3">
                        <p className="font-medium text-ink">{document.name}</p>
                        {document.description ? (
                          <p className="mt-1 max-w-sm text-xs text-ink/60">{document.description}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        {document.category ? (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: `${document.category.color}20`,
                              color: document.category.color
                            }}
                          >
                            {document.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-ink/50">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">{document.fileType}</td>
                      <td className="px-3 py-3 text-xs">{formatBytes(document.fileSize)}</td>
                      <td className="px-3 py-3 text-xs">{format(new Date(document.createdAt), "dd MMM yyyy")}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleOpenDocument(document)}
                            className="rounded-lg border border-sky/30 px-2 py-1 text-xs font-semibold text-sky transition hover:bg-sky/10"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(document)}
                            className="rounded-lg border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteDocument(document)}
                            className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-ink/60">
              Page {pagination.page} of {pagination.totalPages} - {pagination.total} total
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handlePageChange(activePage - 1)}
                disabled={activePage <= 1}
                className="rounded-lg border border-white/80 bg-white px-3 py-1 text-xs font-semibold text-ink disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => void handlePageChange(activePage + 1)}
                disabled={activePage >= pagination.totalPages}
                className="rounded-lg border border-white/80 bg-white px-3 py-1 text-xs font-semibold text-ink disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {editingDocumentId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-6 shadow-panel">
              <h3 className="text-lg font-semibold text-ink">Edit Document</h3>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80" htmlFor="edit-name">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80" htmlFor="edit-description">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink/80" htmlFor="edit-category">
                    Category
                  </label>
                  <select
                    id="edit-category"
                    value={editCategoryId}
                    onChange={(event) => setEditCategoryId(event.target.value)}
                    className="w-full rounded-xl border border-white/80 bg-white px-3 py-2 text-sm text-ink"
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-ink"
                >
                  Cancel
                </button>
                <Button type="button" loading={isSavingEdit} onClick={() => void handleSaveEdit()} className="w-auto">
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
