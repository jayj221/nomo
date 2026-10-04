import { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`surface p-4 ${className}`}
      {...props}
    />
  );
}
