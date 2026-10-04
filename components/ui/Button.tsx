"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#e6c6a4,#cd9c6d_55%,#b87f52)] text-[#241009] font-semibold " +
    "hover:opacity-90 disabled:opacity-40",
  secondary:
    "bg-[rgba(255,240,230,0.055)] text-fg border border-line hover:border-line-strong disabled:opacity-40",
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
