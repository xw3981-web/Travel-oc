/* eslint-disable @next/next/no-img-element -- OC images are user data URLs, not optimisable assets */
import { cx } from "./ui";

type Props = {
  src: string;
  name: string;
  size?: number;
  motion?: "bob" | "walk" | "none";
  backpack?: boolean;
  shadow?: boolean;
  className?: string;
};

/** The OC as a paper sticker. Works for transparent cut-outs and plain photos alike. */
export function OCCharacter({ src, name, size = 180, motion = "bob", backpack = false, shadow = true, className }: Props) {
  return (
    <div className={cx("relative inline-flex flex-col items-center", className)} style={{ width: size }}>
      <div className={cx("relative", motion === "bob" && "animate-bob", motion === "walk" && "animate-walk")}>
        <img
          src={src}
          alt={name}
          draggable={false}
          className="sticker block select-none rounded-[18px] object-contain"
          style={{ width: size, height: size }}
        />
        {backpack && (
          <span
            aria-hidden
            className="absolute -right-2 bottom-[18%] animate-pop drop-shadow-sm"
            style={{ fontSize: size * 0.24, animationDelay: "0.2s" }}
          >
            🎒
          </span>
        )}
      </div>
      {shadow && <div className="-mt-1 h-3 w-[62%] rounded-[50%] bg-ink/10 blur-[2px]" aria-hidden />}
    </div>
  );
}
