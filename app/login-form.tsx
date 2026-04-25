"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Inloggen mislukt");
      return;
    }
    router.push("/bevraging");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="code">Inlogcode</label>
      <input
        id="code"
        type="text"
        autoComplete="off"
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Bv. K7P3QM"
        style={{ textTransform: "uppercase", letterSpacing: "0.15em", fontFamily: "ui-monospace, monospace" }}
      />
      {error && <div className="error">{error}</div>}
      <div style={{ marginTop: 16 }}>
        <button type="submit" disabled={loading || !code.trim()}>
          {loading ? "Bezig..." : "Inloggen"}
        </button>
      </div>
    </form>
  );
}
