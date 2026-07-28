"use client";

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

interface ImageUploadProps {
  restaurantId: string;
  onUploaded: (url: string) => void;
  className?: string;
}

export function ImageUpload({
  restaurantId,
  onUploaded,
  className = "",
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    (file: File) => {
      // Validate before upload
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10 MB.");
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      setUploading(true);
      setProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("restaurantId", restaurantId);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener("load", () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { url: string };
            onUploaded(data.url);
          } catch {
            setError("Failed to parse server response.");
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText) as { error?: string };
            setError(data.error || `Upload failed (${xhr.status})`);
          } catch {
            setError(`Upload failed (${xhr.status})`);
          }
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        setError("Network error. Please try again.");
      });

      xhr.addEventListener("abort", () => {
        setUploading(false);
        setError("Upload cancelled.");
      });

      xhr.open("POST", "/api/images/upload");
      xhr.send(formData);
    },
    [restaurantId, onUploaded],
  );

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className={className}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {preview ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 mx-auto rounded object-contain"
            />
            <p className="text-sm text-gray-500">Click or drop to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-10 w-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-400">
              PNG, JPG, WebP, GIF, AVIF up to 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {uploading && (
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
