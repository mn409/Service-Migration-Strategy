import * as React from "react";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAnalyticsSummary,
  useGetVersionDistribution,
  useGetMigrationFunnel,
  useGetRegionalDistribution,
  useGetDailyActiveUsers,
  useGetErrorTrends,
  useGetChurnRiskSegments,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { KPICard } from "@/components/kpi-card";
import { ChartCsvExport } from "@/components/common-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS, CHART_COLOR_LIST, formatNumber, formatDate } from "@/lib/constants";
import { useTheme } from "@/components/theme-provider";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "system"; // Simplified for this context
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalMs, setIntervalMs] = useState(5 * 60 * 1000);
  const queryClient = useQueryClient();

  const summaryQuery = useGetAnalyticsSummary();
  const versionQuery = useGetVersionDistribution();
  const funnelQuery = useGetMigrationFunnel();
  const regionalQuery = useGetRegionalDistribution();
  const dauQuery = useGetDailyActiveUsers({ days: 90 });
  const errorQuery = useGetErrorTrends({ days: 30 });
  const churnQuery = useGetChurnRiskSegments();

  const loading =
    summaryQuery.isLoading || summaryQuery.isFetching ||
    versionQuery.isLoading || versionQuery.isFetching ||
    funnelQuery.isLoading || funnelQuery.isFetching ||
    regionalQuery.isLoading || regionalQuery.isFetching ||
    dauQuery.isLoading || dauQuery.isFetching ||
    errorQuery.isLoading || errorQuery.isFetching ||
    churnQuery.isLoading || churnQuery.isFetching;

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, intervalMs);
    return () => clearInterval(interval);
  }, [autoRefresh, intervalMs]);

  const summary = summaryQuery.data;
  const versions = versionQuery.data || [];
  const funnel = funnelQuery.data || [];
  const regions = regionalQuery.data || [];
  const dau = dauQuery.data || [];
  const errors = errorQuery.data || [];
  const churn = churnQuery.data || [];

  return (
    <Layout>
      <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
        <div className="max-w-[1600px] mx-auto">
          <DashboardHeader
            title="MigrationOps Dashboard"
            subtitle="Cloud service deprecation and migration telemetry"
            lastRefreshedMs={summaryQuery.dataUpdatedAt}
            loading={loading}
            onRefresh={handleRefresh}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            intervalMs={intervalMs}
            setIntervalMs={setIntervalMs}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KPICard title="Total Users" value={summary ? formatNumber(summary.totalUsers, "standard") : "--"} loading={loading} />
            <KPICard title="Active (30d)" value={summary ? formatNumber(summary.activeUsers30d, "standard") : "--"} loading={loading} />
            <KPICard title="Deprecated Version Users" value={summary ? formatNumber(summary.deprecatedVersionUsers, "standard") : "--"} loading={loading} valueColor={CHART_COLORS.amber} subtitle="Users on v1/v2" />
            <KPICard title="Migration Rate" value={summary ? formatNumber(summary.migrationRate, "percent") : "--"} loading={loading} />
            <KPICard title="Avg Error Rate" value={summary ? formatNumber(summary.avgErrorRate, "percent") : "--"} loading={loading} valueColor={summary && summary.avgErrorRate > 5 ? CHART_COLORS.red : CHART_COLORS.blue} />
            <KPICard title="High Churn Risk Users" value={summary ? formatNumber(summary.highChurnUsers, "standard") : "--"} loading={loading} valueColor={CHART_COLORS.red} />
            <KPICard title="Pending Migrations" value={summary ? formatNumber(summary.pendingMigrations, "standard") : "--"} loading={loading} />
            <KPICard title="Migrated Users" value={summary ? formatNumber(summary.migratedUsers, "standard") : "--"} loading={loading} valueColor={CHART_COLORS.green} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* DAU Time Series */}
            <Card className="lg:col-span-2">
              <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Daily Active Users (90d)</CardTitle>
                <ChartCsvExport data={dau} filename="dau-90d.csv" loading={loading} />
              </CardHeader>
              <CardContent>
                {loading && !dau.length ? <Skeleton className="w-full h-[300px]" /> : (
                  <ResponsiveContainer width="100%" height={300} debounce={0}>
                    <AreaChart data={dau}>
                      <defs>
                        <linearGradient id="gradV3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradV2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="gradV1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS.red} stopOpacity={0.5} />
                          <stop offset="100%" stopColor={CHART_COLORS.red} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <YAxis tickFormatter={(v) => formatNumber(v, "compact")} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} isAnimationActive={false} />
                      <Legend />
                      <Area type="monotone" dataKey="v3" name="v3 (Current)" fill="url(#gradV3)" stroke={CHART_COLORS.green} stackId="1" fillOpacity={1} isAnimationActive={false} />
                      <Area type="monotone" dataKey="v2" name="v2 (Deprecated)" fill="url(#gradV2)" stroke={CHART_COLORS.amber} stackId="1" fillOpacity={1} isAnimationActive={false} />
                      <Area type="monotone" dataKey="v1" name="v1 (Deprecated)" fill="url(#gradV1)" stroke={CHART_COLORS.red} stackId="1" fillOpacity={1} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Version Distribution */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Version Distribution</CardTitle>
                <ChartCsvExport data={versions} filename="version-distribution.csv" loading={loading} />
              </CardHeader>
              <CardContent>
                {loading && !versions.length ? <Skeleton className="w-full h-[300px]" /> : (
                  <ResponsiveContainer width="100%" height={300} debounce={0}>
                    <PieChart>
                      <Pie data={versions} dataKey="count" nameKey="version" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={2} isAnimationActive={false} stroke="none">
                        {versions.map((entry, index) => {
                          const color = entry.version === 'v1' ? CHART_COLORS.red : entry.version === 'v2' ? CHART_COLORS.amber : CHART_COLORS.green;
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} isAnimationActive={false} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Migration Funnel */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Migration Funnel</CardTitle>
                <ChartCsvExport data={funnel} filename="migration-funnel.csv" loading={loading} />
              </CardHeader>
              <CardContent>
                {loading && !funnel.length ? <Skeleton className="w-full h-[300px]" /> : (
                  <ResponsiveContainer width="100%" height={300} debounce={0}>
                    <BarChart data={funnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => formatNumber(v, "compact")} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <YAxis dataKey="stage" type="category" width={100} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} cursor={{ fill: 'rgba(0,0,0,0.1)' }} isAnimationActive={false} />
                      <Bar dataKey="count" name="Users" fill={CHART_COLORS.blue} fillOpacity={0.8} radius={[0, 2, 2, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Error Trends */}
            <Card className="lg:col-span-2">
              <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Error Rates (30d)</CardTitle>
                <ChartCsvExport data={errors} filename="error-trends.csv" loading={loading} />
              </CardHeader>
              <CardContent>
                {loading && !errors.length ? <Skeleton className="w-full h-[300px]" /> : (
                  <ResponsiveContainer width="100%" height={300} debounce={0}>
                    <LineChart data={errors}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="date" tickFormatter={(d) => formatDate(d)} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <YAxis tickFormatter={(v) => formatNumber(v, "percent")} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} isAnimationActive={false} />
                      <Legend />
                      <Line type="monotone" dataKey="v1ErrorRate" name="v1 Errors" stroke={CHART_COLORS.red} strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="v2ErrorRate" name="v2 Errors" stroke={CHART_COLORS.amber} strokeWidth={2} dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="v3ErrorRate" name="v3 Errors" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Regional Distribution */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Regional Usage</CardTitle>
                <ChartCsvExport data={regions} filename="regional-usage.csv" loading={loading} />
              </CardHeader>
              <CardContent>
                {loading && !regions.length ? <Skeleton className="w-full h-[300px]" /> : (
                  <ResponsiveContainer width="100%" height={300} debounce={0}>
                    <BarChart data={regions}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="region" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <YAxis tickFormatter={(v) => formatNumber(v, "compact")} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} cursor={false} isAnimationActive={false} />
                      <Legend />
                      <Bar dataKey="v1Users" stackId="a" name="v1 Users" fill={CHART_COLORS.red} fillOpacity={0.8} isAnimationActive={false} />
                      <Bar dataKey="v2Users" stackId="a" name="v2 Users" fill={CHART_COLORS.amber} fillOpacity={0.8} isAnimationActive={false} />
                      <Bar dataKey="v3Users" stackId="a" name="v3 Users" fill={CHART_COLORS.green} fillOpacity={0.8} isAnimationActive={false} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Churn Risk Segments */}
            <Card>
              <CardHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Churn Risk by Tier</CardTitle>
                <ChartCsvExport data={churn} filename="churn-risk.csv" loading={loading} />
              </CardHeader>
              <CardContent>
                {loading && !churn.length ? <Skeleton className="w-full h-[300px]" /> : (
                  <ResponsiveContainer width="100%" height={300} debounce={0}>
                    <BarChart data={churn}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis dataKey="tier" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <YAxis tickFormatter={(v) => formatNumber(v, "compact")} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '6px', border: '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }} cursor={false} isAnimationActive={false} />
                      <Legend />
                      <Bar dataKey="count" name="Users" fill={CHART_COLORS.purple} fillOpacity={0.8} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
          </div>
        </div>
      </div>
    </Layout>
  );
}
