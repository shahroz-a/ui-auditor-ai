"use client";

import { UploadCloud } from "lucide-react";
import { useId, useState, type DragEvent } from "react";

import { ACCEPTED_IMAGE_TYPES, formatBytes, MAX_IMAGE_BYTES } from "@/lib/file-guards";
import { cn } from "@/lib/cn";

export interface DropzoneProps {
  disabled?: boolean;
  onFile: (file: File) => void;
}

export function Dropzone({ disabled = false, onFile }: DropzoneProps) {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);

  function acceptFile(file: File | undefined) {
    if (!file || disabled) {
      return;
    }

    onFile(file);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files.item(0) ?? undefined);
  }

  return (
    <label
      className={cn(
        "grid min-h-56 cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition focus-within:ring-2 focus-within:ring-mint-600 focus-within:ring-offset-2 dark:border-slate-700 dark:bg-slate-900",
        isDragging && "border-mint-600 bg-mint-50 dark:bg-mint-950",
        disabled && "cursor-not-allowed opacity-60"
      )}
      htmlFor={inputId}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <input
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        onChange={(event) => acceptFile(event.target.files?.item(0) ?? undefined)}
        type="file"
      />
      <span className="grid gap-4">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white text-mint-600 shadow-sm dark:bg-slate-950">
          <UploadCloud aria-hidden="true" className="h-7 w-7" />
        </span>
        <span>
          <span className="block text-base font-semibold text-slate-950 dark:text-white">Upload screenshot</span>
          <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
            PNG, JPG, WebP, or AVIF up to {formatBytes(MAX_IMAGE_BYTES)}
          </span>
        </span>
      </span>
    </label>
  );
}
