-- ============================================================
-- Cloud Service Deprecation & Migration Analytics
-- SQL Scripts
-- Author: Platform Analytics Team
-- Last Updated: 2026-05-28
-- ============================================================


-- ============================================================
-- 1. IDENTIFY ACTIVE USERS IN THE LAST 30 DAYS
-- ============================================================
-- Returns all users who have been active within the past 30 days,
-- including their version, tier, and error profile.
-- Useful for confirming which deprecated-version users still need
-- migration support.

SELECT
    su.user_id,
    su.service_version,
    su.subscription_tier,
    su.region,
    su.last_active_date,
    su.days_since_active,
    ROUND(su.error_rate * 100, 2)     AS error_rate_pct,
    su.migration_status,
    su.churn_risk
FROM service_users su
WHERE su.last_active_date >= NOW() - INTERVAL '30 days'
ORDER BY su.last_active_date DESC;


-- ============================================================
-- 2. SEGMENT USERS BY USAGE FREQUENCY
-- ============================================================
-- Buckets users into High / Medium / Low frequency tiers.
-- Logic mirrors the ETL rules used during data ingestion:
--   High   = active in last 7 days AND non-Free tier
--   Medium = active in last 8–20 days
--   Low    = inactive for 21+ days

SELECT
    CASE
        WHEN su.days_since_active <= 7  AND su.subscription_tier != 'Free' THEN 'high'
        WHEN su.days_since_active <= 20 THEN 'medium'
        ELSE 'low'
    END                               AS usage_frequency,
    su.service_version,
    COUNT(*)                          AS user_count,
    ROUND(AVG(su.error_rate) * 100, 2) AS avg_error_pct,
    COUNT(*) FILTER (WHERE su.churn_risk = 'high') AS high_churn_count
FROM service_users su
GROUP BY 1, 2
ORDER BY 2, 1;


-- ============================================================
-- 3. DETECT USERS ON DEPRECATED VERSIONS (v1, v2)
-- ============================================================
-- Isolates users still running v1 or v2, with migration status
-- and priority signal (Enterprise + high churn = top priority).

SELECT
    su.user_id,
    su.service_version,
    su.subscription_tier,
    su.region,
    su.migration_status,
    su.churn_risk,
    su.days_since_active,
    ROUND(su.error_rate * 100, 2)     AS error_rate_pct,
    -- Priority rank: Enterprise high-churn v1 users first
    CASE
        WHEN su.service_version = 'v1'
             AND su.subscription_tier = 'Enterprise'
             AND su.churn_risk = 'high'      THEN 1
        WHEN su.service_version = 'v1'
             AND su.churn_risk = 'high'      THEN 2
        WHEN su.service_version = 'v1'       THEN 3
        WHEN su.service_version = 'v2'
             AND su.churn_risk = 'high'      THEN 4
        ELSE 5
    END                               AS migration_priority
FROM service_users su
WHERE su.service_version IN ('v1', 'v2')
  AND su.migration_status != 'migrated'
ORDER BY migration_priority, su.error_rate DESC;


-- ============================================================
-- 4. CHURN RISK ANALYSIS
-- ============================================================
-- Identifies users at elevated churn risk based on inactivity
-- and error rate thresholds. Returns aggregated risk scores by
-- version and subscription tier for executive-level reporting.

WITH risk_scores AS (
    SELECT
        su.user_id,
        su.service_version,
        su.subscription_tier,
        su.churn_risk,
        su.days_since_active,
        su.error_rate,
        -- Composite risk score (0–100)
        LEAST(100,
            (su.days_since_active * 0.8)
            + (su.error_rate * 200)
        )                             AS risk_score
    FROM service_users su
)
SELECT
    rs.service_version,
    rs.subscription_tier,
    rs.churn_risk,
    COUNT(*)                          AS user_count,
    ROUND(AVG(rs.risk_score), 1)      AS avg_risk_score,
    ROUND(AVG(rs.error_rate) * 100, 2) AS avg_error_pct,
    ROUND(AVG(rs.days_since_active), 1) AS avg_days_inactive,
    COUNT(*) FILTER (WHERE rs.risk_score > 60) AS critical_users
FROM risk_scores rs
GROUP BY 1, 2, 3
ORDER BY AVG(rs.risk_score) DESC;


-- ============================================================
-- 5. MIGRATION FUNNEL SUMMARY
-- ============================================================
-- Snapshot of migration pipeline health across all deprecated
-- version users. Funnel: Identified → Contacted → In Progress → Migrated

SELECT
    COUNT(*)                                        AS total_deprecated_users,
    COUNT(*) FILTER (WHERE migration_status != 'not_started')   AS contacted_or_beyond,
    COUNT(*) FILTER (WHERE migration_status = 'in_progress')    AS in_progress,
    COUNT(*) FILTER (WHERE migration_status = 'migrated')       AS migrated,
    ROUND(
        COUNT(*) FILTER (WHERE migration_status = 'migrated') * 100.0
        / NULLIF(COUNT(*), 0), 1
    )                                               AS migration_rate_pct,
    COUNT(*) FILTER (WHERE migration_status = 'not_started')    AS still_uncontacted
FROM service_users
WHERE service_version IN ('v1', 'v2');


-- ============================================================
-- 6. ACTIVE USERS BY VERSION — LAST 30 DAYS (EVENT-LEVEL)
-- ============================================================
-- Uses the event log for a precise DAU count segmented by version.
-- More accurate than the user table's last_active_date field for
-- near-real-time active user counts.

SELECT
    se.service_version,
    DATE_TRUNC('day', se.timestamp)::date   AS activity_date,
    COUNT(DISTINCT se.user_id)              AS daily_active_users,
    COUNT(*)                                AS total_events,
    COUNT(*) FILTER (WHERE se.error_code IS NOT NULL) AS error_events,
    ROUND(
        COUNT(*) FILTER (WHERE se.error_code IS NOT NULL) * 100.0
        / NULLIF(COUNT(*), 0), 2
    )                                       AS error_rate_pct
FROM service_events se
WHERE se.timestamp >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 2 DESC, 1;
