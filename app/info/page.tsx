import Link from "next/link";
import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/session";

export default async function InfoPage() {
  const code = await getEmployeeSession();
  if (!code) redirect("/");

  return (
    <div className="blurred-bg">
      <div className="container">
        <div className="card">
          <h1>Voor je begint — even kort</h1>

          <p>
            Bedankt om de bevraging in te vullen. Voor je je voorkeuren ingeeft,
            is het belangrijk dat je het volgende meeneemt:
          </p>

          <h2>Een algoritme houdt rekening met iedereen</h2>
          <p>
            De antwoorden van álle medewerkers worden via een anoniem algoritme samengebracht
            tot één rooster. Het algoritme probeert <strong>de voorkeuren van iedereen
            maximaal te respecteren</strong> — niet alleen de jouwe, en ook niet alleen die
            van een paar collega's.
          </p>

          <div className="callout">
            <strong>Dat betekent ook dat IEDEREEN een aantal zaken zal moeten opofferen
            voor de collega's.</strong> Je zal niet altijd je eerste keuze krijgen — niemand
            krijgt dat. Wat we wél garanderen: over een jaar genomen wordt het in balans
            gebracht. Wie deze maand een minder gunstig rooster kreeg, krijgt later iets meer
            van zijn/haar voorkeur. De wiskunde achter dit evenwicht staat
            uitgelegd op de <a href="/infoalgoritme.html" target="_blank" rel="noopener">infopagina over het algoritme</a>.
          </div>

          <h2>Iedereen mag de resultaten zien</h2>
          <p>
            Om transparant te zijn: de antwoorden van de hele groep zullen <strong>door
            alle medewerkers ingekeken kunnen worden</strong>. Zo kan iedereen zelf zien dat
            er geen gesjoemel is en dat het rooster echt eerlijk wordt opgebouwd.
          </p>
          <p>
            De resultaten zijn ook dan nog <strong>anoniem</strong>: ze tonen enkel je
            persoonlijke inlogcode, niet je naam. Alleen jij weet welke code bij jouw
            antwoorden hoort.
          </p>

          <h2>Wat je nu best doet</h2>
          <ul>
            <li>Bewaar je inlogcode goed (schrijf hem op of laat de mail in je inbox staan).</li>
            <li>Vul de bevraging zo eerlijk mogelijk in — niet wat je denkt dat van je verwacht wordt.</li>
            <li>Lees gerust de <a href="/infoalgoritme.html" target="_blank" rel="noopener">technische uitleg</a> als je nieuwsgierig bent naar hoe het algoritme werkt.</li>
          </ul>

          <div style={{ marginTop: 28, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/bevraging" className="btn">
              Ik begrijp het — verder naar de bevraging
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
