import { useCallback, useRef, useState } from "react";

import { toast } from "sonner";

import {
  deleteDocumentRequest,
  getDocumentAccessUrlRequest,
  listDocumentsRequest,
  updateDocumentRequest
} from "@/lib/documents-api";
import { getErrorMessage } from "@/lib/error-message";
import { DocumentItem, PaginationData } from "@/types/auth";

const DEFAULT_PAGINATION: PaginationData = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

const DOCUMENTS_PAGE_LIMIT = 10;

export interface UseDashboardDocumentsResult {
  documents: DocumentItem[];
  pagination: PaginationData;
  isDocumentsLoading: boolean;
  searchInput: string;
  filterCategoryId: string;
  activePage: number;
  editingDocumentId: string | null;
  editName: string;
  editDescription: string;
  editCategoryId: string;
  isSavingEdit: boolean;
  setSearchInput: (value: string) => void;
  setEditName: (value: string) => void;
  setEditDescription: (value: string) => void;
  setEditCategoryId: (value: string) => void;
  loadDocuments: (page: number, search?: string, categoryId?: string) => Promise<void>;
  refreshCurrentDocuments: () => Promise<void>;
  refreshFirstPage: () => Promise<void>;
  handleSearchSubmit: () => Promise<void>;
  handleCategoryFilterChange: (value: string) => Promise<void>;
  startInlineEdit: (document: DocumentItem) => void;
  clearInlineEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  handleDeleteDocument: (document: DocumentItem) => Promise<void>;
  handleOpenDocument: (document: DocumentItem) => Promise<void>;
  handlePageChange: (nextPage: number) => Promise<void>;
}

export function useDashboardDocuments(): UseDashboardDocumentsResult {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>(DEFAULT_PAGINATION);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const activePageRef = useRef(1);
  const searchTermRef = useRef("");
  const filterCategoryIdRef = useRef("");

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

  const refreshCurrentDocuments = useCallback(async () => {
    await loadDocuments(activePageRef.current, searchTermRef.current, filterCategoryIdRef.current);
  }, [loadDocuments]);

  const refreshFirstPage = useCallback(async () => {
    await loadDocuments(1, searchTermRef.current, filterCategoryIdRef.current);
  }, [loadDocuments]);

  const handleSearchSubmit = useCallback(async () => {
    const nextSearch = searchInput.trim();
    searchTermRef.current = nextSearch;
    await loadDocuments(1, nextSearch, filterCategoryIdRef.current);
  }, [loadDocuments, searchInput]);

  const handleCategoryFilterChange = useCallback(
    async (value: string) => {
      setFilterCategoryId(value);
      filterCategoryIdRef.current = value;
      await loadDocuments(1, searchTermRef.current, value);
    },
    [loadDocuments]
  );

  const startInlineEdit = useCallback((document: DocumentItem) => {
    setEditingDocumentId(document.id);
    setEditName(document.name);
    setEditDescription(document.description ?? "");
    setEditCategoryId(document.category?.id ?? "");
  }, []);

  const clearInlineEdit = useCallback(() => {
    setEditingDocumentId(null);
    setEditName("");
    setEditDescription("");
    setEditCategoryId("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
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
      clearInlineEdit();
      await refreshCurrentDocuments();
    } catch (updateError) {
      toast.error(getErrorMessage(updateError, "Unable to update document."));
    } finally {
      setIsSavingEdit(false);
    }
  }, [clearInlineEdit, editCategoryId, editDescription, editName, editingDocumentId, refreshCurrentDocuments]);

  const handleDeleteDocument = useCallback(
    async (document: DocumentItem) => {
      const confirmed = window.confirm(`Delete ${document.name}? This cannot be undone.`);

      if (!confirmed) {
        return;
      }

      try {
        await deleteDocumentRequest(document.id);
        toast.success("Document deleted");
        await refreshCurrentDocuments();
      } catch (deleteError) {
        toast.error(getErrorMessage(deleteError, "Unable to delete document."));
      }
    },
    [refreshCurrentDocuments]
  );

  const handleOpenDocument = useCallback(async (document: DocumentItem) => {
    try {
      const access = await getDocumentAccessUrlRequest(document.id);
      window.open(access.url, "_blank", "noopener,noreferrer");
    } catch (accessError) {
      toast.error(getErrorMessage(accessError, "Unable to open document."));
    }
  }, []);

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === activePage) {
        return;
      }

      await loadDocuments(nextPage, searchTermRef.current, filterCategoryIdRef.current);
    },
    [activePage, loadDocuments, pagination.totalPages]
  );

  return {
    documents,
    pagination,
    isDocumentsLoading,
    searchInput,
    filterCategoryId,
    activePage,
    editingDocumentId,
    editName,
    editDescription,
    editCategoryId,
    isSavingEdit,
    setSearchInput,
    setEditName,
    setEditDescription,
    setEditCategoryId,
    loadDocuments,
    refreshCurrentDocuments,
    refreshFirstPage,
    handleSearchSubmit,
    handleCategoryFilterChange,
    startInlineEdit,
    clearInlineEdit,
    handleSaveEdit,
    handleDeleteDocument,
    handleOpenDocument,
    handlePageChange
  };
}
