"use client";

import { Button } from "@/components/ui/Button";

interface Props {
  onLike: () => void;
  onPass: () => void;
  disabled?: boolean;
}

export function LikePassButtons({ onLike, onPass, disabled }: Props) {
  return (
    <div className="flex gap-3">
      <Button variant="secondary" onClick={onPass} disabled={disabled}>
        Not feeling it
      </Button>
      <Button variant="primary" onClick={onLike} disabled={disabled}>
        I like this
      </Button>
    </div>
  );
}
