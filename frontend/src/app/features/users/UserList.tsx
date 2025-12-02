import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, selectUsers, type User } from "./userSlice";
import {
  Trash,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from "lucide-react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDate } from "../../utils/formatDate";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

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

function getInitials(user: any): string {
  const name = user.name || "";
  if (name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  const email = user.email || "";
  if (email) {
    return email[0].toUpperCase();
  }

  return "?";
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

  // Filters & sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | "SUPER_ADMIN" | "VENDOR" | "CUSTOMER"
  >("ALL");
  const [subscriptionFilter, setSubscriptionFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);

  // 🔐 Get current logged-in user from localStorage
  const authUserJson =
    typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
  const authUser: User | null = authUserJson ? JSON.parse(authUserJson) : null;
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";

  // Vendor list helper (for messaging)
  const vendorUsers = useMemo(
    () => items.filter((u: User) => u.role === "VENDOR"),
    [items]
  );

  // Filtered data for table
  const filteredData = useMemo(
    () =>
      items.filter((user: any) => {
        if (roleFilter !== "ALL" && user.role !== roleFilter) return false;

        if (subscriptionFilter === "ACTIVE" && !user.subscriptionActive)
          return false;
        if (subscriptionFilter === "INACTIVE" && user.subscriptionActive)
          return false;

        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase();
        const name = (user.name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();

        return name.includes(term) || email.includes(term);
      }),
    [items, roleFilter, subscriptionFilter, searchTerm]
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
        id: "avatar",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          const initials = getInitials(user);
          return (
            <div className="flex items-center justify-center text-sm font-semibold rounded-full w-9 h-9 bg-emerald-100 text-emerald-700">
              {initials}
            </div>
          );
        },
        size: 40,
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Name</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <div className="flex flex-col">
            <span className="text-base font-medium">
              {info.getValue() as string}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Email</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Role</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase rounded-full bg-slate-100">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span>Joined</span>
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
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
              className={`inline-flex items-center px-3 py-1 text-xs rounded-full ${
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
                  className="inline-flex items-center justify-center w-8 h-8 text-sm border rounded-md border-border hover:bg-muted"
                  onClick={() => openVendorMessageModal(user)}
                  title="Message vendor"
                >
                  ✉
                </button>
              )}
              <button
                type="button"
                className="inline-flex items-center justify-center w-8 h-8 border rounded-md border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => handleDeleteUser(user)}
                title="Delete user"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
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
            <h2 className="text-xl font-semibold">My Account</h2>
            <p className="text-sm text-muted-foreground">
              Your profile and role in the system.
            </p>
          </div>
        </header>

        <section className="p-4 space-y-2 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">
                {authUser?.name || authUser?.email || "Current user"}
              </h3>
              <p className="text-sm text-muted-foreground">{authUser?.email}</p>
            </div>
            <span className="px-2 py-1 text-xs uppercase rounded-full bg-accent text-accent-foreground">
              {authUser?.role || "UNKNOWN"}
            </span>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
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
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">
            Super admin can view and create users (vendors, admins, customers).
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Showing {filteredData.length} of {items.length} users •{" "}
            {vendorUsers.length} vendors
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute w-4 h-4 -translate-y-1/2 text-muted-foreground left-2 top-1/2" />
            <input
              className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md border-border bg-background"
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role filter */}
          <select
            className="w-full px-3 py-1.5 text-sm border rounded-md border-border bg-background sm:w-40"
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value as "ALL" | "SUPER_ADMIN" | "VENDOR" | "CUSTOMER"
              )
            }
          >
            <option value="ALL">All roles</option>
            <option value="VENDOR">Vendors</option>
            <option value="CUSTOMER">Customers</option>
            <option value="SUPER_ADMIN">Super admins</option>
          </select>

          {/* Subscription filter */}
          <select
            className="w-full px-3 py-1.5 text-sm border rounded-md border-border bg-background sm:w-40"
            value={subscriptionFilter}
            onChange={(e) =>
              setSubscriptionFilter(
                e.target.value as "ALL" | "ACTIVE" | "INACTIVE"
              )
            }
          >
            <option value="ALL">All subscriptions</option>
            <option value="ACTIVE">Active only</option>
            <option value="INACTIVE">Inactive only</option>
          </select>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 text-sm font-semibold text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
              onClick={openBroadcastModal}
            >
              Message vendors
            </button>
            <button
              type="button"
              className="px-3 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
            >
              + Add user
            </button>
          </div>
        </div>
      </header>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-lg p-4 space-y-3 border rounded-lg shadow-lg bg-card border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add User</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-base text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Use this to add vendors or other admin users. Vendors will log in
              and manage their own products.
            </p>

            <form
              className="grid gap-3 md:grid-cols-2"
              onSubmit={handleAddUser}
            >
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  className="w-full px-3 py-2 text-base border rounded-md border-border bg-background"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Optional full name"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  className="w-full px-3 py-2 text-base border rounded-md border-border bg-background"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vendor@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Role</label>
                <select
                  className="w-full px-3 py-2 text-base border rounded-md border-border bg-background"
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
                <label className="text-sm font-medium">Password</label>
                <input
                  className="w-full px-3 py-2 text-base border rounded-md border-border bg-background"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="temporary password"
                />
              </div>

              <div className="flex items-center justify-end gap-2 md:col-span-2">
                <button
                  type="button"
                  className="px-3 py-2 text-sm border rounded-md border-border text-muted-foreground hover:bg-muted"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save user"}
                </button>
              </div>
            </form>

            {saveError && (
              <p className="mt-1 text-sm text-destructive">{saveError}</p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-base text-destructive">{error}</p>}

      {/* User table / skeleton */}
      {loading && filteredData.length === 0 ? (
        <div className="overflow-hidden border rounded-lg border-border bg-card">
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-3 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full w-9 h-9 bg-muted" />
                  <div className="space-y-2">
                    <div className="w-32 h-3 rounded bg-muted" />
                    <div className="w-40 h-3 rounded bg-muted" />
                  </div>
                </div>
                <div className="w-24 h-3 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden border rounded-lg border-border bg-card">
          <table className="w-full text-base text-left">
            <thead className="text-xs uppercase bg-muted text-muted-foreground">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2 font-semibold align-middle"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
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
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={
                      rowIndex % 2 === 0
                        ? "border-t border-border bg-background"
                        : "border-t border-border bg-muted/30"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-middle">
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
                    className="px-3 py-4 text-base text-center text-muted-foreground"
                  >
                    No users found. Once you add users, they will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-2 px-3 py-2 text-xs text-muted-foreground sm:flex-row sm:text-sm">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1 border rounded-md border-border hover:bg-muted disabled:opacity-40"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 border rounded-md border-border hover:bg-muted disabled:opacity-40"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 border rounded-md border-border hover:bg-muted disabled:opacity-40"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 border rounded-md border-border hover:bg-muted disabled:opacity-40"
                onClick={() =>
                  table.setPageIndex(table.getPageCount() - 1 || 0)
                }
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span>
                Page{" "}
                <span className="font-semibold">
                  {table.getState().pagination.pageIndex + 1}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {table.getPageCount() || 1}
                </span>
              </span>
              <span className="hidden sm:inline">
                • {filteredData.length} user
                {filteredData.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Rows per page</span>
              <select
                className="px-2 py-1 text-xs border rounded-md border-border bg-background sm:text-sm"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Single-vendor message modal */}
      {messageVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-md p-4 space-y-3 border rounded-lg shadow-lg bg-card border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Message vendor:{" "}
                <span className="font-normal">
                  {messageVendor.name || messageVendor.email}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setMessageVendor(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              This will send an email to{" "}
              <span className="font-semibold">{messageVendor.email}</span>.
            </p>

            {sendError && (
              <p className="text-sm text-destructive">{sendError}</p>
            )}
            {sendSuccess && (
              <p className="text-sm text-emerald-600">{sendSuccess}</p>
            )}

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Subject</label>
                <input
                  className="w-full px-3 py-2 text-base border rounded-md border-border bg-background"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="w-full px-3 py-2 text-base border rounded-md border-border bg-background"
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
                className="px-3 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  sendMessageToVendors(messageVendor ? [messageVendor.id] : [])
                }
                className="px-4 py-1.5 text-sm font-semibold text-white rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
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
              <h3 className="text-base font-semibold">
                Message multiple vendors
              </h3>
              <button
                type="button"
                onClick={() => setBroadcastOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Choose which vendors to notify, or send to all vendors.
            </p>

            {sendError && (
              <p className="text-sm text-destructive">{sendError}</p>
            )}
            {sendSuccess && (
              <p className="text-sm text-emerald-600">{sendSuccess}</p>
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
                  className="text-sm text-muted-foreground"
                >
                  Select all vendors ({vendorUsers.length})
                </label>
              </div>

              {!selectAllVendors && (
                <div className="p-2 space-y-1 overflow-y-auto text-sm border rounded-md max-h-40 border-border bg-background">
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
                        <span className="text-sm text-muted-foreground">
                          ({v.email})
                        </span>
                      </span>
                    </label>
                  ))}
                  {vendorUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No vendors available.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-base font-medium">Subject</label>
                <input
                  className="w-full px-3 py-2 text-base border rounded-md border-border bg-background"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-base font-medium">Message</label>
                <textarea
                  className="w-full px-3 py-2 text-base border rounded-md border-border bg-background"
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
                className="px-3 py-1.5 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
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
                className="px-4 py-1.5 text-sm font-semibold text-white rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
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
