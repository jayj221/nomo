// OneSignal REST API — web push for window notifications.
// Copy rule: no emoji, no exclamation marks.

export async function sendWindowNotification(message: string): Promise<void> {
  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      contents: { en: message },
      // Tags are set client-side after onboarding completes; last_active
      // recency is handled by OneSignal's built-in session tracking.
      filters: [
        { field: "tag", key: "verified", relation: "=", value: "true" },
        { operator: "AND" },
        { field: "last_session", relation: ">", hours_ago: "168" },
      ],
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/window`,
    }),
  });
  if (!res.ok) {
    throw new Error(`OneSignal send failed: ${res.status} ${await res.text()}`);
  }
}
