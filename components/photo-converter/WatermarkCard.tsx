"use client";

import { useRef } from "react";
import {
  CUSTOM_WM_FONT_FAMILY,
  WM_FONT_PRESETS,
  WM_FONT_PRESET_ID_CUSTOM,
  WM_FONT_WEIGHTS,
} from "@/lib/watermarkFonts";

const selectClass =
  "min-h-11 w-full rounded-lg border border-white/[0.14] bg-app-bg3 px-2.5 py-2 text-sm text-app-text outline-none focus:border-app-accent sm:min-h-0 sm:py-1.5";

function importedFontDropdownLabel(fileName: string, maxLen = 48): string {
  const base =
    fileName.length <= maxLen ? fileName : `${fileName.slice(0, maxLen - 1)}…`;
  return `Imported · ${base}`;
}

type Props = {
  enabled: boolean;
  onToggle: () => void;
  text: string;
  onText: (v: string) => void;
  color: string;
  onColor: (v: string) => void;
  fontPresetId: string;
  onFontPresetId: (id: string) => void;
  fontWeight: number;
  onFontWeight: (w: number) => void;
  fontItalic: boolean;
  onFontItalic: (v: boolean) => void;
  customFontReady: boolean;
  customFontFileName: string | null;
  onCustomFontFile: (file: File) => void;
  onClearCustomFont: () => void;
  size: number;
  onSize: (v: number) => void;
  opacity: number;
  onOpacity: (v: number) => void;
  position: number;
  onPosition: (i: number) => void;
};

export function WatermarkCard({
  enabled,
  onToggle,
  text,
  onText,
  color,
  onColor,
  fontPresetId,
  onFontPresetId,
  fontWeight,
  onFontWeight,
  fontItalic,
  onFontItalic,
  customFontReady,
  customFontFileName,
  onCustomFontFile,
  onClearCustomFont,
  size,
  onSize,
  opacity,
  onOpacity,
  position,
  onPosition,
}: Props) {
  const customFontInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4 rounded-2xl border border-white/[0.08] bg-app-bg2 p-5">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-app-text3">
        Watermark
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="watermark-overlay-label"
          onClick={onToggle}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer touch-manipulation rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg2 ${
            enabled ? "bg-app-accent" : "bg-white/15"
          }`}
        >
          <span
            aria-hidden
            className={`pointer-events-none block size-6 rounded-full bg-white transition-transform duration-200 ease-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span
          id="watermark-overlay-label"
          className="text-xs text-app-text3"
        >
          Text watermark overlay
        </span>
      </div>
      {enabled && (
        <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <div>
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-medium text-app-text2">
                Watermark text
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => onText(e.target.value)}
                className="w-full rounded-lg border border-white/[0.14] bg-app-bg3 px-2.5 py-1.5 text-sm text-app-text outline-none focus:border-app-accent"
              />
            </div>
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-medium text-app-text2">
                Font family
              </label>
              <select
                value={fontPresetId}
                onChange={(e) => onFontPresetId(e.target.value)}
                className={selectClass}
              >
                {WM_FONT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
                <option value={WM_FONT_PRESET_ID_CUSTOM}>
                  {customFontFileName
                    ? importedFontDropdownLabel(customFontFileName)
                    : "Custom (upload file…)"}
                </option>
              </select>
              {fontPresetId === WM_FONT_PRESET_ID_CUSTOM && (
                <div className="mt-2 rounded-lg border border-white/[0.08] bg-app-bg3/80 p-3">
                  <p className="mb-2 text-[11px] leading-relaxed text-app-text3">
                    Upload a font you have on disk (
                    <span className="font-mono text-app-text2">.woff2</span>,{" "}
                    <span className="font-mono text-app-text2">.woff</span>,{" "}
                    <span className="font-mono text-app-text2">.ttf</span>,{" "}
                    <span className="font-mono text-app-text2">.otf</span>).
                    Registered as{" "}
                    <span className="font-mono text-app-accent">
                      {CUSTOM_WM_FONT_FAMILY}
                    </span>{" "}
                    for the canvas.
                  </p>
                  <input
                    ref={customFontInputRef}
                    type="file"
                    accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onCustomFontFile(f);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => customFontInputRef.current?.click()}
                      className="min-h-11 rounded-lg border border-white/[0.14] bg-app-bg2 px-3 py-2 text-xs text-app-text2 transition-colors hover:border-app-accent/40 hover:text-app-text sm:min-h-0"
                    >
                      Choose font file
                    </button>
                    {customFontReady && (
                      <button
                        type="button"
                        onClick={onClearCustomFont}
                        className="min-h-11 rounded-lg border border-white/[0.14] px-3 py-2 text-xs text-app-text3 hover:text-app-text sm:min-h-0"
                      >
                        Remove font
                      </button>
                    )}
                  </div>
                  {!customFontReady && (
                    <p className="mt-1.5 text-[11px] text-app-text3">
                      Preview uses Sans until a file loads successfully.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-medium text-app-text2">
                Font weight
              </label>
              <select
                value={fontWeight}
                onChange={(e) => onFontWeight(Number(e.target.value))}
                className={selectClass}
              >
                {WM_FONT_WEIGHTS.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-medium text-app-text2">
                Font style
              </label>
              <select
                value={fontItalic ? "italic" : "normal"}
                onChange={(e) => onFontItalic(e.target.value === "italic")}
                className={selectClass}
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-medium text-app-text2">
                Text color
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#ffffff"}
                  onChange={(e) => onColor(e.target.value)}
                  className="h-10 w-14 min-h-[44px] min-w-[44px] cursor-pointer rounded-lg border border-white/[0.14] bg-app-bg3 p-1 sm:min-h-10 sm:min-w-14"
                  title="Pick color"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => onColor(e.target.value)}
                  onBlur={() => {
                    if (!/^#[0-9A-Fa-f]{6}$/i.test(color)) onColor("#ffffff");
                  }}
                  spellCheck={false}
                  placeholder="#ffffff"
                  className="min-w-0 flex-1 rounded-lg border border-white/[0.14] bg-app-bg3 px-2.5 py-1.5 font-mono text-sm text-app-text outline-none focus:border-app-accent"
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-medium text-app-text2">
                Font size (px)
              </label>
              <input
                type="number"
                value={size}
                min={8}
                max={200}
                onChange={(e) => onSize(Number(e.target.value) || 32)}
                className="w-full rounded-lg border border-white/[0.14] bg-app-bg3 px-2.5 py-1.5 text-sm text-app-text outline-none focus:border-app-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-app-text2">
                Opacity
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={opacity}
                  onChange={(e) => onOpacity(Number(e.target.value))}
                  className="app-range min-h-[44px] flex-1 py-3 sm:min-h-0 sm:py-0"
                />
                <span className="min-w-8 text-right font-mono text-xs text-app-accent">
                  {opacity}%
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 md:mt-0">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-app-text3">
              Position
            </div>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPosition(i)}
                  className={`flex aspect-square min-h-[44px] items-center justify-center rounded border transition-colors sm:min-h-0 ${
                    position === i
                      ? "border-app-accent bg-[rgba(110,231,183,0.12)]"
                      : "border-white/[0.08] bg-app-bg3 hover:border-white/[0.14]"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      position === i ? "bg-app-accent" : "bg-app-text3"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
