// frontend/src/app/features/subscriptions/SubscriptionPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  ShieldX,
  Clock,
  DollarSign,
  X as XIcon,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

interface VendorSubRow {
  id: number;
  name: string;
  email: string;
  subscriptionActive: boolean;
  lastPaymentDate: string | null;
  nextPaymentDue: string | null;
  subscriptionAmount: number;
  createdAt?: string;
}

interface PaymentRow {
  id: number;
  amount: number;
  periodStart: string;
  periodEnd: string;
  paidAt: string;
}

export default function SubscriptionPage() {
  const [vendors, setVendors] = useState<VendorSubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingVendorId, setSavingVendorId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState("1000");
  const [savingAmount, setSavingAmount] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "BLOCKED"
  >("ALL");

  // History modal
  const [historyVendor, setHistoryVendor] = useState<VendorSubRow | null>(null);
  const [historyPayments, setHistoryPayments] = useState<PaymentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Mark paid modal
  const [payVendor, setPayVendor] = useState<VendorSubRow | null>(null);
  const [payDate, setPayDate] = useState<string>(""); // YYYY-MM-DD
  const [nextDueDate, setNextDueDate] = useState<string>(""); // YYYY-MM-DD
  const [paySaving, setPaySaving] = useState(false);

  async function loadVendors() {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/admin/subscriptions/vendors`, {
        headers,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load vendors");
      }

      const data = (await res.json()) as VendorSubRow[];
      setVendors(data);

      if (data.length > 0) {
        setAmountInput(String(data[0].subscriptionAmount || 1000));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load vendors");
    } finally {
      setLoading(false);
      setSavingVendorId(null);
    }
  }

  useEffect(() => {
    loadVendors();
  }, []);

  // ---------- Derived stats & filtered vendors ----------

  const activeCount = useMemo(
    () => vendors.filter((v) => v.subscriptionActive).length,
    [vendors]
  );
  const blockedCount = useMemo(
    () => vendors.filter((v) => !v.subscriptionActive).length,
    [vendors]
  );
  const totalMonthlyRevenue = useMemo(
    () =>
      vendors.reduce(
        (sum, v) => sum + (v.subscriptionActive ? v.subscriptionAmount : 0),
        0
      ),
    [vendors]
  );

  const filteredVendors = useMemo(
    () =>
      vendors.filter((v) => {
        if (statusFilter === "ACTIVE" && !v.subscriptionActive) return false;
        if (statusFilter === "BLOCKED" && v.subscriptionActive) return false;

        if (!searchTerm.trim()) return true;

        const term = searchTerm.toLowerCase();
        const name = (v.name || "").toLowerCase();
        const email = (v.email || "").toLowerCase();
        return name.includes(term) || email.includes(term);
      }),
    [vendors, statusFilter, searchTerm]
  );

  // -----------------------------
  // Mark Paid modal open helper
  // -----------------------------
  function openMarkPaidModal(vendor: VendorSubRow) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const next = new Date(today.getTime());
    next.setDate(next.getDate() + 30);
    const ny = next.getFullYear();
    const nm = String(next.getMonth() + 1).padStart(2, "0");
    const nd = String(next.getDate()).padStart(2, "0");
    const nextStr = `${ny}-${nm}-${nd}`;

    setPayVendor(vendor);
    setPayDate(todayStr);
    setNextDueDate(nextStr);
    setPaySaving(false);
  }

  // When payDate changes, auto-suggest nextDueDate = payDate + 30 days
  function handlePayDateChange(val: string) {
    setPayDate(val);
    if (!val) return;
    const base = new Date(val);
    if (isNaN(base.getTime())) return;
    const next = new Date(base.getTime());
    next.setDate(next.getDate() + 30);
    const ny = next.getFullYear();
    const nm = String(next.getMonth() + 1).padStart(2, "0");
    const nd = String(next.getDate()).padStart(2, "0");
    setNextDueDate(`${ny}-${nm}-${nd}`);
  }

  async function confirmMarkPaid() {
    if (!payVendor) return;
    if (!payDate || !nextDueDate) {
      alert("Please choose both payment date and next due date.");
      return;
    }

    try {
      setPaySaving(true);

      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/admin/subscriptions/vendor/${payVendor.id}/mark-paid`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            paidAt: payDate,
            nextDue: nextDueDate,
          }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to mark vendor paid");
      }

      await res.json();
      setPayVendor(null);
      await loadVendors();
    } catch (err: any) {
      alert(err.message || "Failed to mark vendor paid");
    } finally {
      setPaySaving(false);
    }
  }

  function closeMarkPaidModal() {
    setPayVendor(null);
  }

  // -----------------------------
  // Block / Unblock
  // -----------------------------
  async function handleBlock(vendorId: number) {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;

    const sure = window.confirm(
      `Block ${
        vendor.name || vendor.email
      }? They will not be able to login, and their products will be hidden.`
    );
    if (!sure) return;

    try {
      setSavingVendorId(vendorId);

      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/admin/subscriptions/vendor/${vendorId}/block`,
        {
          method: "POST",
          headers,
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to block vendor");
      }

      await res.json();
      await loadVendors();
    } catch (err: any) {
      alert(err.message || "Failed to block vendor");
      setSavingVendorId(null);
    }
  }

  async function handleUnblock(vendorId: number) {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;

    const sure = window.confirm(
      `Unblock ${
        vendor.name || vendor.email
      }? They will be able to login and their products will be visible.`
    );
    if (!sure) return;

    try {
      setSavingVendorId(vendorId);

      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/admin/subscriptions/vendor/${vendorId}/unblock`,
        {
          method: "POST",
          headers,
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to unblock vendor");
      }

      await res.json();
      await loadVendors();
    } catch (err: any) {
      alert(err.message || "Failed to unblock vendor");
      setSavingVendorId(null);
    }
  }

  // -----------------------------
  // Update global amount
  // -----------------------------
  async function handleUpdateAmount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const amount = Number(amountInput);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setSavingAmount(true);

      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/admin/subscriptions/settings/update`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ amount }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update subscription amount");
      }

      await res.json();
      await loadVendors();
    } catch (err: any) {
      setError(err.message || "Failed to update amount");
    } finally {
      setSavingAmount(false);
    }
  }

  // -----------------------------
  // History modal
  // -----------------------------
  async function handleViewHistory(vendor: VendorSubRow) {
    try {
      setHistoryVendor(vendor);
      setHistoryLoading(true);
      setHistoryError(null);
      setHistoryPayments([]);

      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/admin/subscriptions/vendor/${vendor.id}/payments`,
        { headers }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.message || "Failed to load vendor payment history"
        );
      }

      const data = await res.json();
      const payments = (data.payments || []) as PaymentRow[];
      setHistoryPayments(payments);
    } catch (err: any) {
      setHistoryError(err.message || "Failed to load vendor payment history");
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setHistoryVendor(null);
    setHistoryPayments([]);
    setHistoryError(null);
  }

  // --------------------------------
  // Render
  // --------------------------------
  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vendor Subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            Manage monthly subscription payments, account status, and history
            for all vendors.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {vendors.length} vendors • {activeCount} active • {blockedCount}{" "}
            blocked
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-center rounded-full w-9 h-9 bg-emerald-100 text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active vendors</p>
            <p className="text-lg font-semibold">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-center text-red-700 bg-red-100 rounded-full w-9 h-9">
            <ShieldX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Blocked vendors</p>
            <p className="text-lg font-semibold">{blockedCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-center text-blue-700 bg-blue-100 rounded-full w-9 h-9">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Default monthly fee (MK)
            </p>
            <p className="text-lg font-semibold">
              {Number(amountInput || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-center rounded-full w-9 h-9 bg-amber-100 text-amber-700">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Potential monthly revenue
            </p>
            <p className="text-lg font-semibold">
              MK {totalMonthlyRevenue.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* Global amount settings */}
      <section className="p-4 space-y-3 border rounded-lg shadow-sm bg-card border-border">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Subscription Fee Settings</h3>
            <p className="text-xs text-muted-foreground">
              This amount will be used as the monthly fee for all vendors. When
              you change it, vendors can be notified by email.
            </p>
          </div>
        </div>

        <form
          className="flex flex-wrap items-center gap-2 text-sm"
          onSubmit={handleUpdateAmount}
        >
          <label className="text-xs font-medium">Monthly fee (MK)</label>
          <input
            className="w-32 px-2 py-1 text-sm border rounded-md border-border bg-background"
            type="number"
            min={0}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={savingAmount}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {savingAmount ? "Saving..." : "Save amount"}
          </button>
          {error && (
            <p className="w-full mt-1 text-xs text-destructive">{error}</p>
          )}
        </form>
      </section>

      {/* Vendor list */}
      <section className="p-4 space-y-3 border rounded-lg shadow-sm bg-card border-border">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold">Vendor Subscriptions</h3>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute w-4 h-4 -translate-y-1/2 text-muted-foreground left-2 top-1/2" />
              <input
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md border-border bg-background"
                placeholder="Search vendor name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <select
              className="w-full px-3 py-1.5 text-sm border rounded-md border-border bg-background sm:w-40"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "BLOCKED")
              }
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active only</option>
              <option value="BLOCKED">Blocked only</option>
            </select>
          </div>
        </div>

        {loading && vendors.length === 0 && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-3 border rounded-md border-border bg-background animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="w-32 h-3 rounded bg-muted" />
                    <div className="w-40 h-3 rounded bg-muted" />
                  </div>
                </div>
                <div className="w-24 h-3 rounded bg-muted" />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredVendors.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {vendors.length === 0
              ? "No vendors found. Once admin adds vendors, they will appear here."
              : "No vendors match the current search or filter."}
          </p>
        )}

        {!loading && filteredVendors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last paid</th>
                  <th className="px-3 py-2">Next due</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((v, idx) => (
                  <tr
                    key={v.id}
                    className={
                      idx % 2 === 0
                        ? "border-t border-border bg-background"
                        : "border-t border-border bg-muted/20"
                    }
                  >
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{v.name || v.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {v.email}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={[
                          "inline-flex items-center px-2 py-1 rounded-full text-[11px] uppercase",
                          v.subscriptionActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700",
                        ].join(" ")}
                      >
                        {v.subscriptionActive ? "ACTIVE" : "BLOCKED"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {v.lastPaymentDate
                        ? new Date(v.lastPaymentDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {v.nextPaymentDue
                        ? new Date(v.nextPaymentDue).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      MK {v.subscriptionAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] hover:bg-emerald-700 disabled:opacity-40"
                          disabled={savingVendorId === v.id}
                          onClick={() => openMarkPaidModal(v)}
                        >
                          Mark paid
                        </button>
                        {v.subscriptionActive ? (
                          <button
                            className="px-2 py-1 rounded-md bg-red-600 text-white text-[11px] hover:bg-red-700 disabled:opacity-40"
                            disabled={savingVendorId === v.id}
                            onClick={() => handleBlock(v.id)}
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 rounded-md bg-blue-600 text-white text-[11px] hover:bg-blue-700 disabled:opacity-40"
                            disabled={savingVendorId === v.id}
                            onClick={() => handleUnblock(v.id)}
                          >
                            Unblock
                          </button>
                        )}
                        <button
                          className="px-2 py-1 rounded-md bg-slate-100 text-[11px] hover:bg-slate-200"
                          onClick={() => handleViewHistory(v)}
                        >
                          History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* --- Mark Paid Modal --- */}
      {payVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-md p-4 space-y-3 border shadow-lg rounded-2xl bg-card border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Mark subscription as paid
              </h3>
              <button
                onClick={closeMarkPaidModal}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-2 text-xs rounded-md bg-muted/40">
              <p className="font-medium">{payVendor.name || payVendor.email}</p>
              <p className="text-xs text-muted-foreground">
                Current fee: MK {payVendor.subscriptionAmount.toLocaleString()}
              </p>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Choose the actual payment date and when the next subscription will
              be due. By default, the next due date is 30 days after the payment
              date.
            </p>

            <div className="space-y-2 text-[11px]">
              <div className="space-y-1">
                <label className="font-medium">Payment date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => handlePayDateChange(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium">Next due date</label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeMarkPaidModal}
                className="px-3 py-1.5 rounded-md bg-slate-100 text-[11px] text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkPaid}
                disabled={paySaving}
                className="px-4 py-1.5 rounded-md bg-emerald-600 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {paySaving ? "Saving..." : "Confirm payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- History Modal --- */}
      {historyVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-xl p-4 space-y-3 border shadow-lg rounded-2xl bg-card border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Subscription history –{" "}
                {historyVendor.name || historyVendor.email}
              </h3>
              <button
                onClick={closeHistory}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground space-y-1">
              <p>
                Registered:{" "}
                {historyVendor.createdAt
                  ? new Date(historyVendor.createdAt).toLocaleDateString()
                  : "—"}
              </p>
              <p>
                Current fee: MK{" "}
                {historyVendor.subscriptionAmount.toLocaleString()}
              </p>
              <p>
                Status:{" "}
                <span
                  className={
                    historyVendor.subscriptionActive
                      ? "text-emerald-700"
                      : "text-red-700"
                  }
                >
                  {historyVendor.subscriptionActive
                    ? "Active"
                    : "Blocked / inactive"}
                </span>
              </p>
            </div>

            {historyLoading && (
              <p className="text-[11px] text-muted-foreground">
                Loading payment history…
              </p>
            )}
            {historyError && (
              <p className="text-[11px] text-destructive">{historyError}</p>
            )}

            {!historyLoading &&
              !historyError &&
              historyPayments.length === 0 && (
                <p className="text-[11px] text-muted-foreground">
                  No subscription payments recorded yet for this vendor.
                </p>
              )}

            {!historyLoading && !historyError && historyPayments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Paid at</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPayments.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          {new Date(p.paidAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          MK {p.amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(p.periodStart).toLocaleDateString()} –{" "}
                          {new Date(p.periodEnd).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={closeHistory}
                className="rounded-md bg-slate-100 px-3 py-1.5 text-[11px] hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
