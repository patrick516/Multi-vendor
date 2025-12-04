// src/app/features/auth/LoginPage.tsx
"use client";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://backend-morning-glitter-4312.fly.dev/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.token) localStorage.setItem("authToken", data.token);
      if (data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }

      const mustChange = data.user?.mustChangePassword === true;

      if (mustChange) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen px-4 bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md p-8 space-y-6 bg-white border border-gray-200 shadow-2xl dark:bg-gray-900 rounded-2xl dark:border-gray-700">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="/icons/tp_logo.svg"
            alt="Multivendor Logo"
            className="object-contain w-24 h-24" // enlarged nicely
          />
        </div>

        {/* Titles */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white">
            Multi Vendor Admin Login
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to manage vendors, products and commissions.
          </p>
        </div>

        {/* ---------------- FORM ---------------- */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-bold transition-all rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          {/* Forgot password */}
          <div className="mt-1 text-center">
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        {/* Register */}
        <div className="text-xs text-center text-gray-600 dark:text-gray-400">
          First time setting up the system?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Create admin account
          </Link>
        </div>
      </div>
    </div>
  );
}
