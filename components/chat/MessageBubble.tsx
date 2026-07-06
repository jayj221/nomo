import type { ChatMessage } from "@/types/app.types";

interface Props {
  message: ChatMessage;
  mine: boolean;
}

export function MessageBubble({ message, mine }: Props) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-card border px-3 py-2 text-sm ${
          mine
            ? "border-white/20 bg-white/10 text-fg"
            : "border-line bg-card text-fg"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
