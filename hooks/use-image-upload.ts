"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { validateImageFile } from "@/lib/file-guards";
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

  useEffect(() => clearPreview, [clearPreview]);

  return {
    reset,
    state,
    upload
  };
}
