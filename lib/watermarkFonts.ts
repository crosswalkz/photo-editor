export type WatermarkFontPreset = {
  id: string;
  label: string;
  /** Canvas/CSS `font-family` value (quoted where needed) */
  family: string;
};

export const WM_FONT_PRESETS: WatermarkFontPreset[] = [
  { id: "sans", label: "Sans", family: '"DM Sans", sans-serif' },
  { id: "serif", label: "Serif", family: 'Georgia, "Times New Roman", serif' },
  { id: "mono", label: "Mono", family: '"DM Mono", ui-monospace, monospace' },
  { id: "system", label: "System UI", family: "system-ui, sans-serif" },
];

/** Dropdown value for user-uploaded font (Font Face API). */
export const WM_FONT_PRESET_ID_CUSTOM = "custom";

/** Single-word family registered via `FontFace` for custom uploads. */
export const CUSTOM_WM_FONT_FAMILY = "PhotoCropUserWM";

export const DEFAULT_WM_FONT_PRESET_ID = "sans";

export const WM_FONT_WEIGHTS: { value: number; label: string }[] = [
  { value: 400, label: "Regular" },
  { value: 500, label: "Medium" },
  { value: 600, label: "Semibold" },
  { value: 700, label: "Bold" },
];

export const DEFAULT_WM_FONT_WEIGHT = 600;

export function wmFontFamilyForPresetId(id: string): string {
  if (id === WM_FONT_PRESET_ID_CUSTOM) {
    return WM_FONT_PRESETS[0].family;
  }
  return (
    WM_FONT_PRESETS.find((p) => p.id === id)?.family ??
    WM_FONT_PRESETS[0].family
  );
}

/** Valid canvas `font` shorthand for watermark text. */
export function buildWatermarkCanvasFont(opts: {
  size: number;
  presetId: string;
  weight: number;
  italic: boolean;
  /** When preset is custom and a file was loaded successfully */
  customFontReady: boolean;
}): string {
  const style = opts.italic ? "italic" : "normal";
  const weight = Number.isFinite(opts.weight) ? opts.weight : DEFAULT_WM_FONT_WEIGHT;
  const size = opts.size || 32;
  const family =
    opts.presetId === WM_FONT_PRESET_ID_CUSTOM && opts.customFontReady
      ? CUSTOM_WM_FONT_FAMILY
      : wmFontFamilyForPresetId(
          opts.presetId === WM_FONT_PRESET_ID_CUSTOM
            ? DEFAULT_WM_FONT_PRESET_ID
            : opts.presetId
        );
  return `${style} ${weight} ${size}px ${family}`;
}
