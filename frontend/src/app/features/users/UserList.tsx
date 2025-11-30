import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, selectUsers, type User } from "./userSlice";
import { Trash } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDate } from "../../utils/formatDate";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Helper for subscription label
function getSubscriptionLabel(user: any): string {
  if (!user.subscriptionActive) return "Inactive";

  if (user.lastPaymentDate) {
    return `Paid on ${formatDate(user.lastPaymentDate)}`;
  }

  if (user.nextPaymentDue) {
    return `Active (due ${formatDate(user.nextPaymentDue)})`;
  }

  return "Active";
}

export default function UserList() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector(selectUsers);

  // Add user modal state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SUPER_ADMIN" | "VENDOR" | "CUSTOMER">(
    "VENDOR"
  );
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Messaging state
  const [messageVendor, setMessageVendor] = useState<User | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [msgSubject, setMsgSubject] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>([]);
  const [selectAllVendors, setSelectAllVendors] = useState(true);

  // 🔐 Get current logged-in user from localStorage
  const authUserJson =
    typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
  const authUser: User | null = authUserJson ? JSON.parse(authUserJson) : null;
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";

  // Vendor list helper
  const vendorUsers = useMemo(
    () => items.filter((u: User) => u.role === "VENDOR"),
    [items]
  );

  // Fetch users (admin only)
  useEffect(() => {
    if (isSuperAdmin) {
      dispatch(fetchUsers());
    }
  }, [dispatch, isSuperAdmin]);

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setRole("VENDOR");
    setSaveError(null);
  }

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

      // Refresh users + reset form + close modal
      if (isSuperAdmin) {
        dispatch(fetchUsers());
      }
      resetForm();
      setShowAddModal(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSaveError(err.message);
      } else {
        setSaveError("Failed to create user");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteUser(user: any) {
    if (!window.confirm(`Delete user "${user.name || user.email}"?`)) return;

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/users/${user.id}`, {
        method: "DELETE",
        headers,
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || "Failed to delete user");
      }

      // Refresh list
      dispatch(fetchUsers());
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Failed to delete user");
      }
    }
  }

  // -------- Messaging helpers --------

  async function sendMessageToVendors(targetVendorIds: number[]) {
    setSendError(null);
    setSendSuccess(null);

    if (!msgBody.trim()) {
      setSendError("Message text is required.");
      return;
    }

    try {
      setSending(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/admin/messages/vendors`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          vendorIds: targetVendorIds,
          subject: msgSubject,
          message: msgBody,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to send message");
      }

      const data = await res.json();
      setSendSuccess(data.message || "Message sent.");
      setMsgBody("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSendError(err.message);
      } else {
        setSendError("Failed to send message");
      }
    } finally {
      setSending(false);
    }
  }

  function openVendorMessageModal(user: any) {
    setMessageVendor(user);
    setMsgSubject("Message from Trade Point Malawi admin");
    setMsgBody("");
    setSendError(null);
    setSendSuccess(null);
  }

  function openBroadcastModal() {
    setBroadcastOpen(true);
    setSelectAllVendors(true);
    setSelectedVendorIds(vendorUsers.map((v: any) => v.id));
    setMsgSubject("Announcement from Trade Point Malawi admin");
    setMsgBody("");
    setSendError(null);
    setSendSuccess(null);
  }

  function toggleVendorSelection(id: number) {
    setSelectAllVendors(false);
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  useEffect(() => {
    if (selectAllVendors) {
      setSelectedVendorIds(vendorUsers.map((v: any) => v.id));
    }
  }, [selectAllVendors, vendorUsers]);

  // 🧱 TanStack table columns
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "name",
        cell: (info) => (
          <span className="text-xs">{info.getValue() as string}</span>
        ),
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: (info) => (
          <span className="text-xs">{info.getValue() as string}</span>
        ),
      },
      {
        header: "Role",
        accessorKey: "role",
        cell: (info) => (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-[2px] text-[10px] font-medium uppercase">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        header: "Joined",
        accessorKey: "createdAt",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(getValue() as string)}
          </span>
        ),
      },
      {
        header: "Subscription",
        cell: ({ row }) => {
          const user = row.original;
          const label = getSubscriptionLabel(user);
          const active = user.subscriptionActive;

          return (
            <span
              className={`inline-flex items-center px-2 py-[2px] text-[10px] rounded-full ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {label}
            </span>
          );
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const user = row.original;
          const isVendor = user.role === "VENDOR";

          return (
            <div className="flex items-center gap-2">
              {isVendor && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center text-xs border rounded-md h-7 w-7 border-border hover:bg-muted"
                  onClick={() => openVendorMessageModal(user)}
                  title="Message vendor"
                >
                  ✉
                </button>
              )}
              <button
                type="button"
                className="inline-flex items-center justify-center border rounded-md h-7 w-7 border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteUser(user)}
                title="Delete user"
              >
                <Trash className="w-3 h-3" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

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

        <section className="p-4 space-y-2 border rounded-lg shadow-sm bg-card border-border">
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

  //  SUPER_ADMIN VIEW
  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-md text-muted-foreground">
            Super admin can view and create users (vendors, admins, customers).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 text-xs font-semibold text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
            onClick={openBroadcastModal}
          >
            Message vendors
          </button>
          <button
            type="button"
            className="px-3 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            + Add user
          </button>
        </div>
      </header>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-lg p-4 space-y-3 border rounded-lg shadow-lg bg-card border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Add User</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Use this to add vendors or other admin users. Vendors will log in
              and manage their own products.
            </p>

            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={handleAddUser}
            >
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">Name</label>
                <input
                  className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Optional full name"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium">Email</label>
                <input
                  className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Role</label>
                <select
                  className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
                  value={role}
                  onChange={(e) =>
                    setRole(
                      e.target.value as "SUPER_ADMIN" | "VENDOR" | "CUSTOMER"
                    )
                  }
                >
                  <option value="VENDOR">Vendor</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="CUSTOMER">Customer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Password</label>
                <input
                  className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="temporary password"
                />
              </div>

              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  className="px-3 py-2 text-xs border rounded-md border-border text-muted-foreground hover:bg-muted"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save user"}
                </button>
              </div>
            </form>

            {saveError && (
              <p className="mt-1 text-xs text-destructive">{saveError}</p>
            )}
          </div>
        </div>
      )}

      {/* User table */}
      {loading && (
        <p className="text-sm text-muted-foreground">Loading users...</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden border rounded-lg border-border bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-4 text-sm text-center text-muted-foreground"
                  >
                    No users found. Once you add users, they will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-muted-foreground">
            <button
              type="button"
              className="px-2 py-1 border rounded-md border-border hover:bg-muted disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <span>
              Page{" "}
              <span className="font-semibold">
                {table.getState().pagination.pageIndex + 1} /{" "}
                {table.getPageCount() || 1}
              </span>
            </span>
            <button
              type="button"
              className="px-2 py-1 border rounded-md border-border hover:bg-muted disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Single-vendor message modal */}
      {messageVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-md p-4 space-y-3 border rounded-lg shadow-lg bg-card border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Message vendor:{" "}
                <span className="font-normal">
                  {messageVendor.name || messageVendor.email}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setMessageVendor(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              This will send an email to{" "}
              <span className="font-semibold">{messageVendor.email}</span>.
            </p>

            {sendError && (
              <p className="text-[11px] text-destructive">{sendError}</p>
            )}
            {sendSuccess && (
              <p className="text-[11px] text-emerald-600">{sendSuccess}</p>
            )}

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-medium">Subject</label>
                <input
                  className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium">Message</label>
                <textarea
                  className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
                  rows={4}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMessageVendor(null)}
                className="px-3 py-1.5 rounded-md bg-muted text-xs text-muted-foreground hover:bg-muted/80"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  sendMessageToVendors(messageVendor ? [messageVendor.id] : [])
                }
                className="px-4 py-1.5 rounded-md bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={sending}
              >
                {sending ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast / multi-vendor message modal */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-lg p-4 space-y-3 border rounded-lg shadow-lg bg-card border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Message multiple vendors
              </h3>
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Choose which vendors to notify, or send to all vendors.
            </p>

            {sendError && (
              <p className="text-[11px] text-destructive">{sendError}</p>
            )}
            {sendSuccess && (
              <p className="text-[11px] text-emerald-600">{sendSuccess}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="selectAllVendors"
                  type="checkbox"
                  checked={selectAllVendors}
                  onChange={(e) => setSelectAllVendors(e.target.checked)}
                />
                <label
                  htmlFor="selectAllVendors"
                  className="text-[11px] text-muted-foreground"
                >
                  Select all vendors ({vendorUsers.length})
                </label>
              </div>

              {!selectAllVendors && (
                <div className="p-2 space-y-1 overflow-y-auto text-xs border rounded-md max-h-40 border-border bg-background">
                  {vendorUsers.map((v: any) => (
                    <label
                      key={v.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendorIds.includes(v.id)}
                        onChange={() => toggleVendorSelection(v.id)}
                      />
                      <span>
                        {v.name || v.email}{" "}
                        <span className="text-[10px] text-muted-foreground">
                          ({v.email})
                        </span>
                      </span>
                    </label>
                  ))}
                  {vendorUsers.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      No vendors available.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-medium">Subject</label>
                <input
                  className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium">Message</label>
                <textarea
                  className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
                  rows={4}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="px-3 py-1.5 rounded-md bg-muted text-xs text-muted-foreground hover:bg-muted/80"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const ids = selectAllVendors
                    ? vendorUsers.map((v: any) => v.id)
                    : selectedVendorIds;
                  sendMessageToVendors(ids);
                }}
                className="px-4 py-1.5 rounded-md bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={sending}
              >
                {sending ? "Sending..." : "Send message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
