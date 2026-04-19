"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { DocumentsSection } from "@/components/dashboard/DocumentsSection";
import { UploadSection } from "@/components/dashboard/UploadSection";
import { Button } from "@/components/ui/Button";
import { useDashboardDocuments } from "@/hooks/dashboard/useDashboardDocuments";
import { useDashboardSession } from "@/hooks/dashboard/useDashboardSession";
import { useDashboardUpload } from "@/hooks/dashboard/useDashboardUpload";

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
  const documents = useDashboardDocuments();
  const session = useDashboardSession({
    onDocumentsSync: documents.refreshCurrentDocuments
  });
  const upload = useDashboardUpload({
    onUploadSuccess: documents.refreshFirstPage
  });

  if (session.isLoading) {
    return (
      <main className="min-h-screen bg-black text-zinc-100">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
          <section className="w-full animate-floatIn rounded-lg border border-zinc-800 bg-zinc-950/80 p-8">
            <div className="h-5 w-44 animate-pulse rounded bg-zinc-800" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-zinc-800" />
            <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-zinc-800" />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
        <DashboardHeader
          isLoggingOut={session.isLoggingOut}
          notificationsOpen={session.isNotificationsOpen}
          notifications={session.notifications}
          unreadNotificationsCount={session.unreadNotificationsCount}
          onToggleNotifications={session.toggleNotifications}
          onCloseNotifications={session.closeNotifications}
          onMarkNotificationAsRead={session.handleMarkNotificationAsRead}
          onLogout={session.handleLogout}
        />

        {session.error ? (
          <section className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm text-red-300">{session.error}</p>
            <Button type="button" variant="outline" className="mt-3 w-auto" onClick={() => void session.reloadDashboard()}>
              Retry
            </Button>
          </section>
        ) : null}

        <div className="mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Section 01 - Overview</p>
        </div>
        <DashboardSummary data={session.data} socketStatus={session.socketStatus} socketMessage={session.socketMessage} />

        <div className="mb-2 mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Section 02 - Intake</p>
        </div>

        <UploadSection
          categories={session.categories}
          selectedFile={upload.selectedFile}
          uploadName={upload.uploadName}
          uploadDescription={upload.uploadDescription}
          uploadCategoryId={upload.uploadCategoryId}
          isUploading={upload.isUploading}
          uploadProgress={upload.uploadProgress}
          isDragOverUpload={upload.isDragOverUpload}
          onFileChange={upload.handleFileChange}
          onFileDrop={upload.handleFileDrop}
          onFileDragOver={upload.handleFileDragOver}
          onFileDragLeave={upload.handleFileDragLeave}
          onUploadNameChange={upload.setUploadName}
          onUploadDescriptionChange={upload.setUploadDescription}
          onUploadCategoryChange={upload.setUploadCategoryId}
          onUpload={upload.handleUploadDocument}
        />

        <div className="mb-2 mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Section 03 - Library</p>
        </div>

        <DocumentsSection
          categories={session.categories}
          documents={documents.documents}
          isDocumentsLoading={documents.isDocumentsLoading}
          searchInput={documents.searchInput}
          filterCategoryId={documents.filterCategoryId}
          pagination={documents.pagination}
          activePage={documents.activePage}
          editingDocumentId={documents.editingDocumentId}
          editName={documents.editName}
          editDescription={documents.editDescription}
          editCategoryId={documents.editCategoryId}
          isSavingEdit={documents.isSavingEdit}
          onSearchInputChange={documents.setSearchInput}
          onSearchSubmit={documents.handleSearchSubmit}
          onCategoryFilterChange={documents.handleCategoryFilterChange}
          onOpenDocument={documents.handleOpenDocument}
          onStartEdit={documents.startInlineEdit}
          onDeleteDocument={documents.handleDeleteDocument}
          onEditNameChange={documents.setEditName}
          onEditDescriptionChange={documents.setEditDescription}
          onEditCategoryChange={documents.setEditCategoryId}
          onCancelEdit={documents.clearInlineEdit}
          onSaveEdit={documents.handleSaveEdit}
          onPageChange={documents.handlePageChange}
          formatBytes={formatBytes}
        />
      </div>
    </main>
  );
}
