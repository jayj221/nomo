interface Props {
  // Connection-scale step: 1=prompts, 2=voice, 3=photo, 4=name, 5=chat
  step: number;
}

export function StepStrip({ step }: Props) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`h-2 w-2 rounded-full ${
            s <= step ? "bg-white" : "bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}
