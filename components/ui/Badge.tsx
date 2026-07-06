import { HTMLAttributes } from "react";

type Tone = "neutral" | "good" | "bad";

const tones: Record<Tone, string> = {
  neutral: "border-line text-secondary",
  good: "border-good/40 text-good",
  bad: "border-bad/40 text-bad",
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...props }: Props) {
  return (
    <span
      className={`inline-block rounded-btn border px-2 py-0.5 text-[11px] uppercase tracking-wider ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
