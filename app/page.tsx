import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/session";
import LoginForm from "./login-form";

export default async function Home() {
  const code = await getEmployeeSession();
  if (code) redirect("/bevraging");
  return (
    <div className="login-page">
      <div className="login-card">
        <div
          className="login-hero"
          style={{ backgroundImage: "url(/achtergrondlogin.png)" }}
          aria-hidden="true"
        >
          <div className="login-hero-overlay">
            <h1>Bevraging medewerkers</h1>
            <p>Voorkeuren rond verdiepingen en uurroosters</p>
          </div>
        </div>
        <div className="login-body">
          <p className="muted">
            Voer hier de inlogcode in die je per mail ontving.
          </p>
          <div className="callout">
            <strong>Bewaar deze code goed.</strong> Je hebt hem later opnieuw
            nodig om je voorkeuren te koppelen aan je uurrooster. Schrijf hem op
            of laat de mail in je inbox staan.
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
