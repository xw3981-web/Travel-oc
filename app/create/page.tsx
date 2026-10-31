"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getAIService } from "@/lib/ai";
import { extractPalette, type CutoutResult } from "@/lib/image/imageUtils";
import { useCurrentJourney, useOC } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { OCCharacter } from "@/components/OCCharacter";
import { OCUploader } from "@/components/OCUploader";
import { Button, cx, LoadingState, PageHeader, PageShell, PaperCard } from "@/components/ui";
import type { SampleOC } from "@/lib/samples";
import type { OC, OCStyle } from "@/types/oc";

export default function CreatePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CreateRoute />
    </Suspense>
  );
}

/** `/create?new=1` adds another OC; plain `/create` edits the current one (or creates the first). */
function CreateRoute() {
  const isNew = useSearchParams().get("new") === "1";
  const { oc, loading } = useOC();
  if (loading) return <LoadingState />;
  const target = isNew ? null : oc;
  return <CreateForm key={target?.id ?? "new"} target={target} />;
}

function CreateForm({ target }: { target: OC | null }) {
  const router = useRouter();
  const { saveOC, deleteOC } = useOC();
  const { journey, traveling } = useCurrentJourney();
  const { m, locale } = useI18n();
  const editing = !!target;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // `raw` is what was uploaded (or stored); `original` is what will be saved after the optional cut-out.
  const [raw, setRaw] = useState<string | null>(null);
  const [cutoutOn, setCutoutOn] = useState(true);
  const [cut, setCut] = useState<{ from: string; result: CutoutResult } | null>(null);
  const [cutting, setCutting] = useState(false);
  const [styled, setStyled] = useState<{ from: string; url: string } | null>(null);
  const [style, setStyle] = useState<OCStyle>("original");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [palette, setPalette] = useState<string[] | undefined>();
  const [stylizing, setStylizing] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const prefilled = useRef(false);
  const cutRun = useRef(0);
  const styleRun = useRef(0);

  const cutReady = cutoutOn && cut?.from === raw;
  const original = cutReady && cut.result.status === "removed" ? cut.result.url : raw;
  const styledUrl = styled && styled.from === original ? styled.url : null;

  useEffect(() => {
    if (!target || prefilled.current) return;
    prefilled.current = true;
    setRaw(target.originalImageUrl);
    setCutoutOn(false); // already saved the way the user wanted it
    if (target.styledImageUrl) setStyled({ from: target.originalImageUrl, url: target.styledImageUrl });
    setStyle(target.activeStyle);
    setName(target.name);
    setDescription(target.description ?? "");
    setPalette(target.palette);
  }, [target]);

  // Cut the background out of new images.
  useEffect(() => {
    if (!raw || !cutoutOn || cut?.from === raw) return;
    const run = ++cutRun.current;
    setCutting(true);
    getAIService()
      .removeBackground(raw)
      .catch((): CutoutResult => ({ url: raw, status: "complex" }))
      .then((result) => {
        if (run !== cutRun.current) return;
        setCut({ from: raw, result });
        setCutting(false);
      });
  }, [raw, cutoutOn, cut]);

  // Keep palette and cartoon version in sync with the image that will be saved.
  useEffect(() => {
    if (!original || cutting) return;
    extractPalette(original).then(setPalette).catch(() => setPalette(undefined));
  }, [original, cutting]);

  useEffect(() => {
    if (style !== "cartoon" || !original || cutting || styled?.from === original) return;
    const run = ++styleRun.current;
    setStylizing(true);
    setStyleError(null);
    getAIService()
      .stylizeOC(original)
      .then((url) => {
        if (run === styleRun.current) setStyled({ from: original, url });
      })
      .catch(() => {
        if (run !== styleRun.current) return;
        setStyleError(m.create.styleFailed);
        setStyle("original");
      })
      .finally(() => {
        if (run === styleRun.current) setStylizing(false);
      });
  }, [style, original, cutting, styled, m]);

  function handleImage(dataUrl: string, sample?: SampleOC) {
    setRaw(dataUrl);
    setCutoutOn(true);
    setStyleError(null);
    if (sample) {
      if (!name.trim()) setName(sample.name[locale]);
      if (!description.trim()) setDescription(sample.description[locale]);
    }
  }

  async function handleSave() {
    if (!original || !name.trim()) return;
    setSaving(true);
    try {
      const draft = {
        name,
        originalImageUrl: original,
        styledImageUrl: styledUrl ?? undefined,
        activeStyle: style,
        description,
        palette,
      };
      await saveOC(draft, target?.id);
      router.push("/");
    } catch {
      setSaving(false); // the provider shows the error toast
    }
  }

  async function handleDelete() {
    if (!target) return;
    await deleteOC(target.id);
    router.push("/");
  }

  const targetAway = !!target && traveling && journey?.ocId === target.id;

  const preview = style === "cartoon" && styledUrl ? styledUrl : original;
  const busy = cutting || (style === "cartoon" && stylizing);
  const canSave = !!original && !!name.trim() && !busy && !saving;

  return (
    <PageShell>
      <PageHeader title={target ? m.create.titleEdit(target.name) : m.create.titleNew} kicker={editing ? m.create.kickerEdit : m.create.kickerNew} back="/" />

      <PaperCard className="relative mb-4 overflow-hidden p-5">
        <div className="grid min-h-[240px] place-items-center rounded-2xl bg-paper-deep/50">
          {preview ? (
            <div className={cx("transition", busy && "opacity-50 blur-[1px]")}>
              <OCCharacter src={preview} name={name || "OC"} size={190} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-ink-faint">
              <div className="grid h-28 w-28 place-items-center rounded-full border-2 border-dashed border-line text-4xl">?</div>
              <p className="font-hand text-xl">{m.create.who}</p>
            </div>
          )}
          {busy && (
            <p className="absolute bottom-24 rounded-full bg-card/90 px-3 py-1 font-hand text-lg text-ink-soft shadow-card" role="status">
              {cutting ? m.create.cutoutWorking : m.create.inking}
            </p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-line bg-paper p-1" role="radiogroup" aria-label={m.create.styleLabel}>
          {(["original", "cartoon"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={style === opt}
              disabled={!original}
              onClick={() => setStyle(opt)}
              className={cx(
                "rounded-full py-2 text-sm font-bold transition disabled:opacity-40",
                style === opt ? "bg-card text-ink shadow-card" : "text-ink-soft hover:text-ink",
              )}
            >
              {m.common[opt]}
            </button>
          ))}
        </div>
        {styleError && <p className="mt-2 text-center text-sm text-clay-deep">{styleError}</p>}

        {raw && (
          <div className="mt-3 flex items-center justify-between gap-3 px-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={cutoutOn}
                onChange={(e) => setCutoutOn(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-clay)]"
              />
              {m.create.cutout}
            </label>
            {cutoutOn && cutReady && !cutting && (
              <span className="text-right text-xs text-ink-faint">{m.create.cutoutStatus[cut.result.status]}</span>
            )}
          </div>
        )}
      </PaperCard>

      <PaperCard className="mb-4 p-5">
        <OCUploader hasImage={!!raw} onImage={handleImage} />
      </PaperCard>

      <PaperCard className="mb-6 space-y-4 p-5">
        <label className="block">
          <span className="mb-1.5 block px-1 text-sm font-bold">{m.create.name}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder={m.create.namePlaceholder}
            className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-base outline-none transition placeholder:text-ink-faint focus:border-clay/60 focus:bg-card"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block px-1 text-sm font-bold">
            {m.create.look} <span className="font-normal text-ink-faint">{m.create.optional}</span>
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={120}
            placeholder={m.create.lookPlaceholder}
            className="w-full rounded-2xl border border-line bg-paper/60 px-4 py-3 text-base outline-none transition placeholder:text-ink-faint focus:border-clay/60 focus:bg-card"
          />
          <span className="mt-1.5 block px-1 text-xs text-ink-faint">{m.create.lookHelp}</span>
        </label>
      </PaperCard>

      <Button className="w-full py-4 text-base" disabled={!canSave} onClick={handleSave}>
        {saving ? m.create.saving : editing ? m.create.saveEdit : m.create.welcome(name.trim())}
      </Button>
      {!original && <p className="mt-3 text-center text-sm text-ink-faint">{m.create.needImage}</p>}
      {original && !name.trim() && <p className="mt-3 text-center text-sm text-ink-faint">{m.create.needName}</p>}

      {target && (
        <div className="mt-10 text-center">
          {targetAway ? (
            <p className="text-xs text-ink-faint">{m.ocs.cantDeleteAway(target.name)}</p>
          ) : confirmingDelete ? (
            <div className="mx-auto max-w-xs animate-fade-up rounded-3xl border border-line bg-card p-4 shadow-card">
              <p className="text-sm">{m.ocs.confirmDelete(target.name)}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" className="flex-1 px-3 py-2 text-sm" onClick={() => setConfirmingDelete(false)}>
                  {m.ocs.cancel}
                </Button>
                <Button className="flex-1 bg-clay-deep px-3 py-2 text-sm" onClick={() => void handleDelete()}>
                  {m.ocs.confirm}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" className="text-sm text-clay-deep" onClick={() => setConfirmingDelete(true)}>
              {m.ocs.deleteOC(target.name)}
            </Button>
          )}
        </div>
      )}
    </PageShell>
  );
}
