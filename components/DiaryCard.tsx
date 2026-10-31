import { cx } from "./ui";

type Props = {
  diary: string;
  signature?: string;
  /** A P.S. addressed to the owner, set apart from the diary. */
  note?: string;
  notePrefix?: string;
  /** Fade lines in one at a time, as if being written. */
  reveal?: boolean;
  className?: string;
};

export function DiaryCard({ diary, signature, note, notePrefix = "P.S.", reveal = false, className }: Props) {
  const lines = diary.split("\n").filter(Boolean);
  return (
    <div className={cx("relative rounded-3xl border border-line bg-[#fffdf6] px-6 pb-5 pt-6 shadow-card", className)}>
      <span aria-hidden className="washi absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-2 rounded-sm bg-tape/80" />
      <div className="ruled font-hand text-[22px] text-ink">
        {lines.map((line, i) => (
          <p key={i} className={reveal ? "animate-fade-in" : undefined} style={reveal ? { animationDelay: `${i * 0.9}s` } : undefined}>
            {line}
          </p>
        ))}
      </div>
      {signature && (
        <p
          className={cx("mt-1 text-right font-hand text-xl text-clay", reveal && "animate-fade-in")}
          style={reveal ? { animationDelay: `${lines.length * 0.9}s` } : undefined}
        >
          — {signature}
        </p>
      )}
      {note && (
        <p
          className={cx("mt-3 border-t border-dashed border-line pt-3 font-hand text-xl leading-snug text-clay-deep", reveal && "animate-fade-in")}
          style={reveal ? { animationDelay: `${(lines.length + 1) * 0.9}s` } : undefined}
        >
          <span className="mr-1 font-bold">{notePrefix}</span>
          {note}
        </p>
      )}
    </div>
  );
}
