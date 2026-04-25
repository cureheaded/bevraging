import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/session";
import SurveyForm from "./survey-form";

export default async function BevragingPage() {
  const code = await getEmployeeSession();
  if (!code) redirect("/");
  return (
    <div className="container">
      <div className="card">
        <h1>Jouw voorkeuren</h1>
        <p className="muted">
          Vul deze bevraging zo eerlijk mogelijk in. Je antwoorden worden enkel onder
          jouw inlogcode bewaard — niet onder je naam. Je kan later nog terugkomen en
          aanpassen zolang de bevraging openstaat.
        </p>
        <SurveyForm />
      </div>
    </div>
  );
}
