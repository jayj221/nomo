"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-white text-black hover:bg-white/90 disabled:bg-white/30 disabled:text-black/50",
  secondary:
    "bg-transparent text-fg border border-white/10 hover:border-white/25 disabled:opacity-40",
  ghost: "bg-transparent text-secondary hover:text-fg disabled:opacity-40",
  danger: "bg-transparent text-bad border border-bad/40 hover:border-bad",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

export function Button({
  variant = "primary",
  full = true,
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`rounded-btn px-4 py-3 text-sm font-medium transition-colors ${
        full ? "w-full" : ""
      } ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
