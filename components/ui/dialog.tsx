"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export interface DialogProps {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}

export function Dialog({ children, description, onClose, open, title }: DialogProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4">
      <div
        aria-describedby={description ? "dialog-description" : undefined}
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white" id="dialog-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300" id="dialog-description">
                {description}
              </p>
            ) : null}
          </div>
          <Button aria-label="Close dialog" size="icon" variant="ghost" onClick={onClose}>
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
