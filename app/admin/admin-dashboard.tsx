"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmployeesTab from "./employees-tab";
import SettingsTab from "./settings-tab";
import ResponsesTab from "./responses-tab";

type Tab = "employees" | "settings" | "responses";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("employees");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <button className="secondary" onClick={logout}>Uitloggen</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          className={tab === "employees" ? "" : "secondary"}
          onClick={() => setTab("employees")}
        >
          Medewerkers & mails
        </button>
        <button
          className={tab === "responses" ? "" : "secondary"}
          onClick={() => setTab("responses")}
        >
          Antwoorden
        </button>
        <button
          className={tab === "settings" ? "" : "secondary"}
          onClick={() => setTab("settings")}
        >
          Instellingen (Excel inlezen)
        </button>
      </div>

      <div className="card">
        {tab === "employees" && <EmployeesTab origin={origin} />}
        {tab === "settings" && <SettingsTab onImported={() => setTab("employees")} />}
        {tab === "responses" && <ResponsesTab />}
      </div>
    </>
  );
}
