import * as React from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  useGetAnalyticsSummary,
  useGetMigrationFunnel,
  useGetChurnRiskSegments,
} from "@workspace/api-client-react";
import { Printer, Download } from "lucide-react";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-zinc-900 dark:bg-zinc-950 border border-zinc-700/60 text-green-400 dark:text-green-300 p-4 rounded-md overflow-x-auto text-[12.5px] leading-relaxed font-mono whitespace-pre">
      {children}
    </pre>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-border pb-2 mb-5">
      <span className="text-muted-foreground text-sm font-mono font-semibold">{number}</span>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    </div>
  );
}

function KPIRow({ label, definition, formula, target }: {
  label: string; definition: string; formula?: string; target?: string;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-x-6 py-3 border-b border-border/50 last:border-0">
      <div className="font-semibold text-foreground text-sm">{label}</div>
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground">{definition}</p>
        {formula && <p className="text-xs font-mono text-blue-400">{formula}</p>}
        {target && <p className="text-xs text-amber-400">Target: {target}</p>}
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const summaryQuery = useGetAnalyticsSummary();
  const funnelQuery = useGetMigrationFunnel();
  const churnQuery = useGetChurnRiskSegments();

  const summary = summaryQuery.data;
  const funnel = funnelQuery.data ?? [];
  const churn = churnQuery.data ?? [];

  const migrated = funnel.find((f) => f.stage === "Migrated");
  const highChurnEnterprise = churn.filter(
    (c) => c.churnRisk === "high" && c.tier === "Enterprise"
  ).reduce((s, c) => s + c.count, 0);

  return (
    <Layout>
      <div className="min-h-screen bg-background px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* Page header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-2">
                <span className="bg-amber-500/15 text-amber-400 border border-amber-600/30 px-2 py-0.5 rounded">INTERNAL DOC</span>
                <span>Platform Lifecycle Program · Azure Data Analytics</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Migration Strategy & PRD</h1>
              <p className="text-muted-foreground">
                v1/v2 Service Deprecation Initiative · Last reviewed May 2026
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 print:hidden"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
              Export PDF
            </Button>
          </div>

          {/* Live snapshot cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
              {[
                { label: "Total Users", value: summary.totalUsers.toLocaleString() },
                { label: "Deprecated Version Users", value: summary.deprecatedVersionUsers.toLocaleString(), warn: true },
                { label: "Migration Rate", value: `${summary.migrationRate}%`, ok: true },
                { label: "High Churn Risk", value: summary.highChurnUsers.toLocaleString(), warn: true },
              ].map((s) => (
                <div key={s.label} className="bg-card border rounded-lg p-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.warn ? "text-amber-400" : s.ok ? "text-green-400" : "text-foreground"}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Section 1 — Migration Strategy */}
          <section>
            <SectionTitle number="01" title="Migration Strategy" />
            <div className="space-y-4 text-sm text-foreground leading-relaxed">
              <p>
                Our user base runs across three service versions. <strong>v1 and v2 are deprecated</strong> — they
                run on end-of-life infrastructure with elevated error rates (v1: ~15%, v2: ~7%) compared to v3 (&lt;3%).
                The goal of this program is to move all remaining users to v3 before the EOL enforcement date.
              </p>

              <div className="bg-muted/40 border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/60">
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Priority Tier</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Segment</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Rationale</th>
                      <th className="text-left px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground">Approx. Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-2.5 font-semibold text-red-400">P0</td>
                      <td className="px-4 py-2.5">v1 · Enterprise · High Churn</td>
                      <td className="px-4 py-2.5 text-muted-foreground">Highest error rates, highest revenue risk</td>
                      <td className="px-4 py-2.5 font-mono text-amber-400">{highChurnEnterprise || "~40–60"}</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-2.5 font-semibold text-amber-400">P1</td>
                      <td className="px-4 py-2.5">v1 · Professional/Standard · High/Med Churn</td>
                      <td className="px-4 py-2.5 text-muted-foreground">Still on end-of-life infra, moderate churn signal</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">~200–250</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-2.5 font-semibold text-blue-400">P2</td>
                      <td className="px-4 py-2.5">v2 · Enterprise/Professional</td>
                      <td className="px-4 py-2.5 text-muted-foreground">More stable but must migrate before v2 sunset</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">~300–350</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-zinc-400">P3</td>
                      <td className="px-4 py-2.5">v2 · Standard/Free</td>
                      <td className="px-4 py-2.5 text-muted-foreground">Lowest risk — self-service nudges sufficient</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">~300+</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { phase: "Phase 0", weeks: "Wk 1–2", label: "Discovery", desc: "Telemetry analysis, contact data validation, v3 parity check" },
                  { phase: "Phase 1", weeks: "Wk 3–6", label: "Proactive Outreach", desc: "White-glove contact for P0/P1 accounts, dedicated migration engineer" },
                  { phase: "Phase 2", weeks: "Wk 7–12", label: "Assisted Migration", desc: "Unblock technical blockers, rollback safety net, CSM escalation" },
                  { phase: "Phase 3", weeks: "Wk 13+", label: "Automated Push", desc: "In-app wizard for P3, EOL enforcement read-only mode" },
                ].map((p) => (
                  <div key={p.phase} className="bg-card border rounded-lg p-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">{p.phase} · {p.weeks}</div>
                    <div className="font-semibold text-foreground mt-1 mb-1">{p.label}</div>
                    <p className="text-[12px] text-muted-foreground">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2 — Communication Plan */}
          <section>
            <SectionTitle number="02" title="Customer Communication Plan" />
            <div className="space-y-3">
              {[
                {
                  label: "T−30 Days",
                  subject: "Important: Upcoming Service Upgrade for Your Account",
                  channel: "Email + Dismissible Banner",
                  tone: "Informational",
                  desc: "Introduce EOL timeline. Link to migration guide. Offer a scheduled call for Enterprise accounts. No urgency yet — awareness only.",
                },
                {
                  label: "T−14 Days",
                  subject: "Action Required: Your API Version Will Be Deprecated",
                  channel: "Email + Persistent In-App Banner",
                  tone: "Urgent",
                  desc: "Feature comparison table showing v3 improvements. Include benchmark data (v3 has 5× fewer errors, 2–3× lower latency). One-click migration wizard CTA.",
                },
                {
                  label: "T−48 Hours",
                  subject: "Final Notice: Complete Migration Before Service Disablement",
                  channel: "Email + Direct CSM Outreach (Enterprise)",
                  tone: "Critical",
                  desc: "Countdown timer. Clear EOL timestamp. FAQ section. Enterprise users get a personal note from their Technical Account Manager.",
                },
                {
                  label: "T+0 (EOL Day)",
                  subject: "Your service has been moved to read-only mode",
                  channel: "In-App Full-Screen Modal",
                  tone: "Enforcement",
                  desc: "30-day grace period starts. Users can read but not write. Migration wizard prominently shown. Support escalation path available.",
                },
              ].map((t) => (
                <div key={t.label} className="flex gap-4 bg-card border rounded-lg p-4">
                  <div className="min-w-[90px] text-[12px] font-mono text-amber-400 font-semibold pt-0.5">{t.label}</div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm text-foreground">"{t.subject}"</p>
                    <p className="text-xs text-muted-foreground">{t.channel} · Tone: {t.tone}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 — Automation Ideas */}
          <section>
            <SectionTitle number="03" title="Automation Ideas" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: "Outreach Scoring Engine",
                  desc: "Daily job scores every deprecated-version user on a 0–100 scale using error rate, days inactive, tier, and churn risk. Auto-assigns CSM when score exceeds 70 and status is 'not started'.",
                },
                {
                  title: "CRM Auto-Tagging",
                  desc: "Hourly sync pushes updated churn_risk labels to Salesforce/HubSpot. Triggers an alert in #migration-ops Slack when any account escalates from medium → high.",
                },
                {
                  title: "Migration Milestone Webhooks",
                  desc: "Posts to Slack when a P0 account moves from 'contacted' → 'in_progress', and again at 'migrated'. Weekly velocity report auto-posts every Monday at 9am.",
                },
                {
                  title: "In-Product Contextual Nudges",
                  desc: "If a deprecated-version user logs in and hasn't opened the migration wizard in 7+ days: show a contextual prompt. Error spikes above 15% trigger an automatic banner comparing v3 stability.",
                },
              ].map((a) => (
                <div key={a.title} className="bg-card border rounded-lg p-4 space-y-1.5">
                  <p className="font-semibold text-sm text-foreground">{a.title}</p>
                  <p className="text-[13px] text-muted-foreground">{a.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 — KPI Definitions */}
          <section>
            <SectionTitle number="04" title="KPI Definitions" />
            <div className="bg-card border rounded-lg overflow-hidden divide-y divide-border/60">
              <KPIRow
                label="Migration Rate"
                definition="Percentage of deprecated-version users who have completed migration to v3."
                formula="(Migrated Users ÷ Total Deprecated Users) × 100"
                target={`≥ 80% by EOL · Current: ${summary ? summary.migrationRate + "%" : "--"}`}
              />
              <KPIRow
                label="Migration Velocity"
                definition="New users successfully moved to 'migrated' status each week. Tracks program momentum."
                formula="COUNT(status = 'migrated' this week) - COUNT(status = 'migrated' last week)"
                target="≥ 40 users/week during Phase 1–2"
              />
              <KPIRow
                label="Churn Risk Score"
                definition="Composite 0–100 score per user calculated daily. Drives prioritization and CSM assignment."
                formula="MIN(100, (days_since_active × 0.8) + (error_rate × 200))"
                target="P0 users scored > 70 must be contacted within 48h"
              />
              <KPIRow
                label="DAU Delta (v1/v2)"
                definition="Week-over-week change in Daily Active Users on deprecated versions. Validates migration pull-through."
                formula="DAU_this_week (v1+v2) ÷ DAU_last_week (v1+v2) − 1"
                target="−5% to −10%/week during active migration phases"
              />
              <KPIRow
                label="Error Rate Delta"
                definition="Change in average error rate for users who completed migration. Primary quality signal."
                formula="avg_error_rate (post-migration, 30d) ÷ avg_error_rate (pre-migration, 30d) − 1"
                target="≥ −70% (v3 should have 70%+ fewer errors)"
              />
              <KPIRow
                label="Time-to-Migrate (TTM)"
                definition="Calendar days between first outreach ('contacted') and successful migration for P0/P1 users."
                formula="migrated_date − contacted_date"
                target="Median TTM ≤ 21 days for Enterprise accounts"
              />
              <KPIRow
                label="v3 Adoption Depth"
                definition="% of migrated users actively using 3+ distinct v3 features within 30 days. Validates stickiness."
                formula="COUNT(migrated, feature_usage ≥ 3) ÷ COUNT(all migrated) × 100"
                target="≥ 65% within 30 days of migration"
              />
            </div>
          </section>

          {/* Section 5 — SQL Scripts */}
          <section>
            <SectionTitle number="05" title="SQL Scripts (PostgreSQL)" />
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">1. Identify active deprecated-version users (last 30 days)</p>
                <CodeBlock>{`SELECT
    user_id,
    service_version,
    subscription_tier,
    region,
    last_active_date,
    ROUND(error_rate * 100, 2)     AS error_rate_pct,
    migration_status,
    churn_risk
FROM service_users
WHERE service_version IN ('v1', 'v2')
  AND last_active_date >= NOW() - INTERVAL '30 days'
ORDER BY last_active_date DESC;`}</CodeBlock>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">2. Segment users by usage frequency</p>
                <CodeBlock>{`SELECT
    CASE
        WHEN days_since_active <= 7
             AND subscription_tier != 'Free' THEN 'high'
        WHEN days_since_active <= 20          THEN 'medium'
        ELSE                                       'low'
    END                                AS usage_frequency,
    service_version,
    COUNT(*)                           AS user_count,
    ROUND(AVG(error_rate) * 100, 2)    AS avg_error_pct
FROM service_users
GROUP BY 1, 2
ORDER BY 2, 1;`}</CodeBlock>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">3. Churn risk analysis with composite score</p>
                <CodeBlock>{`SELECT
    service_version,
    subscription_tier,
    churn_risk,
    COUNT(*)                           AS user_count,
    ROUND(AVG(
        LEAST(100,
            (days_since_active * 0.8)
            + (error_rate * 200)
        )
    ), 1)                              AS avg_risk_score,
    ROUND(AVG(error_rate) * 100, 2)    AS avg_error_pct
FROM service_users
GROUP BY 1, 2, 3
ORDER BY avg_risk_score DESC;`}</CodeBlock>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">4. Migration funnel snapshot</p>
                <CodeBlock>{`SELECT
    COUNT(*)                                             AS identified,
    COUNT(*) FILTER (
        WHERE migration_status != 'not_started')         AS contacted_or_beyond,
    COUNT(*) FILTER (
        WHERE migration_status = 'in_progress')          AS in_progress,
    COUNT(*) FILTER (
        WHERE migration_status = 'migrated')             AS migrated,
    ROUND(
        COUNT(*) FILTER (WHERE migration_status = 'migrated')
        * 100.0 / NULLIF(COUNT(*), 0), 1
    )                                                    AS migration_rate_pct
FROM service_users
WHERE service_version IN ('v1', 'v2');`}</CodeBlock>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">5. Daily active users per version (event-level, last 30 days)</p>
                <CodeBlock>{`SELECT
    service_version,
    DATE_TRUNC('day', timestamp)::date      AS activity_date,
    COUNT(DISTINCT user_id)                 AS daily_active_users,
    COUNT(*) FILTER (
        WHERE error_code IS NOT NULL) * 100.0
        / NULLIF(COUNT(*), 0)               AS error_rate_pct
FROM service_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 2 DESC, 1;`}</CodeBlock>
              </div>
            </div>
          </section>

          {/* Section 6 — KQL Queries */}
          <section>
            <SectionTitle number="06" title="KQL Queries (Azure Data Explorer)" />
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">1. Daily active users by version (last 90 days)</p>
                <CodeBlock>{`ServiceEvents
| where timestamp >= ago(90d)
| summarize
    DAU = dcount(userId),
    TotalEvents = count(),
    ErrorRate = round(
        countif(isnotempty(errorCode)) * 100.0 / count(), 2
    )
    by serviceVersion, bin(timestamp, 1d)
| order by timestamp asc
| render timechart`}</CodeBlock>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">2. Error spike detection (hourly, last 30 days)</p>
                <CodeBlock>{`ServiceEvents
| where timestamp >= ago(30d)
| summarize
    TotalEvents = count(),
    Errors = countif(isnotempty(errorCode)),
    AffectedUsers = dcount(userId)
    by serviceVersion, region, bin(timestamp, 1h)
| extend ErrorRate = round(Errors * 100.0 / TotalEvents, 2)
| where ErrorRate > 15
| order by timestamp desc
| project Hour=format_datetime(timestamp, 'yyyy-MM-dd HH:mm'),
    Version=serviceVersion, Region=region,
    ErrorRate, AffectedUsers`}</CodeBlock>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">3. Version usage share — weekly rollup (6 months)</p>
                <CodeBlock>{`ServiceEvents
| where timestamp >= ago(180d)
| summarize EventCount=count() by serviceVersion, bin(timestamp, 7d)
| join kind=inner (
    ServiceEvents
    | where timestamp >= ago(180d)
    | summarize TotalWeek=count() by bin(timestamp, 7d)
) on timestamp
| extend UsageSharePct = round(EventCount * 100.0 / TotalWeek, 1)
| order by timestamp asc
| project Week=format_datetime(timestamp,'yyyy-[W]WW'),
    Version=serviceVersion, EventCount, UsageSharePct`}</CodeBlock>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">4. Error events only — last 7 days (incident triage)</p>
                <CodeBlock>{`ServiceEvents
| where timestamp >= ago(7d)
| where isnotempty(errorCode)
| order by timestamp desc
| project
    Timestamp = format_datetime(timestamp, 'yyyy-MM-dd HH:mm:ss'),
    UserId = userId,
    Version = serviceVersion,
    Region = region,
    EventType = eventType,
    ErrorCode = errorCode,
    LatencyMs = latencyMs
| take 1000`}</CodeBlock>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">5. API response latency percentiles by version</p>
                <CodeBlock>{`ServiceEvents
| where timestamp >= ago(30d)
| summarize
    P50 = percentile(latencyMs, 50),
    P95 = percentile(latencyMs, 95),
    P99 = percentile(latencyMs, 99),
    AvgLatency = round(avg(latencyMs), 0)
    by serviceVersion
| order by P95 desc
| project Version=serviceVersion,
    AvgLatencyMs=AvgLatency, P50_ms=P50,
    P95_ms=P95, P99_ms=P99`}</CodeBlock>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t pt-6 flex items-center justify-between text-xs text-muted-foreground print:hidden">
            <span>MigrationOps · Azure Data Analytics Platform · Internal Use Only</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </Button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
