// src/app/features/users/UserList.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, selectUsers } from "./userSlice";
import UserCard from "./UserCard";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function UserList() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector(selectUsers);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "VENDOR" | "CUSTOMER">(
    "VENDOR"
  );
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 🔐 Get current logged-in user from localStorage
  const authUserJson =
    typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
  const authUser = authUserJson ? JSON.parse(authUserJson) : null;
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";

  // Only SUPER_ADMIN should fetch all users
  useEffect(() => {
    if (isSuperAdmin) {
      dispatch(fetchUsers());
    }
  }, [dispatch, isSuperAdmin]);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);

    if (!email || !password) {
      setSaveError("Email and password are required.");
      return;
    }

    try {
      setSaving(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create user");
      }

      await res.json();

      // Refresh users + reset form
      if (isSuperAdmin) {
        dispatch(fetchUsers());
      }
      setName("");
      setEmail("");
      setPassword("");
      setRole("VENDOR");
    } catch (err: any) {
      setSaveError(err.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  // 🔒 NON-ADMIN VIEW (Vendor / Customer)
  if (!isSuperAdmin) {
    return (
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">My Account</h2>
            <p className="text-xs text-muted-foreground">
              Your profile and role in the system.
            </p>
          </div>
        </header>

        <section className="rounded-lg bg-card border border-border shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">
                {authUser?.name || authUser?.email || "Current user"}
              </h3>
              <p className="text-xs text-muted-foreground">{authUser?.email}</p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-accent text-accent-foreground uppercase">
              {authUser?.role || "UNKNOWN"}
            </span>
          </div>

          <p className="text-[11px] text-muted-foreground mt-2">
            Only system administrators can view and create other users. As a{" "}
            <span className="font-semibold">{authUser?.role}</span>, you can
            manage your own products and activity, but you cannot add or edit
            other user accounts.
          </p>
        </section>
      </div>
    );
  }

  // 👑 SUPER_ADMIN VIEW
  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-xs text-muted-foreground">
            Super admin can view and create users (vendors, admins, customers).
          </p>
        </div>
      </header>

      {/* Add user form (SUPER_ADMIN only) */}
      <section className="rounded-lg bg-card border border-border shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add User</h3>
        <p className="text-[11px] text-muted-foreground">
          Use this to add vendors or other admin users. Vendors will log in and
          manage their own products.
        </p>

        <form className="grid gap-3 md:grid-cols-4" onSubmit={handleAddUser}>
          <div className="space-y-1">
            <label className="text-xs font-medium">Name</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional full name"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium">Email</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Role</label>
            <select
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "SUPER_ADMIN" | "VENDOR" | "CUSTOMER")
              }
            >
              <option value="VENDOR">Vendor</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="text-xs font-medium">Password</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="temporary password"
            />
          </div>

          <div className="flex items-center justify-end md:col-span-1">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save user"}
            </button>
          </div>
        </form>

        {saveError && (
          <p className="text-xs text-destructive mt-1">{saveError}</p>
        )}
      </section>

      {/* User cards */}
      {loading && (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No users found. Once you add users, they will appear here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
