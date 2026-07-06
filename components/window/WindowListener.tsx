"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Listens for new window rows over Supabase Realtime. When a window
// fires and the app is open, the user is taken straight to the Window
// screen. Also initializes OneSignal for push when the app is closed.
export function WindowListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("windows-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "windows" },
        () => {
          if (!pathname.startsWith("/call")) router.push("/window");
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, pathname]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;
    let cancelled = false;
    import("react-onesignal").then(async ({ default: OneSignal }) => {
      if (cancelled) return;
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
        });
        await OneSignal.Slidedown.promptPush();
        // Tag drives the push segment for window notifications
        await OneSignal.User.addTag("verified", "true");
      } catch {
        // Push is best-effort; realtime covers the open-app case
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
