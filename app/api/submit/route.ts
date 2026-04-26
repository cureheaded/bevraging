import { NextResponse } from "next/server";
import { supabase, type SurveyAnswers } from "@/lib/supabase";
import { getEmployeeSession } from "@/lib/session";

function validate(a: any): a is SurveyAnswers {
  if (!a || typeof a !== "object") return false;
  if (!Array.isArray(a.floorPreference)) return false;
  if (!Array.isArray(a.floorMustAvoid)) return false;
  if (!["long_stretch", "short_stretch", "no_preference", "other"].includes(a.scheduleStyle)) return false;
  if (!["early", "late", "mix", "no_preference"].includes(a.shiftPreference)) return false;
  if (!["as_few_as_possible", "no_preference", "extra_ok"].includes(a.weekendsPerMonth)) return false;
  return true;
}

export async function POST(req: Request) {
  const code = await getEmployeeSession();
  if (!code) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const answers = body?.answers;

  if (!validate(answers)) {
    return NextResponse.json({ error: "Antwoorden onvolledig of ongeldig" }, { status: 400 });
  }

  // Upsert: medewerker mag antwoord nog aanpassen tot we de bevraging sluiten
  const { error } = await supabase
    .from("responses")
    .upsert(
      {
        login_code: code,
        answers,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "login_code" },
    );

  if (error) {
    console.error("[/api/submit] supabase error:", error);
    return NextResponse.json(
      { error: `Bewaren mislukt: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Gebruikt door bevraging-pagina om bestaande antwoorden voor te vullen
  const code = await getEmployeeSession();
  if (!code) {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("responses")
    .select("answers, submitted_at, updated_at")
    .eq("login_code", code)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Server-fout" }, { status: 500 });
  }
  return NextResponse.json({ response: data ?? null });
}
