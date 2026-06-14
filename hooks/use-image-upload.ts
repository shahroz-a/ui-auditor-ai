"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MAX_IMAGE_PIXELS, validateImageFile } from "@/lib/file-guards";
import type { UploadError, UploadState } from "@/types/image";

function readImage(file: File, previewUrl: string): Promise<UploadState> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve({
        status: "error",
        error: {
          code: "browser-unsupported",
          title: "Browser unsupported",
          message: "This browser cannot read image dimensions locally."
        }
      });
      return;
    }

    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
        resolve({
          status: "error",
          error: {
            code: "huge-image",
            title: "Image dimensions are too large",
            message: "Use a screenshot below 36 megapixels so the browser can analyze it safely."
          }
        });
        return;
      }

      resolve({
        status: "ready",
        image: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          width: image.naturalWidth,
          height: image.naturalHeight,
          previewUrl
        }
      });
    };
    image.onerror = () => {
      resolve({
        status: "error",
        error: {
          code: "corrupted-image",
          title: "Image could not be read",
          message: "The file looks like an image but the browser could not decode it."
        }
      });
    };
    image.src = previewUrl;
  });
}

export function useImageUpload() {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const previewRef = useRef<string | null>(null);

  const clearPreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearPreview();
    setState({ status: "idle" });
  }, [clearPreview]);

  const upload = useCallback(
    async (file: File) => {
      const validationError: UploadError | null = validateImageFile(file);

      if (validationError) {
        clearPreview();
        setState({ status: "error", error: validationError });
        return;
      }

      clearPreview();
      setState({ status: "loading", fileName: file.name });

      const previewUrl = URL.createObjectURL(file);
      previewRef.current = previewUrl;
      const nextState = await readImage(file, previewUrl);

      if (nextState.status === "error") {
        clearPreview();
      }

      setState(nextState);
    },
    [clearPreview]
  );

  const pasteFromClipboard = useCallback(async () => {
    if (!navigator.clipboard?.read) {
      setState({
        status: "error",
        error: {
          code: "clipboard-permission",
          title: "Clipboard image access unavailable",
          message: "Use the file picker or drag a screenshot into the upload area."
        }
      });
      return;
    }

    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith("image/"));

        if (imageType) {
          const blob = await item.getType(imageType);
          const extension = imageType.split("/")[1] || "png";
          const file = new File([blob], `clipboard-screenshot.${extension}`, {
            type: imageType,
            lastModified: Date.now()
          });
          await upload(file);
          return;
        }
      }

      setState({
        status: "error",
        error: {
          code: "clipboard-empty",
          title: "No screenshot found",
          message: "Copy an image to your clipboard, then try paste again."
        }
      });
    } catch {
      setState({
        status: "error",
        error: {
          code: "clipboard-permission",
          title: "Clipboard permission denied",
          message: "Use drag and drop or the file picker if this browser blocks clipboard images."
        }
      });
    }
  }, [upload]);

  useEffect(() => clearPreview, [clearPreview]);

  return {
    pasteFromClipboard,
    reset,
    state,
    upload
  };
}
