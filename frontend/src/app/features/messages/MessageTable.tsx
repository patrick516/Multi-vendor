// src/app/features/messages/MessageTable.tsx
import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash,
} from "lucide-react";

import { formatDate } from "../../utils/formatDate";
import type { MessageLog } from "./types";
import { snippet } from "./utils";

interface Props {
  logs: MessageLog[];
  onRowClick: (log: MessageLog) => void;
  onDelete: (log: MessageLog) => void;
}

export function MessageTable({ logs, onRowClick, onDelete }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

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
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const log = row.original;
          return (
            <button
              type="button"
              className="inline-flex items-center justify-center w-8 h-8 text-sm border rounded-md border-destructive text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(log);
              }}
              title="Delete message"
            >
              <Trash className="w-4 h-4" />
            </button>
          );
        },
      },
    ],
    [onDelete]
  );

  const table = useReactTable({
    data: logs,
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
                  onClick={() => onRowClick(log)}
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
            onClick={() => table.setPageIndex(table.getPageCount() - 1 || 0)}
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
          of <span className="font-semibold">{table.getPageCount() || 1}</span>{" "}
          • {logs.length} result
          {logs.length === 1 ? "" : "s"}
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
  );
}
