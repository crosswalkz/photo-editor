"use client";

import { useEffect, useId, type ReactNode } from "react";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  /** Default: neutral accent confirm. Danger: destructive (e.g. delete, discard). */
  variant?: "default" | "danger";
};

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  onConfirm,
  variant = "default",
}: ConfirmDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "rounded-lg border border-red-400/45 bg-red-950/50 px-4 py-2 text-sm font-semibold text-red-100 transition-colors hover:border-red-400/65 hover:bg-red-950/70"
      : "rounded-lg bg-app-accent px-4 py-2 text-sm font-semibold text-app-bg transition-colors hover:bg-app-accent2";

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[min(400px,95vw)] rounded-2xl border border-white/[0.14] bg-app-bg2 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="text-[15px] font-semibold leading-snug text-app-text"
        >
          {title}
        </h2>
        {description != null && description !== "" && (
          <div className="mt-3 text-[13px] leading-relaxed text-app-text2">
            {description}
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.14] bg-app-bg3 px-4 py-2 text-sm font-medium text-app-text2 transition-colors hover:border-white/[0.22] hover:text-app-text"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={confirmClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
