"use client";

import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export interface AvailableSlot {
  connection_user_id: string;
  rank: number | null;
  label: string;
}

interface Props {
  connection: AvailableSlot;
  onJoin: (mode: "voice" | "text") => void;
  busy?: boolean;
}

// Voice leads, text is allowed — the order of the buttons is the nudge.
export function ConnectionSlot({ connection, onJoin, busy }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-card p-3">
      <Avatar size={40} />
      <p className="flex-1 text-sm text-fg">{connection.label}</p>
      <Button
        full={false}
        onClick={() => onJoin("voice")}
        disabled={busy}
        className="px-4"
      >
        Talk
      </Button>
      <Button
        full={false}
        variant="secondary"
        onClick={() => onJoin("text")}
        disabled={busy}
        className="px-4"
      >
        Text
      </Button>
    </div>
  );
}
