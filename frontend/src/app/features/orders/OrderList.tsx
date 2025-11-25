// src/app/features/orders/OrderList.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, selectOrders, type Order } from "./orderSlice";
import { formatDate } from "../../utils/formatDate";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// WhatsApp link builder with optional prefilled text
function buildWhatsAppLink(
  phone?: string | null,
  text?: string | null
): string | null {
  if (!phone) return null;

  // strip non-digits
  let digits = phone.replace(/[^\d]/g, "");
  if (!digits) return null;

  // Malawi: 0882… → 265882…
  if (digits.startsWith("0") && digits.length >= 9 && digits.length <= 10) {
    digits = "265" + digits.slice(1);
  }

  const base = `https://wa.me/${digits}`;
  if (!text) return base;

  const encoded = encodeURIComponent(text);
  return `${base}?text=${encoded}`;
}

export default function OrderList() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector(selectOrders);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  async function handleMarkSold(order: Order) {
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
      <header className="flex items-center justify-between">
        <div>
          {/* <h2 className="text-lg font-semibold">Orders</h2> */}
          <p className="text-xs text-muted-foreground">
            Track customer orders and vendor sales.
          </p>
        </div>
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
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((order: Order) => {
                const firstItem =
                  order.items && order.items.length > 0 ? order.items[0] : null;
                const productName = firstItem?.product?.name || "your order";
                const quantity = firstItem?.quantity || 1;

                const waMessage = `
Hello ${order.customer?.name || order.customer?.email || "there"},

I'm contacting you about your order #${order.id} on Trade Point Malawi.

Product: ${productName}
Quantity: ${quantity}
Total amount: MK ${order.totalAmount.toFixed(2)}

Your note:
${order.customerNote || "No note was provided."}
`.trim();

                const whatsappLink = buildWhatsAppLink(
                  order.customerPhone,
                  waMessage
                );

                return (
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
                      {whatsappLink && (
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] font-medium text-emerald-700 hover:bg-emerald-100"
                          onClick={() => window.open(whatsappLink, "_blank")}
                        >
                          WhatsApp chat
                        </button>
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
                    <td className="px-3 py-2 space-x-1 text-xs">
                      <button
                        className="px-2 py-1 rounded-md bg-slate-100 text-[11px] hover:bg-slate-200"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </button>
                      {order.status === "PENDING" && (
                        <button
                          className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] hover:bg-emerald-700"
                          onClick={() => handleMarkSold(order)}
                        >
                          Mark as sold
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

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

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

/* ---------- ORDER DETAIL MODAL WITH STEPPER ---------- */

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const dispatch = useDispatch<any>();

  // Map status to step progress
  function getStepStatus(stepIndex: number): "done" | "current" | "pending" {
    const status = order.status;
    const orderLevel =
      status === "PENDING"
        ? 1
        : status === "PAID"
        ? 2
        : status === "COMPLETED"
        ? 3
        : 1;

    if (stepIndex < orderLevel) return "done";
    if (stepIndex === orderLevel) return "current";
    return "pending";
  }

  async function updateStatus(
    newStatus: "PENDING" | "PAID" | "COMPLETED" | "CANCELLED"
  ) {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/orders/${order.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update order status");
      }

      await res.json();
      dispatch(fetchOrders());
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    }
  }

  // Prefilled WhatsApp link also inside modal
  const modalWaMessage = `
Hello ${order.customer?.name || order.customer?.email || "there"},

I'm contacting you about your order #${order.id} on Trade Point Malawi.

Total amount: MK ${order.totalAmount.toFixed(2)}

Customer note:
${order.customerNote || "No note was provided."}
`.trim();

  const whatsappLink = buildWhatsAppLink(order.customerPhone, modalWaMessage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="w-full max-w-xl p-4 space-y-4 border shadow-lg rounded-2xl bg-card border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Order #{order.id} – {order.status}
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between text-[11px] mb-2">
          {[
            { label: "Placed", step: 1 },
            { label: "Confirmed", step: 2 },
            { label: "Completed", step: 3 },
          ].map(({ label, step }, idx, arr) => {
            const status = getStepStatus(step);
            const isLast = idx === arr.length - 1;

            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      "h-6 w-6 rounded-full text-[10px] flex items-center justify-center",
                      status === "done"
                        ? "bg-emerald-600 text-white"
                        : status === "current"
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-400"
                        : "bg-muted text-muted-foreground border border-border",
                    ].join(" ")}
                  >
                    {step}
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={[
                      "h-[2px] flex-1 mx-1",
                      getStepStatus(step + 1) !== "pending"
                        ? "bg-emerald-500"
                        : "bg-muted",
                    ].join(" ")}
                  ></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Details */}
        <div className="grid gap-3 md:grid-cols-2 text-[11px]">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Customer</p>
            <p className="text-muted-foreground">
              {order.customer?.name || order.customer?.email || "N/A"}
            </p>
            <p className="text-muted-foreground">
              Phone: {order.customerPhone || "N/A"}
            </p>
            {whatsappLink && (
              <button
                type="button"
                className="mt-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] font-medium text-emerald-700 hover:bg-emerald-100"
                onClick={() => window.open(whatsappLink, "_blank")}
              >
                Open WhatsApp chat
              </button>
            )}
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">Order Info</p>
            <p className="text-muted-foreground">
              Created: {formatDate(order.createdAt)}
            </p>
            <p className="text-muted-foreground">
              Total: MK {order.totalAmount.toLocaleString()}
            </p>
            {order.items[0]?.product?.name && (
              <p className="text-muted-foreground">
                Product: {order.items[0].product!.name} (x
                {order.items[0].quantity})
              </p>
            )}
          </div>
        </div>

        {order.customerNote && (
          <div className="rounded-md bg-muted px-3 py-2 text-[11px] text-muted-foreground">
            <span className="font-semibold">Customer note: </span>
            {order.customerNote}
          </div>
        )}

        {/* Status action buttons */}
        <div className="flex flex-wrap justify-end gap-2 pt-2 text-[11px]">
          {order.status !== "PENDING" && order.status !== "CANCELLED" && (
            <button
              type="button"
              className="px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200"
              onClick={() => updateStatus("PENDING")}
            >
              Reset to Pending
            </button>
          )}
          {order.status === "PENDING" && (
            <button
              type="button"
              className="px-3 py-1 text-white rounded-md bg-sky-600 hover:bg-sky-700"
              onClick={() => updateStatus("PAID")}
            >
              Confirm Order
            </button>
          )}
          {order.status === "PAID" && (
            <button
              type="button"
              className="px-3 py-1 text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
              onClick={() => updateStatus("COMPLETED")}
            >
              Mark Completed
            </button>
          )}
          {order.status !== "CANCELLED" && (
            <button
              type="button"
              className="px-3 py-1 text-white bg-red-600 rounded-md hover:bg-red-700"
              onClick={() => updateStatus("CANCELLED")}
            >
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
