"use client";

import { OUTPUT_FORMATS } from "@/lib/constants";

type Props = {
  outputFormat: string;
  onOutputFormat: (v: string) => void;
  quality: number;
  onQuality: (v: number) => void;
};

export function SettingsCard({
  outputFormat,
  onOutputFormat,
  quality,
  onQuality,
}: Props) {
  return (
    <div className="mb-4 rounded-2xl border border-white/[0.08] bg-app-bg2 p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-app-text3">
        Conversion settings
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-app-text2">
            Output format
          </label>
          <select
            value={outputFormat}
            onChange={(e) => onOutputFormat(e.target.value)}
            className="w-full appearance-none rounded-lg border border-white/[0.14] bg-app-bg3 px-2.5 py-1.5 text-sm text-app-text outline-none transition-colors focus:border-app-accent"
          >
            {OUTPUT_FORMATS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-app-text2">
            Quality
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={10}
              max={100}
              value={quality}
              onChange={(e) => onQuality(Number(e.target.value))}
              className="app-range min-h-[44px] flex-1 py-3 sm:min-h-0 sm:py-0"
            />
            <span className="min-w-8 text-right font-mono text-xs text-app-accent">
              {quality}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
