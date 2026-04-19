import { ChangeEvent, DragEvent } from "react";

import { Button } from "@/components/ui/Button";
import { DocumentCategory } from "@/types/auth";

interface UploadSectionProps {
  categories: DocumentCategory[];
  selectedFile: File | null;
  uploadName: string;
  uploadDescription: string;
  uploadCategoryId: string;
  isUploading: boolean;
  uploadProgress: number;
  isDragOverUpload: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onFileDragLeave: () => void;
  onUploadNameChange: (value: string) => void;
  onUploadDescriptionChange: (value: string) => void;
  onUploadCategoryChange: (value: string) => void;
  onUpload: () => Promise<void>;
}

const fieldClassName =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/30";

export function UploadSection({
  categories,
  selectedFile,
  uploadName,
  uploadDescription,
  uploadCategoryId,
  isUploading,
  uploadProgress,
  isDragOverUpload,
  onFileChange,
  onFileDrop,
  onFileDragOver,
  onFileDragLeave,
  onUploadNameChange,
  onUploadDescriptionChange,
  onUploadCategoryChange,
  onUpload
}: UploadSectionProps): JSX.Element {
  return (
    <section className="mb-6 rounded-lg border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-zinc-100">Upload</h2>
        <p className="mt-1 text-sm text-zinc-400">PDF, DOC, DOCX, TXT, PNG, JPG. Max 10MB.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">File</p>
          <div
            onDrop={onFileDrop}
            onDragOver={onFileDragOver}
            onDragLeave={onFileDragLeave}
            className={`rounded-lg border-2 border-dashed px-4 py-5 transition ${
              isDragOverUpload ? "border-yellow-300 bg-yellow-400/5" : "border-zinc-700 bg-black/20"
            }`}
          >
            <p className="text-sm font-medium text-zinc-200">Drag and drop a file</p>
            <p className="mt-1 text-xs text-zinc-500">or browse from your device</p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={onFileChange}
              className="mt-3 block w-full text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-zinc-700 file:bg-zinc-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-zinc-200 hover:file:border-yellow-400"
            />
          </div>
          {selectedFile ? <p className="text-xs text-zinc-400">Selected file: {selectedFile.name}</p> : null}
          {(isUploading || uploadProgress > 0) && uploadProgress <= 100 ? (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full bg-yellow-400 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="mt-1 text-xs text-zinc-400">Upload progress: {uploadProgress}%</p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">Document Name</span>
            <input
              value={uploadName}
              onChange={(event) => onUploadNameChange(event.target.value)}
              placeholder="Quarterly report"
              className={fieldClassName}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">Description</span>
            <textarea
              value={uploadDescription}
              onChange={(event) => onUploadDescriptionChange(event.target.value)}
              placeholder="Optional context"
              rows={4}
              className={fieldClassName}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-yellow-300">Category</span>
            <select
              value={uploadCategoryId}
              onChange={(event) => onUploadCategoryChange(event.target.value)}
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

          <div className="pt-2">
            <Button type="button" loading={isUploading} onClick={() => void onUpload()} className="w-auto">
              Upload
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
