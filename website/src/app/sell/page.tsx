"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/app/utils/fetcher";

export default function SellPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/auth/vendor-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || "Failed to create vendor account");
      }

      setSuccess(
        body.message ||
          "Your vendor account has been created. Check your email for your temporary password."
      );
      setName("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      setError(err.message || "Failed to create vendor account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">
          Sell on Trade Point Malawi
        </h1>
        <p className="max-w-xl text-sm text-slate-600">
          Register as a vendor to list your products on Trade Point Malawi. We
          will send you a temporary password by email. After you pay your
          subscription fee and the admin activates your account, you&apos;ll be
          able to access the vendor dashboard.
        </p>
      </header>

      <section className="max-w-md p-5 bg-white shadow-sm rounded-2xl ring-1 ring-slate-100">
        {error && <p className="mb-2 text-[11px] text-red-600">{error}</p>}
        {success && (
          <p className="mb-2 text-[11px] text-emerald-700">{success}</p>
        )}

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="font-medium text-md text-slate-700">
              Your name or business names
            </label>
            <input
              className="w-full px-3 py-2 bg-white border rounded-md text-md border-slate-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nyasa Traders"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-md text-slate-700">
              Email (required)
            </label>
            <input
              className="w-full px-3 py-2 bg-white border rounded-md text-md border-slate-200"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-md text-slate-700">
              Phone (optional)
            </label>
            <input
              className="w-full px-3 py-2 bg-white border rounded-md text-md border-slate-200"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="099x xxx xxx"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Create vendor account"}
          </button>
        </form>
      </section>
    </div>
  );
}
