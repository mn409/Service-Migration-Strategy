import * as React from "react";
import { Layout } from "@/components/layout";

export default function StrategyPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-background px-5 py-8">
        <div className="max-w-4xl mx-auto space-y-8 bg-card p-8 rounded-lg border shadow-sm prose dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Migration Strategy & PRD</h1>
          <p className="text-muted-foreground text-lg mb-8">Internal planning document for the v1/v2 service deprecation initiative.</p>

          <section>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">1. Migration Strategy</h2>
            <p><strong>Phase 1 Target:</strong> v1 Enterprise High-Churn Users.</p>
            <p><strong>Why:</strong> These users are experiencing the highest error rates on the legacy infrastructure and are at the greatest risk of churn. Migrating them to v3 stabilizes their experience immediately.</p>
            <ul>
              <li><strong>Week 1-2:</strong> Silent background telemetry analysis to verify v3 parity for target accounts.</li>
              <li><strong>Week 3-4:</strong> White-glove outreach to top 50 accounts.</li>
              <li><strong>Week 5-8:</strong> Automated rolling migration for remaining v1 users.</li>
              <li><strong>Week 9+:</strong> Begin v2 phase-out.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">2. Customer Communication Plan</h2>
            <p>We will execute a 3-touchpoint email sequence alongside persistent in-app notifications.</p>
            <ul>
              <li><strong>T-30 Days:</strong> "Important: Upcoming Service Upgrade" (Email + Dismissible Banner)</li>
              <li><strong>T-14 Days:</strong> "Action Required: API Version Deprecation" (Email + Persistent Banner)</li>
              <li><strong>T-48 Hours:</strong> "Final Notice: Service Migration" (Direct CSM Outreach for Enterprise)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">3. Automation Ideas</h2>
            <ul>
              <li><strong>API-driven outreach scoring:</strong> Trigger Zendesk tasks when a v1 user hits {">"} 5% error rate for 3 consecutive days.</li>
              <li><strong>Auto-tagging:</strong> Sync churn risk scores to Salesforce hourly.</li>
              <li><strong>Milestone Webhooks:</strong> Push notifications to `#migration-war-room` Slack channel for every 1,000 successful migrations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">4. KPI Definitions</h2>
            <ul className="space-y-2">
              <li><strong>Migration Rate:</strong> (Migrated Users / Total Legacy Users) * 100</li>
              <li><strong>Churn Risk Score:</strong> Composite metric of error rate + days since active + legacy version flag</li>
              <li><strong>DAU Delta:</strong> Net change in Daily Active Users post-migration</li>
              <li><strong>Error Rate Delta:</strong> Change in average 5xx errors per 10k requests</li>
              <li><strong>Time-to-Migrate:</strong> Days elapsed from first notification to active v3 request</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">5. Helpful SQL Scripts</h2>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Identify Deprecated Users</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`SELECT user_id, service_version, last_active_date
FROM users
WHERE service_version IN ('v1', 'v2')
  AND last_active_date > CURRENT_DATE - INTERVAL '30 days'
ORDER BY last_active_date DESC;`}
              </pre>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Churn Risk Analysis</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`SELECT 
  subscription_tier,
  COUNT(CASE WHEN error_rate > 0.05 THEN 1 END) as high_risk_users,
  AVG(days_since_active) as avg_inactivity
FROM users
GROUP BY subscription_tier;`}
              </pre>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Migration Funnel Query</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`SELECT 
  migration_status, 
  COUNT(*) as user_count
FROM users
WHERE service_version = 'v3'
GROUP BY migration_status;`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold border-b pb-2 mb-4">6. Helpful KQL Queries (Azure Data Explorer)</h2>
            
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Daily Active Users</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`EventLog
| where TimeGenerated > ago(30d)
| summarize dcount(UserId) by bin(TimeGenerated, 1d), ServiceVersion
| render timechart`}
              </pre>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Error Spikes</h3>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`EventLog
| where EventType == 'Error'
| make-series ErrorCount=count() on TimeGenerated from ago(7d) to now() step 1h by ServiceVersion
| render timechart`}
              </pre>
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
