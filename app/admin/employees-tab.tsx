"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: string;
  name: string;
  email: string;
  login_code: string;
  mail_sent_at: string | null;
  responded: boolean;
  response_updated_at: string | null;
};

const DEFAULT_SUBJECT = "Bevraging voorkeuren — jouw inlogcode";
const DEFAULT_BODY = (name: string, code: string, url: string) => `Dag ${name.split(" ")[0] || name},

Voor het opmaken van de uurroosters wil ik graag weten wat jouw voorkeuren zijn — bv. op welke verdieping je het liefst werkt, en of je liever lange of korte werkreeksen draait.

Vul de bevraging in via deze link:
${url}

Jouw persoonlijke inlogcode: ${code}

De antwoorden worden anoniem (enkel onder die code) bewaard.

Alvast bedankt!`;

export default function EmployeesTab({ origin }: { origin: string }) {
  const [list, setList] = useState<Employee[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [bodyTemplate, setBodyTemplate] = useState<string>("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const res = await fetch("/api/admin/employees");
    const data = await res.json();
    if (!res.ok) {
      setError(data?.error ?? "Kon medewerkers niet ophalen");
      return;
    }
    setList(data.employees);
  }

  function buildMailto(e: Employee) {
    const url = `${origin}/`;
    const body = bodyTemplate
      ? bodyTemplate
          .replaceAll("{naam}", e.name)
          .replaceAll("{voornaam}", e.name.split(" ")[0] || e.name)
          .replaceAll("{code}", e.login_code)
          .replaceAll("{url}", url)
      : DEFAULT_BODY(e.name, e.login_code, url);
    // mailto: gebruikt %20 voor spaties (RFC 6068), niet + zoals URLSearchParams doet
    const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return `mailto:${e.email}?${qs}`;
  }

  async function markSent(id: string, sent: boolean) {
    await fetch("/api/admin/mark-sent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, sent }),
    });
    refresh();
  }

  async function deleteOne(id: string, name: string) {
    if (!confirm(`Medewerker "${name}" verwijderen? Diens antwoorden worden ook gewist.`)) return;
    await fetch(`/api/admin/employees?id=${id}`, { method: "DELETE" });
    refresh();
  }

  async function sendAndMark(e: Employee) {
    window.location.href = buildMailto(e);
    // Laat de browser de mail-app openen, dan markeren we als verzonden
    setTimeout(() => markSent(e.id, true), 300);
  }

  if (error) return <div className="error">{error}</div>;
  if (!list) return <p className="muted">Laden...</p>;

  if (list.length === 0) {
    return (
      <div>
        <h2>Nog geen medewerkers</h2>
        <p className="muted">
          Ga naar <strong>Instellingen</strong> en lees een Excel-bestand in met namen en e-mails.
        </p>
      </div>
    );
  }

  const total = list.length;
  const sent = list.filter((e) => e.mail_sent_at).length;
  const responded = list.filter((e) => e.responded).length;

  return (
    <div>
      <h2>Mailtemplate</h2>
      <p className="muted">
        Wordt gebruikt om de mailto-link op te bouwen. Placeholders: <code>{"{voornaam}"}</code>,
        <code> {"{naam}"}</code>, <code>{"{code}"}</code>, <code>{"{url}"}</code>. Laat leeg om
        de standaard te gebruiken.
      </p>
      <label htmlFor="subj">Onderwerp</label>
      <input id="subj" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <label htmlFor="body">Bericht (laat leeg voor standaard)</label>
      <textarea
        id="body"
        rows={8}
        value={bodyTemplate}
        onChange={(e) => setBodyTemplate(e.target.value)}
        placeholder={DEFAULT_BODY("[Naam]", "[CODE]", `${origin}/`)}
      />

      <h2>Medewerkers</h2>
      <p className="muted">
        Totaal: <strong>{total}</strong> · Mail gemarkeerd als verstuurd: <strong>{sent}</strong> ·
        Bevraging ingevuld: <strong>{responded}</strong>
      </p>

      <table>
        <thead>
          <tr>
            <th>Naam</th>
            <th>Email</th>
            <th>Code</th>
            <th>Mail</th>
            <th>Antwoord</th>
            <th>Acties</th>
          </tr>
        </thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.id}>
              <td>{e.name}</td>
              <td>{e.email}</td>
              <td><span className="code-pill">{e.login_code}</span></td>
              <td>
                {e.mail_sent_at ? (
                  <span className="tag tag-sent" title={e.mail_sent_at}>verstuurd</span>
                ) : (
                  <span className="tag tag-pending">nog niet</span>
                )}
              </td>
              <td>
                {e.responded ? (
                  <span className="tag tag-done" title={e.response_updated_at ?? ""}>ingevuld</span>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td className="row-actions">
                <button onClick={() => sendAndMark(e)}>Mail openen</button>
                <button
                  className="secondary"
                  onClick={() => navigator.clipboard.writeText(e.login_code)}
                  title="Kopieer code"
                >
                  Kopieer code
                </button>
                {e.mail_sent_at && (
                  <button className="secondary" onClick={() => markSent(e.id, false)} title="Reset mail-status">
                    ↺
                  </button>
                )}
                <button className="danger" onClick={() => deleteOne(e.id, e.name)}>×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
