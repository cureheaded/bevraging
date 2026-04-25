"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SurveyAnswers } from "@/lib/supabase";

const FLOORS = ["Verdieping 1", "Verdieping 2", "Verdieping 3", "Verdieping 4", "Verdieping 5", "Verdieping 6"];

const EMPTY: SurveyAnswers = {
  floorPreference: [],
  floorMustAvoid: [],
  scheduleStyle: "no_preference",
  scheduleStyleOther: "",
  shiftPreference: "no_preference",
  weekendsPerMonth: "no_preference",
  comments: "",
};

export default function SurveyForm() {
  const router = useRouter();
  const [a, setA] = useState<SurveyAnswers>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/submit")
      .then((r) => r.json())
      .then((data) => {
        if (data?.response?.answers) {
          setA({ ...EMPTY, ...data.response.answers });
          setSavedAt(data.response.updated_at);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function toggleFloor(field: "floorPreference" | "floorMustAvoid", floor: string) {
    setA((prev) => {
      const has = prev[field].includes(floor);
      const next = has ? prev[field].filter((f) => f !== floor) : [...prev[field], floor];
      // Een verdieping kan niet tegelijk in voorkeur en in vermijden zitten
      const other = field === "floorPreference" ? "floorMustAvoid" : "floorPreference";
      return {
        ...prev,
        [field]: next,
        [other]: prev[other].filter((f) => f !== floor),
      };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: a }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Bewaren mislukt");
      return;
    }
    setSavedAt(new Date().toISOString());
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!loaded) return <p className="muted">Laden...</p>;

  return (
    <form onSubmit={submit}>
      {savedAt && (
        <div className="success">
          Antwoorden bewaard op {new Date(savedAt).toLocaleString("nl-BE")}. Je mag nog aanpassen.
        </div>
      )}

      <h2>1. Verdiepingen — voorkeur</h2>
      <p className="muted">Welke verdiepingen werk je het liefst? Je mag er meerdere kiezen, of geen.</p>
      <div className="check-group">
        {FLOORS.map((f) => {
          const sel = a.floorPreference.includes(f);
          return (
            <label key={f} className={`check-option ${sel ? "selected" : ""}`}>
              <input type="checkbox" checked={sel} onChange={() => toggleFloor("floorPreference", f)} />
              <span>{f}</span>
            </label>
          );
        })}
      </div>

      <h2>2. Verdiepingen — liever vermijden</h2>
      <p className="muted">Verdiepingen waar je liefst niet komt. Mag leeg blijven.</p>
      <div className="check-group">
        {FLOORS.map((f) => {
          const sel = a.floorMustAvoid.includes(f);
          return (
            <label key={f} className={`check-option ${sel ? "selected" : ""}`}>
              <input type="checkbox" checked={sel} onChange={() => toggleFloor("floorMustAvoid", f)} />
              <span>{f}</span>
            </label>
          );
        })}
      </div>

      <h2>3. Reeks-voorkeur</h2>
      <p className="muted">Hoe liefst werk je je dagen aaneen?</p>
      <div className="radio-group">
        {[
          { v: "long_stretch", l: "Lange reeksen — bv. 6 dagen werk + minimum 2 dagen thuis" },
          { v: "short_stretch", l: "Kortere reeksen — bv. 3 of 4 dagen werk + 1 dag thuis" },
          { v: "no_preference", l: "Geen voorkeur" },
          { v: "other", l: "Andere (zie opmerkingen)" },
        ].map((opt) => {
          const sel = a.scheduleStyle === opt.v;
          return (
            <label key={opt.v} className={`radio-option ${sel ? "selected" : ""}`}>
              <input
                type="radio"
                name="scheduleStyle"
                checked={sel}
                onChange={() => setA({ ...a, scheduleStyle: opt.v as SurveyAnswers["scheduleStyle"] })}
              />
              <span>{opt.l}</span>
            </label>
          );
        })}
      </div>
      {a.scheduleStyle === "other" && (
        <>
          <label htmlFor="schedule-other">Welke reeks-verdeling werkt voor jou?</label>
          <input
            id="schedule-other"
            type="text"
            value={a.scheduleStyleOther ?? ""}
            onChange={(e) => setA({ ...a, scheduleStyleOther: e.target.value })}
            placeholder="Bv. 5 dagen werk + 2 thuis, dan 2 dagen werk + 1 thuis"
          />
        </>
      )}

      <h2>4. Vroeg- of laatdienst</h2>
      <div className="radio-group">
        {[
          { v: "early", l: "Liefst vroegdienst" },
          { v: "late", l: "Liefst laatdienst" },
          { v: "mix", l: "Mix van beide is fijn" },
          { v: "no_preference", l: "Geen voorkeur" },
        ].map((opt) => {
          const sel = a.shiftPreference === opt.v;
          return (
            <label key={opt.v} className={`radio-option ${sel ? "selected" : ""}`}>
              <input
                type="radio"
                name="shiftPreference"
                checked={sel}
                onChange={() => setA({ ...a, shiftPreference: opt.v as SurveyAnswers["shiftPreference"] })}
              />
              <span>{opt.l}</span>
            </label>
          );
        })}
      </div>

      <h2>5. Weekends</h2>
      <div className="radio-group">
        {[
          { v: "as_few_as_possible", l: "Liefst zo weinig mogelijk weekendwerk" },
          { v: "no_preference", l: "Geen specifieke voorkeur" },
          { v: "extra_ok", l: "Extra weekends mogen, ik werk ze graag" },
        ].map((opt) => {
          const sel = a.weekendsPerMonth === opt.v;
          return (
            <label key={opt.v} className={`radio-option ${sel ? "selected" : ""}`}>
              <input
                type="radio"
                name="weekendsPerMonth"
                checked={sel}
                onChange={() => setA({ ...a, weekendsPerMonth: opt.v as SurveyAnswers["weekendsPerMonth"] })}
              />
              <span>{opt.l}</span>
            </label>
          );
        })}
      </div>

      <h2>6. Opmerkingen</h2>
      <p className="muted">Iets dat we moeten weten? Bv. kinderopvang op specifieke dagen, vaste afspraken, ...</p>
      <textarea
        value={a.comments ?? ""}
        onChange={(e) => setA({ ...a, comments: e.target.value })}
        placeholder="Optioneel"
      />

      {error && <div className="error">{error}</div>}

      <div style={{ marginTop: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="submit" disabled={saving}>
          {saving ? "Bewaren..." : savedAt ? "Aanpassingen bewaren" : "Antwoorden bewaren"}
        </button>
        <button type="button" className="secondary" onClick={logout}>
          Uitloggen
        </button>
      </div>
    </form>
  );
}
