import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isAdmin } from "@/lib/session";

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Niet toegelaten" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const anonymous = searchParams.get("anonymous") === "1";

  const { data: responses, error } = await supabase
    .from("responses")
    .select("login_code, answers, submitted_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (anonymous) {
    return NextResponse.json({ responses: responses ?? [] });
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("login_code, name, email");
  const byCode = new Map((employees ?? []).map((e) => [e.login_code, e]));
  const enriched = (responses ?? []).map((r) => ({
    ...r,
    name: byCode.get(r.login_code)?.name ?? "(onbekend)",
    email: byCode.get(r.login_code)?.email ?? "",
  }));

  return NextResponse.json({ responses: enriched });
}
