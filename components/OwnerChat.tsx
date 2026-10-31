"use client";

/* eslint-disable @next/next/no-img-element -- OC avatar is a data URL */
import { useState } from "react";
import { formatDuration, tripMinutes } from "@/lib/format";
import { CHAT_MIN_MINUTES, replyText } from "@/lib/game/ownerChat";
import { useCurrentJourney } from "@/lib/hooks/useGame";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Journey } from "@/types/journey";
import { Button, cx } from "./ui";

export function canChat(journey: Journey): boolean {
  return journey.status === "completed" && tripMinutes(journey) >= CHAT_MIN_MINUTES;
}

function OCBubble({ image, children, pending }: { image?: string; children: React.ReactNode; pending?: boolean }) {
  return (
    <div className="flex items-end gap-2 animate-fade-up">
      {image ? (
        <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-full border border-line bg-paper object-contain" />
      ) : (
        <span className="h-9 w-9 shrink-0 rounded-full bg-paper-deep" />
      )}
      <div className={cx("rounded-2xl rounded-bl-md border border-line bg-card px-4 py-2.5 text-[15px] leading-relaxed shadow-card", pending && "text-ink-faint")}>
        {children}
      </div>
    </div>
  );
}

function OwnerBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-clay/15 px-4 py-2.5 text-[15px] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

/**
 * After a long focus session the OC asks what you were up to. Read-only when
 * `interactive` is false (album), where it only shows a saved exchange.
 */
export function OwnerChat({
  journey,
  ocName,
  ocImage,
  interactive = false,
}: {
  journey: Journey;
  ocName: string;
  ocImage?: string;
  interactive?: boolean;
}) {
  const { m, locale } = useI18n();
  const { answerChat } = useCurrentJourney();
  const [text, setText] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  const minutes = tripMinutes(journey);
  const time = formatDuration(minutes, locale);
  const chat = journey.chat;
  if (!chat && (!interactive || skipped || !canChat(journey))) return null;

  const reply = chat && ((chat.replyKey && replyText(chat.replyKey, locale, { time, activity: chat.activity, minutes })) || chat.reply);

  async function send(answer: string) {
    if (!answer.trim()) return;
    setSending(answer.trim());
    await answerChat(answer, locale);
    setSending(null);
  }

  return (
    <section className="space-y-3 rounded-3xl border border-line bg-paper/60 p-4">
      <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">{m.chat.title(ocName)}</p>
      <OCBubble image={ocImage}>{m.chat.ask(time)}</OCBubble>

      {chat ? (
        <>
          <OwnerBubble>{chat.activity}</OwnerBubble>
          {reply && <OCBubble image={ocImage}>{reply}</OCBubble>}
        </>
      ) : sending ? (
        <>
          <OwnerBubble>{sending}</OwnerBubble>
          <OCBubble image={ocImage} pending>
            <span className="inline-flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bob rounded-full bg-ink-faint" style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }} />
              ))}
            </span>
          </OCBubble>
        </>
      ) : (
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {m.chat.chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setText(chip)}
                className={cx(
                  "rounded-full border px-3 py-1 text-sm font-bold transition",
                  text === chip ? "border-clay/50 bg-card text-ink" : "border-line bg-card/60 text-ink-soft hover:text-ink",
                )}
              >
                {chip}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(text);
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={80}
              placeholder={m.chat.placeholder}
              aria-label={m.chat.ask(time)}
              className="min-w-0 flex-1 rounded-2xl border border-line bg-card px-4 py-2.5 text-base outline-none transition placeholder:text-ink-faint focus:border-clay/60"
            />
            <Button type="submit" className="shrink-0 px-4 py-2.5 text-sm" disabled={!text.trim()}>
              {m.chat.send}
            </Button>
          </form>
          <button type="button" onClick={() => setSkipped(true)} className="px-1 text-xs text-ink-faint hover:text-ink">
            {m.chat.skip}
          </button>
        </div>
      )}
    </section>
  );
}
