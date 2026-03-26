"use client";

import type { ConvertedFile, ImageFileEntry } from "@/lib/imagePipeline";
import { formatSize } from "@/lib/imagePipeline";

type Props = {
  open: boolean;
  onClose: () => void;
  files: ImageFileEntry[];
  converted: ConvertedFile[];
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
};

export function BeforeAfterModal({
  open,
  onClose,
  files,
  converted,
  selectedIndex,
  onSelectIndex,
}: Props) {
  if (!open) return null;
  const orig = files[selectedIndex];
  const after = converted[selectedIndex];

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-[min(860px,95vw)] overflow-y-auto rounded-2xl border border-white/[0.14] bg-app-bg2 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[15px] font-semibold">Before / After</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/[0.08] bg-app-bg3 px-2.5 py-1 font-sans text-xs text-app-text2 hover:text-app-text"
          >
            Close ×
          </button>
        </div>
        <div className="mb-2.5">
          <select
            value={selectedIndex}
            onChange={(e) => onSelectIndex(Number(e.target.value))}
            className="inline-block w-full max-w-full rounded-lg border border-white/[0.14] bg-app-bg3 px-2.5 py-1.5 text-sm text-app-text outline-none focus:border-app-accent sm:w-auto"
          >
            {converted.map((c, i) => (
              <option key={c.name} value={i}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-3">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-app-text3">
              Original
            </div>
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background:
                  "repeating-conic-gradient(#333 0% 25%, #2a2a2a 0% 50%) 0 0 / 16px 16px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={orig?.croppedUrl || orig?.dataUrl || ""}
                alt="Before"
                className="block max-h-80 w-full object-contain"
              />
            </div>
            <p className="mt-1.5 font-mono text-xs text-app-text3">
              size:{" "}
              <span className="text-app-accent">
                {orig ? formatSize(orig.size) : "—"}
              </span>
            </p>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-app-text3">
              Converted
            </div>
            <div
              className="overflow-hidden rounded-xl"
              style={{
                background:
                  "repeating-conic-gradient(#333 0% 25%, #2a2a2a 0% 50%) 0 0 / 16px 16px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={after?.url || ""}
                alt="After"
                className="block max-h-80 w-full object-contain"
              />
            </div>
            <p className="mt-1.5 font-mono text-xs text-app-text3">
              size:{" "}
              <span className="text-app-accent">
                {after ? formatSize(after.size) : "—"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
