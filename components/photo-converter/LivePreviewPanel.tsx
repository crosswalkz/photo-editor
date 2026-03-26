"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useState } from "react";

function IconUndo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  );
}

function IconRedo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
    </svg>
  );
}

function IconTrash({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

type Props = {
  hasFiles: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  showInfo: boolean;
  cw: number;
  ch: number;
  formatExt: string;
  quality: number;
  fileSizeLabel: string;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  filterLabel: string;
  filterOn: boolean;
  wmEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDiscardAll: () => void;
  canDiscardAll: boolean;
};

export function LivePreviewPanel({
  hasFiles,
  canvasRef,
  showInfo,
  cw,
  ch,
  formatExt,
  quality,
  fileSizeLabel,
  rotation,
  flipH,
  flipV,
  filterLabel,
  filterOn,
  wmEnabled,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDiscardAll,
  canDiscardAll,
}: Props) {
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const historyIconBtnClass =
    "inline-flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div className="flex min-h-[280px] flex-col border-t border-white/[0.08] bg-app-bg2 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:border-l lg:border-t-0">
      <ConfirmDialog
        open={discardConfirmOpen}
        onClose={() => setDiscardConfirmOpen(false)}
        title="Discard all edits?"
        description="This resets the current image to defaults: filters, crop, watermark, and export settings. Edit history for this image will be cleared."
        cancelLabel="Cancel"
        confirmLabel="Discard"
        variant="danger"
        onConfirm={onDiscardAll}
      />
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-5 pb-3 pt-4">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-app-text3">
          Preview
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={!hasFiles || !canUndo}
            onClick={onUndo}
            title="Undo"
            aria-label="Undo last edit"
            className={`${historyIconBtnClass} border-white/[0.14] bg-app-bg3 text-app-text2 hover:border-app-accent/40 hover:text-app-text`}
          >
            <IconUndo className="size-4" />
          </button>
          <button
            type="button"
            disabled={!hasFiles || !canRedo}
            onClick={onRedo}
            title="Redo"
            aria-label="Redo edit"
            className={`${historyIconBtnClass} border-white/[0.14] bg-app-bg3 text-app-text2 hover:border-app-accent/40 hover:text-app-text`}
          >
            <IconRedo className="size-4" />
          </button>
          <button
            type="button"
            disabled={!hasFiles || !canDiscardAll}
            title={
              !hasFiles
                ? undefined
                : !canDiscardAll
                  ? "No edits to discard"
                  : "Discard all edits for this image"
            }
            aria-label="Discard all edits"
            onClick={() => setDiscardConfirmOpen(true)}
            className={`${historyIconBtnClass} border-red-400/35 bg-app-bg3 text-red-300/90 hover:border-red-400/55 hover:text-red-200 disabled:text-app-text2`}
          >
            <IconTrash className="size-4" />
          </button>
        </div>
      </div>
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-5"
        style={{
          background:
            "repeating-conic-gradient(#1a1a1d 0% 25%, #151518 0% 50%) 0 0 / 20px 20px",
        }}
      >
        {!hasFiles && (
          <div className="text-center text-app-text3">
            <div className="mb-2 text-[30px] opacity-35">🖼</div>
            <div className="text-[13px] leading-relaxed">
              Upload an image
              <br />
              to see live preview
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`max-h-[240px] max-w-full rounded-lg object-contain transition-opacity duration-100 lg:max-h-[calc(100vh-260px)] ${
            hasFiles ? "block" : "hidden"
          }`}
        />
      </div>
      {showInfo && hasFiles && (
        <div className="flex shrink-0 flex-col gap-1.5 border-t border-white/[0.08] px-5 py-3">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-white/[0.08] bg-app-bg3 px-2 py-0.5 font-mono text-[11px] text-app-text3">
              {cw} × {ch}px
            </span>
            <span className="rounded-full border border-[rgba(110,231,183,0.3)] bg-[rgba(110,231,183,0.08)] px-2 py-0.5 font-mono text-[11px] text-app-accent">
              {formatExt}
            </span>
            <span className="rounded-full border border-white/[0.08] bg-app-bg3 px-2 py-0.5 font-mono text-[11px] text-app-text3">
              Q {quality}%
            </span>
            <span className="rounded-full border border-white/[0.08] bg-app-bg3 px-2 py-0.5 font-mono text-[11px] text-app-text3">
              {fileSizeLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rounded-full border border-[rgba(110,231,183,0.25)] bg-[rgba(110,231,183,0.08)] px-2 py-0.5 font-mono text-[11px] text-app-accent ${
                rotation !== 0 ? "inline-block" : "hidden"
              }`}
            >
              ↻ {rotation}°
            </span>
            <span
              className={`rounded-full border border-[rgba(110,231,183,0.25)] bg-[rgba(110,231,183,0.08)] px-2 py-0.5 font-mono text-[11px] text-app-accent ${
                flipH ? "inline-block" : "hidden"
              }`}
            >
              ⇔ Flip H
            </span>
            <span
              className={`rounded-full border border-[rgba(110,231,183,0.25)] bg-[rgba(110,231,183,0.08)] px-2 py-0.5 font-mono text-[11px] text-app-accent ${
                flipV ? "inline-block" : "hidden"
              }`}
            >
              ⇕ Flip V
            </span>
            <span
              className={`rounded-full border border-[rgba(110,231,183,0.25)] bg-[rgba(110,231,183,0.08)] px-2 py-0.5 font-mono text-[11px] text-app-accent ${
                filterOn ? "inline-block" : "hidden"
              }`}
            >
              ◈ {filterLabel}
            </span>
            <span
              className={`rounded-full border border-[rgba(110,231,183,0.25)] bg-[rgba(110,231,183,0.08)] px-2 py-0.5 font-mono text-[11px] text-app-accent ${
                wmEnabled ? "inline-block" : "hidden"
              }`}
            >
              ⌥ Watermark
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
