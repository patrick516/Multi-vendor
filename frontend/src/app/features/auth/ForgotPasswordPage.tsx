// frontend/src/app/features/auth/ForgotPasswordPage.tsx
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

type Stage = "request" | "verify";

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<Stage>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function handleRequest(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data: { message?: string } = await res
        .json()
        .catch(() => ({} as { message?: string }));

      setMessage(
        data.message ||
          "If an account with that email exists, we have sent a reset code."
      );
      setStage("verify");
    } catch {
      setError("Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data: { message?: string } = await res
        .json()
        .catch(() => ({} as { message?: string }));

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setMessage(
        data.message || "Password reset successful. You can login now."
      );
      // Optionally store token & redirect directly to dashboard
      // localStorage.setItem("authToken", data.token);
      // localStorage.setItem("authUser", JSON.stringify(data.user));
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to reset password.");
      } else {
        setError("Failed to reset password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-6 bg-white shadow-md rounded-xl">
        <h1 className="mb-2 text-xl font-semibold text-slate-800">
          {stage === "request" ? "Forgot your password?" : "Enter reset code"}
        </h1>
        <p className="mb-4 text-sm text-slate-600">
          {stage === "request"
            ? "Enter your account email and we'll send you a one-time reset code."
            : "Check your email for the 6-digit code and enter it with your new password."}
        </p>

        {message && (
          <div className="px-3 py-2 mb-3 text-sm rounded-md bg-emerald-50 text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="px-3 py-2 mb-3 text-sm text-red-600 rounded-md bg-red-50">
            {error}
          </div>
        )}

        {stage === "request" ? (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 focus:border-blue-500 focus:outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 text-sm border rounded-md border-slate-300 bg-slate-100"
                value={email}
                disabled
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">
                Reset code (OTP)
              </label>
              <input
                type="text"
                maxLength={6}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm tracking-[0.3em] text-center font-mono"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 text-sm border rounded-md border-slate-300"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? "Resetting password..." : "Reset password"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm text-blue-600 hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}
