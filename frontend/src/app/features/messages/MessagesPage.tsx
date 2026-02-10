// src/app/features/messages/MessagesPage.tsx
import { useMessages } from "./useMessages";
import { MessageSummaryCards } from "./MessageSummaryCards";
import { MessageFilters } from "./MessageFilters";
import { MessageTable } from "./MessageTable";
import { MessageDetailModal } from "./MessageDetailModal";

export default function MessagesPage() {
  const {
    loading,
    error,
    stats,
    subjectFilter,
    setSubjectFilter,
    vendorFilter,
    setVendorFilter,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    vendorOptions,
    filteredLogs,
    selectedLog,
    setSelectedLog,
    handleDeleteMessage,
    clearFilters,
  } = useMessages();

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
            {stats.totalMessages} messages • {stats.broadcastCount} broadcasts •{" "}
            {stats.directCount} direct / multi • {stats.last7DaysCount} in last
            7 days
          </p>
        </div>
      </header>

      {/* Summary cards */}
      <MessageSummaryCards stats={stats} />

      {/* Filters */}
      <MessageFilters
        subjectFilter={subjectFilter}
        setSubjectFilter={setSubjectFilter}
        vendorFilter={vendorFilter}
        setVendorFilter={setVendorFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        vendorOptions={vendorOptions}
        clearFilters={clearFilters}
      />

      {/* Loading skeleton */}
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
        <MessageTable
          logs={filteredLogs}
          onRowClick={setSelectedLog}
          onDelete={handleDeleteMessage}
        />
      )}

      {/* Detail modal */}
      {selectedLog && (
        <MessageDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
