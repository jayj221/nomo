"use client";

import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import type { AvailableConnection } from "@/types/app.types";

interface Props {
  connection: AvailableConnection;
  onJoin: () => void;
  busy?: boolean;
}

export function ConnectionSlot({ connection, onJoin, busy }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-card p-3">
      <Avatar size={40} />
      <p className="flex-1 text-sm text-fg">{connection.label}</p>
      <Button full={false} onClick={onJoin} disabled={busy} className="px-5">
        Join call
      </Button>
    </div>
  );
}
