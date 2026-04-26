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

const SUBJECT = "WZC Nieuwbeekhof - Bevraging Werkplanning";

function getVoornaam(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[parts.length - 1] || name;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(e: Employee, surveyUrl: string, infoUrl: string): string {
  const voornaam = escapeHtml(getVoornaam(e.name));
  const code = escapeHtml(e.login_code);
  return `<div style="font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #1a2238; max-width: 600px;">
<p>Dag ${voornaam},</p>

<p>Elke personeelsvergadering kunnen ook punten worden besproken die de medewerkers belangrijk vinden. In de laatste vergadering vroegen enkele collega's om de werkroosterplanning te herbekijken. Sommigen voelen zich benadeeld.</p>

<p>Omdat wij samen streven naar een leuke sfeer en goede samenwerking, willen we deze vraag grondig bekijken.</p>

<p>Ik vraag je daarom om <a href="${surveyUrl}" style="color:#2c5fb3; font-weight:500;">deze bevraging</a> in te vullen.</p>

<p>Als kernteam willen we hier zo eerlijk en correct mogelijk in zijn. Daarom is dit volledig anoniem. Ik heb een behoorlijk complex maar eerlijk algoritme uitgewerkt zodat niemand benadeeld wordt op basis van de bevraging. Wil je daar meer over weten? <a href="${infoUrl}" style="color:#2c5fb3; font-weight:500;">Lees hier</a>.</p>

<p style="background:#fff8e1; border-left:4px solid #f5b400; padding:12px 14px; border-radius:6px;">
<strong>Belangrijk:</strong> de code hieronder is de enige verbinding met wie je bent. Houd die goed bij (schrijf ze op of bewaar deze mail).<br><br>
Jouw persoonlijke code: <strong style="font-family: ui-monospace, Consolas, monospace; font-size: 1.15em; letter-spacing: 0.1em; background:#fff; padding:3px 10px; border-radius:4px; border:1px solid #e0d4a8;">${code}</strong>
</p>

<p>Dankjewel!</p>

<p>B</p>
</div>`;
}

function buildEmailPlain(e: Employee, surveyUrl: string, infoUrl: string): string {
  const voornaam = getVoornaam(e.name);
  return `Dag ${voornaam},

Elke personeelsvergadering kunnen ook punten worden besproken die de medewerkers belangrijk vinden. In de laatste vergadering vroegen enkele collega's om de werkroosterplanning te herbekijken. Sommigen voelen zich benadeeld.

Omdat wij samen streven naar een leuke sfeer en goede samenwerking, willen we deze vraag grondig bekijken.

Ik vraag je daarom om deze bevraging in te vullen: ${surveyUrl}

Als kernteam willen we hier zo eerlijk en correct mogelijk in zijn. Daarom is dit volledig anoniem. Ik heb een behoorlijk complex maar eerlijk algoritme uitgewerkt zodat niemand benadeeld wordt op basis van de bevraging. Wil je daar meer over weten? Lees hier: ${infoUrl}

Belangrijk: de code hieronder is de enige verbinding met wie je bent. Houd die goed bij (schrijf ze op of bewaar deze mail).

Jouw persoonlijke code: ${e.login_code}

Dankjewel!

B`;
}

export default function EmployeesTab({ origin }: { origin: string }) {
  const [list, setList] = useState<Employee[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewFor, setPreviewFor] = useState<Employee | null>(null);
  const [status, setStatus] = useState<string | null>(null);

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

  function copyHtmlToClipboard(html: string, plain: string): boolean {
    // execCommand-aanpak: selecteer een verborgen HTML-element en kopieer.
    // Dit behoudt rich text (HTML) in het klembord op een manier die Outlook,
    // Apple Mail, Thunderbird en Gmail allemaal correct herkennen bij Ctrl+V.
    const div = document.createElement("div");
    div.contentEditable = "true";
    div.innerHTML = html;
    div.style.position = "fixed";
    div.style.top = "-9999px";
    div.style.left = "-9999px";
    div.style.opacity = "0";
    document.body.appendChild(div);

    const range = document.createRange();
    range.selectNodeContents(div);
    const sel = window.getSelection();
    if (!sel) {
      document.body.removeChild(div);
      return false;
    }
    sel.removeAllRanges();
    sel.addRange(range);

    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    sel.removeAllRanges();
    document.body.removeChild(div);

    // Voeg ook moderne async-API toe als extra zekerheid (sommige browsers verkiezen die)
    if (navigator.clipboard && typeof (window as any).ClipboardItem === "function") {
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plain], { type: "text/plain" }),
          }),
        ])
        .catch(() => {});
    }
    return ok;
  }

  async function openMailto(e: Employee) {
    const surveyUrl = `${origin}/`;
    const infoUrl = `${origin}/infoalgoritme.html`;
    const html = buildEmailHtml(e, surveyUrl, infoUrl);
    const plain = buildEmailPlain(e, surveyUrl, infoUrl);

    const copied = copyHtmlToClipboard(html, plain);

    setStatus(
      copied
        ? "Mail-inhoud (HTML) staat op je klembord. Plak met Ctrl+V in het bericht-veld van het mailprogramma dat zo opent. Als er al tekst staat (bv. handtekening) — klik bovenaan in het bericht en plak."
        : "Klembord-toegang geweigerd door je browser. Open de Voorbeeld-knop, selecteer de mail en kopieer manueel met Ctrl+C.",
    );

    // Lege mailto: enkel ontvanger + onderwerp, geen body — zo plakt de gebruiker in een schoon veld
    const url = `mailto:${e.email}?subject=${encodeURIComponent(SUBJECT)}`;
    window.location.href = url;

    setTimeout(() => setStatus(null), 12000);
    setTimeout(() => markSent(e.id, true), 400);
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
  const surveyUrl = `${origin}/`;
  const infoUrl = `${origin}/infoalgoritme.html`;

  return (
    <div>
      <h2>Medewerkers</h2>
      <p className="muted">
        Totaal: <strong>{total}</strong> · Mail verstuurd: <strong>{sent}</strong> ·
        Bevraging ingevuld: <strong>{responded}</strong>
      </p>
      <p className="muted" style={{ fontSize: "0.88rem" }}>
        Onderwerp: <code>{SUBJECT}</code> · Voornaam wordt het laatste woord uit de naam-kolom.
        Klik op <strong>Mail openen</strong>: de HTML-inhoud gaat naar je klembord en je
        standaard mailprogramma opent met onderwerp en ontvanger ingevuld — plak met Ctrl+V
        in het bericht-veld.
      </p>

      {status && <div className="success">{status}</div>}

      <table>
        <thead>
          <tr>
            <th>Naam</th>
            <th>Voornaam</th>
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
              <td><em>{getVoornaam(e.name)}</em></td>
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
                <button onClick={() => openMailto(e)} title="Open standaard mailprogramma met onderwerp + bericht ingevuld">
                  Mail openen
                </button>
                <button className="secondary" onClick={() => setPreviewFor(e)} title="Toon hoe de mail eruit ziet">
                  Voorbeeld
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

      {previewFor && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16,
          }}
          onClick={() => setPreviewFor(null)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 12, maxWidth: 720, width: "100%",
              maxHeight: "90vh", overflow: "auto", padding: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Mail voor {previewFor.name}</h3>
              <button className="secondary" onClick={() => setPreviewFor(null)}>Sluiten</button>
            </div>
            <p className="muted" style={{ fontSize: "0.88rem" }}>
              <strong>Onderwerp:</strong> {SUBJECT}<br/>
              <strong>Aan:</strong> {previewFor.email}
            </p>
            <div
              style={{ border: "1px solid #e3e6ea", borderRadius: 6, padding: 16, background: "#fafbfc" }}
              dangerouslySetInnerHTML={{ __html: buildEmailHtml(previewFor, surveyUrl, infoUrl) }}
            />
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => { openMailto(previewFor); setPreviewFor(null); }}>
                Mail openen
              </button>
              <button
                className="secondary"
                onClick={() => {
                  const html = buildEmailHtml(previewFor, surveyUrl, infoUrl);
                  const plain = buildEmailPlain(previewFor, surveyUrl, infoUrl);
                  const ok = copyHtmlToClipboard(html, plain);
                  setStatus(ok ? "HTML gekopieerd naar klembord." : "Kopiëren mislukt.");
                  setTimeout(() => setStatus(null), 6000);
                }}
              >
                Kopieer HTML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
