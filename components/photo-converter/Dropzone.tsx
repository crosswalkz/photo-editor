"use client";

import { MAX_UPLOAD_IMAGES, PHOTO_UPLOAD_ACCEPT } from "@/lib/constants";

type Props = {
  onPickFiles: () => void;
  onFiles: (files: FileList) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** At capacity — browse is blocked; drops still report via `onFiles`. */
  uploadLocked?: boolean;
};

export function Dropzone({
  onPickFiles,
  onFiles,
  dragOver,
  setDragOver,
  inputRef,
  uploadLocked = false,
}: Props) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={uploadLocked}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPickFiles();
        }
      }}
      onClick={onPickFiles}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border-[1.5px] border-dashed px-4 py-8 text-center transition-all sm:py-8 ${
        uploadLocked
          ? "cursor-not-allowed border-white/[0.1] bg-app-bg3/50 opacity-60"
          : `cursor-pointer ${
              dragOver
                ? "border-app-accent bg-[rgba(110,231,183,0.12)]"
                : "border-white/[0.14] bg-[rgba(110,231,183,0.06)] hover:border-app-accent hover:bg-[rgba(110,231,183,0.12)]"
            }`
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        disabled={uploadLocked}
        accept={PHOTO_UPLOAD_ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <div className="mb-1 text-[22px] opacity-90">⬆</div>
      <div className="mb-0.5 text-sm font-medium">Drop images here</div>
      <div className="text-xs text-app-text3">
        or <span className="text-app-accent">browse files</span> — PNG, JPG,
        WebP, BMP, TIFF…
      </div>
      <div className="mt-1.5 text-[11px] text-app-text3">
        Up to {MAX_UPLOAD_IMAGES} images
        {uploadLocked ? " (full — remove one to add more)" : ""}
      </div>
    </div>
  );
}
