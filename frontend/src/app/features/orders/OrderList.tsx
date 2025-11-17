// src/app/features/orders/OrderList.tsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, selectOrders } from "./orderSlice";
import { formatDate } from "../../utils/formatDate";

export default function OrderList() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector(selectOrders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

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
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Order #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-3 py-2 text-xs">#{order.id}</td>
                  <td className="px-3 py-2 text-xs">
                    {order.customer?.name || order.customer?.email || "N/A"}
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
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-sm text-muted-foreground"
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
