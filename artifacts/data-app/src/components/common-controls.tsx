import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Printer, RefreshCw, ChevronDown, Check, Download } from "lucide-react";
import { useTheme } from "./theme-provider";
import { CSVLink } from "react-csv";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
        color: isDark ? "#c8c9cc" : "#4b5563",
      }}
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}

export function PrintButton({ loading }: { loading?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => window.print()}
      disabled={loading}
      className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors disabled:opacity-50 print:hidden"
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
        color: isDark ? "#c8c9cc" : "#4b5563",
      }}
      aria-label="Export as PDF"
    >
      <Printer className="w-3.5 h-3.5" />
    </button>
  );
}

export function SimpleRefreshButton({ loading, onRefresh }: { loading?: boolean; onRefresh: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsSpinning(true);
    } else {
      const t = setTimeout(() => setIsSpinning(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className="flex items-center gap-1 px-2 h-[26px] rounded-[6px] text-[12px] hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50 print:hidden"
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
        color: isDark ? "#c8c9cc" : "#4b5563",
      }}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
      Refresh
    </button>
  );
}

const INTERVAL_OPTIONS = [
  { label: "Every 5 min", ms: 5 * 60 * 1000 },
  { label: "Every 15 min", ms: 15 * 60 * 1000 },
  { label: "Every 1 hour", ms: 60 * 60 * 1000 },
  { label: "Every 24 hours", ms: 24 * 60 * 60 * 1000 },
];

export function SplitRefreshButton({
  loading,
  onRefresh,
  autoRefresh,
  setAutoRefresh,
  intervalMs,
  setIntervalMs,
}: {
  loading?: boolean;
  onRefresh: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  intervalMs: number;
  setIntervalMs: (val: number) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isSpinning, setIsSpinning] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      setIsSpinning(true);
    } else {
      const t = setTimeout(() => setIsSpinning(false), 600);
      return () => clearTimeout(t);
    }
  }, [loading]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative print:hidden" ref={dropdownRef}>
      <div
        className="flex items-center rounded-[6px] overflow-hidden h-[26px] text-[12px]"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
          color: isDark ? "#c8c9cc" : "#4b5563",
        }}
      >
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <div
          className="w-px h-4 shrink-0"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }}
        />
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center justify-center px-1.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover text-popover-foreground shadow-md z-50 p-1">
          <label className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-muted rounded-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            Auto-refresh
          </label>
          <div className="h-px bg-border my-1" />
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
            Refresh Interval
          </div>
          {INTERVAL_OPTIONS.map((opt) => (
            <button
              key={opt.ms}
              onClick={() => {
                setIntervalMs(opt.ms);
                setAutoRefresh(true);
                setDropdownOpen(false);
              }}
              className="flex w-full items-center justify-between px-2 py-1.5 text-sm hover:bg-muted rounded-sm transition-colors disabled:opacity-50"
            >
              {opt.label}
              {intervalMs === opt.ms && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChartCsvExport({ data, filename, loading }: { data: any[]; filename: string; loading?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (loading || !data || data.length === 0) return null;

  return (
    <CSVLink
      data={data}
      filename={filename}
      className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80"
      style={{
        backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2",
        color: isDark ? "#c8c9cc" : "#4b5563",
      }}
      aria-label="Export chart data as CSV"
    >
      <Download className="w-3.5 h-3.5" />
    </CSVLink>
  );
}
