import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/session";
import { generateLoginCode } from "@/lib/code";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Niet toegelaten" }, { status: 401 });
  }

  const { data: employees, error: e1 } = await supabase
    .from("employees")
    .select("id, name, email, login_code, mail_sent_at, created_at")
    .order("name", { ascending: true });
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: responses, error: e2 } = await supabase
    .from("responses")
    .select("login_code, submitted_at, updated_at");
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const responded = new Map(responses?.map((r) => [r.login_code, r]) ?? []);
  const list = (employees ?? []).map((e) => ({
    ...e,
    responded: responded.has(e.login_code),
    response_updated_at: responded.get(e.login_code)?.updated_at ?? null,
  }));

  return NextResponse.json({ employees: list });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Niet toegelaten" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rows = body?.rows;
  const mode = body?.mode === "replace" ? "replace" : "merge";

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Geen rijen ontvangen" }, { status: 400 });
  }

  const cleaned: { name: string; email: string }[] = [];
  for (const r of rows) {
    const name = String(r?.name ?? "").trim();
    const email = String(r?.email ?? "").trim().toLowerCase();
    if (!name || !email || !email.includes("@")) continue;
    cleaned.push({ name, email });
  }
  if (cleaned.length === 0) {
    return NextResponse.json({ error: "Geen geldige rijen (naam + email vereist)" }, { status: 400 });
  }

  if (mode === "replace") {
    const { error } = await supabase.from("employees").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Haal bestaande emails op om unieke codes te kunnen genereren
  const { data: existing } = await supabase.from("employees").select("login_code, email");
  const existingCodes = new Set((existing ?? []).map((e) => e.login_code));
  const existingEmails = new Set((existing ?? []).map((e) => e.email));

  const toInsert: { name: string; email: string; login_code: string }[] = [];
  for (const row of cleaned) {
    if (existingEmails.has(row.email)) continue; // skip duplicates
    let code = generateLoginCode();
    while (existingCodes.has(code)) code = generateLoginCode();
    existingCodes.add(code);
    toInsert.push({ ...row, login_code: code });
  }

  if (toInsert.length === 0) {
    return NextResponse.json({ ok: true, inserted: 0, skipped: cleaned.length });
  }

  const { error } = await supabase.from("employees").insert(toInsert);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, inserted: toInsert.length, skipped: cleaned.length - toInsert.length });
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Niet toegelaten" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Geen id" }, { status: 400 });

  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
