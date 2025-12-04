// src/app/features/messages/MessagesPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  Mail,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  X as XIcon,
} from "lucide-react";
import { formatDate } from "../../utils/formatDate";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://backend-morning-glitter-4312.fly.dev/api";

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

  // Sorting
  const [sorting, setSorting] = useState<SortingState>([]);

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

  // Unique vendor names/emails for filter dropdown
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

  // Stats
  const totalMessages = logs.length;
  const broadcastCount = logs.filter((l) => l.targetType === "ALL").length;
  const directCount = logs.filter((l) => l.targetType !== "ALL").length;
  const last7DaysCount = logs.filter((l) => {
    const created = new Date(l.createdAt).getTime();
    const now = Date.now();
    const diff = now - created;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return diff <= sevenDays;
  }).length;

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
        accessorKey: "createdAt",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 font-medium tracking-wide uppercase text-md hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
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
              <span className="inline-flex items-center px-3 py-1 font-semibold rounded-full text-md bg-emerald-50 text-emerald-800">
                All vendors
              </span>
            );
          }
          if (log.recipients.length === 1) {
            const r = log.recipients[0];
            return (
              <span className="text-sm text-slate-900">
                {r.name || r.email}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-3 py-1 font-semibold text-blue-800 rounded-full text-md bg-blue-50">
              {log.recipients.length} vendors
            </span>
          );
        },
      },
      {
        accessorKey: "subject",
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1 font-medium tracking-wide uppercase text-md hover:text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Subject
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">
            {(getValue() as string) || "(no subject)"}
          </span>
        ),
      },
      {
        accessorKey: "message",
        header: "Message",
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
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
              <span className="text-md text-muted-foreground">All vendors</span>
            );
          }
          if (!log.recipients.length) {
            return <span className="text-md text-muted-foreground">—</span>;
          }
          const first = log.recipients[0];
          const extra = log.recipients.length - 1;
          return (
            <span className="text-md text-muted-foreground">
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
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Message History</h2>
          <p className="text-md text-muted-foreground">
            View all messages sent to vendors: broadcasts, targeted updates, and
            individual notifications.
          </p>
          <p className="mt-1 text-md text-muted-foreground">
            {totalMessages} messages • {broadcastCount} broadcasts •{" "}
            {directCount} direct / multi • {last7DaysCount} in last 7 days
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-center text-blue-700 bg-blue-100 rounded-full w-9 h-9">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-md text-muted-foreground">Total messages</p>
            <p className="text-lg font-semibold">{totalMessages}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-center rounded-full w-9 h-9 bg-emerald-100 text-emerald-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-md text-muted-foreground">Broadcasts</p>
            <p className="text-lg font-semibold">{broadcastCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-center rounded-full w-9 h-9 bg-amber-100 text-amber-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-md text-muted-foreground">Targeted messages</p>
            <p className="text-lg font-semibold">{directCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 border rounded-lg shadow-sm bg-card border-border">
          <div className="flex items-center justify-center text-purple-700 bg-purple-100 rounded-full w-9 h-9">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <p className="text-md text-muted-foreground">Last 7 days</p>
            <p className="text-lg font-semibold">{last7DaysCount}</p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap gap-3 p-3 border rounded-lg text-md border-border bg-card">
        <div className="flex items-center w-full gap-2 text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters</span>
        </div>

        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="font-medium text-muted-foreground">Subject</label>
          <div className="relative">
            <Search className="absolute w-3 h-3 -translate-y-1/2 left-2 top-1/2 text-muted-foreground" />
            <input
              className="w-full px-6 py-1 border rounded-md text-md border-border bg-background"
              placeholder="Search subject…"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="font-medium text-muted-foreground">
            Vendor (name or email)
          </label>
          <input
            className="w-full px-2 py-1 border rounded-md text-md border-border bg-background"
            placeholder="Type vendor name / email…"
            list="vendors-list"
            value={vendorFilter}
            onChange={(e) => setVendorFilter(e.target.value)}
          />
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
            className="px-2 py-1 border rounded-md text-md border-border bg-background"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="font-medium text-muted-foreground">To</label>
          <input
            type="date"
            className="px-2 py-1 border rounded-md text-md border-border bg-background"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            className="px-3 py-1 border rounded-md text-md border-border text-muted-foreground hover:bg-muted"
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

      {loading && filteredLogs.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-3 border rounded-md border-border bg-card animate-pulse"
            >
              <div className="space-y-2">
                <div className="w-40 h-3 rounded bg-muted" />
                <div className="w-64 h-3 rounded bg-muted" />
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
            <thead className="uppercase text-md bg-muted text-muted-foreground">
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
                table.getRowModel().rows.map((row, idx) => {
                  const log = row.original;
                  return (
                    <tr
                      key={row.id}
                      className={
                        "border-t cursor-pointer border-border hover:bg-muted/40 " +
                        (idx % 2 === 0 ? "bg-background" : "bg-muted/10")
                      }
                      onClick={() => setSelectedLog(log)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2 align-top">
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
          <div className="flex flex-col items-center justify-between gap-2 px-3 py-2 text-md text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="p-1 border rounded-md border-border hover:bg-muted disabled:opacity-40"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 border rounded-md border-border hover:bg-muted disabled:opacity-40"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 border rounded-md border-border hover:bg-muted disabled:opacity-40"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 border rounded-md border-border hover:bg-muted disabled:opacity-40"
                onClick={() =>
                  table.setPageIndex(table.getPageCount() - 1 || 0)
                }
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            <div>
              Page{" "}
              <span className="font-semibold">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              of{" "}
              <span className="font-semibold">{table.getPageCount() || 1}</span>{" "}
              • {filteredLogs.length} result
              {filteredLogs.length === 1 ? "" : "s"}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Rows per page</span>
              <select
                className="px-2 py-1 border rounded-md text-md border-border bg-background"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-lg p-4 space-y-3 border shadow-lg rounded-2xl border-border bg-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Message details</h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-md text-muted-foreground hover:text-foreground"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-2 space-y-1 rounded-md text-md bg-muted/40 text-muted-foreground">
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
              <p className="font-medium text-md">Message</p>
              <div className="p-2 text-sm whitespace-pre-wrap border rounded-md border-border bg-background">
                {selectedLog.message}
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-md">
                Recipients ({selectedLog.recipients.length}
                {selectedLog.targetType === "ALL"
                  ? selectedLog.recipients.length === 0
                    ? " – (broadcast to all vendors)"
                    : ""
                  : ""}
                )
              </p>
              <div className="p-2 space-y-1 overflow-y-auto border rounded-md text-md max-h-40 border-border bg-background">
                {selectedLog.targetType === "ALL" &&
                  selectedLog.recipients.length === 0 && (
                    <p className="text-muted-foreground">
                      Broadcast sent to all vendors at the time.
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
                      No individual recipients recorded.
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
