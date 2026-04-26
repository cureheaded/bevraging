import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { setEmployeeSession } from "@/lib/session";
import { normalizeCode } from "@/lib/code";

const DEV_CODE = "1234";
const isDev = process.env.NODE_ENV !== "production";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const code = normalizeCode(String(body?.code ?? ""));

  if (!code) {
    return NextResponse.json({ error: "Geen code opgegeven" }, { status: 400 });
  }

  // Dev-only: code "1234" maakt automatisch een test-gebruiker aan
  if (isDev && code === DEV_CODE) {
    await supabase
      .from("employees")
      .upsert(
        {
          name: "Test Gebruiker",
          email: "test@bevraging.local",
          login_code: DEV_CODE,
        },
        { onConflict: "login_code" },
      );
    await setEmployeeSession(DEV_CODE);
    return NextResponse.json({ ok: true });
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
