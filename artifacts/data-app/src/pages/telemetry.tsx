import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDailyActiveUsers,
  useGetErrorSpikes,
  useGetEventLog,
  useGetUserFrequencySegments,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS, formatNumber, formatDate } from "@/lib/constants";
import { useTheme } from "@/components/theme-provider";
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

export default function TelemetryPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "system";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const queryClient = useQueryClient();

  const dauQuery = useGetDailyActiveUsers({ days: 30 });
  const spikesQuery = useGetErrorSpikes();
  const eventsQuery = useGetEventLog({ days: 7, limit: 100 });
  const segmentsQuery = useGetUserFrequencySegments();

  const loading =
    dauQuery.isLoading || dauQuery.isFetching ||
    spikesQuery.isLoading || spikesQuery.isFetching ||
    eventsQuery.isLoading || eventsQuery.isFetching ||
    segmentsQuery.isLoading || segmentsQuery.isFetching;

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const dau = dauQuery.data || [];
  const spikes = spikesQuery.data || [];
  const events = eventsQuery.data || [];
  const segments = segmentsQuery.data || [];

  const spikeColumns = [
    { accessorKey: "timestamp", header: "Timestamp", cell: ({ row }: any) => new Date(row.original.timestamp).toLocaleString() },
    { accessorKey: "version", header: "Version", cell: ({ row }: any) => <Badge variant="outline">{row.original.version}</Badge> },
    { accessorKey: "region", header: "Region" },
    {
      accessorKey: "errorRate",
      header: "Error Rate",
      cell: ({ row }: any) => {
        const rate = row.original.errorRate;
        const isHigh = rate > 20;
        return <span className={isHigh ? "text-red-500 font-bold" : ""}>{rate.toFixed(1)}%</span>;
      }
    },
    { accessorKey: "affectedUsers", header: "Affected Users", cell: ({ row }: any) => formatNumber(row.original.affectedUsers, "standard") },
  ];

  const eventColumns = [
    { accessorKey: "timestamp", header: "Time", cell: ({ row }: any) => new Date(row.original.timestamp).toLocaleTimeString() },
    { accessorKey: "userId", header: "User", cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.userId}</span> },
    { accessorKey: "eventType", header: "Event" },
    { accessorKey: "errorCode", header: "Error Code", cell: ({ row }: any) => row.original.errorCode ? <span className="text-red-500 font-mono text-xs">{row.original.errorCode}</span> : "-" },
    { accessorKey: "latencyMs", header: "Latency", cell: ({ row }: any) => `${row.original.latencyMs}ms` },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <DashboardHeader
            title="Telemetry & Events"
            subtitle="System health, error spikes, and event logs"
            loading={loading}
            onRefresh={handleRefresh}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-base">DAU (30d)</CardTitle>
              </CardHeader>
              <CardContent>
                {loading && !dau.length ? <Skeleton className="w-full h-[300px]" /> : (
                  <ResponsiveContainer width="100%" height={300} debounce={0}>
                    <AreaChart data={dau}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <YAxis tickFormatter={(v) => formatNumber(v, "compact")} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} isAnimationActive={false} />
                      <Area type="monotone" dataKey="total" stroke={CHART_COLORS.blue} fill={CHART_COLORS.blue} fillOpacity={0.2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-2">
                <CardTitle className="text-base">Usage Frequency by Version</CardTitle>
              </CardHeader>
              <CardContent>
                {loading && !segments.length ? <Skeleton className="w-full h-[300px]" /> : (
                  <ResponsiveContainer width="100%" height={300} debounce={0}>
                    <BarChart data={segments}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="version" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <YAxis tickFormatter={(v) => formatNumber(v, "compact")} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} isAnimationActive={false} cursor={false} />
                      <Bar dataKey="count" fill={CHART_COLORS.purple} fillOpacity={0.8} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Error Spikes</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable data={spikes} columns={spikeColumns} loading={loading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event Log (Last 7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable data={events} columns={eventColumns} loading={loading} />
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
