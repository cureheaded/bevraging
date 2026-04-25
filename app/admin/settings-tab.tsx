"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";

type Row = { name: string; email: string };

function findColumn(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => String(h ?? "").toLowerCase().trim());
  for (const c of candidates) {
    const idx = lower.findIndex((h) => h === c);
    if (idx >= 0) return idx;
  }
  for (const c of candidates) {
    const idx = lower.findIndex((h) => h.includes(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

export default function SettingsTab({ onImported }: { onImported: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      if (!wb.SheetNames.length) throw new Error("Geen tabbladen gevonden in dit bestand");

      // Zoek álle cellen in álle tabbladen die naar email-adressen lijken,
      // en de buurcellen (links of rechts) als kandidaat voor de naam.
      type Found = { name: string; email: string; sheet: string };
      const found: Found[] = [];
      const sheetsScanned: string[] = [];

      for (const sheetName of wb.SheetNames) {
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        sheetsScanned.push(sheetName);

        const rows = XLSX.utils.sheet_to_json<any[]>(sheet, {
          header: 1,
          blankrows: false,
          defval: "",
          raw: false,
        });
        if (!rows.length) continue;

        // Probeer eerst headers te herkennen
        const firstRow = (rows[0] as any[]).map((c) => String(c ?? ""));
        const nameIdx = findColumn(firstRow, ["naam", "name", "voornaam", "medewerker"]);
        const emailIdx = findColumn(firstRow, ["email", "e-mail", "mail"]);

        if (nameIdx >= 0 && emailIdx >= 0) {
          for (let i = 1; i < rows.length; i++) {
            const r = rows[i] as any[];
            const name = String(r?.[nameIdx] ?? "").trim();
            const email = String(r?.[emailIdx] ?? "").trim();
            if (name && email && email.includes("@")) {
              found.push({ name, email, sheet: sheetName });
            }
          }
          continue;
        }

        // Geen headers herkend → scan alle cellen op email-adressen
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i] as any[];
          if (!Array.isArray(r)) continue;
          for (let j = 0; j < r.length; j++) {
            const cell = String(r[j] ?? "").trim();
            if (!cell.includes("@") || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cell)) continue;
            // Naam = eerste niet-lege buurcel: links eerst, anders rechts
            let name = "";
            for (let k = j - 1; k >= 0; k--) {
              const v = String(r[k] ?? "").trim();
              if (v) { name = v; break; }
            }
            if (!name) {
              for (let k = j + 1; k < r.length; k++) {
                const v = String(r[k] ?? "").trim();
                if (v && !v.includes("@")) { name = v; break; }
              }
            }
            if (name) found.push({ name, email: cell, sheet: sheetName });
          }
        }
      }

      if (found.length === 0) {
        throw new Error(
          `Geen rijen met naam + email gevonden. Tabbladen gescand: ${sheetsScanned.join(", ") || "(geen)"}. Verwacht kolommen "naam" en "email", of een lijst waar email-adressen naast namen staan.`,
        );
      }

      // De-dupe op email
      const seen = new Set<string>();
      const unique: Row[] = [];
      for (const f of found) {
        const e = f.email.toLowerCase();
        if (seen.has(e)) continue;
        seen.add(e);
        unique.push({ name: f.name, email: f.email });
      }

      setPreview(unique);
    } catch (err: any) {
      setError(err?.message ?? "Kon bestand niet lezen");
      setPreview(null);
    }
  }

  async function importNow() {
    if (!preview) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: preview, mode }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.error ?? "Importeren mislukt");
      return;
    }
    setResult(
      `Klaar — ${data.inserted} nieuwe medewerker(s) toegevoegd, ${data.skipped} overgeslagen (al bestaande email of ongeldige rij).`,
    );
    setPreview(null);
    if (fileInput.current) fileInput.current.value = "";
    setTimeout(onImported, 1200);
  }

  return (
    <div>
      <h2>Medewerkers inlezen via Excel</h2>
      <p className="muted">
        Verwacht kolommen <code>naam</code> en <code>email</code> (of equivalent — kolom A/B
        werkt ook als headers ontbreken). Per nieuwe medewerker wordt automatisch een
        unieke inlogcode aangemaakt.
      </p>

      <label htmlFor="xlsx">Excel-bestand</label>
      <input
        id="xlsx"
        ref={fileInput}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <div style={{ marginTop: 12 }}>
        <label className={`radio-option ${mode === "merge" ? "selected" : ""}`} style={{ marginBottom: 6 }}>
          <input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} />
          <span><strong>Samenvoegen</strong> — bestaande medewerkers behouden, nieuwe toevoegen</span>
        </label>
        <label className={`radio-option ${mode === "replace" ? "selected" : ""}`}>
          <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />
          <span><strong>Vervangen</strong> — alle bestaande medewerkers wissen en opnieuw beginnen (ook hun antwoorden!)</span>
        </label>
      </div>

      {error && <div className="error">{error}</div>}
      {result && <div className="success">{result}</div>}

      {preview && (
        <>
          <h3>Voorbeeld ({preview.length} rijen)</h3>
          <table>
            <thead>
              <tr><th>Naam</th><th>Email</th></tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((r, i) => (
                <tr key={i}><td>{r.name}</td><td>{r.email}</td></tr>
              ))}
              {preview.length > 50 && (
                <tr><td colSpan={2} className="muted">... en nog {preview.length - 50} rijen</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ marginTop: 12 }}>
            <button onClick={importNow} disabled={submitting}>
              {submitting ? "Bezig..." : `Importeer ${preview.length} medewerkers`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
