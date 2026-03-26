"use client";

import type { ImageFileEntry } from "@/lib/imagePipeline";
import { formatSize } from "@/lib/imagePipeline";

type Props = {
  files: ImageFileEntry[];
  previewIndex: number;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  fileDone: boolean[];
};

export function FileGrid({
  files,
  previewIndex,
  onSelect,
  onRemove,
  fileDone,
}: Props) {
  return (
    <>
      <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-[7px]">
        {files.map((f, i) => (
          <button
            key={`${f.name}-${i}-${f.dataUrl.slice(0, 20)}`}
            type="button"
            id={`file-${i}`}
            onClick={() => onSelect(i)}
            className={`group relative cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] bg-app-bg3 text-left transition-colors hover:border-white/[0.14] ${
              i === previewIndex ? "!border-app-accent" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={f.croppedUrl || f.dataUrl}
              alt=""
              className="block h-[85px] w-full object-cover"
            />
            <div className="px-2 py-1">
              <div className="truncate text-[11px] font-medium">{f.name}</div>
              <div className="font-mono text-[10px] text-app-text3">
                {formatSize(f.size)}
              </div>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(i);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onRemove(i);
                }
              }}
              className="absolute right-0.5 top-0.5 flex size-9 items-center justify-center rounded-full bg-black/75 text-sm text-white opacity-100 transition-opacity [-webkit-tap-highlight-color:transparent] sm:right-1 sm:top-1 sm:size-[18px] sm:text-[10px] sm:opacity-0 sm:group-hover:opacity-100"
            >
              ×
            </span>
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left scale-x-0 bg-app-accent transition-transform duration-[400ms] ease-out ${
                fileDone[i] ? "scale-x-100" : ""
              }`}
            />
          </button>
        ))}
      </div>
      {files.length > 1 && (
        <p className="mt-1.5 text-[11px] text-app-text3">
          ↑ Click a thumbnail to preview it
        </p>
      )}
    </>
  );
}
