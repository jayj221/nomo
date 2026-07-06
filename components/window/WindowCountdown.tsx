"use client";

import { useEffect, useState } from "react";

interface Props {
  expiresAt: string;
  onExpired?: () => void;
}

export function WindowCountdown({ expiresAt, onExpired }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now()),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      setRemaining(ms);
      if (ms === 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <p className="text-center text-6xl font-light tabular-nums tracking-tight">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </p>
  );
}
