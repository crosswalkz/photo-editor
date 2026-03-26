/** Maximum number of images in the queue at once. */
export const MAX_UPLOAD_IMAGES = 5;

/** Max undo steps per image for styling / crop snapshot history. */
export const MAX_STYLE_UNDO_STEPS = 10;

/** File input `accept` for uploads (GIF excluded). */
export const PHOTO_UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/bmp,image/avif,image/tiff,.jpg,.jpeg,.png,.webp,.bmp,.avif,.tif,.tiff";

export function isGifImageFile(file: File): boolean {
  if (file.type.toLowerCase() === "image/gif") return true;
  return /\.gif$/i.test(file.name);
}

/** Stock image shown on each filter preset chip (same path as `public/assets/stockPhoto.png`). */
export const FILTER_PREVIEW_SRC = "/assets/stockPhoto.png";

/** App header icon (`public/assets/photoCropIcon.png`). */
export const PHOTO_CROP_ICON_SRC = "/assets/camera.svg";

export const FILTER_PRESETS: { label: string; value: string }[] = [
  { label: "Original", value: "none" },
  { label: "Grayscale", value: "grayscale(100%)" },
  { label: "Sepia", value: "sepia(80%)" },
  { label: "Invert", value: "invert(100%)" },
  { label: "Vivid", value: "contrast(150%) brightness(1.1)" },
  { label: "Blur", value: "blur(2px)" },
  { label: "Bright", value: "brightness(1.4) saturate(1.3)" },
  { label: "Matte", value: "saturate(0.1) brightness(0.85)" },
];

export const OUTPUT_FORMATS: { value: string; label: string }[] = [
  { value: "image/webp", label: "WebP" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/gif", label: "GIF" },
];
