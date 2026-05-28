export const CHART_COLORS = {
  blue: "#0079F2",
  amber: "#f59e0b",
  green: "#009118",
  red: "#A60808",
  purple: "#795EFF",
  pink: "#ec4899",
  slate: "#475569",
};

export const CHART_COLOR_LIST = [
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.green,
  CHART_COLORS.red,
  CHART_COLORS.pink,
];

export const DATA_SOURCES: string[] = ["App DB", "Telemetry Cluster", "Support CRM"];

export function formatNumber(value: number, type: "currency" | "percent" | "compact" | "standard"): string {
  switch (type) {
    case "currency": return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    case "percent": return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value / 100);
    case "compact": return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
    case "standard": return new Intl.NumberFormat("en-US").format(value);
  }
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(dateStr);
}

import { format } from "date-fns";

export function formatDate(dateStr: string, fmt = "MMM d"): string {
  return format(parseLocalDate(dateStr), fmt);
}