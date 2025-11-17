// src/app/components/dashboard/SummaryCard.tsx
interface SummaryCardProps {
  label: string;
  value: number | string;
  accent?: "primary" | "secondary";
}

export function SummaryCard({
  label,
  value,
  accent = "primary",
}: SummaryCardProps) {
  const accentBg = accent === "primary" ? "bg-primary" : "bg-secondary";
  const accentText =
    accent === "primary"
      ? "text-primary-foreground"
      : "text-secondary-foreground";

  return (
    <div className="flex-1 min-w-[160px] rounded-lg bg-card shadow-sm border border-border px-4 py-3 flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{value}</span>
        <span
          className={`text-[11px] px-2 py-1 rounded-full ${accentBg} ${accentText}`}
        >
          Today
        </span>
      </div>
    </div>
  );
}
