// src/app/features/commissions/CommissionPage.tsx
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

interface VendorRow {
  vendorId: number;
  vendorName: string;
  vendorEmail: string | null;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  salesCount: number;
}

interface CommissionSummaryResponse {
  vendors: VendorRow[];
  totals: {
    totalCommission: number;
    pendingCommission: number;
    paidCommission: number;
    salesCount: number;
  };
}

export default function CommissionPage() {
  const [data, setData] = useState<CommissionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingVendorId, setSavingVendorId] = useState<number | null>(null);

  async function loadSummary() {
    try {
      setLoading(true);
      setError(null);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/admin/commissions/summary`, {
        headers,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load commission summary");
      }

      const json = (await res.json()) as CommissionSummaryResponse;
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load commission summary");
    } finally {
      setLoading(false);
      setSavingVendorId(null);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function handleMarkVendorPaid(vendorId: number) {
    const vendor = data?.vendors.find((v) => v.vendorId === vendorId);
    if (!vendor || vendor.pendingCommission <= 0) return;

    const sure = window.confirm(
      `Mark all pending commissions for "${vendor.vendorName}" as PAID?`,
    );
    if (!sure) return;

    try {
      setSavingVendorId(vendorId);

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

      const res = await fetch(
        `${API_BASE_URL}/admin/commissions/vendor/${vendorId}/mark-paid-all`,
        {
          method: "POST",
          headers,
        },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to mark commissions as paid");
      }

      await res.json();
      // reload summary to reflect pending/paid changes
      await loadSummary();
    } catch (err: any) {
      alert(err.message || "Failed to mark commissions as paid");
      setSavingVendorId(null);
    }
  }

  const vendors = data?.vendors ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-4">
      <header>
        {/* <h2 className="text-lg font-semibold">Commissions</h2> */}
        <p className="text-md text-muted-foreground">
          Track commission owed by vendors and mark payments as received.
        </p>
      </header>

      <section className="p-4 space-y-3 border rounded-lg shadow-sm bg-card border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Per Vendor Summary</h3>
          {totals && (
            <div className="text-[11px] text-muted-foreground text-right space-y-0.5">
              <div>
                Total Commission:{" "}
                <span className="font-semibold">
                  MK {totals.totalCommission.toLocaleString()}
                </span>
              </div>
              <div>
                Pending:{" "}
                <span className="font-semibold text-amber-600">
                  MK {totals.pendingCommission.toLocaleString()}
                </span>
              </div>
              <div>
                Paid:{" "}
                <span className="font-semibold text-emerald-600">
                  MK {totals.paidCommission.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <p className="text-sm text-muted-foreground">
            Loading commission summary...
          </p>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && (
          <>
            {vendors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No commission records yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Vendor</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Total Commission</th>
                      <th className="px-3 py-2">Pending</th>
                      <th className="px-3 py-2">Paid</th>
                      <th className="px-3 py-2">Sales Count</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((row) => (
                      <tr key={row.vendorId} className="border-t border-border">
                        <td className="px-3 py-2 text-sm">{row.vendorName}</td>
                        <td className="px-3 py-2 text-sm">
                          {row.vendorEmail ?? "N/A"}
                        </td>
                        <td className="px-3 py-2 text-sm font-semibold">
                          MK {row.totalCommission.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-amber-700">
                          MK {row.pendingCommission.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-emerald-700">
                          MK {row.paidCommission.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm">{row.salesCount}</td>
                        <td className="px-3 py-2 text-sm text-right">
                          <button
                            className="px-3 py-1 rounded-md text-[11px] bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700"
                            disabled={
                              row.pendingCommission <= 0 ||
                              savingVendorId === row.vendorId
                            }
                            onClick={() => handleMarkVendorPaid(row.vendorId)}
                          >
                            {row.pendingCommission <= 0
                              ? "No pending"
                              : savingVendorId === row.vendorId
                                ? "Saving..."
                                : "Mark pending as paid"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
