// Daily.co REST API — voice-only private rooms.

const DAILY_API = "https://api.daily.co/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface DailyRoom {
  name: string;
  url: string;
}

/** Private voice room, auto-deleted 30 minutes after creation. */
export async function createRoom(): Promise<DailyRoom> {
  const res = await fetch(`${DAILY_API}/rooms`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      privacy: "private",
      properties: {
        exp: Math.floor(Date.now() / 1000) + 30 * 60,
        eject_at_room_exp: true,
        start_video_off: true,
        enable_screenshare: false,
        enable_chat: false,
        max_participants: 2,
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily room creation failed: ${res.status}`);
  const data = await res.json();
  return { name: data.name, url: data.url };
}

/** Meeting token so a specific user can join a private room. */
export async function createMeetingToken(
  roomName: string,
  userId: string,
): Promise<string> {
  const res = await fetch(`${DAILY_API}/meeting-tokens`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: userId,
        exp: Math.floor(Date.now() / 1000) + 30 * 60,
        start_video_off: true,
      },
    }),
  });
  if (!res.ok) throw new Error(`Daily token creation failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}
