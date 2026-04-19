import { ChangeEvent, DragEvent, useCallback, useState } from "react";

import { toast } from "sonner";

import { uploadDocumentRequest } from "@/lib/documents-api";
import { getErrorMessage } from "@/lib/error-message";

interface UseDashboardUploadOptions {
  onUploadSuccess: () => Promise<void>;
}

export interface UseDashboardUploadResult {
  isUploading: boolean;
  uploadProgress: number;
  isDragOverUpload: boolean;
  selectedFile: File | null;
  uploadName: string;
  uploadDescription: string;
  uploadCategoryId: string;
  setUploadName: (value: string) => void;
  setUploadDescription: (value: string) => void;
  setUploadCategoryId: (value: string) => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (event: DragEvent<HTMLDivElement>) => void;
  handleFileDragOver: (event: DragEvent<HTMLDivElement>) => void;
  handleFileDragLeave: () => void;
  handleUploadDocument: () => Promise<void>;
}

export function useDashboardUpload({ onUploadSuccess }: UseDashboardUploadOptions): UseDashboardUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategoryId, setUploadCategoryId] = useState("");

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setSelectedFile(file);

      if (file && !uploadName) {
        setUploadName(file.name);
      }
    },
    [uploadName]
  );

  const handleFileDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
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
    },
    [uploadName]
  );

  const handleFileDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOverUpload(true);
  }, []);

  const handleFileDragLeave = useCallback(() => {
    setIsDragOverUpload(false);
  }, []);

  const handleUploadDocument = useCallback(async () => {
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
      await onUploadSuccess();
    } catch (uploadError) {
      toast.error(getErrorMessage(uploadError, "Upload failed."));
    } finally {
      setTimeout(() => {
        setUploadProgress(0);
      }, 400);
      setIsUploading(false);
    }
  }, [onUploadSuccess, selectedFile, uploadCategoryId, uploadDescription, uploadName]);

  return {
    isUploading,
    uploadProgress,
    isDragOverUpload,
    selectedFile,
    uploadName,
    uploadDescription,
    uploadCategoryId,
    setUploadName,
    setUploadDescription,
    setUploadCategoryId,
    handleFileChange,
    handleFileDrop,
    handleFileDragOver,
    handleFileDragLeave,
    handleUploadDocument
  };
}
