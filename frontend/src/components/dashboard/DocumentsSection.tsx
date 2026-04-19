import { Fragment } from "react";

import { format } from "date-fns";

import { Button } from "@/components/ui/Button";
import { DocumentCategory, DocumentItem, PaginationData } from "@/types/auth";

interface DocumentsSectionProps {
  categories: DocumentCategory[];
  documents: DocumentItem[];
  isDocumentsLoading: boolean;
  searchInput: string;
  filterCategoryId: string;
  pagination: PaginationData;
  activePage: number;
  editingDocumentId: string | null;
  editName: string;
  editDescription: string;
  editCategoryId: string;
  isSavingEdit: boolean;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => Promise<void>;
  onCategoryFilterChange: (value: string) => Promise<void>;
  onOpenDocument: (document: DocumentItem) => Promise<void>;
  onStartEdit: (document: DocumentItem) => void;
  onDeleteDocument: (document: DocumentItem) => Promise<void>;
  onEditNameChange: (value: string) => void;
  onEditDescriptionChange: (value: string) => void;
  onEditCategoryChange: (value: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => Promise<void>;
  onPageChange: (page: number) => Promise<void>;
  formatBytes: (bytes: number) => string;
}

const fieldClassName =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30";

const tableActionClassName =
  "rounded-md border border-zinc-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-200 transition hover:border-yellow-400 hover:text-yellow-300";

export function DocumentsSection({
  categories,
  documents,
  isDocumentsLoading,
  searchInput,
  filterCategoryId,
  pagination,
  activePage,
  editingDocumentId,
  editName,
  editDescription,
  editCategoryId,
  isSavingEdit,
  onSearchInputChange,
  onSearchSubmit,
  onCategoryFilterChange,
  onOpenDocument,
  onStartEdit,
  onDeleteDocument,
  onEditNameChange,
  onEditDescriptionChange,
  onEditCategoryChange,
  onCancelEdit,
  onSaveEdit,
  onPageChange,
  formatBytes
}: DocumentsSectionProps): JSX.Element {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Document Library</h2>
          <p className="mt-1 text-sm text-zinc-400">Filter, inspect, and manage stored files.</p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void onSearchSubmit();
          }}
          className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search by name"
            className={fieldClassName}
          />
          <select
            value={filterCategoryId}
            onChange={(event) => void onCategoryFilterChange(event.target.value)}
            className={fieldClassName}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="sm:w-auto">
            Search
          </Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        {isDocumentsLoading ? (
          <div className="space-y-2 p-4">
            <div className="h-9 animate-pulse rounded bg-zinc-800" />
            <div className="h-9 animate-pulse rounded bg-zinc-800" />
            <div className="h-9 animate-pulse rounded bg-zinc-800" />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-zinc-900/50 px-4 py-10 text-center">
            <p className="text-sm text-zinc-400">No documents found for current filters.</p>
          </div>
        ) : (
          <table className="min-w-full text-left">
            <thead className="border-b border-zinc-800 bg-black/30 text-[11px] uppercase tracking-[0.16em] text-zinc-400">
              <tr>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Size</th>
                <th className="px-3 py-3">Uploaded</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/50 text-sm text-zinc-200">
              {documents.map((document) => (
                <Fragment key={document.id}>
                  <tr>
                    <td className="px-3 py-3 align-top">
                      <p className="font-medium text-zinc-100">{document.name}</p>
                      {document.description ? <p className="mt-1 max-w-sm text-xs text-zinc-500">{document.description}</p> : null}
                    </td>
                    <td className="px-3 py-3 align-top">
                      {document.category ? (
                        <span className="inline-flex items-center rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-yellow-300">
                          {document.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500">Uncategorized</span>
                      )}
                    </td>
                    <td className="px-3 py-3 align-top text-xs text-zinc-400">{document.fileType}</td>
                    <td className="px-3 py-3 align-top text-xs text-zinc-400">{formatBytes(document.fileSize)}</td>
                    <td className="px-3 py-3 align-top text-xs text-zinc-400">{format(new Date(document.createdAt), "dd MMM yyyy")}</td>
                    <td className="px-3 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void onOpenDocument(document)} className={tableActionClassName}>
                          View
                        </button>
                        <button type="button" onClick={() => onStartEdit(document)} className={tableActionClassName}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteDocument(document)}
                          className="rounded-md border border-red-500/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300 transition hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editingDocumentId === document.id ? (
                    <tr>
                      <td colSpan={6} className="bg-black/30 px-3 py-4">
                        <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">Edit Document</p>

                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <label className="block space-y-2 md:col-span-2">
                              <span className="text-xs text-zinc-400">Name</span>
                              <input
                                value={editName}
                                onChange={(event) => onEditNameChange(event.target.value)}
                                className={fieldClassName}
                              />
                            </label>

                            <label className="block space-y-2 md:col-span-2">
                              <span className="text-xs text-zinc-400">Description</span>
                              <textarea
                                value={editDescription}
                                onChange={(event) => onEditDescriptionChange(event.target.value)}
                                rows={3}
                                className={fieldClassName}
                              />
                            </label>

                            <label className="block space-y-2">
                              <span className="text-xs text-zinc-400">Category</span>
                              <select
                                value={editCategoryId}
                                onChange={(event) => onEditCategoryChange(event.target.value)}
                                className={fieldClassName}
                              >
                                <option value="">No category</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button type="button" loading={isSavingEdit} onClick={() => void onSaveEdit()} className="w-auto">
                              Save
                            </Button>
                            <Button type="button" onClick={onCancelEdit} variant="ghost" className="w-auto">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Page {pagination.page} of {pagination.totalPages} - {pagination.total} total
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onPageChange(activePage - 1)}
            disabled={activePage <= 1}
            className="w-auto"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onPageChange(activePage + 1)}
            disabled={activePage >= pagination.totalPages}
            className="w-auto"
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
