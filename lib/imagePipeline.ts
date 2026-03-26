import { DEFAULT_CROP_PRESET_ID } from "./cropRatios";
import {
  buildWatermarkCanvasFont,
  DEFAULT_WM_FONT_PRESET_ID,
  DEFAULT_WM_FONT_WEIGHT,
} from "./watermarkFonts";

export type Transforms = { rotation: number; flipH: boolean; flipV: boolean };

/** Per-image edits (filters, export, watermark, crop preset). */
export type ImageEditSettings = {
  transforms: Transforms;
  currentFilter: string;
  outputFormat: string;
  quality: number;
  wmEnabled: boolean;
  wmText: string;
  wmColor: string;
  wmFontPresetId: string;
  wmFontWeight: number;
  wmFontItalic: boolean;
  wmSize: number;
  wmOpacity: number;
  wmPosition: number;
  cropPresetId: string;
};

export function defaultImageEditSettings(): ImageEditSettings {
  return {
    transforms: { rotation: 0, flipH: false, flipV: false },
    currentFilter: "none",
    outputFormat: "image/webp",
    quality: 85,
    wmEnabled: false,
    wmText: "© My Work",
    wmColor: "#ffffff",
    wmFontPresetId: DEFAULT_WM_FONT_PRESET_ID,
    wmFontWeight: DEFAULT_WM_FONT_WEIGHT,
    wmFontItalic: false,
    wmSize: 32,
    wmOpacity: 40,
    wmPosition: 8,
    cropPresetId: DEFAULT_CROP_PRESET_ID,
  };
}

const DEFAULT_EDIT_SETTINGS_JSON = JSON.stringify(defaultImageEditSettings());

export function renderOptionsFromSettings(
  s: ImageEditSettings,
  wmCustomFontReady: boolean
): RenderOptions {
  return {
    resizeWidth: null,
    currentFilter: s.currentFilter,
    transforms: s.transforms,
    wmEnabled: s.wmEnabled,
    wmText: s.wmText,
    wmSize: s.wmSize,
    wmOpacityPercent: s.wmOpacity,
    wmPosition: s.wmPosition,
    wmColor: s.wmColor,
    wmFontPresetId: s.wmFontPresetId,
    wmFontWeight: s.wmFontWeight,
    wmFontItalic: s.wmFontItalic,
    wmCustomFontReady,
  };
}

export type ImageFileEntry = {
  file: File;
  dataUrl: string;
  croppedUrl?: string;
  name: string;
  size: number;
  settings: ImageEditSettings;
};

/** True if the slot differs from a fresh upload (settings not default and/or crop applied). */
export function entryHasDiscardableEdits(
  entry: ImageFileEntry | null | undefined
): boolean {
  if (!entry) return false;
  if (entry.croppedUrl) return true;
  return JSON.stringify(entry.settings) !== DEFAULT_EDIT_SETTINGS_JSON;
}

/** Undo/redo snapshot for one queue item (settings + optional crop). */
export type EditSnapshot = {
  settings: ImageEditSettings;
  croppedUrl?: string;
};

export function snapshotFromEntry(entry: ImageFileEntry): EditSnapshot {
  return {
    settings: structuredClone(entry.settings),
    ...(entry.croppedUrl !== undefined
      ? { croppedUrl: entry.croppedUrl }
      : {}),
  };
}

export function applySnapshotToEntry(
  entry: ImageFileEntry,
  snap: EditSnapshot
): ImageFileEntry {
  const next: ImageFileEntry = {
    ...entry,
    settings: structuredClone(snap.settings),
  };
  if (snap.croppedUrl !== undefined) next.croppedUrl = snap.croppedUrl;
  else delete next.croppedUrl;
  return next;
}

export type RenderOptions = {
  resizeWidth: number | null;
  currentFilter: string;
  transforms: Transforms;
  wmEnabled: boolean;
  wmText: string;
  wmSize: number;
  wmOpacityPercent: number;
  wmPosition: number;
  /** CSS color string, e.g. `#ffffff` */
  wmColor: string;
  wmFontPresetId: string;
  wmFontWeight: number;
  wmFontItalic: boolean;
  /** Custom upload: font registered and ready for canvas */
  wmCustomFontReady: boolean;
};

export type ConvertedFile = {
  name: string;
  url: string;
  size: number;
  origSize: number;
  original: string;
};

export function formatSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

/** Renders `img` onto canvas with transforms, filter, optional watermark. */
export function renderImageToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  options: RenderOptions
): { cw: number; ch: number } {
  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;
  const resizeW = options.resizeWidth;
  if (resizeW && resizeW < w) {
    h = Math.round((h * resizeW) / w);
    w = resizeW;
  }

  const rot = options.transforms.rotation;
  const swapped = rot % 180 !== 0;
  const cw = swapped ? h : w;
  const ch = swapped ? w : h;

  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { cw, ch };

  ctx.clearRect(0, 0, cw, ch);
  ctx.save();
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate((rot * Math.PI) / 180);
  if (options.transforms.flipH) ctx.scale(-1, 1);
  if (options.transforms.flipV) ctx.scale(1, -1);
  if (options.currentFilter && options.currentFilter !== "none")
    ctx.filter = options.currentFilter;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();

  if (options.wmEnabled) {
    const text = options.wmText || "© Watermark";
    const size = options.wmSize || 32;
    const opacity = options.wmOpacityPercent / 100;
    ctx.save();
    ctx.globalAlpha = opacity;
    const raw = options.wmColor?.trim() ?? "";
    ctx.fillStyle = /^#[0-9A-Fa-f]{6}$/i.test(raw) ? raw : "#ffffff";
    ctx.font = buildWatermarkCanvasFont({
      size,
      presetId: options.wmFontPresetId,
      weight: options.wmFontWeight,
      italic: options.wmFontItalic,
      customFontReady: options.wmCustomFontReady,
    });
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(text).width;
    const pad = 20;
    const col = options.wmPosition % 3;
    const row = Math.floor(options.wmPosition / 3);
    const x =
      col === 0 ? pad : col === 1 ? (cw - tw) / 2 : cw - tw - pad;
    const y =
      row === 0
        ? pad + size / 2
        : row === 1
          ? ch / 2
          : ch - size / 2 - pad;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  return { cw, ch };
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function drawLivePreview(
  canvas: HTMLCanvasElement,
  imageSrc: string,
  options: RenderOptions
): Promise<{ cw: number; ch: number } | null> {
  try {
    const img = await loadImage(imageSrc);
    return renderImageToCanvas(canvas, img, options);
  } catch {
    return null;
  }
}

/** Renders the same pixels as the live preview (filters, rotate, flip, resize, watermark) to a PNG data URL for cropping. */
export async function renderTransformedDataUrl(
  imageSrc: string,
  options: RenderOptions
): Promise<string> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  renderImageToCanvas(canvas, img, options);
  return canvas.toDataURL("image/png");
}

export async function bakeImage(
  entry: ImageFileEntry,
  format: string,
  quality: number,
  resizeW: number | null,
  options: RenderOptions
): Promise<ConvertedFile> {
  const src = entry.croppedUrl || entry.dataUrl;
  const img = await loadImage(src);
  const temp = document.createElement("canvas");
  const opts: RenderOptions = {
    ...options,
    resizeWidth: resizeW,
  };
  renderImageToCanvas(temp, img, opts);
  const ext = format.split("/")[1] ?? "png";
  const name = entry.name.replace(/\.[^.]+$/, `.${ext}`);
  const url = temp.toDataURL(format, quality);
  const size = Math.round(url.length * 0.75);
  return {
    name,
    url,
    size,
    origSize: entry.size,
    original: src,
  };
}
