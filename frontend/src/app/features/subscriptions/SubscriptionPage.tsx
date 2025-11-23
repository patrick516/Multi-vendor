import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

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

  const [historyVendor, setHistoryVendor] = useState<VendorSubRow | null>(null);
  const [historyPayments, setHistoryPayments] = useState<PaymentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

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

  async function handleMarkPaid(vendorId: number) {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;

    const sure = window.confirm(
      `Mark ${vendor.name || vendor.email} as PAID for this period?`
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
        `${API_BASE_URL}/admin/subscriptions/vendor/${vendorId}/mark-paid`,
        {
          method: "POST",
          headers,
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to mark vendor paid");
      }

      await res.json();
      await loadVendors();
    } catch (err: any) {
      alert(err.message || "Failed to mark vendor paid");
      setSavingVendorId(null);
    }
  }

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
      setError(err.message || "Failed to update subscription amount");
    } finally {
      setSavingAmount(false);
    }
  }

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

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vendor Subscriptions</h2>
          <p className="text-xs text-muted-foreground">
            Manage monthly subscription payments and account status for vendors.
          </p>
        </div>
      </header>

      {/* Global amount settings */}
      <section className="p-4 space-y-3 border rounded-lg shadow-sm bg-card border-border">
        <h3 className="text-sm font-semibold">Subscription Fee</h3>
        <p className="text-[11px] text-muted-foreground">
          This amount will be used as the monthly fee for all vendors. When you
          change it, all vendors will be notified by email.
        </p>

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
        </form>

        {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
      </section>

      {/* Vendor list */}
      <section className="p-4 space-y-3 border rounded-lg shadow-sm bg-card border-border">
        <h3 className="text-sm font-semibold">Vendors</h3>

        {loading && (
          <p className="text-sm text-muted-foreground">
            Loading vendor subscriptions...
          </p>
        )}

        {!loading && vendors.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No vendors found. Once admin adds vendors, they will appear here.
          </p>
        )}

        {!loading && vendors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last Paid</th>
                  <th className="px-3 py-2">Next Due</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v.id} className="border-t border-border">
                    <td className="px-3 py-2 text-xs">{v.name || v.email}</td>
                    <td className="px-3 py-2 text-xs">{v.email}</td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={[
                          "px-2 py-1 rounded-full text-[10px] uppercase",
                          v.subscriptionActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700",
                        ].join(" ")}
                      >
                        {v.subscriptionActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {v.lastPaymentDate
                        ? new Date(v.lastPaymentDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {v.nextPaymentDue
                        ? new Date(v.nextPaymentDue).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      MK {v.subscriptionAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 space-x-1 text-xs text-right">
                      <button
                        className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] hover:bg-emerald-700 disabled:opacity-40"
                        disabled={savingVendorId === v.id}
                        onClick={() => handleMarkPaid(v.id)}
                      >
                        {savingVendorId === v.id ? "Saving..." : "Mark paid"}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* History Modal */}
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
                ✕
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground space-y-1">
              <p>
                Registered:{" "}
                {historyVendor.createdAt
                  ? new Date(historyVendor.createdAt).toLocaleDateString()
                  : "—"}
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
                      <th className="px-3 py-2">Paid At</th>
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
