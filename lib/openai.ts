// OpenAI Moderation API — prompt answers are checked before going live.

export interface ModerationResult {
  flagged: boolean;
}

export async function moderateText(text: string): Promise<ModerationResult> {
  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
  });
  if (!res.ok) throw new Error(`Moderation failed: ${res.status}`);
  const data = await res.json();
  return { flagged: Boolean(data.results?.[0]?.flagged) };
}
