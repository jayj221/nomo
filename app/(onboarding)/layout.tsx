import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

const STEPS = ["Photos", "Prompts", "About you", "Verify"];

export default async function OnboardingLayout({
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
  if (profile?.onboarding_complete) redirect("/home");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 py-8">
      <div className="mb-8 flex items-center gap-2">
        {STEPS.map((s) => (
          <div key={s} className="h-[3px] flex-1 rounded-full bg-white/10" />
        ))}
      </div>
      {children}
    </main>
  );
}
