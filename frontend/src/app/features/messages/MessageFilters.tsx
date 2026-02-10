// src/app/features/messages/MessageFilters.tsx
import { Filter, Search } from "lucide-react";

interface Props {
  subjectFilter: string;
  setSubjectFilter: (v: string) => void;
  vendorFilter: string;
  setVendorFilter: (v: string) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  vendorOptions: string[];
  clearFilters: () => void;
}

export function MessageFilters({
  subjectFilter,
  setSubjectFilter,
  vendorFilter,
  setVendorFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  vendorOptions,
  clearFilters,
}: Props) {
  return (
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
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </div>
    </section>
  );
}
