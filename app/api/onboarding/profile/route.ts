import { NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth";

const GENDERS = ["man", "woman", "nonbinary"];

export async function POST(request: Request) {
  const auth = await requireUser();
  if (isResponse(auth)) return auth;
  const { user, supabase } = auth;

  const body = await request.json().catch(() => null);
  const { first_name, age, city, gender, seeking } = body ?? {};

  if (typeof first_name !== "string" || !first_name.trim()) {
    return NextResponse.json({ error: "First name required" }, { status: 400 });
  }
  if (!Number.isInteger(age) || age < 18 || age > 100) {
    return NextResponse.json({ error: "You must be 18 or older" }, { status: 400 });
  }
  if (typeof city !== "string" || !city.trim()) {
    return NextResponse.json({ error: "City required" }, { status: 400 });
  }
  if (!GENDERS.includes(gender)) {
    return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
  }
  if (
    !Array.isArray(seeking) ||
    seeking.length === 0 ||
    seeking.some((s: string) => !GENDERS.includes(s))
  ) {
    return NextResponse.json(
      { error: "Choose who you want to connect with" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("users")
    .update({
      first_name: first_name.trim(),
      age,
      city: city.trim(),
      gender,
      seeking,
      last_active: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
