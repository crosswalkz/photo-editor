/** `ratio` is width/height for Cropper.js; `null` means free (no lock). */
export type CropAspectPreset = {
  id: string;
  label: string;
  ratio: number | null;
};

export const CROP_ASPECT_PRESETS: CropAspectPreset[] = [
  { id: "free", label: "Free", ratio: null },
  { id: "1-1", label: "1:1", ratio: 1 },
  { id: "4-3", label: "4:3", ratio: 4 / 3 },
  { id: "3-4", label: "3:4", ratio: 3 / 4 },
  { id: "16-9", label: "16:9", ratio: 16 / 9 },
  { id: "9-16", label: "9:16", ratio: 9 / 16 },
];

export const DEFAULT_CROP_PRESET_ID = "free";

export function cropRatioForPresetId(id: string): number | null {
  return CROP_ASPECT_PRESETS.find((p) => p.id === id)?.ratio ?? null;
}
