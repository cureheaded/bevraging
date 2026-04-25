import { redirect } from "next/navigation";
import { getEmployeeSession } from "@/lib/session";
import LoginForm from "./login-form";

export default async function Home() {
  const code = await getEmployeeSession();
  if (code) redirect("/bevraging");
  return (
    <div className="container">
      <div className="card">
        <h1>Bevraging medewerkers</h1>
        <p className="muted">
          Voer hier de inlogcode in die je per mail ontving. Je antwoorden worden anoniem
          bewaard — alleen de beheerder weet welke code bij wie hoort.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
