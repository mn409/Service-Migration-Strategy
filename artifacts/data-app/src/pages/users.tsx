import * as React from "react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetUsers } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { DashboardHeader } from "@/components/dashboard-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UsersPage() {
  const [version, setVersion] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [tier, setTier] = useState<string>("");
  const [churnRisk, setChurnRisk] = useState<string>("");
  
  const queryClient = useQueryClient();

  const queryParams = {
    ...(version && { version }),
    ...(region && { region }),
    ...(tier && { tier }),
    ...(churnRisk && { churnRisk }),
    page: 1,
    limit: 500, // Fetch more for client side filtering/sorting demo
  };

  const usersQuery = useGetUsers(queryParams);
  const loading = usersQuery.isLoading || usersQuery.isFetching;
  const users = usersQuery.data?.users || [];

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  const columns = [
    {
      accessorKey: "userId",
      header: "User ID",
      cell: ({ row }: any) => <span className="font-mono text-sm">{row.original.userId}</span>,
    },
    {
      accessorKey: "serviceVersion",
      header: "Version",
      cell: ({ row }: any) => {
        const v = row.original.serviceVersion;
        const color = v === "v1" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                      v === "v2" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        return <Badge className={`${color} border-0 hover:bg-transparent`}>{v}</Badge>;
      },
    },
    {
      accessorKey: "lastActiveDate",
      header: "Last Active",
      cell: ({ row }: any) => new Date(row.original.lastActiveDate).toLocaleDateString(),
    },
    {
      accessorKey: "region",
      header: "Region",
    },
    {
      accessorKey: "errorRate",
      header: "Error Rate",
      cell: ({ row }: any) => `${(row.original.errorRate).toFixed(2)}%`,
    },
    {
      accessorKey: "subscriptionTier",
      header: "Tier",
      cell: ({ row }: any) => <Badge variant="outline">{row.original.subscriptionTier}</Badge>,
    },
    {
      accessorKey: "migrationStatus",
      header: "Migration",
      cell: ({ row }: any) => <Badge variant="secondary">{row.original.migrationStatus}</Badge>,
    },
    {
      accessorKey: "churnRisk",
      header: "Churn Risk",
      cell: ({ row }: any) => {
        const risk = row.original.churnRisk;
        const color = risk === "high" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                      risk === "medium" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
        return <Badge className={`${color} border-0 hover:bg-transparent`}>{risk}</Badge>;
      },
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <DashboardHeader
            title="User Explorer"
            subtitle="Analyze individual user telemetry and migration status"
            loading={loading}
            onRefresh={handleRefresh}
          />

          <div className="flex flex-wrap items-end gap-4 p-4 border rounded-lg bg-card">
            <div className="w-[180px]">
              <Label className="text-[13px] mb-1.5 block">Version</Label>
              <Select value={version} onValueChange={setVersion}>
                <SelectTrigger><SelectValue placeholder="All Versions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Versions</SelectItem>
                  <SelectItem value="v1">v1 (Deprecated)</SelectItem>
                  <SelectItem value="v2">v2 (Deprecated)</SelectItem>
                  <SelectItem value="v3">v3 (Current)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Label className="text-[13px] mb-1.5 block">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue placeholder="All Regions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="us-east">US East</SelectItem>
                  <SelectItem value="us-west">US West</SelectItem>
                  <SelectItem value="eu-central">EU Central</SelectItem>
                  <SelectItem value="ap-south">AP South</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Label className="text-[13px] mb-1.5 block">Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger><SelectValue placeholder="All Tiers" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[180px]">
              <Label className="text-[13px] mb-1.5 block">Churn Risk</Label>
              <Select value={churnRisk} onValueChange={setChurnRisk}>
                <SelectTrigger><SelectValue placeholder="All Risks" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="ml-auto">
              <CSVLink
                data={users}
                filename="filtered-users.csv"
                className="flex items-center"
              >
                <Button variant="outline" className="gap-2" disabled={loading || users.length === 0}>
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </CSVLink>
            </div>
          </div>

          <DataTable data={users} columns={columns} loading={loading} />
        </div>
      </div>
    </Layout>
  );
}
