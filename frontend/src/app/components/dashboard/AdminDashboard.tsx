// src/app/features/dashboard/AdminDashboard.tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  selectProducts,
} from "@/app/features/products/productSlice";
import { fetchOrders, selectOrders } from "@/app/features/orders/orderSlice";

import { fetchUsers, selectUsers } from "@/app/features/users/userSlice";
import { SummaryCard } from "../../components/dashboard/SummaryCard";

export default function AdminDashboard() {
  const dispatch = useDispatch<any>();

  const { items: products } = useSelector(selectProducts);
  const { items: orders } = useSelector(selectOrders);
  const { items: users } = useSelector(selectUsers);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchOrders());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Simple derived metrics (later we can refine with status fields)
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalUsers = users.length;
  const totalVendors = users.filter((u) => u.role === "VENDOR").length;

  return (
    <div className="w-min-h h-full space-y-6">
      {/* Header strip like screenshot */}
      <div className="w-full rounded-lg bg-brand-blue text-white px-6 py-4 shadow-sm">
        <h1 className="text-lg md:text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-xs text-white/80 mt-1">
          Overview of products, orders and vendors.
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
        <SummaryCard label="Vendors" value={totalVendors} accent="primary" />
        <SummaryCard label="Users" value={totalUsers} accent="secondary" />
      </div>

      {/* Main panels row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue panel */}
        <div className="rounded-lg bg-card border border-border shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Revenue (Last 30 Days)</h2>
              <p className="text-[11px] text-muted-foreground">
                This will show total revenue over the last month.
              </p>
            </div>
            <div className="flex gap-2 text-[11px]">
              <button className="px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Last 30
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-[160px] bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
            Chart placeholder (revenue by date)
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            Total: MK 0
          </div>
        </div>

        {/* Utilization / status panel */}
        <div className="rounded-lg bg-card border border-border shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Product Status Overview</h2>
              <p className="text-[11px] text-muted-foreground">
                Later we can show pending vs active vs archived products.
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-[160px] bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
            Chart placeholder (e.g. bar chart by status)
          </div>
          <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
            <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground">
              Active: {totalProducts}
            </span>
            <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
              Pending: 0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
