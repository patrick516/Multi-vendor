// src/app/features/messages/MessageSummaryCards.tsx
import { Mail, Users, Filter } from "lucide-react";
import type { MessageStats } from "./types";

interface Props {
  stats: MessageStats;
}

export function MessageSummaryCards({ stats }: Props) {
  const { totalMessages, broadcastCount, directCount, last7DaysCount } = stats;

  return (
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
  );
}
