import type { UploadError } from "@/types/image";

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif"] as const;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 36_000_000;

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"] as const;
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function validateImageFile(file: File): UploadError | null {
  if (file.size === 0) {
    return {
      code: "zero-byte-file",
      title: "Empty file",
      message: "Choose an image that contains screenshot data."
    };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return {
      code: "unsupported-format",
      title: "Unsupported format",
      message: "Use a PNG, JPG, JPEG, WebP, or AVIF screenshot."
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      code: "huge-image",
      title: "Image is too large",
      message: `Compress the screenshot below ${formatBytes(MAX_IMAGE_BYTES)} and try again.`
    };
  }

  return null;
}
