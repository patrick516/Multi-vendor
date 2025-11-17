// src/app/features/commissions/CommissionPage.tsx
import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface VendorRow {
  vendorId: number;
  vendorName: string;
  vendorEmail: string | null;
  totalCommission: number;
  salesCount: number;
}

interface CommissionSummaryResponse {
  vendors: VendorRow[];
  totals: {
    totalCommission: number;
    salesCount: number;
  };
}

export default function CommissionPage() {
  const [data, setData] = useState<CommissionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
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
      }
    }

    load();
  }, []);

  const vendors = data?.vendors ?? [];
  const totals = data?.totals;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Commissions</h2>
        <p className="text-xs text-muted-foreground">
          Track commission owed by vendors and mark payments as received.
        </p>
      </header>

      <section className="rounded-lg bg-card border border-border shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Per Vendor Summary</h3>
          {totals && (
            <div className="text-[11px] text-muted-foreground text-right">
              <div>
                Total Commission:{" "}
                <span className="font-semibold">
                  MK {totals.totalCommission.toLocaleString()}
                </span>
              </div>
              <div>Sales counted: {totals.salesCount}</div>
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
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Vendor</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Total Commission</th>
                      <th className="px-3 py-2">Sales Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((row) => (
                      <tr key={row.vendorId} className="border-t border-border">
                        <td className="px-3 py-2 text-xs">{row.vendorName}</td>
                        <td className="px-3 py-2 text-xs">
                          {row.vendorEmail ?? "N/A"}
                        </td>
                        <td className="px-3 py-2 text-xs font-semibold">
                          MK {row.totalCommission.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-xs">{row.salesCount}</td>
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
