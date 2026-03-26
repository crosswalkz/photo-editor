"use client";

type Props = {
  onOpenCrop: () => void;
  hasFiles: boolean;
};

function CropIcon() {
  return (
    <svg
      className="size-3.5 shrink-0 stroke-current"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      aria-hidden
    >
      <polyline points="6 2 6 8 2 8" />
      <polyline points="18 22 18 16 22 16" />
      <path d="M2 17.5 6 14v-4 4h4l8 6" />
      <path d="M22 6.5 18 10V6h-4L6 2" />
    </svg>
  );
}

export function CropCard({ onOpenCrop, hasFiles }: Props) {
  return (
    <div className="mb-4 rounded-2xl border border-white/[0.08] bg-app-bg2 p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-app-text3">
        Crop
      </div>
      <p className="mb-3 text-xs text-app-text3">
        Choose aspect ratio and adjust the crop in the editor.
      </p>
      <button
        type="button"
        disabled={!hasFiles}
        onClick={onOpenCrop}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/[0.14] bg-app-bg3 px-4 py-2.5 text-sm font-medium text-app-text2 transition-colors hover:border-app-accent/40 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-h-0"
      >
        <CropIcon />
        Crop image
      </button>
    </div>
  );
}
