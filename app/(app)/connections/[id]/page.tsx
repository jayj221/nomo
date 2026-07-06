"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { SocialShareTile } from "@/components/chat/SocialShareTile";
import type { ChatMessage, SocialPlatform } from "@/types/app.types";

const PLATFORMS: SocialPlatform[] = [
  "instagram",
  "tiktok",
  "spotify",
  "apple_music",
];

interface ShareState {
  mine: { platform: SocialPlatform; handle: string }[];
  theirs: { platform: SocialPlatform; handle: string }[];
}

export default function ChatPage() {
  const { id: connectionId } = useParams<{ id: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [shares, setShares] = useState<ShareState>({ mine: [], theirs: [] });
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadShares = useCallback(async () => {
    const res = await fetch(`/api/social/shares/${connectionId}`);
    if (res.ok) setShares(await res.json());
  }, [connectionId]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });

    fetch(`/api/messages/${connectionId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));
    loadShares();

    // Live messages + share updates over Supabase Realtime
    const channel = supabase
      .channel(`chat:${connectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "social_shares",
          filter: `connection_id=eq.${connectionId}`,
        },
        () => loadShares(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, loadShares]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(content: string) {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connection_id: connectionId, content }),
    });
    if (res.ok) {
      const d = await res.json();
      setMessages((prev) =>
        prev.some((m) => m.id === d.message.id) ? prev : [...prev, d.message],
      );
    }
  }

  async function share(platform: SocialPlatform, handle: string) {
    await fetch("/api/social/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connection_id: connectionId, platform, handle }),
    });
    await loadShares();
  }

  return (
    <main className="flex min-h-[85vh] flex-col">
      <div className="flex-1">
        <div className="flex flex-col gap-2">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} mine={m.sender_id === userId} />
          ))}
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-faint">
              You both chose this. Say something.
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-col gap-4 bg-bg pb-2 pt-3">
        <ChatInput onSend={send} />

        <details className="rounded-card border border-line bg-card p-3">
          <summary className="cursor-pointer text-sm text-secondary">
            Share on your terms
          </summary>
          <div className="mt-3 flex flex-col gap-2">
            {PLATFORMS.map((p) => (
              <SocialShareTile
                key={p}
                platform={p}
                sharedHandle={shares.mine.find((s) => s.platform === p)?.handle}
                theirHandle={shares.theirs.find((s) => s.platform === p)?.handle}
                onShare={share}
              />
            ))}
            <p className="mt-1 text-xs text-faint">
              The app never accesses your account. Just the handle you type.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
}
