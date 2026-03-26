"use client";

import {
  CROP_ASPECT_PRESETS,
  type CropAspectPreset,
} from "@/lib/cropRatios";
import Cropper from "cropperjs";
import { useCallback, useEffect, useRef } from "react";

type Props = {
  open: boolean;
  /** Transformed preview bitmap; empty while preparing */
  imageSrc: string;
  preparing: boolean;
  /** width/height; `null` = free crop (Cropper NaN) */
  aspectRatio: number | null;
  selectedPresetId: string;
  onPresetChange: (id: string) => void;
  onClose: () => void;
  onApply: (dataUrl: string) => void;
};

export function CropModal({
  open,
  imageSrc,
  preparing,
  aspectRatio,
  selectedPresetId,
  onPresetChange,
  onClose,
  onApply,
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);

  const destroyCropper = useCallback(() => {
    cropperRef.current?.destroy();
    cropperRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) {
      destroyCropper();
    }
  }, [open, destroyCropper]);

  const onImageLoad = useCallback(() => {
    destroyCropper();
    const el = imgRef.current;
    if (!el || !open || !imageSrc) return;
    cropperRef.current = new Cropper(el, {
      aspectRatio: aspectRatio === null ? NaN : aspectRatio,
      viewMode: 1,
    });
  }, [open, destroyCropper, imageSrc, aspectRatio]);

  useEffect(() => {
    const c = cropperRef.current;
    if (!open || !imageSrc || !c) return;
    c.setAspectRatio(aspectRatio === null ? NaN : aspectRatio);
  }, [open, imageSrc, aspectRatio]);

  const handleApply = () => {
    const c = cropperRef.current;
    if (!c) return;
    const cropped = c.getCroppedCanvas();
    if (!cropped) return;
    destroyCropper();
    onApply(cropped.toDataURL());
  };

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && (destroyCropper(), onClose())}
    >
      <div className="flex max-h-[90vh] w-full max-w-[min(720px,95vw)] flex-col overflow-hidden rounded-2xl border border-white/[0.14] bg-app-bg2 shadow-xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-6 sm:py-4">
          <div className="text-[15px] font-semibold">Crop image</div>
          <button
            type="button"
            onClick={() => {
              destroyCropper();
              onClose();
            }}
            className="rounded-lg border border-white/[0.08] bg-app-bg3 px-3 py-1.5 text-xs text-app-text2 hover:text-app-text sm:text-sm"
          >
            Close
          </button>
        </div>
        <div className="shrink-0 border-b border-white/[0.08] px-4 py-3 sm:px-6 sm:py-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-app-text3">
            Aspect ratio
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CROP_ASPECT_PRESETS.map((p: CropAspectPreset) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                className={`min-h-11 rounded-lg border px-3 py-2 text-xs transition-colors sm:min-h-0 sm:py-1.5 ${
                  selectedPresetId === p.id
                    ? "border-app-accent bg-[rgba(110,231,183,0.12)] text-app-accent"
                    : "border-white/[0.14] bg-app-bg3 text-app-text2 hover:text-app-text"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {preparing || !imageSrc ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-white/[0.08] bg-app-bg3 px-4 py-12 text-sm text-app-text3">
              Preparing preview…
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              ref={imgRef}
              key={imageSrc}
              src={imageSrc}
              alt="Crop"
              className="block max-w-full"
              onLoad={onImageLoad}
            />
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 border-t border-white/[0.08] bg-app-bg2 p-4 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
          <button
            type="button"
            disabled={preparing || !imageSrc}
            onClick={handleApply}
            className="w-full rounded-lg bg-app-accent px-5 py-3 text-sm font-semibold text-app-bg transition-colors hover:bg-app-accent2 disabled:cursor-not-allowed disabled:opacity-40 sm:order-2 sm:w-auto sm:min-w-[120px] sm:py-2.5"
          >
            Save
          </button>
          {/* <button
            type="button"
            onClick={() => {
              destroyCropper();
              onClose();
            }}
            className="w-full rounded-lg border border-white/[0.14] bg-transparent px-4 py-3 text-sm text-app-text2 transition-colors hover:text-app-text sm:order-1 sm:w-auto sm:py-2.5"
          >
            Cancel
          </button> */}
        </div>
      </div>
    </div>
  );
}
