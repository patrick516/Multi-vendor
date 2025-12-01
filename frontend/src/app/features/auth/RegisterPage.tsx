// src/app/features/auth/RegisterPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "SUPER_ADMIN", // backend will ignore for first user but we keep intention clear
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create admin");
      }

      const data = await res.json();
      if (data.token) localStorage.setItem("authToken", data.token);
      if (data.user)
        localStorage.setItem("authUser", JSON.stringify(data.user));

      const mustChange = data.user?.mustChangePassword === true;
      navigate(mustChange ? "/change-password" : "/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-muted">
      <div className="w-full max-w-md p-6 space-y-5 border rounded-lg shadow-lg bg-card border-border">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Setup Admin Account
          </h1>
          <p className="text-xs text-muted-foreground">
            This will create the main admin. Vendors will be added later from
            the admin panel.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium">Full name</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Admin name (optional)"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Email</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Password</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Confirm password</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 mt-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Creating admin..." : "Create admin account"}
          </button>
        </form>

        <div className="text-center text-[11px] text-muted-foreground">
          Already have an admin account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}
