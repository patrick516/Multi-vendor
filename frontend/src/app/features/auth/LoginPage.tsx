// src/app/features/auth/LoginPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

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

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Login failed");
      }

      const data = await res.json();

      // store token + user for later
      if (data.token) localStorage.setItem("authToken", data.token);
      if (data.user)
        localStorage.setItem("authUser", JSON.stringify(data.user));

      // If backend says password must be changed, force that first
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
    <div className="flex items-center justify-center w-full min-h-screen bg-muted">
      <div className="w-full max-w-md p-6 space-y-5 border rounded-lg shadow-lg bg-card border-border">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Multi Vendor Admin Login
          </h1>
          <p className="text-xs text-muted-foreground">
            Sign in to manage vendors, products and commissions.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
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
              placeholder="Your password"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 mt-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="text-center text-[11px] text-muted-foreground">
          First time setting up the system?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Create admin account
          </Link>
        </div>
      </div>
    </div>
  );
}
