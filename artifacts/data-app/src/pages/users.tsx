import * as React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetUsers } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CSVLink } from "react-csv";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 50;

type UserRow = {
  id: number;
  userId: string;
  serviceVersion: string;
  lastActiveDate: string;
  usageFrequency: string;
  region: string;
  errorRate: number;
  subscriptionTier: string;
  migrationStatus: string;
  churnRisk: string;
  daysSinceActive: number;
};

function migrationBadgeColor(status: string) {
  switch (status) {
    case "migrated": return "bg-green-900/30 text-green-400 border-green-700/40";
    case "in_progress": return "bg-blue-900/30 text-blue-400 border-blue-700/40";
    case "contacted": return "bg-amber-900/30 text-amber-400 border-amber-700/40";
    default: return "bg-zinc-800/60 text-zinc-400 border-zinc-700/40";
  }
}

function migrationLabel(status: string) {
  switch (status) {
    case "migrated": return "Migrated";
    case "in_progress": return "In Progress";
    case "contacted": return "Contacted";
    default: return "Not Started";
  }
}

export default function UsersPage() {
  const [version, setVersion] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const [churnRisk, setChurnRisk] = useState<string>("");
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);

  const queryClient = useQueryClient();

  // Build query params — only include filter if a real value is selected
  const queryParams: Record<string, string | number | boolean> = {
    page,
    limit: PAGE_SIZE,
  };
  if (version && version !== "all") queryParams.version = version;
  if (region && region !== "all") queryParams.region = region;
  if (tier && tier !== "all") queryParams.tier = tier;
  if (churnRisk && churnRisk !== "all") queryParams.churnRisk = churnRisk;

  const usersQuery = useGetUsers({ params: queryParams } as any);
  const loading = usersQuery.isLoading || usersQuery.isFetching;
  const users: UserRow[] = (usersQuery.data as any)?.users ?? [];
  const total: number = (usersQuery.data as any)?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function resetFilters() {
    setVersion("");
    setRegion("");
    setTier("");
    setChurnRisk("");
    setPage(1);
  }

  function handleFilterChange(setter: (v: string) => void) {
    return (v: string) => {
      setter(v);
      setPage(1);
    };
  }

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "userId",
      header: "User ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.userId}</span>
      ),
    },
    {
      accessorKey: "serviceVersion",
      header: "Version",
      cell: ({ row }) => {
        const v = row.original.serviceVersion;
        const cls =
          v === "v1"
            ? "bg-red-900/30 text-red-400 border-red-700/40"
            : v === "v2"
            ? "bg-amber-900/30 text-amber-400 border-amber-700/40"
            : "bg-green-900/30 text-green-400 border-green-700/40";
        return (
          <Badge className={`${cls} text-[11px] font-semibold border`}>{v}</Badge>
        );
      },
    },
    {
      accessorKey: "lastActiveDate",
      header: "Last Active",
      cell: ({ row }) =>
        new Date(row.original.lastActiveDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
    },
    {
      accessorKey: "daysSinceActive",
      header: "Days Inactive",
      cell: ({ row }) => {
        const d = row.original.daysSinceActive;
        const cls = d > 30 ? "text-red-400" : d > 14 ? "text-amber-400" : "text-green-400";
        return <span className={`font-medium ${cls}`}>{d}d</span>;
      },
    },
    {
      accessorKey: "usageFrequency",
      header: "Frequency",
      cell: ({ row }) => {
        const f = row.original.usageFrequency;
        const cls =
          f === "high"
            ? "bg-green-900/30 text-green-400 border-green-700/40"
            : f === "medium"
            ? "bg-blue-900/30 text-blue-400 border-blue-700/40"
            : "bg-zinc-800/60 text-zinc-400 border-zinc-700/40";
        return <Badge className={`${cls} text-[11px] capitalize border`}>{f}</Badge>;
      },
    },
    {
      accessorKey: "region",
      header: "Region",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.region}</span>
      ),
    },
    {
      accessorKey: "errorRate",
      header: "Error Rate",
      cell: ({ row }) => {
        const r = row.original.errorRate;
        const cls = r > 10 ? "text-red-400 font-semibold" : r > 5 ? "text-amber-400" : "text-green-400";
        return <span className={`text-sm ${cls}`}>{r.toFixed(1)}%</span>;
      },
    },
    {
      accessorKey: "subscriptionTier",
      header: "Tier",
      cell: ({ row }) => {
        const t = row.original.subscriptionTier;
        const cls =
          t === "Enterprise"
            ? "bg-purple-900/30 text-purple-400 border-purple-700/40"
            : t === "Professional"
            ? "bg-blue-900/30 text-blue-400 border-blue-700/40"
            : "bg-zinc-800/60 text-zinc-400 border-zinc-700/40";
        return <Badge className={`${cls} text-[11px] border`}>{t}</Badge>;
      },
    },
    {
      accessorKey: "migrationStatus",
      header: "Migration Status",
      cell: ({ row }) => {
        const s = row.original.migrationStatus;
        return (
          <Badge className={`${migrationBadgeColor(s)} text-[11px] border`}>
            {migrationLabel(s)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "churnRisk",
      header: "Churn Risk",
      cell: ({ row }) => {
        const risk = row.original.churnRisk;
        const cls =
          risk === "high"
            ? "bg-red-900/30 text-red-400 border-red-700/40"
            : risk === "medium"
            ? "bg-amber-900/30 text-amber-400 border-amber-700/40"
            : "bg-green-900/30 text-green-400 border-green-700/40";
        return <Badge className={`${cls} text-[11px] capitalize border`}>{risk}</Badge>;
      },
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <Layout>
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="max-w-[1600px] mx-auto space-y-5">
          <DashboardHeader
            title="User Explorer"
            subtitle="Drill into individual accounts — filter by version, region, tier, or risk level"
            loading={loading}
            onRefresh={() => queryClient.invalidateQueries()}
          />

          {/* Filter bar */}
          <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-card">
            <div className="w-[175px]">
              <Label className="text-[12px] text-muted-foreground mb-1.5 block uppercase tracking-wide">Version</Label>
              <Select value={version || "all"} onValueChange={handleFilterChange(setVersion)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Versions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Versions</SelectItem>
                  <SelectItem value="v1">v1 — Deprecated</SelectItem>
                  <SelectItem value="v2">v2 — Deprecated</SelectItem>
                  <SelectItem value="v3">v3 — Current</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[175px]">
              <Label className="text-[12px] text-muted-foreground mb-1.5 block uppercase tracking-wide">Region</Label>
              <Select value={region || "all"} onValueChange={handleFilterChange(setRegion)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="US-East">US-East</SelectItem>
                  <SelectItem value="US-West">US-West</SelectItem>
                  <SelectItem value="EU-West">EU-West</SelectItem>
                  <SelectItem value="EU-North">EU-North</SelectItem>
                  <SelectItem value="APAC">APAC</SelectItem>
                  <SelectItem value="LATAM">LATAM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[175px]">
              <Label className="text-[12px] text-muted-foreground mb-1.5 block uppercase tracking-wide">Subscription Tier</Label>
              <Select value={tier || "all"} onValueChange={handleFilterChange(setTier)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-[175px]">
              <Label className="text-[12px] text-muted-foreground mb-1.5 block uppercase tracking-wide">Churn Risk</Label>
              <Select value={churnRisk || "all"} onValueChange={handleFilterChange(setChurnRisk)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground hover:text-foreground"
              onClick={resetFilters}
            >
              Clear filters
            </Button>

            <div className="ml-auto">
              <CSVLink
                data={users}
                filename={`users-export-p${page}.csv`}
                className="flex items-center"
              >
                <Button variant="outline" size="sm" className="h-9 gap-2" disabled={loading || users.length === 0}>
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
              </CSVLink>
            </div>
          </div>

          {/* Result count */}
          <div className="flex items-center justify-between text-[13px] text-muted-foreground">
            <span>
              {loading
                ? "Loading..."
                : `${total.toLocaleString()} users${version || region || tier || churnRisk ? " (filtered)" : ""}`}
            </span>
            <span>
              Page {page} of {Math.max(1, totalPages)}
            </span>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id} className="border-b bg-muted/40">
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap cursor-pointer select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <span className="flex items-center gap-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === "asc" && " ↑"}
                            {header.column.getIsSorted() === "desc" && " ↓"}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        {columns.map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-16 text-muted-foreground">
                        No users match the current filters.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <span className="text-[13px] text-muted-foreground">
                Showing {users.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-[13px] text-muted-foreground min-w-[80px] text-center">
                  Page {page} / {Math.max(1, totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
