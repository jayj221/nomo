// Replicate — aesthetic photo scoring. Server-side only; scores are
// stored in the database and never returned to any client.

const REPLICATE_API = "https://api.replicate.com/v1";

// Aesthetic scoring model (LAION aesthetic predictor). Outputs ~0–10.
const MODEL_VERSION =
  process.env.REPLICATE_MODEL_VERSION ??
  "methexis-inc/img2prompt-aesthetic:latest";

interface PredictionResponse {
  id: string;
  status: string;
  output: unknown;
  urls: { get: string };
}

async function replicateFetch(
  path: string,
  init?: RequestInit,
): Promise<PredictionResponse> {
  const res = await fetch(`${REPLICATE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Replicate error: ${res.status}`);
  return res.json();
}

/**
 * Score a single photo 0–10. Takes a signed URL to the image.
 * Polls the prediction until it settles (Replicate is async).
 */
export async function scorePhoto(imageUrl: string): Promise<number> {
  let prediction = await replicateFetch("/predictions", {
    method: "POST",
    body: JSON.stringify({
      version: MODEL_VERSION,
      input: { image: imageUrl },
    }),
  });

  const deadline = Date.now() + 60_000;
  while (
    prediction.status !== "succeeded" &&
    prediction.status !== "failed" &&
    Date.now() < deadline
  ) {
    await new Promise((r) => setTimeout(r, 1500));
    prediction = await replicateFetch(`/predictions/${prediction.id}`);
  }

  if (prediction.status !== "succeeded") {
    throw new Error("Photo scoring did not complete");
  }

  const raw = Number(prediction.output);
  if (Number.isNaN(raw)) throw new Error("Unexpected scoring output");
  return Math.max(0, Math.min(10, raw));
}
