import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { WindowListener } from "@/components/window/WindowListener";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("onboarding_complete")
    .eq("id", user.id)
    .single();
  if (!profile?.onboarding_complete) redirect("/photos");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <WindowListener />
      <div className="flex-1 px-6 pb-24 pt-8">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-bg">
        <div className="mx-auto flex max-w-md">
          <Link
            href="/home"
            className="flex-1 py-4 text-center text-sm text-secondary hover:text-fg"
          >
            Today
          </Link>
          <Link
            href="/window"
            className="flex-1 py-4 text-center text-sm text-secondary hover:text-fg"
          >
            Window
          </Link>
          <Link
            href="/connections"
            className="flex-1 py-4 text-center text-sm text-secondary hover:text-fg"
          >
            Connections
          </Link>
        </div>
      </nav>
    </div>
  );
}
