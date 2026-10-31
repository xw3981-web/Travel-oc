"use client";

/* eslint-disable @next/next/no-img-element -- previews are local data URLs */
import { useRef, useState } from "react";
import { ImageProcessingError, prepareUpload, rasterize } from "@/lib/image/imageUtils";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SAMPLE_OCS, sampleUrl, type SampleOC } from "@/lib/samples";
import { cx } from "./ui";

type Props = {
  hasImage: boolean;
  onImage(dataUrl: string, sample?: SampleOC): void;
};

export function OCUploader({ hasImage, onImage }: Props) {
  const { m, locale } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onImage(await prepareUpload(file));
    } catch (err) {
      setError(m.errors.image[err instanceof ImageProcessingError ? err.code : "unknown"]);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function pickSample(sample: SampleOC) {
    setError(null);
    setBusy(true);
    try {
      onImage(await rasterize(sampleUrl(sample)), sample);
    } catch {
      onImage(sampleUrl(sample), sample);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        disabled={busy}
        className={cx(
          "flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-bold transition",
          dragging ? "border-clay bg-clay/5 text-clay" : "border-line bg-paper/60 text-ink-soft hover:border-clay/50 hover:text-ink",
        )}
      >
        <span className="text-2xl" aria-hidden>
          {busy ? "⏳" : "🖼️"}
        </span>
        {busy ? m.uploader.preparing : hasImage ? m.uploader.change : m.uploader.upload}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        aria-label={m.uploader.aria}
      />
      <p className="mt-2 px-1 text-xs text-ink-faint">{m.uploader.tip}</p>
      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-[#fbeae2] px-3 py-2 text-sm text-clay-deep">
          {error}
        </p>
      )}

      <div className="mt-4">
        <p className="mb-2 px-1 font-hand text-lg text-ink-soft">{m.uploader.borrow}</p>
        <div className="flex gap-2">
          {SAMPLE_OCS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={busy}
              onClick={() => void pickSample(s)}
              className="flex flex-1 flex-col items-center rounded-2xl border border-line bg-card px-2 py-2 text-xs font-bold text-ink-soft transition hover:-translate-y-0.5 hover:text-ink hover:shadow-card"
            >
              <img src={sampleUrl(s)} alt="" className="h-12 w-12 object-contain" />
              {s.name[locale]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
