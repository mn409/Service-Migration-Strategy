# Service Deprecation & Customer Migration Strategy
## Internal PRD — Platform Lifecycle Program

**Program:** Azure CloudSync v1/v2 Deprecation  
**Author:** Platform PM, Cloud Infrastructure  
**Status:** Active  
**Last Reviewed:** May 2026  
**Audience:** PM, Engineering, Customer Success, Marketing

---

## Executive Summary

CloudSync v1 and v2 serve approximately 50% of our active user base. Both versions carry a significantly elevated error rate (v1: ~12–20%, v2: ~4–11%) compared to v3 (<3%), and their underlying infrastructure is reaching end-of-support. This document outlines the strategy to migrate the remaining deprecated-version user base to v3 within the next two quarters, with minimal churn impact.

---

## 1. Migration Strategy

### Who to Target First (Priority Tiers)

**Tier 1 — v1 Enterprise, High Churn Risk**  
These users are on the oldest version, experiencing the highest error rates, and showing inactivity signals. They are at the highest risk of churning before migration happens. Proactive outreach with a dedicated migration engineer is warranted. Approximate count: ~120–150 users.

**Tier 2 — v1 Professional + Standard, High/Medium Churn Risk**  
Still on end-of-life infrastructure but slightly lower error exposure. These users respond well to self-service tooling with assisted onboarding if they stall.

**Tier 3 — v2 Enterprise and Professional**  
v2 users are stable enough that the urgency is lower, but they need a clear EOL date and a smooth migration path before v2 infrastructure is sunset. Timeline: migrate by end of Q3 2026.

**Tier 4 — v2 Standard and Free**  
Lowest risk, highest volume. These users migrate well through in-app prompts and automated nudges. No dedicated CSM needed.

### Migration Phasing

| Phase | Timeline | Target | Goal |
|-------|----------|--------|------|
| Phase 0 — Discovery | Weeks 1–2 | All deprecated users | Confirm contact data, segment risk |
| Phase 1 — Proactive Outreach | Weeks 3–6 | Tier 1 + Tier 2 | Move to "In Progress" |
| Phase 2 — Assisted Migration | Weeks 7–12 | Tier 1–3 stalled | Unblock technical blockers |
| Phase 3 — Automated Push | Weeks 13–18 | Tier 4 + late stragglers | In-app migration wizard |
| Phase 4 — EOL Enforcement | Week 20+ | Any remaining | Enforce read-only → sunset |

---

## 2. Customer Communication Plan

### Email Sequence (Deprecated Version Users)

**Email 1 — Awareness (Day 0)**  
Subject: "An important update about your CloudSync service version"  
Content: Inform users of the upcoming EOL date, link to migration guide, offer a scheduled call for Enterprise. Tone: informational, no urgency yet.

**Email 2 — Value Reinforcement (Day 14)**  
Subject: "What's new in CloudSync v3 — and how to get there in under 2 hours"  
Content: Feature comparison table, benchmark data (v3 error rate 5x lower, latency 2–3x faster), migration guide link, one-click migration wizard CTA.

**Email 3 — Urgency Signal (Day 35)**  
Subject: "Your CloudSync v1/v2 environment: action needed before [EOL date]"  
Content: EOL date now prominent. Counter showing days remaining. Migration status badge if they started but stalled.

**Email 4 — Final Notice (Day 55)**  
Subject: "Final notice: CloudSync v1/v2 sunset in 30 days"  
Content: Clear deadline, escalation path for blockers, FAQ. Enterprise customers get a personal note from their TAM.

### In-App Notifications
- Banner in the product header: "You're on CloudSync v1 — this version retires [date]. Migrate now →"
- Migration progress tracker visible in account settings
- Dashboard widget showing migration steps completed vs. remaining

### Migration Guide Deliverables
- Interactive migration wizard in-product (3-step: assess → plan → execute)
- Video walkthrough (~8 min) for self-service Standard/Free users
- PDF runbook for Enterprise teams with multiple environments
- Dedicated Slack/Teams channel: `#v3-migration-support`

---

## 3. Automation Ideas

### Outreach Scoring Engine
Build a lightweight ML model (or rule-based scorer) that ranks users by migration urgency:
- Inputs: days_since_active, error_rate, subscription_tier, churn_risk, migration_status
- Output: priority_score (0–100)
- Trigger: CSM assignment email when score > 70 and status = "not_started"

### Auto-Tagging Churn Risk Users
- Daily job: run churn risk classification on user activity deltas
- Tag users in CRM (Salesforce / HubSpot) automatically with `churn_risk: high`
- Trigger CSM alert via Slack when a previously "medium" user escalates to "high"

### Migration Milestone Webhooks
- Post to `#migration-ops` Slack channel when:
  - A Tier 1 user moves from "contacted" → "in_progress"
  - Any Enterprise user completes migration
  - Weekly: aggregate migration velocity report (% moved per tier)

### API-Driven Nudges
- If user logs in on v1/v2 and has not opened migration wizard in 7+ days: show contextual prompt
- If user's error rate spikes > 15%: show proactive "Did you know v3 has 5x fewer errors?" banner
- Automate account-level cutover scheduling for Enterprise customers via API

---

## 4. KPI Definitions

| KPI | Definition | Target | Owner |
|-----|-----------|--------|-------|
| **Migration Rate** | (Migrated users / Total deprecated users) × 100 | ≥ 80% by EOL | PM |
| **Weekly Migration Velocity** | New users moved to "migrated" status per week | ≥ 40 users/week | Program |
| **Churn Risk Score** | Composite score (0–100): 0.8 × days_inactive + 200 × error_rate | Track Tier 1 < 60 | CS |
| **DAU Delta (v1/v2)** | Week-over-week change in DAU on deprecated versions | –5% to –10%/week | Eng |
| **Error Rate Delta** | Change in avg error rate for active users pre/post migration | –70% post-migration | Reliability |
| **Time-to-Migrate (TTM)** | Days from "contacted" to "migrated" for Tier 1 users | < 21 days | CS |
| **Adoption Depth (v3)** | % of migrated users who use ≥3 v3 features within 30 days | ≥ 65% | PM |
| **Escalation Rate** | % of migration attempts that require engineering intervention | < 10% | Eng |

---

## 5. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Enterprise customer refuses migration due to API incompatibility | Medium | High | Ship v3 compatibility shim; assign migration engineer |
| EU users blocked by data residency requirements | Low | High | Ensure EU-West v3 environment meets GDPR requirements before outreach |
| Self-service migration failure rate > 15% | Medium | Medium | Add rollback capability; 24-hour support SLA |
| Churn spike post-EOL enforcement | Low | High | Extend read-only grace period by 30 days if migration rate < 60% at EOL-30 |

---

*This document is reviewed bi-weekly by the Platform PM and updated based on migration dashboard telemetry.*
