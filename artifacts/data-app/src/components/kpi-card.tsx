import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS } from "@/lib/constants";

interface KPICardProps {
  title: string;
  value: string | number;
  loading?: boolean;
  valueColor?: string;
  subtitle?: string;
}

export function KPICard({ title, value, loading, valueColor = CHART_COLORS.blue, subtitle }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        {loading ? (
          <>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
            {subtitle && <Skeleton className="h-3 w-40 mt-1" />}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1 tracking-tight" style={{ color: valueColor }}>
              {value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
