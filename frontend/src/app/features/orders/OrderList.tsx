// src/app/features/orders/OrderList.tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, selectOrders } from "./orderSlice";
import { formatDate } from "../../utils/formatDate";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function OrderList() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector(selectOrders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  async function handleMarkSold(order: any) {
    if (!order.items || order.items.length === 0) {
      alert("No items found for this order.");
      return;
    }

    const item = order.items[0]; // current flow only creates one item per order
    const qty = item.quantity || 1;

    const confirmMsg = `Mark order #${order.id} as SOLD for ${qty} x ${item.product?.name}? This will reduce stock and record commission.`;
    const sure = window.confirm(confirmMsg);
    if (!sure) return;

    try {
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

      // 1) Mark product as sold (creates commission + reduces stock)
      const res1 = await fetch(
        `${API_BASE_URL}/products/${item.productId}/mark-sold`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ quantity: qty }),
        }
      );

      if (!res1.ok) {
        const body = await res1.json().catch(() => ({}));
        throw new Error(body.message || "Failed to mark product as sold");
      }

      // 2) Update order status to COMPLETED
      const res2 = await fetch(`${API_BASE_URL}/orders/${order.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!res2.ok) {
        const body = await res2.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update order status");
      }

      // Refresh orders
      dispatch(fetchOrders());
    } catch (err: any) {
      alert(err.message || "Failed to mark order as sold");
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold">Orders</h2>
        <p className="text-xs text-muted-foreground">
          Track customer orders and vendor sales.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading orders...</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden border rounded-lg border-border bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Order #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Contact</th> {/* 👈 NEW */}
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th> {/* 👈 NEW */}
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-3 py-2 text-xs">#{order.id}</td>
                  <td className="px-3 py-2 text-xs">
                    {order.customer?.name || order.customer?.email || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{order.customerPhone || "N/A"}</div>
                    {order.customerNote && (
                      <div className="text-[10px] text-muted-foreground line-clamp-2">
                        {order.customerNote}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs font-semibold">
                    MK {order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground uppercase text-[10px]">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {order.status === "PENDING" ? (
                      <button
                        className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] hover:bg-emerald-700"
                        onClick={() => handleMarkSold(order)}
                      >
                        Mark as sold
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-4 text-sm text-center text-muted-foreground"
                  >
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
