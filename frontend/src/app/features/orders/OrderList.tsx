// src/app/features/orders/OrderList.tsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, selectOrders, type Order } from "./orderSlice";
import { formatDate } from "../../utils/formatDate";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  MessageCircle,
} from "lucide-react";
import type { AppDispatch } from "../../context/AppProvider";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

// WhatsApp link builder with optional prefilled text
function buildWhatsAppLink(
  phone?: string | null,
  text?: string | null,
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
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector(selectOrders);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "PENDING" | "PAID" | "COMPLETED" | "CANCELLED"
  >("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Derived stats
  const totalOrders = items.length;
  const pendingCount = items.filter((o) => o.status === "PENDING").length;
  const completedCount = items.filter((o) => o.status === "COMPLETED").length;

  // Filter & search
  const filteredOrders = useMemo(() => {
    return items.filter((order) => {
      // status filter
      if (statusFilter && order.status !== statusFilter) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const idMatch = String(order.id).includes(term);
      const customerName = order.customer?.name?.toLowerCase() || "";
      const customerEmail = order.customer?.email?.toLowerCase() || "";
      const phone = order.customerPhone?.toLowerCase() || "";
      const firstItemName =
        order.items?.[0]?.product?.name?.toLowerCase() || "";

      // vendor names for search
      const vendorNames =
        order.vendorsSummary?.toLowerCase() ||
        Array.from(
          new Set(
            order.items
              .map((item) => item.product?.vendor?.name?.toLowerCase() || "")
              .filter(Boolean),
          ),
        ).join(", ");

      return (
        idMatch ||
        customerName.includes(term) ||
        customerEmail.includes(term) ||
        phone.includes(term) ||
        firstItemName.includes(term) ||
        vendorNames.includes(term)
      );
    });
  }, [items, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const pageOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, safePage]);

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
        },
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
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Failed to mark order as sold");
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">
            Track customer orders and vendor sales, and manage status updates.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalOrders} order{totalOrders === 1 ? "" : "s"} • {pendingCount}{" "}
            pending • {completedCount} completed
          </p>
        </div>
      </header>

      {/* Filters */}
      <section className="flex flex-wrap gap-3 p-3 text-sm border rounded-lg border-border bg-card">
        <div className="flex items-center w-full gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="font-medium text-muted-foreground">
            Search orders
          </label>
          <div className="relative">
            <Search className="absolute w-3 h-3 -translate-y-1/2 left-2 top-1/2 text-muted-foreground" />
            <input
              className="w-full px-6 py-1 text-sm border rounded-md border-border bg-background"
              placeholder="Order #, customer, phone, product, vendor…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {/* Status filter */}
        <div className="space-y-1">
          <label className="font-medium text-muted-foreground">Status</label>
          <select
            className="px-2 py-1 text-sm border rounded-md border-border bg-background"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(
                e.target.value as
                  | ""
                  | "PENDING"
                  | "PAID"
                  | "COMPLETED"
                  | "CANCELLED",
              );
              setCurrentPage(1);
            }}
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            className="px-3 py-1 text-sm border rounded-md border-border text-muted-foreground hover:bg-muted"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("");
              setCurrentPage(1);
            }}
          >
            Clear filters
          </button>
        </div>
      </section>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-3 border rounded-md border-border bg-card animate-pulse"
            >
              <div className="space-y-2">
                <div className="w-32 h-3 rounded bg-muted" />
                <div className="w-40 h-3 rounded bg-muted" />
              </div>
              <div className="w-24 h-3 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden border rounded-lg border-border bg-card">
          <table className="w-full text-sm text-left">
            <thead className="text-sm uppercase bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Order #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Vendors</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageOrders.map((order) => {
                const firstItem =
                  order.items && order.items.length > 0 ? order.items[0] : null;
                const productName = firstItem?.product?.name || "your order";
                const quantityFirst = firstItem?.quantity || 1;

                const totalQuantity =
                  order.totalQuantity ??
                  order.items.reduce(
                    (sum, item) => sum + (item.quantity || 0),
                    0,
                  );

                const vendorsSummary =
                  order.vendorsSummary ||
                  Array.from(
                    new Set(
                      order.items
                        .map((item) => item.product?.vendor?.name)
                        .filter(Boolean) as string[],
                    ),
                  ).join(", ") ||
                  "—";

                const waMessage = `
Hello ${order.customer?.name || order.customer?.email || "there"},

I'm contacting you about your order #${order.id} on Trade Point Malawi.

Product: ${productName}
Quantity: ${quantityFirst}
Total amount: MK ${order.totalAmount.toFixed(2)}

Your note:
${order.customerNote || "No note was provided."}
`.trim();

                const whatsappLink = buildWhatsAppLink(
                  order.customerPhone,
                  waMessage,
                );

                return (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-3 py-2 text-sm font-semibold">
                      #{order.id}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {order.customer?.name || order.customer?.email || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-col">
                        <span>{order.customerPhone || "N/A"}</span>
                        {order.customerNote && (
                          <span className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {order.customerNote}
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.customerPhone && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-[2px] text-[10px] font-medium text-slate-700 hover:bg-slate-200"
                              onClick={() =>
                                window.open(
                                  `tel:${order.customerPhone}`,
                                  "_self",
                                )
                              }
                            >
                              <PhoneCall className="w-3 h-3" />
                              Call
                            </button>
                          )}
                          {whatsappLink && (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] font-medium text-emerald-700 hover:bg-emerald-100"
                              onClick={() =>
                                window.open(whatsappLink, "_blank")
                              }
                            >
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm">{vendorsSummary}</td>
                    <td className="px-3 py-2 text-sm">
                      {totalQuantity} item{totalQuantity === 1 ? "" : "s"}
                    </td>
                    <td className="px-3 py-2 text-sm font-semibold">
                      MK {order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <span
                        className={[
                          "inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold uppercase",
                          order.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : order.status === "PAID"
                              ? "bg-sky-100 text-sky-800"
                              : order.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "CANCELLED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-700",
                        ].join(" ")}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          className="px-2 py-1 text-[11px] rounded-md bg-slate-100 hover:bg-slate-200"
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </button>
                        {order.status === "PENDING" && (
                          <button
                            className="px-2 py-1 text-[11px] font-semibold text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleMarkSold(order)}
                          >
                            Mark as sold
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-4 text-sm text-center text-muted-foreground"
                  >
                    No orders found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground">
            <span>
              Page <span className="font-semibold">{safePage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span> •{" "}
              {filteredOrders.length} order
              {filteredOrders.length === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-2 py-1 border rounded-md border-border bg-background disabled:opacity-50 hover:bg-muted"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="flex items-center gap-1 px-2 py-1 border rounded-md border-border bg-background disabled:opacity-50 hover:bg-muted"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
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
  const dispatch = useDispatch<AppDispatch>();

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
    newStatus: "PENDING" | "PAID" | "COMPLETED" | "CANCELLED",
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
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message || "Failed to update order status");
      } else {
        alert("Failed to update order status");
      }
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
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-2 text-[11px]">
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
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-[2px] text-[10px] font-medium text-emerald-700 hover:bg-emerald-100"
                onClick={() => window.open(whatsappLink, "_blank")}
              >
                <MessageCircle className="w-3 h-3" />
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
          <div className="px-3 py-2 text-[11px] rounded-md bg-muted text-muted-foreground">
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
