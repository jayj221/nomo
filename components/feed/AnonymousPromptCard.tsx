import { Card } from "@/components/ui/Card";
import type { AnonymousPrompt } from "@/types/app.types";

interface Props {
  prompt: AnonymousPrompt;
}

export function AnonymousPromptCard({ prompt }: Props) {
  return (
    <Card className="p-5">
      <p className="text-[11px] uppercase tracking-widest text-faint">
        {prompt.question}
      </p>
      <p className="answer-text mt-2 text-lg leading-relaxed text-fg">
        {prompt.answer}
      </p>
    </Card>
  );
}
