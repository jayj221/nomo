"use client";

interface Props {
  seconds: number;
}

export function CallTimer({ seconds }: Props) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="text-xs tabular-nums text-faint">
      {m}:{s.toString().padStart(2, "0")}
    </span>
  );
}
