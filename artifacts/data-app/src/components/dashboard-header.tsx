import * as React from "react";
import { DATA_SOURCES } from "@/lib/constants";
import { DarkModeToggle, PrintButton, SplitRefreshButton, SimpleRefreshButton } from "./common-controls";
import { useTheme } from "./theme-provider";

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  lastRefreshedMs?: number;
  loading?: boolean;
  onRefresh: () => void;
  // If autoRefresh is undefined, we use SimpleRefreshButton
  autoRefresh?: boolean;
  setAutoRefresh?: (val: boolean) => void;
  intervalMs?: number;
  setIntervalMs?: (val: number) => void;
}

export function DashboardHeader({
  title,
  subtitle,
  lastRefreshedMs,
  loading,
  onRefresh,
  autoRefresh,
  setAutoRefresh,
  intervalMs,
  setIntervalMs,
}: DashboardHeaderProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const lastRefreshed = lastRefreshedMs
    ? (() => {
        const d = new Date(lastRefreshedMs);
        const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
        const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return `${time} on ${date}`;
      })()
    : null;

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="pt-2">
        <h1 className="font-bold text-[32px] tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1.5 text-[14px]">{subtitle}</p>

        {DATA_SOURCES.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[12px] text-muted-foreground shrink-0">Data Sources:</span>
            {DATA_SOURCES.map((source) => (
              <span
                key={source}
                className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                title={source}
                style={{
                  maxWidth: "20ch",
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)",
                  color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)",
                }}
              >
                {source}
              </span>
            ))}
          </div>
        )}

        {lastRefreshed && (
          <p className="text-[12px] text-muted-foreground mt-3">Last refresh: {lastRefreshed}</p>
        )}
      </div>
      <div className="flex items-center gap-3 pt-2 print:hidden">
        {autoRefresh !== undefined && setAutoRefresh && intervalMs !== undefined && setIntervalMs ? (
          <SplitRefreshButton
            loading={loading}
            onRefresh={onRefresh}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            intervalMs={intervalMs}
            setIntervalMs={setIntervalMs}
          />
        ) : (
          <SimpleRefreshButton loading={loading} onRefresh={onRefresh} />
        )}
        <PrintButton loading={loading} />
        <DarkModeToggle />
      </div>
    </div>
  );
}
