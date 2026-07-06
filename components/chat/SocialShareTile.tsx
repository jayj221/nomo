"use client";

import { useState } from "react";
import type { SocialPlatform } from "@/types/app.types";

const LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  spotify: "Spotify",
  apple_music: "Apple Music",
};

interface Props {
  platform: SocialPlatform;
  sharedHandle?: string; // what I already shared
  theirHandle?: string; // visible only once we both shared this platform
  onShare: (platform: SocialPlatform, handle: string) => Promise<void>;
}

export function SocialShareTile({
  platform,
  sharedHandle,
  theirHandle,
  onShare,
}: Props) {
  const [handle, setHandle] = useState(sharedHandle ?? "");
  const [busy, setBusy] = useState(false);

  async function share() {
    if (!handle.trim() || busy) return;
    setBusy(true);
    await onShare(platform, handle.trim());
    setBusy(false);
  }

  return (
    <div className="rounded-card border border-line bg-card p-3">
      <p className="text-[11px] uppercase tracking-widest text-faint">
        {LABELS[platform]}
      </p>

      {theirHandle && (
        <p className="mt-2 text-sm text-good">them · @{theirHandle}</p>
      )}
      {sharedHandle && (
        <p className="mt-1 text-sm text-secondary">you · @{sharedHandle}</p>
      )}

      {!sharedHandle && (
        <div className="mt-2 flex gap-2">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Your handle / username"
            className="flex-1 px-3 py-2 text-sm"
          />
          <button
            onClick={share}
            disabled={busy || !handle.trim()}
            className="rounded-btn border border-white/10 px-3 text-sm text-fg disabled:opacity-40"
          >
            Share with them
          </button>
        </div>
      )}
    </div>
  );
}
