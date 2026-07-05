# LeanIQA Observability Architecture

**Target Profile:** Solo-Founder MVP (< 1,000 users)  
**Core Tooling:** Sentry (Crash Reporting) + PostHog (Product Analytics & Telemetry)  
**Omitted Tooling:** Datadog, OpenTelemetry, Distributed Tracing, Slack Alerts, Apdex, p99 metrics.

## 1. Guiding Principles & North Star Metric

### North Star Metric
**"Successful AI Meal Logs per Active User per Day"**
All dashboards and alerts serve to protect and improve this single metric.

### The 5 Core Questions
Every collected metric and event must answer at least one of these:
1. Is the app broken?
2. Are users completing the core flow?
3. Is AI working?
4. Is the business growing?
5. Is AI cost under control?

### Launch Mode
During the first production release, collect only the minimum required telemetry and dashboards to avoid overwhelming the solo developer. The architecture allows additional events and dashboards to be progressively enabled later without refactoring.

---

## 2. Privacy & Security Rules (Strictly Enforced)

**NEVER SEND to Analytics or Error Tracking:**
- JWTs & Refresh tokens
- API keys (including Gemini keys)
- Email addresses & Phone numbers
- Exact meal text / Raw input
- User photos
- Sensitive health information (e.g., exact medical conditions if applicable)

**Sanitized Event Payloads:**
For meal logging errors, only capture structural/meta-data:
- `meal_hash` (e.g., SHA-256 of the input text)
- `word_count`
- `is_compound` (boolean)
- `confidence` (0-100)

---

## 3. What We Intentionally Do NOT Track in MVP

To keep operations lean and maintain user privacy during the early stage, we explicitly exclude:
- Heatmaps
- Mouse tracking
- Rage clicks
- DOM snapshots
- Distributed tracing
- Browser profiling
- CPU profiling
- Memory profiling
- Device fingerprinting
- Advanced telemetry

---

## 4. Monitoring Architecture & SDKs

**Frontend (React/Vite):**
- **Sentry React SDK:** Uncaught exceptions, React Error Boundaries, and manual error captures.
- **PostHog JS SDK:** Screen views, user interactions, feature usage, and funnel events.

**Backend / Supabase Edge Functions:**
- **Sentry Node/Edge SDK:** Execution failures, timeout captures.
- **PostHog Node SDK:** Server-side critical business events (e.g., successful subscription).

**Health Endpoint (`/api/health`):**
Returns real-time system status for basic ping monitoring:
- `application_status` (ok/degraded/down)
- `version`
- `environment`
- `uptime`
- `release_version`
- `git_commit`
- `database_connectivity` (ok/failed)
- `ai_availability` (ok/failed)
- `timestamp`

**Request Correlation:**
- Every frontend API request, Edge Function invocation, and AI query must carry a generated `x-correlation-id`.
- Sentry tags and PostHog event properties will include this ID to correlate user actions with server-side AI execution.

---

## 5. Release Tracking & Deployment Health

Every Sentry event must include contextual tags:
- `release_version`
- `git_commit`
- `environment` (e.g., `production`, `preview`)
- `build_timestamp`

**Deployment Health Monitoring:**
Compare metrics 1 hour pre-deployment vs. 1 hour post-deployment:
- Crash rate (Goal: < 1% drop in crash-free sessions)
- AI success rate (Goal: Stable or improved)

---

## 6. Event Taxonomy & Naming Convention

**Format:** `noun_verb` or `object_action` (Snake case)
**Schema Evolution:** Every analytics event must include an `event_version` property (e.g., `event_version: 1`) to support future schema evolution without breaking historical dashboards.

### Authentication & Lifecycle
- `user_signed_up`
- `user_logged_in`
- `onboarding_started`
- `goal_created`

### Meal Logging & AI
- `meal_log_attempted`
- `meal_logged` (Properties: `is_first_meal`, `is_third_meal`, `source: ai|cache|manual`, `is_compound`, `event_version`)
- `meal_log_failed` (Properties: `error_reason`, `word_count`, `meal_hash`, `event_version`)
- `meal_log_edited`
- `meal_log_deleted`
- `meal_log_retried`
- `ai_request_started`
- `ai_request_succeeded`
- `ai_request_failed`
- `ai_fallback_triggered`
- `cache_hit`

### Business & Subscriptions
- `subscription_checkout_started`
- `subscription_started`
- `subscription_converted`
- `payment_failed`

---

## 7. Error Severity & Alert Thresholds

### Severity Classification
* **P0 (Critical):** Login failure, Meal logging failure, Payment failure
* **P1 (High):** Weekly report failure, Profile save failure
* **P2 (Medium):** Slow AI response, Image loading issues
* **P3 (Low):** Minor UI issues

### Alert Thresholds (Email/Push to Founder)
* **Meal logging failure rate:** > 5%
* **Login failure rate:** > 2%
* **AI fallback rate:** > 20%
* **Crash-free sessions:** < 99%
* **AI total request duration:** > 3000ms average

---

## 8. Founder-First Dashboards

### 1. Founder Dashboard (The Daily Pulse)
- New Users (Count)
- Active Users (DAU/MAU)
- Meals Logged Today
- Users Who Logged Meals
- Average Meals per Active User
- Total Meals Logged (Count)
- AI Success Rate (%)
- Fallback Rate (%)
- Crash-Free Sessions (%)
- Revenue ($)
- Active Subscriptions (Count)

### 2. Core Loop Dashboard
- App Opened -> Meal Logging Attempted -> Meal Logged Successfully -> Dashboard Viewed -> Returned Next Day

### 3. User Funnel Dashboard
- Sign Up -> Onboarding Started -> Goal Created
- Goal Created -> First Meal Logged
- First Meal Logged -> Third Meal Logged
- Subscription Conversion Rate

### 4. Retention Dashboard
- Day-1 Retention (%)
- Day-3 Retention (%)
- Day-7 Retention (%)
- Day-30 Retention (%)

### 5. AI Health Dashboard
- AI Requests (Total Count)
- Cache Hit (%)
- Cache Miss (%)
- Cache Coverage (%)
- Average Cache Confidence
- Fallback Trigger Rate (%)
- AI Failure (%)
- AI Availability (Uptime % & Outages)
- AI Latency Breakdown:
  - Frontend request time (ms)
  - Edge Function execution time (ms)
  - Gemini response time (ms)
  - Total request duration (ms)
- Unknown Foods / Low Confidence Results (Count)
- Compound Meals (%)

### 6. AI Cost Dashboard
- AI Requests
- Average Latency
- Cache Hit (%)
- Fallback (%)
*(Token-level cost estimation delayed until production usage justifies it)*

### 7. AI Quality Dashboard
- User Manually Edited AI Result (%)
- Manual Calorie Edits (Count)
- Manual Protein Edits (Count)
- Manual Serving-Size Changes (Count)
- User Retried Parsing (%)
- User Deleted AI-generated Meal (%)
- Confidence Distribution (Histogram)
- Average Confidence Score (0-100)

### 8. Business KPI Dashboard
- Average Meals per Day
- Users Logging Meals 3+ Days/Week
- Subscription Conversion
- Average Streak Length (Days)

### 9. Database Health
- Supabase Query Latency (ms)
- Failed Queries (Count)
- Failed Reads (Count)
- Failed Writes (Count)
- RLS Denials (Count)
- Edge Function Errors (Count)
- Timeout Count (Count)
