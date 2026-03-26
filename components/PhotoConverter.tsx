"use client";

import {
  type ConvertedFile,
  type EditSnapshot,
  type ImageFileEntry,
  type ImageEditSettings,
  type RenderOptions,
  applySnapshotToEntry,
  bakeImage,
  defaultImageEditSettings,
  drawLivePreview,
  entryHasDiscardableEdits,
  formatSize,
  renderOptionsFromSettings,
  renderTransformedDataUrl,
  snapshotFromEntry,
} from "@/lib/imagePipeline";
import {
  FILTER_PRESETS,
  isGifImageFile,
  MAX_STYLE_UNDO_STEPS,
  MAX_UPLOAD_IMAGES,
  PHOTO_CROP_ICON_SRC,
} from "@/lib/constants";
import { cropRatioForPresetId } from "@/lib/cropRatios";
import {
  CUSTOM_WM_FONT_FAMILY,
  DEFAULT_WM_FONT_PRESET_ID,
  WM_FONT_PRESET_ID_CUSTOM,
} from "@/lib/watermarkFonts";
import JSZip from "jszip";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { BeforeAfterModal } from "./photo-converter/BeforeAfterModal";
import { CropCard } from "./photo-converter/CropCard";
import { CropModal } from "./photo-converter/CropModal";
import { Dropzone } from "./photo-converter/Dropzone";
import { FileGrid } from "./photo-converter/FileGrid";
import { FiltersTransformsCard } from "./photo-converter/FiltersTransformsCard";
import { LivePreviewPanel } from "./photo-converter/LivePreviewPanel";
import { ResultsSection } from "./photo-converter/ResultsSection";
import { SettingsCard } from "./photo-converter/SettingsCard";
import { WatermarkCard } from "./photo-converter/WatermarkCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const resetTransformsAfterCrop = defaultImageEditSettings().transforms;

export function PhotoConverter() {
  const [files, setFiles] = useState<ImageFileEntry[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [convertedFiles, setConvertedFiles] = useState<ConvertedFile[]>([]);
  const [wmFontCustomReady, setWmFontCustomReady] = useState(false);
  const [wmCustomFontName, setWmCustomFontName] = useState<string | null>(null);
  const customFontFaceRef = useRef<FontFace | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState("");
  const cropRequestIdRef = useRef(0);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffSelectIndex, setDiffSelectIndex] = useState(0);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [fileDone, setFileDone] = useState<boolean[]>([]);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [pendingRemoveIndex, setPendingRemoveIndex] = useState<number | null>(
    null
  );

  const [previewDims, setPreviewDims] = useState({ cw: 0, ch: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  /** Bumped whenever preview scheduling runs; stale async draws must not commit. */
  const livePreviewGenRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const styleHistoryRef = useRef(
    new Map<number, { past: EditSnapshot[]; future: EditSnapshot[] }>()
  );
  const [historyTick, setHistoryTick] = useState(0);

  const recordStyleHistoryBeforeEdit = useCallback(
    (index: number, entry: ImageFileEntry) => {
      const snap = snapshotFromEntry(entry);
      let stacks = styleHistoryRef.current.get(index);
      if (!stacks) {
        stacks = { past: [], future: [] };
        styleHistoryRef.current.set(index, stacks);
      }
      stacks.past.push(structuredClone(snap));
      while (stacks.past.length > MAX_STYLE_UNDO_STEPS) stacks.past.shift();
      stacks.future = [];
    },
    []
  );

  const showToast = useCallback(
    (msg: string, variant: "success" | "error" = "success") => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({
        message: variant === "success" ? `✓ ${msg}` : `! ${msg}`,
        variant,
      });
      toastTimerRef.current = setTimeout(() => setToast(null), 2200);
    },
    []
  );

  const removeCustomFontFace = useCallback(() => {
    const f = customFontFaceRef.current;
    if (f) {
      try {
        document.fonts.delete(f);
      } catch {
        /* ignore */
      }
      customFontFaceRef.current = null;
    }
  }, []);

  const updateCurrentSettings = useCallback(
    (partial: Partial<ImageEditSettings>) => {
      setFiles((prev) => {
        if (!prev.length) return prev;
        const i = Math.min(previewIndex, prev.length - 1);
        recordStyleHistoryBeforeEdit(i, prev[i]);
        const next = [...prev];
        next[i] = {
          ...next[i],
          settings: { ...next[i].settings, ...partial },
        };
        return next;
      });
      setHistoryTick((t) => t + 1);
    },
    [previewIndex, recordStyleHistoryBeforeEdit]
  );

  const loadWatermarkCustomFont = useCallback(
    async (file: File) => {
      removeCustomFontFace();
      try {
        const buf = await file.arrayBuffer();
        const face = new FontFace(CUSTOM_WM_FONT_FAMILY, buf);
        await face.load();
        document.fonts.add(face);
        customFontFaceRef.current = face;
        setWmFontCustomReady(true);
        setWmCustomFontName(file.name);
        setFiles((prev) => {
          if (!prev.length) return prev;
          const i = Math.min(previewIndex, prev.length - 1);
          recordStyleHistoryBeforeEdit(i, prev[i]);
          const next = [...prev];
          next[i] = {
            ...next[i],
            settings: {
              ...next[i].settings,
              wmFontPresetId: WM_FONT_PRESET_ID_CUSTOM,
            },
          };
          return next;
        });
        setHistoryTick((t) => t + 1);
        showToast("Custom font loaded");
      } catch {
        setWmFontCustomReady(false);
        setWmCustomFontName(null);
        showToast("Could not load font file", "error");
      }
    },
    [removeCustomFontFace, showToast, previewIndex, recordStyleHistoryBeforeEdit]
  );

  const clearWatermarkCustomFont = useCallback(() => {
    removeCustomFontFace();
    setWmFontCustomReady(false);
    setWmCustomFontName(null);
    setFiles((prev) =>
      prev.map((f) =>
        f.settings.wmFontPresetId === WM_FONT_PRESET_ID_CUSTOM
          ? {
              ...f,
              settings: {
                ...f.settings,
                wmFontPresetId: DEFAULT_WM_FONT_PRESET_ID,
              },
            }
          : f
      )
    );
  }, [removeCustomFontFace]);

  useEffect(() => {
    return () => {
      const f = customFontFaceRef.current;
      if (f) {
        try {
          document.fonts.delete(f);
        } catch {
          /* ignore */
        }
        customFontFaceRef.current = null;
      }
    };
  }, []);

  const buildRenderOptions = useCallback((): RenderOptions => {
    const idx = Math.min(previewIndex, Math.max(0, files.length - 1));
    const s = files[idx]?.settings ?? defaultImageEditSettings();
    return renderOptionsFromSettings(s, wmFontCustomReady);
  }, [files, previewIndex, wmFontCustomReady]);

  const schedulePreview = useCallback(() => {
    livePreviewGenRef.current += 1;
    const genWhenScheduled = livePreviewGenRef.current;
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      previewDebounceRef.current = null;
      void (async () => {
        const canvas = canvasRef.current;
        if (!canvas || !files.length) {
          if (genWhenScheduled === livePreviewGenRef.current) {
            setPreviewDims({ cw: 0, ch: 0 });
          }
          return;
        }
        const idx = Math.min(previewIndex, files.length - 1);
        const f = files[idx];
        const src = f.croppedUrl || f.dataUrl;
        if (genWhenScheduled !== livePreviewGenRef.current) return;
        const dims = await drawLivePreview(canvas, src, buildRenderOptions());
        if (genWhenScheduled !== livePreviewGenRef.current) {
          schedulePreview();
          return;
        }
        if (dims) setPreviewDims(dims);
      })();
    }, 55);
  }, [files, previewIndex, buildRenderOptions]);

  useEffect(() => {
    schedulePreview();
    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [schedulePreview]);

  const handlePickFiles = () => {
    if (files.length >= MAX_UPLOAD_IMAGES) {
      showToast(
        `Maximum ${MAX_UPLOAD_IMAGES} images — remove one to add more`,
        "error"
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFiles = useCallback(
    (list: FileList) => {
      let skippedGif = false;
      const valid: File[] = [];
      for (const f of Array.from(list)) {
        if (!f.type.startsWith("image/")) continue;
        if (isGifImageFile(f)) {
          skippedGif = true;
          continue;
        }
        valid.push(f);
      }

      const room = Math.max(0, MAX_UPLOAD_IMAGES - files.length);
      const toLoad = valid.slice(0, room);
      const skippedLimit = valid.length > room;

      toLoad.forEach((f) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setFiles((prev) => {
            if (prev.length >= MAX_UPLOAD_IMAGES) return prev;
            const next = [
              ...prev,
              {
                file: f,
                dataUrl,
                name: f.name,
                size: f.size,
                settings: defaultImageEditSettings(),
              },
            ];
            if (prev.length === 0) setPreviewIndex(0);
            return next;
          });
        };
        reader.readAsDataURL(f);
      });

      if (skippedGif) {
        showToast("GIF images are not supported for upload", "error");
      }
      if (skippedLimit) {
        showToast(
          `Maximum ${MAX_UPLOAD_IMAGES} images — remove one to add more`,
          "error"
        );
      }
    },
    [showToast, files.length]
  );

  const removeFile = (i: number) => {
    styleHistoryRef.current.clear();
    setHistoryTick((t) => t + 1);
    setFiles((prev) => {
      const next = prev.filter((_, j) => j !== i);
      setPreviewIndex((pi) => {
        if (next.length === 0) return 0;
        let npi = pi;
        if (i < pi) npi = pi - 1;
        if (npi >= next.length) npi = Math.max(0, next.length - 1);
        return npi;
      });
      return next;
    });
    setConvertedFiles([]);
    setFileDone([]);
  };

  const requestRemoveFile = (i: number) => {
    const entry = files[i];
    if (!entry) return;
    if (!entryHasDiscardableEdits(entry)) {
      removeFile(i);
      return;
    }
    setPendingRemoveIndex(i);
    setRemoveConfirmOpen(true);
  };

  const closeRemoveConfirm = () => {
    setRemoveConfirmOpen(false);
    setPendingRemoveIndex(null);
  };

  useEffect(() => {
    if (previewIndex >= files.length && files.length > 0) {
      setPreviewIndex(files.length - 1);
    }
  }, [files.length, previewIndex]);

  const onTransform = (
    kind: "rotate-cw" | "rotate-ccw" | "flip-h" | "flip-v"
  ) => {
    setFiles((prev) => {
      if (!prev.length) return prev;
      const i = Math.min(previewIndex, prev.length - 1);
      recordStyleHistoryBeforeEdit(i, prev[i]);
      const t = prev[i].settings.transforms;
      let transforms = { ...t };
      if (kind === "rotate-cw")
        transforms = { ...t, rotation: (t.rotation + 90) % 360 };
      else if (kind === "rotate-ccw")
        transforms = { ...t, rotation: (t.rotation - 90 + 360) % 360 };
      else if (kind === "flip-h") transforms = { ...t, flipH: !t.flipH };
      else transforms = { ...t, flipV: !t.flipV };
      const next = [...prev];
      next[i] = {
        ...next[i],
        settings: { ...next[i].settings, transforms },
      };
      return next;
    });
    setHistoryTick((t) => t + 1);
  };

  const resetTransforms = () => {
    setFiles((prev) => {
      if (!prev.length) return prev;
      const i = Math.min(previewIndex, prev.length - 1);
      recordStyleHistoryBeforeEdit(i, prev[i]);
      const next = [...prev];
      next[i] = {
        ...next[i],
        settings: {
          ...next[i].settings,
          transforms: { rotation: 0, flipH: false, flipV: false },
          currentFilter: "none",
        },
      };
      return next;
    });
    setHistoryTick((t) => t + 1);
    showToast("Transforms reset");
  };

  const closeCropModal = useCallback(() => {
    cropRequestIdRef.current += 1;
    setCropOpen(false);
    setCropImageSrc("");
  }, []);

  const openCrop = () => {
    if (!files.length) {
      showToast("Upload an image first", "error");
      return;
    }
    const idx = Math.min(previewIndex, files.length - 1);
    const entry = files[idx];
    const src = entry.croppedUrl || entry.dataUrl;
    const opts = buildRenderOptions();
    const requestId = cropRequestIdRef.current + 1;
    cropRequestIdRef.current = requestId;
    setCropImageSrc("");
    setCropOpen(true);
    void (async () => {
      try {
        const url = await renderTransformedDataUrl(src, opts);
        if (cropRequestIdRef.current !== requestId) return;
        setCropImageSrc(url);
      } catch {
        if (cropRequestIdRef.current !== requestId) return;
        showToast("Could not prepare crop", "error");
        setCropOpen(false);
        setCropImageSrc("");
      }
    })();
  };

  const applyCrop = (dataUrl: string) => {
    setFiles((prev) => {
      const next = [...prev];
      const idx = Math.min(previewIndex, next.length - 1);
      if (next[idx]) {
        recordStyleHistoryBeforeEdit(idx, next[idx]);
        next[idx] = {
          ...next[idx],
          croppedUrl: dataUrl,
          settings: {
            ...next[idx].settings,
            transforms: { ...resetTransformsAfterCrop },
            currentFilter: "none",
            wmEnabled: false,
          },
        };
      }
      return next;
    });
    setHistoryTick((t) => t + 1);
    cropRequestIdRef.current += 1;
    setCropOpen(false);
    setCropImageSrc("");
    showToast("Crop applied");
  };

  const undoStyling = useCallback(() => {
    setFiles((prev) => {
      if (!prev.length) return prev;
      const i = Math.min(previewIndex, prev.length - 1);
      const stacks = styleHistoryRef.current.get(i);
      if (!stacks?.past.length) return prev;
      const curSnap = snapshotFromEntry(prev[i]);
      const target = stacks.past.pop()!;
      stacks.future.push(structuredClone(curSnap));
      const next = [...prev];
      next[i] = applySnapshotToEntry(prev[i], target);
      return next;
    });
    setHistoryTick((t) => t + 1);
  }, [previewIndex]);

  const redoStyling = useCallback(() => {
    setFiles((prev) => {
      if (!prev.length) return prev;
      const i = Math.min(previewIndex, prev.length - 1);
      const stacks = styleHistoryRef.current.get(i);
      if (!stacks?.future.length) return prev;
      const curSnap = snapshotFromEntry(prev[i]);
      const target = stacks.future.pop()!;
      stacks.past.push(structuredClone(curSnap));
      while (stacks.past.length > MAX_STYLE_UNDO_STEPS) stacks.past.shift();
      const next = [...prev];
      next[i] = applySnapshotToEntry(prev[i], target);
      return next;
    });
    setHistoryTick((t) => t + 1);
  }, [previewIndex]);

  const discardAllStyling = useCallback(() => {
    let didDiscard = false;
    setFiles((prev) => {
      if (!prev.length) return prev;
      const i = Math.min(previewIndex, prev.length - 1);
      const cur = prev[i];
      const stacks = styleHistoryRef.current.get(i);
      const hasHistory =
        !!stacks && (stacks.past.length > 0 || stacks.future.length > 0);
      const hasEdits = entryHasDiscardableEdits(cur);
      if (!hasEdits && !hasHistory) return prev;
      didDiscard = true;
      styleHistoryRef.current.set(i, { past: [], future: [] });
      const next = [...prev];
      if (hasEdits) {
        const cleared: ImageFileEntry = {
          ...cur,
          settings: defaultImageEditSettings(),
        };
        delete cleared.croppedUrl;
        next[i] = cleared;
      }
      return next;
    });
    if (didDiscard) {
      setHistoryTick((t) => t + 1);
      showToast("All edits discarded");
    }
  }, [previewIndex, showToast]);

  const convertAll = async () => {
    if (!files.length) return;
    const needsCustomButMissing = files.some(
      (f) =>
        f.settings.wmEnabled &&
        f.settings.wmFontPresetId === WM_FONT_PRESET_ID_CUSTOM &&
        !wmFontCustomReady
    );
    if (needsCustomButMissing) {
      showToast("Load a custom font file first", "error");
      return;
    }
    const customWmFiles = files.filter(
      (f) =>
        f.settings.wmEnabled &&
        f.settings.wmFontPresetId === WM_FONT_PRESET_ID_CUSTOM &&
        wmFontCustomReady
    );
    if (customWmFiles.length) {
      const maxW = Math.max(
        ...customWmFiles.map((f) => f.settings.wmFontWeight)
      );
      try {
        await document.fonts.load(`${maxW}px ${CUSTOM_WM_FONT_FAMILY}`);
      } catch {
        /* continue; canvas may still work */
      }
    }

    setConverting(true);
    setProgress(0);
    setFileDone(files.map(() => false));
    setConvertedFiles([]);

    const out: ConvertedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const s = files[i].settings;
      const format = s.outputFormat;
      const q = s.quality / 100;
      const opts = renderOptionsFromSettings(s, wmFontCustomReady);
      const baked = await bakeImage(files[i], format, q, null, opts);
      out.push(baked);
      setProgress(((i + 1) / files.length) * 100);
      setFileDone((d) => {
        const n = [...d];
        n[i] = true;
        return n;
      });
      await new Promise((r) => setTimeout(r, 40));
    }
    setConvertedFiles(out);
    setConverting(false);
    showToast(
      `${files.length} image${files.length > 1 ? "s" : ""} converted`
    );
  };

  const downloadSingle = (i: number) => {
    const cf = convertedFiles[i];
    if (!cf) return;
    const a = document.createElement("a");
    a.href = cf.url;
    a.download = cf.name;
    a.click();
  };

  const downloadZip = async () => {
    if (!convertedFiles.length) return;
    const zip = new JSZip();
    convertedFiles.forEach((cf) => {
      const b64 = cf.url.split(",")[1];
      if (b64) zip.file(cf.name, b64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "converted-images.zip";
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("ZIP downloaded");
  };

  const safePreviewIdx = files.length
    ? Math.min(previewIndex, files.length - 1)
    : 0;
  const currentSettings =
    files[safePreviewIdx]?.settings ?? defaultImageEditSettings();

  const filterLabel =
    FILTER_PRESETS.find((f) => f.value === currentSettings.currentFilter)
      ?.label ?? "";
  const formatExt =
    currentSettings.outputFormat.split("/")[1]?.toUpperCase() ?? "";
  const activeFile =
    files.length > 0 ? files[Math.min(previewIndex, files.length - 1)] : null;

  const styleStacks =
    files.length > 0
      ? styleHistoryRef.current.get(safePreviewIdx)
      : undefined;
  const canUndoStyle = !!styleStacks?.past.length && historyTick >= 0;
  const canRedoStyle = !!styleStacks?.future.length && historyTick >= 0;
  const canDiscardAllStyle =
    !!activeFile &&
    (entryHasDiscardableEdits(activeFile) ||
      !!styleStacks?.past.length ||
      !!styleStacks?.future.length);

  const appHeader = (
    <header className="mb-8 flex flex-wrap items-baseline gap-4">
      <div className="flex items-center gap-2.5">
        <Image
          src={PHOTO_CROP_ICON_SRC}
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0 object-contain"
          priority
        />
        <div className="text-[22px] font-mono font-semibold tracking-tight leading-none">
          pix<span className="text-app-accent">lr</span>
        </div>
      </div>
    </header>
  );

  return (
    <>
      {files.length === 0 ? (
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8">
          {appHeader}
          <div className="flex min-h-0 flex-1 flex-col justify-center pb-16">
            <div className="mx-auto w-full max-w-2xl">
              <Dropzone
                onPickFiles={handlePickFiles}
                onFiles={handleFiles}
                dragOver={dragOver}
                setDragOver={setDragOver}
                inputRef={fileInputRef}
                uploadLocked={false}
              />
            </div>
          </div>
        </div>
      ) : (
    <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1fr_340px]">
      <div className="overflow-y-auto border-white/[0.08] px-4 py-8 pb-16 lg:border-r lg:px-6">
        {appHeader}

        <div className="mb-4 rounded-2xl border border-white/[0.08] bg-app-bg2 p-5">
          <div className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-app-text3">
            Upload images
          </div>
          <Dropzone
            onPickFiles={handlePickFiles}
            onFiles={handleFiles}
            dragOver={dragOver}
            setDragOver={setDragOver}
            inputRef={fileInputRef}
            uploadLocked={files.length >= MAX_UPLOAD_IMAGES}
          />
          <FileGrid
            files={files}
            previewIndex={Math.min(previewIndex, Math.max(0, files.length - 1))}
            onSelect={setPreviewIndex}
            onRemove={requestRemoveFile}
            fileDone={fileDone.length === files.length ? fileDone : files.map(() => false)}
          />
        </div>

        <FiltersTransformsCard
          currentFilter={currentSettings.currentFilter}
          onFilter={(v) => updateCurrentSettings({ currentFilter: v })}
          transforms={currentSettings.transforms}
          onTransform={onTransform}
          onReset={resetTransforms}
        />

        <CropCard
          onOpenCrop={openCrop}
          hasFiles={files.length > 0}
        />

        <WatermarkCard
          enabled={currentSettings.wmEnabled}
          onToggle={() =>
            updateCurrentSettings({ wmEnabled: !currentSettings.wmEnabled })
          }
          text={currentSettings.wmText}
          onText={(v) => updateCurrentSettings({ wmText: v })}
          color={currentSettings.wmColor}
          onColor={(v) => updateCurrentSettings({ wmColor: v })}
          fontPresetId={currentSettings.wmFontPresetId}
          onFontPresetId={(id) => updateCurrentSettings({ wmFontPresetId: id })}
          fontWeight={currentSettings.wmFontWeight}
          onFontWeight={(w) => updateCurrentSettings({ wmFontWeight: w })}
          fontItalic={currentSettings.wmFontItalic}
          onFontItalic={(v) => updateCurrentSettings({ wmFontItalic: v })}
          customFontReady={wmFontCustomReady}
          customFontFileName={wmCustomFontName}
          onCustomFontFile={loadWatermarkCustomFont}
          onClearCustomFont={clearWatermarkCustomFont}
          size={currentSettings.wmSize}
          onSize={(v) => updateCurrentSettings({ wmSize: v })}
          opacity={currentSettings.wmOpacity}
          onOpacity={(v) => updateCurrentSettings({ wmOpacity: v })}
          position={currentSettings.wmPosition}
          onPosition={(v) => updateCurrentSettings({ wmPosition: v })}
        />

        <SettingsCard
          outputFormat={currentSettings.outputFormat}
          onOutputFormat={(v) => updateCurrentSettings({ outputFormat: v })}
          quality={currentSettings.quality}
          onQuality={(v) => updateCurrentSettings({ quality: v })}
        />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={
              files.length === 0 ||
              converting ||
              (currentSettings.wmEnabled &&
                currentSettings.wmFontPresetId === WM_FONT_PRESET_ID_CUSTOM &&
                !wmFontCustomReady)
            }
            onClick={() => void convertAll()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-app-accent px-5 py-2.5 text-sm font-semibold text-app-bg transition-colors hover:bg-app-accent2 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:min-h-0"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Convert all
          </button>
          <button
            type="button"
            disabled={convertedFiles.length === 0}
            onClick={() => {
              setDiffSelectIndex(0);
              setDiffOpen(true);
            }}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/[0.14] bg-transparent px-4 py-2 text-sm text-app-text2 transition-colors hover:text-app-text disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto sm:min-h-0"
          >
            Before / After
          </button>
          {convertedFiles.length > 0 && (
            <button
              type="button"
              onClick={() => void downloadZip()}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.14] bg-transparent px-4 py-2 text-sm text-app-text2 transition-colors hover:text-app-text sm:w-auto sm:min-h-0"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              ZIP all
            </button>
          )}
        </div>

        <div
          className={`mt-3 h-0.5 overflow-hidden rounded-sm bg-app-bg3 ${
            converting ? "block" : "hidden"
          }`}
        >
          <div
            className="h-full rounded-sm bg-app-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ResultsSection converted={convertedFiles} onDownload={downloadSingle} />
      </div>

      <LivePreviewPanel
        hasFiles={files.length > 0}
        canvasRef={canvasRef}
        showInfo={!!activeFile}
        cw={previewDims.cw}
        ch={previewDims.ch}
        formatExt={formatExt}
        quality={currentSettings.quality}
        fileSizeLabel={activeFile ? formatSize(activeFile.size) : ""}
        rotation={currentSettings.transforms.rotation}
        flipH={currentSettings.transforms.flipH}
        flipV={currentSettings.transforms.flipV}
        filterLabel={filterLabel}
        filterOn={currentSettings.currentFilter !== "none"}
        wmEnabled={currentSettings.wmEnabled}
        canUndo={canUndoStyle}
        canRedo={canRedoStyle}
        onUndo={undoStyling}
        onRedo={redoStyling}
        onDiscardAll={discardAllStyling}
        canDiscardAll={canDiscardAllStyle}
      />
    </div>
      )}

      <ConfirmDialog
        open={removeConfirmOpen}
        onClose={closeRemoveConfirm}
        title="Remove this image?"
        description="Any edits, crop, watermark, or export settings for this image will be lost."
        cancelLabel="Cancel"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => {
          if (pendingRemoveIndex !== null) removeFile(pendingRemoveIndex);
        }}
      />

      <BeforeAfterModal
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
        files={files}
        converted={convertedFiles}
        selectedIndex={Math.min(
          diffSelectIndex,
          Math.max(0, convertedFiles.length - 1)
        )}
        onSelectIndex={setDiffSelectIndex}
      />

      <CropModal
        open={cropOpen}
        imageSrc={cropImageSrc}
        preparing={cropOpen && !cropImageSrc}
        aspectRatio={cropRatioForPresetId(currentSettings.cropPresetId)}
        selectedPresetId={currentSettings.cropPresetId}
        onPresetChange={(id) => updateCurrentSettings({ cropPresetId: id })}
        onClose={closeCropModal}
        onApply={applyCrop}
      />

      <div
        role="status"
        className={`fixed bottom-6 left-1/2 z-[200] max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border px-4 py-2.5 font-mono text-sm shadow-lg transition-all duration-300 ${
          toast?.variant === "error"
            ? "border-red-400/70 bg-red-950/55 text-red-300"
            : "border-app-accent bg-app-bg2 text-app-accent"
        } ${
          toast
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-[60px] opacity-0"
        }`}
      >
        {toast?.message}
      </div>
    </>
  );
}
