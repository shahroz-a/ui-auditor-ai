"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dropzone } from "@/components/ui/dropzone";
import { formatBytes } from "@/lib/file-guards";
import type { UploadedImage } from "@/types/image";

export interface UploadPanelProps {
  image?: UploadedImage;
  isLoading: boolean;
  onFile: (file: File) => void;
  onReset: () => void;
}

export function UploadPanel({ image, isLoading, onFile, onReset }: UploadPanelProps) {
  return (
    <Card aria-labelledby="upload-title">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white" id="upload-title">
              Screenshot
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Local image analysis only.</p>
          </div>
          {image ? (
            <Button icon={<RotateCcw aria-hidden="true" className="h-4 w-4" />} variant="ghost" onClick={onReset}>
              Reset
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardBody className="grid gap-5">
        {image ? (
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
              <Image
                alt={`Uploaded screenshot: ${image.name}`}
                className="max-h-[420px] w-full object-contain"
                height={image.height}
                src={image.previewUrl}
                unoptimized
                width={image.width}
              />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Width</dt>
                <dd className="font-semibold text-slate-950 dark:text-white">{image.width}px</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Height</dt>
                <dd className="font-semibold text-slate-950 dark:text-white">{image.height}px</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Size</dt>
                <dd className="font-semibold text-slate-950 dark:text-white">{formatBytes(image.size)}</dd>
              </div>
              <div>
                <dt className="text-slate-500 dark:text-slate-400">Type</dt>
                <dd className="font-semibold text-slate-950 dark:text-white">{image.type.replace("image/", "").toUpperCase()}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <Dropzone disabled={isLoading} onFile={onFile} />
        )}
      </CardBody>
    </Card>
  );
}
