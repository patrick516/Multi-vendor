// src/app/features/dashboard/AdminDashboard.tsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  selectProducts,
} from "@/app/features/products/productSlice";
import { fetchOrders, selectOrders } from "@/app/features/orders/orderSlice";
import { fetchUsers, selectUsers } from "@/app/features/users/userSlice";
import { SummaryCard } from "../../components/dashboard/SummaryCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

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
}

interface RevenueChartPoint {
  date: string; // YYYY-MM-DD
  amount: number;
}

interface VendorChartPoint {
  name: string;
  count: number;
}

export default function AdminDashboard() {
  const dispatch = useDispatch<any>();

  const { items: products } = useSelector(selectProducts);
  const { items: orders } = useSelector(selectOrders);
  const { items: users } = useSelector(selectUsers);

  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState<string | null>(null);
  const [totalRevenueLast30, setTotalRevenueLast30] = useState(0);
  const [paymentsCountLast30, setPaymentsCountLast30] = useState(0);
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartPoint[]>(
    []
  );

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchOrders());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Load subscription revenue from /admin/subscriptions/vendors
  useEffect(() => {
    async function loadSubscriptionRevenue() {
      try {
        setSubLoading(true);
        setSubError(null);

        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE_URL}/admin/subscriptions/vendors`, {
          headers,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.message || "Failed to load subscription vendors"
          );
        }

        const vendors = (await res.json()) as VendorSubRow[];

        const now = new Date();
        const days = 30;
        const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        let total = 0;
        let count = 0;
        const byDate: Record<string, number> = {};

        vendors.forEach((v) => {
          if (!v.lastPaymentDate) return;
          const paidAt = new Date(v.lastPaymentDate);
          if (paidAt < since) return;

          const amount = v.subscriptionAmount || 0;
          total += amount;
          count += 1;

          const dayKey = paidAt.toISOString().slice(0, 10); // YYYY-MM-DD
          byDate[dayKey] = (byDate[dayKey] || 0) + amount;
        });

        setTotalRevenueLast30(total);
        setPaymentsCountLast30(count);

        const chartPoints: RevenueChartPoint[] = Object.entries(byDate)
          .map(([date, amount]) => ({ date, amount }))
          .sort((a, b) => (a.date < b.date ? -1 : 1));

        setRevenueChartData(chartPoints);
      } catch (err: any) {
        setSubError(err.message || "Failed to load subscription revenue");
      } finally {
        setSubLoading(false);
      }
    }

    loadSubscriptionRevenue();
  }, []);

  // Derived metrics
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalUsers = users.length;
  const totalVendors = users.filter((u) => u.role === "VENDOR").length;

  const activeVendors = users.filter(
    (u) => u.role === "VENDOR" && u.subscriptionActive !== false
  ).length;
  const blockedVendors = totalVendors - activeVendors;

  const vendorChartData: VendorChartPoint[] = useMemo(
    () => [
      { name: "Active vendors", count: activeVendors },
      { name: "Blocked vendors", count: blockedVendors },
    ],
    [activeVendors, blockedVendors]
  );

  return (
    <div className="h-full space-y-6 w-min-h">
      {/* Header strip */}
      <div className="w-full px-6 py-4 text-white rounded-lg shadow-sm bg-brand-blue">
        <h1 className="text-lg font-semibold md:text-xl">Admin Dashboard</h1>
        <p className="mt-1 text-xs text-white/80">
          Overview of products, orders, vendors and subscription revenue.
        </p>
      </div>

      {/* Summary cards row */}
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label="Total Products"
          value={totalProducts}
          accent="primary"
        />
        <SummaryCard
          label="Total Orders"
          value={totalOrders}
          accent="secondary"
        />
        <SummaryCard
          label="Active Vendors"
          value={activeVendors}
          accent="primary"
        />
        <SummaryCard
          label="Blocked Vendors"
          value={blockedVendors}
          accent="secondary"
        />
      </div>

      {/* Main panels row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subscription revenue panel */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                Subscription Revenue (Last 30 Days)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Total vendor subscription payments recorded in the last month.
              </p>
            </div>
            <div className="flex gap-2 text-[11px]">
              <button className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Last 30 days
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[180px] rounded-md bg-muted p-2 text-xs text-muted-foreground">
            {subLoading && (
              <div className="flex items-center justify-center h-full">
                Loading chart…
              </div>
            )}
            {!subLoading && revenueChartData.length === 0 && (
              <div className="flex items-center justify-center h-full">
                No subscription payments in the last 30 days.
              </div>
            )}
            {!subLoading && revenueChartData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickMargin={5}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip
                    formatter={(value: any) =>
                      `MK ${(value as number).toLocaleString()}`
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10 }}
                    verticalAlign="top"
                    height={24}
                  />
                  <Bar dataKey="amount" name="Revenue" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap justify-between items-center text-[11px] text-muted-foreground mt-2 gap-2">
            <span>
              Total revenue:{" "}
              <span className="font-semibold text-emerald-700">
                MK {totalRevenueLast30.toLocaleString()}
              </span>
            </span>
            <span>
              Payments recorded:{" "}
              <span className="font-semibold text-slate-800">
                {paymentsCountLast30}
              </span>
            </span>
            {subError && (
              <span className="text-[10px] text-destructive">{subError}</span>
            )}
          </div>
        </div>

        {/* Vendor & Product Overview panel */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                Vendor & Product Overview
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Quick view of vendor status and product usage.
              </p>
            </div>
          </div>

          <div className="flex-1 min-h-[180px] rounded-md bg-muted p-2 text-xs text-muted-foreground">
            {vendorChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                No vendor data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    tickMargin={5}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground">
              Active vendors: {activeVendors}
            </span>
            <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              Blocked vendors: {blockedVendors}
            </span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
              Total users: {totalUsers}
            </span>
            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
              Products: {totalProducts}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
