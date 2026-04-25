import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { setEmployeeSession } from "@/lib/session";
import { normalizeCode } from "@/lib/code";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = normalizeCode(String(body?.code ?? ""));

  if (!code) {
    return NextResponse.json({ error: "Geen code opgegeven" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("employees")
    .select("login_code")
    .eq("login_code", code)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Server-fout" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Code niet gevonden" }, { status: 401 });
  }

  await setEmployeeSession(code);
  return NextResponse.json({ ok: true });
}
