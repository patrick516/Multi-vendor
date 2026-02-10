// src/app/features/messages/useMessages.ts
import { useEffect, useMemo, useState } from "react";
import type { MessageLog, MessageStats } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

export function useMessages() {
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

  // Load from API
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
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
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

  // --- Delete message handler ---
  async function handleDeleteMessage(log: MessageLog) {
    if (
      !window.confirm(
        `Delete this message?\n\nSubject: ${
          log.subject || "(no subject)"
        }\n\nThis action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      if (!token) {
        alert("You are not logged in.");
        return;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch(`${API_BASE_URL}/admin/messages/${log.id}`, {
        method: "DELETE",
        headers,
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || "Failed to delete message");
      }

      setLogs((prev) => prev.filter((m) => m.id !== log.id));
      if (selectedLog && selectedLog.id === log.id) {
        setSelectedLog(null);
      }
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Failed to delete message");
      }
    }
  }

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
  const stats: MessageStats = useMemo(() => {
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

    return { totalMessages, broadcastCount, directCount, last7DaysCount };
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

  function clearFilters() {
    setSubjectFilter("");
    setVendorFilter("");
    setFromDate("");
    setToDate("");
  }

  return {
    logs,
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
  };
}
