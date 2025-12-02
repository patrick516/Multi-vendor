import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  selectProducts,
  type Product,
} from "@/app/features/products/productSlice";
import {
  fetchOrders,
  selectOrders,
  type Order,
} from "@/app/features/orders/orderSlice";
import {
  fetchUsers,
  selectUsers,
  type User,
} from "@/app/features/users/userSlice";
import type { AppDispatch } from "@/app/context/AppProvider";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

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
}

interface RevenueChartPoint {
  date: string; // YYYY-MM-DD
  amount: number;
}

interface VendorChartPoint {
  name: string;
  count: number;
}

interface PiePoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

type Role = "SUPER_ADMIN" | "VENDOR" | "CUSTOMER";

interface AuthUser {
  id: number;
  role: Role;
}

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();

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

  // ----- current auth user from localStorage -----
  const authUser: AuthUser | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("authUser");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<AuthUser>;
      if (
        typeof parsed.id === "number" &&
        (parsed.role === "SUPER_ADMIN" ||
          parsed.role === "VENDOR" ||
          parsed.role === "CUSTOMER")
      ) {
        return { id: parsed.id, role: parsed.role };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const currentUserId = authUser?.id;

  // ----- visibleProducts: admin sees all, vendor sees own products only -----
  const visibleProducts: Product[] = useMemo(() => {
    if (isSuperAdmin || !currentUserId) return products;
    return products.filter((p) => p.vendorId === currentUserId);
  }, [products, isSuperAdmin, currentUserId]);

  // ----- visibleOrders: admin sees all, vendor sees orders that contain their products -----
  const visibleOrders: Order[] = useMemo(() => {
    if (isSuperAdmin || !currentUserId) return orders;

    const ownProductIds = new Set<number>(visibleProducts.map((p) => p.id));

    return orders.filter((order) =>
      order.items.some((item) => ownProductIds.has(item.productId))
    );
  }, [orders, isSuperAdmin, currentUserId, visibleProducts]);

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
          const body = (await res.json().catch(() => ({}))) as {
            message?: string;
          };
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
      } catch (err: unknown) {
        if (err instanceof Error) {
          setSubError(err.message);
        } else {
          setSubError("Failed to load subscription revenue");
        }
      } finally {
        setSubLoading(false);
      }
    }

    loadSubscriptionRevenue();
  }, []);

  // Derived metrics (NOTE: products & orders are role-based)
  const totalProducts = visibleProducts.length;
  const totalOrders = visibleOrders.length;
  const totalUsers = users.length;
  const totalVendors = users.filter((u: User) => u.role === "VENDOR").length;

  const activeVendors = users.filter(
    (u: User) => u.role === "VENDOR" && u.subscriptionActive !== false
  ).length;
  const blockedVendors = totalVendors - activeVendors;

  const vendorChartData: VendorChartPoint[] = useMemo(
    () => [
      { name: "Active vendors", count: activeVendors },
      { name: "Blocked vendors", count: blockedVendors },
    ],
    [activeVendors, blockedVendors]
  );

  // Products by Category (pie) – role-based via visibleProducts
  const productCategoryPieData: PiePoint[] = useMemo(() => {
    const map = new Map<string, number>();

    visibleProducts.forEach((p) => {
      const name = p.category?.name || "Other / Uncategorised";
      map.set(name, (map.get(name) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [visibleProducts]);

  // Order status breakdown (pie) – role-based via visibleOrders
  const orderStatusPieData: PiePoint[] = useMemo(() => {
    const map = new Map<string, number>();

    visibleOrders.forEach((o) => {
      const status = o.status || "UNKNOWN";
      map.set(status, (map.get(status) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [visibleOrders]);

  const CATEGORY_COLORS = [
    "#22c55e",
    "#0ea5e9",
    "#f97316",
    "#a855f7",
    "#facc15",
    "#ef4444",
  ];

  const STATUS_COLORS: Record<string, string> = {
    PENDING: "#f97316",
    PAID: "#22c55e",
    COMPLETED: "#16a34a",
    CANCELLED: "#ef4444",
    UNKNOWN: "#94a3b8",
  };

  return (
    <div className="h-full space-y-6">
      {/* Summary cards row */}
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label={isSuperAdmin ? "Total Products" : "My Products"}
          value={totalProducts}
          accent="primary"
        />
        <SummaryCard
          label={isSuperAdmin ? "Total Orders" : "My Orders"}
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

      {/* MIDDLE ROW: PIE CHARTS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Products by Category (Pie chart) */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm border-border bg-card">
          <div className="text-center">
            <h2 className="text-sm font-semibold">Products by Category</h2>
            <p className="text-sm text-muted-foreground">
              Distribution of {isSuperAdmin ? "all" : "your"} active products
              across categories.
            </p>
          </div>

          <div className="flex-1 min-h-[220px] rounded-md bg-muted p-2 text-xs text-muted-foreground">
            {productCategoryPieData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                No product data yet.
              </div>
            ) : (
              <div className="flex items-center h-full gap-4">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={productCategoryPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        labelLine={false}
                      >
                        {productCategoryPieData.map((entry, index) => (
                          <Cell
                            key={`cat-${entry.name}`}
                            fill={
                              CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom legend */}
                <div className="flex w-[40%] flex-col gap-2 text-xs">
                  {productCategoryPieData.map((entry, index) => (
                    <div
                      key={`cat-legend-${entry.name}`}
                      className="flex items-center justify-between px-2 py-1 rounded-md shadow-sm bg-white/80"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                          }}
                        />
                        <span
                          className="max-w-[120px] truncate text-slate-700"
                          title={entry.name}
                        >
                          {entry.name}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-800">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Overview (Pie chart) */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm border-border bg-card">
          <div className="text-center">
            <h2 className="text-sm font-semibold">Order Status Overview</h2>
            <p className="text-sm text-muted-foreground">
              Breakdown of {isSuperAdmin ? "all" : "your"} orders by status.
            </p>
          </div>

          <div className="flex-1 min-h-[220px] rounded-md bg-muted p-2 text-xs text-muted-foreground">
            {orderStatusPieData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                No orders yet.
              </div>
            ) : (
              <div className="flex items-center h-full gap-4">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        labelLine={false}
                      >
                        {orderStatusPieData.map((entry) => {
                          const status = entry.name || "UNKNOWN";
                          const color =
                            STATUS_COLORS[status] || STATUS_COLORS.UNKNOWN;
                          return (
                            <Cell key={`status-${entry.name}`} fill={color} />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom legend */}
                <div className="flex w-[40%] flex-col gap-2 text-xs">
                  {orderStatusPieData.map((entry) => {
                    const status = entry.name || "UNKNOWN";
                    const color =
                      STATUS_COLORS[status] || STATUS_COLORS.UNKNOWN;
                    return (
                      <div
                        key={`status-legend-${entry.name}`}
                        className="flex items-center justify-between px-2 py-1 rounded-md shadow-sm bg-white/80"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-slate-700">{status}</span>
                        </div>
                        <span className="font-semibold text-slate-800">
                          {entry.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: BAR CHARTS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subscription revenue panel */}
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                Subscription Revenue (Last 30 Days)
              </h2>
              <p className="text-sm text-muted-foreground">
                Total vendor subscription payments recorded in the last month.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <button className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
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
                    tickFormatter={(value: number) => `${value / 1000}k`}
                  />
                  <Tooltip<number, string>
                    formatter={(value) => `MK ${value.toLocaleString()}`}
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

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs text-muted-foreground">
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
        <div className="flex flex-col gap-3 p-4 border rounded-lg shadow-sm border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                Vendor & Product Overview
              </h2>
              <p className="text-sm text-muted-foreground">
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

          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            <span className="px-2 py-1 rounded-md bg-primary text-primary-foreground">
              Active vendors: {activeVendors}
            </span>
            <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
              Blocked vendors: {blockedVendors}
            </span>
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
              Total users: {totalUsers}
            </span>
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
              Products: {totalProducts}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
