import type { ImageMetadata } from "@/types/audit";

export interface UploadedImage extends ImageMetadata {
  previewUrl: string;
}

export type UploadErrorCode =
  | "browser-unsupported"
  | "clipboard-empty"
  | "clipboard-permission"
  | "corrupted-image"
  | "huge-image"
  | "invalid-image"
  | "unsupported-format"
  | "zero-byte-file";

export interface UploadError {
  code: UploadErrorCode;
  title: string;
  message: string;
}

export type UploadState =
  | { status: "idle" }
  | { status: "loading"; fileName: string }
  | { status: "ready"; image: UploadedImage }
  | { status: "error"; error: UploadError };
