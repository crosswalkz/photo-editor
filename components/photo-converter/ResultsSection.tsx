"use client";

import type { ConvertedFile } from "@/lib/imagePipeline";
import { formatSize } from "@/lib/imagePipeline";

type Props = {
  converted: ConvertedFile[];
  onDownload: (index: number) => void;
};

export function ResultsSection({ converted, onDownload }: Props) {
  if (!converted.length) return null;

  return (
    <div className="mt-4">
      <div className="rounded-2xl border border-white/[0.08] bg-app-bg2 p-5">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-app-text3">
          Results
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2.5">
          {converted.map((cf, i) => {
            const saved = Math.round((1 - cf.size / cf.origSize) * 100);
            return (
              <div
                key={`${cf.name}-${i}`}
                className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-app-bg3 p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cf.url}
                  alt=""
                  className="block h-20 w-full rounded-lg object-cover"
                />
                <div className="truncate text-xs font-medium">{cf.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-white/[0.08] bg-app-bg2 px-1.5 py-0.5 font-mono text-[10px] text-app-text3">
                    {formatSize(cf.origSize)}
                  </span>
                  <span className="rounded-full border border-white/[0.08] bg-app-bg2 px-1.5 py-0.5 font-mono text-[10px] text-app-text3">
                    {formatSize(cf.size)}
                  </span>
                  {saved > 0 && (
                    <span className="rounded-full border border-[rgba(110,231,183,0.3)] bg-[rgba(110,231,183,0.1)] px-1.5 py-0.5 font-mono text-[10px] text-app-accent">
                      −{saved}%
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDownload(i)}
                  className="flex w-full min-h-11 items-center justify-center gap-1.5 rounded-lg border border-white/[0.14] bg-transparent py-2 text-xs text-app-text2 transition-colors hover:border-app-accent hover:text-app-accent sm:min-h-0"
                >
                  <svg
                    className="size-3 stroke-current"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth={2}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
