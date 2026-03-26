"use client";

import { FILTER_PREVIEW_SRC, FILTER_PRESETS } from "@/lib/constants";
import type { Transforms } from "@/lib/imagePipeline";

type Props = {
  currentFilter: string;
  onFilter: (value: string) => void;
  transforms: Transforms;
  onTransform: (kind: "rotate-cw" | "rotate-ccw" | "flip-h" | "flip-v") => void;
  onReset: () => void;
};

function Icon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <svg
      className="size-3 shrink-0 stroke-current"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function FiltersTransformsCard({
  currentFilter,
  onFilter,
  transforms,
  onTransform,
  onReset,
}: Props) {
  const transformBtnClass =
    "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors sm:min-h-0 sm:py-1.5";

  return (
    <div className="mb-4 rounded-2xl border border-white/[0.08] bg-app-bg2 p-5">
      <div className="mb-4 flex justify-between flex-wrap items-center gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-app-text3">
          Filters & transforms
        </div>
        <button
          type="button"
          onClick={() => onReset()}
          title="Reset filter and rotation / flip only"
          className={`${transformBtnClass} shrink-0 border-white/[0.14] bg-app-bg3 text-app-text2 hover:text-app-text sm:w-auto`}
        >
          <Icon>
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-5.6" />
          </Icon>
          Filter / rotate reset
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {FILTER_PRESETS.map((f) => {
          const selected = currentFilter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilter(f.value)}
              aria-pressed={selected}
              aria-label={`${f.label} filter`}
              className={`flex flex-col gap-1.5 rounded-lg border p-1.5 text-left transition-colors ${
                selected
                  ? "border-app-accent bg-[rgba(110,231,183,0.12)]"
                  : "border-white/[0.14] bg-app-bg3 hover:border-white/[0.22]"
              }`}
            >
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-white/[0.08] bg-app-bg3">
                {/* eslint-disable-next-line @next/next/no-img-element -- static preview asset */}
                <img
                  src={FILTER_PREVIEW_SRC}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    filter: f.value === "none" ? "none" : f.value,
                  }}
                />
              </div>
              <span
                className={`px-0.5 text-center text-[11px] font-medium leading-tight ${
                  selected ? "text-app-accent" : "text-app-text2"
                }`}
              >
                {f.label}
              </span>
            </button>
          );
        })}
      </div>
      <hr className="my-3 border-0 border-t border-white/[0.08]" />
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-app-text3">
        Rotate / flip
      </div>
      <div className="grid gap-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onTransform("rotate-cw")}
            className={`${transformBtnClass} border-white/[0.14] bg-app-bg3 text-app-text2 hover:text-app-text`}
          >
            <Icon>
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </Icon>
            CW 90°
          </button>
          <button
            type="button"
            onClick={() => onTransform("rotate-ccw")}
            className={`${transformBtnClass} border-white/[0.14] bg-app-bg3 text-app-text2 hover:text-app-text`}
          >
            <Icon>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </Icon>
            CCW 90°
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onTransform("flip-h")}
            className={`${transformBtnClass} ${
              transforms.flipH
                ? "border-app-accent bg-[rgba(110,231,183,0.12)] text-app-accent"
                : "border-white/[0.14] bg-app-bg3 text-app-text2 hover:text-app-text"
            }`}
          >
            <Icon>
              <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" />
              <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
              <line x1="12" y1="20" x2="12" y2="4" />
            </Icon>
            Flip H
          </button>
          <button
            type="button"
            onClick={() => onTransform("flip-v")}
            className={`${transformBtnClass} ${
              transforms.flipV
                ? "border-app-accent bg-[rgba(110,231,183,0.12)] text-app-accent"
                : "border-white/[0.14] bg-app-bg3 text-app-text2 hover:text-app-text"
            }`}
          >
            <Icon>
              <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
              <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </Icon>
            Flip V
          </button>
        </div>
      </div>
    </div>
  );
}
