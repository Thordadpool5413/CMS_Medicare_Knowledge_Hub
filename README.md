# CMS Medicare Knowledge Hub

Source repository for the **National Hospice Intelligence & Decision Platform**.

This GitHub project is the production-aligned source package for the application currently running from AppDeploy application `oklahoma-hospice-intelligence-os-mogirs`. The import is anchored to production snapshot `1789104336546` from September 11, 2026 and preserves the same product architecture, evidence rules, public-data integrations, private workspace workflows, scoring models, background jobs, and major user experiences.

## What the platform does

The application turns public CMS and Census evidence, plus private user-scoped operating facts, into an auditable hospice decision workflow:

**Evidence → Confidence → Decision → Guardrail → Commitment → Owner → Execution → Outcome**

Major workspaces included in this repository:

- Command Center
- Expert Decision Room
- Provider Intelligence 360
- Universal U.S. hospice provider search
- Hospice Explorer
- 3-way national provider comparison
- Ownership / PECOS context
- Watchlist and provider-change monitoring
- 90-day Growth Strategy
- Territory Deployment 3.0 with Census county geometry
- Private Operational Truth with change history
- Referral Market for hospitals, SNFs, and physicians
- Physician Opportunity 3.0 and Physician 360
- Win / Loss private field intelligence
- CMS SSVI FY2024/FY2025 evidence
- HCRIS freestanding hospice Operating Model 2.0
- Source-period alignment and decision-confidence adjustment
- Source-contract health, system diagnostics, HCRIS routing, national physician warehouse status, and competition-cache completeness

## Evidence rules

The platform intentionally refuses several common shortcuts:

- Missing evidence reduces evidence coverage. It is not silently scored as zero.
- Different reporting periods remain visible and can reduce composite decision confidence.
- Estimated Medicare ADC is a public claims proxy, not live total census.
- SSVI is a service/spending variation and oversight signal, not a fraud finding or quality grade.
- HCRIS is provider-reported cost-report accounting, not EBITDA, valuation, cash flow, contribution margin, or a formal Medicare cap settlement.
- Patient-service ZIP and county geometry do not establish licensure, serviceability, drive time, staffing radius, or contractual access.
- Provider, claims, clinician, hospital, SNF, geography, or quality data do not establish patient-level hospice eligibility.
- Physician Order and Referring eligibility does not prove that a clinician referred a patient to a selected hospice.
- Provider-summed beneficiary counts are not relabeled as unique statewide people.

## Technology

- React 19
- TypeScript
- Vite
- Vitest
- Lucide React
- JSZip
- AppDeploy client/server runtime for API transport, authentication, storage/database access, and scheduled jobs
- CMS Provider Data API
- data.cms.gov APIs and catalog
- CMS HCRIS public cost-report files
- CMS SSVI public workbook
- U.S. Census ZCTA/county relationships, county adjacency, and TIGERweb geometry

## Repository layout

- `src/` React application, navigation, intelligence views, decision workflows, maps, growth math, responsive UI, and client-side evidence logic
- `backend/` CMS/Census integrations, scoring, evidence models, HCRIS, SSVI, service geography, physician warehouse, private operational truth, monitoring, alerts, storage, and API routes
- `tests/` product-level user-flow QA specification
- `cron.json` AppDeploy scheduled job definitions
- `appdeploy.auth-login.json` AppDeploy authentication presentation configuration
- `SOURCE_SNAPSHOT.md` source provenance and migration boundary

## AppDeploy runtime

The source is AppDeploy-compatible and intentionally retains `@appdeploy/client` and `@appdeploy/sdk` integrations because those services provide authentication, API routing, persistent database/storage, notifications, and scheduler infrastructure for the running application.

A move to a generic host is a separate infrastructure migration. Replacing AppDeploy would require equivalent implementations for those runtime services rather than simply moving React files and hoping the database develops a sense of duty.

## Source checks

Pure TypeScript/model tests are available through Vitest:

```bash
npm install
npm test
```

Frontend and backend source also include local TypeScript declarations for the AppDeploy interfaces used by this codebase. A full production build/deploy should still be performed in the AppDeploy environment so its runtime modules and backend packaging are resolved exactly as they are in production.

## Production reference

- AppDeploy app: `oklahoma-hospice-intelligence-os-mogirs`
- Production snapshot anchor: `1789104336546`
- Production URL: https://oklahoma-hospice-intelligence-os-mogirs.v2.appdeploy.ai/

The GitHub repository is intended to be the durable, reviewable source-of-truth home for ongoing development while AppDeploy remains the current runtime/deployment target.
