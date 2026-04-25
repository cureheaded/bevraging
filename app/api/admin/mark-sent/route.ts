import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/session";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Niet toegelaten" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = String(body?.id ?? "");
  const sent = body?.sent !== false; // default true

  if (!id) return NextResponse.json({ error: "Geen id" }, { status: 400 });

  const { error } = await supabase
    .from("employees")
    .update({ mail_sent_at: sent ? new Date().toISOString() : null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
