// src/app/features/messages/MessagesPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDate } from "../../utils/formatDate";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

type TargetType = "SINGLE" | "MULTI" | "ALL";

interface RecipientInfo {
  id: number;
  name: string | null;
  email: string;
}

interface MessageLog {
  id: number;
  subject: string | null;
  message: string;
  createdAt: string;
  targetType: TargetType;
  recipients: RecipientInfo[];
}

// Shorten a message body for the table
function snippet(text: string, length = 80): string {
  if (!text) return "";
  return text.length > length ? text.slice(0, length) + "…" : text;
}

export default function MessagesPage() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [fromDate, setFromDate] = useState(""); // YYYY-MM-DD
  const [toDate, setToDate] = useState(""); // YYYY-MM-DD

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("authToken")
            : null;

        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/admin/messages/history`, {
          headers,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load message history");
        }

        const data = (await res.json()) as MessageLog[];

        // sort newest first
        setLogs(
          data.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load message history");
        }
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  // Unique vendor names/emails for filter dropdown (optional)
  const vendorOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      log.recipients.forEach((r) => {
        const label = r.name || r.email;
        if (label) set.add(label);
      });
    });
    return Array.from(set).sort();
  }, [logs]);

  // Apply filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Subject filter
      if (subjectFilter.trim()) {
        const subj = (log.subject || "").toLowerCase();
        if (!subj.includes(subjectFilter.trim().toLowerCase())) {
          return false;
        }
      }

      // Vendor filter (by recipient name or email)
      if (vendorFilter.trim()) {
        const search = vendorFilter.trim().toLowerCase();
        const matchesVendor = log.recipients.some((r) => {
          const label = `${r.name || ""} ${r.email}`.toLowerCase();
          return label.includes(search);
        });
        if (!matchesVendor) return false;
      }

      // Date range filter
      if (fromDate) {
        const from = new Date(fromDate + "T00:00:00");
        if (new Date(log.createdAt) < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate + "T23:59:59");
        if (new Date(log.createdAt) > to) return false;
      }

      return true;
    });
  }, [logs, subjectFilter, vendorFilter, fromDate, toDate]);

  // Table columns
  const columns = useMemo<ColumnDef<MessageLog>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "createdAt",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(getValue() as string)}
          </span>
        ),
      },
      {
        header: "Target",
        cell: ({ row }) => {
          const log = row.original;
          if (log.targetType === "ALL") {
            return (
              <span className="text-xs font-semibold text-slate-800">
                All vendors
              </span>
            );
          }
          if (log.recipients.length === 1) {
            const r = log.recipients[0];
            return (
              <span className="text-xs text-slate-800">
                {r.name || r.email}
              </span>
            );
          }
          return (
            <span className="text-xs text-slate-800">
              {log.recipients.length} vendors
            </span>
          );
        },
      },
      {
        header: "Subject",
        accessorKey: "subject",
        cell: ({ getValue }) => (
          <span className="text-xs font-semibold">
            {(getValue() as string) || "(no subject)"}
          </span>
        ),
      },
      {
        header: "Message",
        accessorKey: "message",
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {snippet(getValue() as string)}
          </span>
        ),
      },
      {
        header: "Recipients",
        cell: ({ row }) => {
          const log = row.original;
          if (log.targetType === "ALL") {
            return (
              <span className="text-[11px] text-muted-foreground">
                All vendors
              </span>
            );
          }
          if (!log.recipients.length) {
            return <span className="text-[11px] text-muted-foreground">—</span>;
          }
          const first = log.recipients[0];
          const extra = log.recipients.length - 1;
          return (
            <span className="text-[11px] text-muted-foreground">
              {first.name || first.email}
              {extra > 0 && ` (+${extra} more)`}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredLogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Message History</h2>
          <p className="text-xs text-muted-foreground">
            View all messages sent to vendors, including broadcasts and
            individual notifications.
          </p>
        </div>
      </header>

      {/* Filters */}
      <section className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-3 text-[11px]">
        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="font-medium text-muted-foreground">Subject</label>
          <input
            className="w-full px-2 py-1 text-xs border rounded-md border-border bg-background"
            placeholder="Search subject…"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-[160px] space-y-1">
          <label className="font-medium text-muted-foreground">
            Vendor (name or email)
          </label>
          <input
            className="w-full px-2 py-1 text-xs border rounded-md border-border bg-background"
            placeholder="Type vendor name / email…"
            list="vendors-list"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          />
          {/* optional datalist for suggestions */}
          <datalist id="vendors-list">
            {vendorOptions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className="font-medium text-muted-foreground">From</label>
          <input
            type="date"
            className="px-2 py-1 text-xs border rounded-md border-border bg-background"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="font-medium text-muted-foreground">To</label>
          <input
            type="date"
            className="px-2 py-1 text-xs border rounded-md border-border bg-background"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1 text-[11px] text-muted-foreground hover:bg-muted"
            onClick={() => {
              setSubjectFilter("");
              setVendorFilter("");
              setFromDate("");
              setToDate("");
            }}
          >
            Clear filters
          </button>
        </div>
      </section>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading history…</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden border rounded-lg border-border bg-card">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => {
                  const log = row.original;
                  return (
                    <tr
                      key={row.id}
                      className="border-t cursor-pointer border-border hover:bg-muted/40"
                      onClick={() => setSelectedLog(log)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-4 text-sm text-center text-muted-foreground"
                  >
                    No messages found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-3 py-2 text-[11px] text-muted-foreground">
            <button
              type="button"
              className="px-2 py-1 border rounded-md border-border hover:bg-muted disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <span>
              Page{" "}
              <span className="font-semibold">
                {table.getState().pagination.pageIndex + 1} /{" "}
                {table.getPageCount() || 1}
              </span>
            </span>
            <button
              type="button"
              className="px-2 py-1 border rounded-md border-border hover:bg-muted disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-lg p-4 space-y-3 border rounded-lg shadow-lg border-border bg-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Message details</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-[11px] text-muted-foreground">
              <div>
                <span className="font-medium">Date: </span>
                <span>{formatDate(selectedLog.createdAt)}</span>
              </div>
              <div>
                <span className="font-medium">Target: </span>
                {selectedLog.targetType === "ALL" && <span>All vendors</span>}
                {selectedLog.targetType !== "ALL" && (
                  <span>
                    {selectedLog.recipients.length} vendor
                    {selectedLog.recipients.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Subject: </span>
                <span>{selectedLog.subject || "(no subject)"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-medium">Message</p>
              <div className="p-2 text-xs whitespace-pre-wrap border rounded-md border-border bg-background">
                {selectedLog.message}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-medium">
                Recipients ({selectedLog.recipients.length})
              </p>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-background p-2 text-[11px] space-y-1">
                {selectedLog.targetType === "ALL" &&
                  selectedLog.recipients.length === 0 && (
                    <p className="text-muted-foreground">
                      All vendors at time of sending.
                    </p>
                  )}

                {selectedLog.recipients.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="font-medium">{r.name || r.email}</span>
                    <span className="text-muted-foreground">{r.email}</span>
                  </div>
                ))}

                {selectedLog.targetType !== "ALL" &&
                  selectedLog.recipients.length === 0 && (
                    <p className="text-muted-foreground">
                      No recipients saved.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
