// src/app/features/messages/MessageDetailModal.tsx
import { X as XIcon } from "lucide-react";
import type { MessageLog } from "./types";
import { formatDate } from "../../utils/formatDate";

interface Props {
  log: MessageLog;
  onClose: () => void;
}

export function MessageDetailModal({ log, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="w-full max-w-lg p-4 space-y-3 border shadow-lg rounded-2xl border-border bg-card">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Message details</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-md text-muted-foreground hover:text-foreground"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 space-y-1 rounded-md text-md bg-muted/40 text-muted-foreground">
          <div>
            <span className="font-medium">Date: </span>
            <span>{formatDate(log.createdAt)}</span>
          </div>
          <div>
            <span className="font-medium">Target: </span>
            {log.targetType === "ALL" && <span>All vendors</span>}
            {log.targetType !== "ALL" && (
              <span>
                {log.recipients.length} vendor
                {log.recipients.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div>
            <span className="font-medium">Subject: </span>
            <span>{log.subject || "(no subject)"}</span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-md">Message</p>
          <div className="p-2 text-sm whitespace-pre-wrap border rounded-md border-border bg-background">
            {log.message}
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-md">
            Recipients ({log.recipients.length}
            {log.targetType === "ALL" && log.recipients.length === 0
              ? " – (broadcast to all vendors)"
              : ""}
            )
          </p>
          <div className="p-2 space-y-1 overflow-y-auto border rounded-md text-md max-h-40 border-border bg-background">
            {log.targetType === "ALL" && log.recipients.length === 0 && (
              <p className="text-muted-foreground">
                Broadcast sent to all vendors at the time.
              </p>
            )}

            {log.recipients.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="font-medium">{r.name || r.email}</span>
                <span className="text-muted-foreground">{r.email}</span>
              </div>
            ))}

            {log.targetType !== "ALL" && log.recipients.length === 0 && (
              <p className="text-muted-foreground">
                No individual recipients recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
