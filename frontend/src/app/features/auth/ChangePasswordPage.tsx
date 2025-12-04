// src/app/features/auth/ChangePasswordPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://backend-morning-glitter-4312.fly.dev/api";
export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword) {
      setError("Current and new passwords are required.");
      return;
    }

    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to change password");
      }

      const data = await res.json();

      // update authUser in localStorage so mustChangePassword becomes false
      if (data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-muted">
      <div className="w-full max-w-md p-6 space-y-5 border rounded-lg shadow-lg bg-card border-border">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold text-foreground">
            Change your password
          </h1>
          <p className="text-xs text-muted-foreground">
            For security, you must update your temporary password before using
            the system.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="text-xs font-medium">Current password</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">New password</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Confirm new password</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-emerald-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 mt-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
