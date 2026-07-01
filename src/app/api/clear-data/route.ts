import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Wipes all of the signed-in user's progress (completions, flags, submitted
// code). Does not touch the shared AI answer cache.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { error } = await supabase.from("progress").delete().eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
