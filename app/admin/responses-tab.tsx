"use client";

import { useEffect, useState } from "react";
import type { SurveyAnswers } from "@/lib/supabase";

type Response = {
  login_code: string;
  answers: SurveyAnswers;
  submitted_at: string;
  updated_at: string;
  name?: string;
  email?: string;
};

const SCHEDULE_LABELS: Record<string, string> = {
  long_stretch: "Lange reeksen (6+2)",
  short_stretch: "Kortere reeksen (3-4 + 1)",
  no_preference: "Geen voorkeur",
  other: "Andere",
};
const SHIFT_LABELS: Record<string, string> = {
  early: "Liefst vroeg",
  late: "Liefst laat",
  mix: "Mix is fijn",
  no_preference: "Geen voorkeur",
};
const WEEKEND_LABELS: Record<string, string> = {
  as_few_as_possible: "Zo weinig mogelijk",
  no_preference: "Geen voorkeur",
  extra_ok: "Extra mag",
};

export default function ResponsesTab() {
  const [list, setList] = useState<Response[] | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/responses${anonymous ? "?anonymous=1" : ""}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) setError(d?.error ?? "Fout");
        else setList(d.responses);
      });
  }, [anonymous]);

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bevraging-${anonymous ? "anoniem" : "volledig"}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (error) return <div className="error">{error}</div>;
  if (!list) return <p className="muted">Laden...</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Antwoorden ({list.length})</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, fontWeight: 400 }}>
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            Anonieme weergave (enkel codes)
          </label>
          <button className="secondary" onClick={downloadJSON} disabled={list.length === 0}>
            Download JSON
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="muted" style={{ marginTop: 16 }}>Nog geen antwoorden ontvangen.</p>
      ) : (
        <div style={{ marginTop: 16 }}>
          {list.map((r) => (
            <div
              key={r.login_code}
              style={{ border: "1px solid #e3e6ea", borderRadius: 8, padding: 16, marginBottom: 12 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  {anonymous ? (
                    <strong><span className="code-pill">{r.login_code}</span></strong>
                  ) : (
                    <>
                      <strong>{r.name}</strong>{" "}
                      <span className="muted">· {r.email} · </span>
                      <span className="code-pill">{r.login_code}</span>
                    </>
                  )}
                </div>
                <span className="muted" style={{ fontSize: "0.85rem" }}>
                  {new Date(r.updated_at).toLocaleString("nl-BE")}
                </span>
              </div>
              <table style={{ marginTop: 12 }}>
                <tbody>
                  <tr>
                    <td><strong>Verdiepingen voorkeur</strong></td>
                    <td>{r.answers.floorPreference?.join(", ") || <span className="muted">—</span>}</td>
                  </tr>
                  <tr>
                    <td><strong>Liefst vermijden</strong></td>
                    <td>{r.answers.floorMustAvoid?.join(", ") || <span className="muted">—</span>}</td>
                  </tr>
                  <tr>
                    <td><strong>Reeks-voorkeur</strong></td>
                    <td>
                      {SCHEDULE_LABELS[r.answers.scheduleStyle] ?? r.answers.scheduleStyle}
                      {r.answers.scheduleStyle === "other" && r.answers.scheduleStyleOther && (
                        <> — <em>{r.answers.scheduleStyleOther}</em></>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Vroeg/laat</strong></td>
                    <td>{SHIFT_LABELS[r.answers.shiftPreference] ?? r.answers.shiftPreference}</td>
                  </tr>
                  <tr>
                    <td><strong>Weekends</strong></td>
                    <td>{WEEKEND_LABELS[r.answers.weekendsPerMonth] ?? r.answers.weekendsPerMonth}</td>
                  </tr>
                  {r.answers.comments && (
                    <tr>
                      <td><strong>Opmerkingen</strong></td>
                      <td style={{ whiteSpace: "pre-wrap" }}>{r.answers.comments}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
