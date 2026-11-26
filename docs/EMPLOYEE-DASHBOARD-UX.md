# Employee dashboard implementation specification

Status: implemented; focused verification passed, browser acceptance outstanding. The existing `/api/v1/dashboard` contains organization-wide analytics and is not used as a personal summary.

## Sections and data

- Welcome: Lagos time greeting and current date; employee identity from the authenticated profile.
- Employment: name, initials, staff ID, designation, department/business unit and status where available.
- Summary: current-year persisted annual leave balance; pending requests across leave, loan, training, exit and complaints; active loan count; latest approved payroll period. Missing balance or payslip is unavailable, not zero.
- Quick actions: existing employee pages for leave, loans, training, payslips, documents and complaints.
- Recent requests: up to five owner-scoped records across those five request types, ordered by creation date. Complaint copy is generic; never return complaint contents or identity beyond the authenticated owner.
- Recent notifications: existing authenticated notification feed, up to five, with existing destination permission checks and no extra polling.

## Backend and authorization

Add an authenticated employee summary endpoint under the existing dashboard router. Derive employee identity from the authenticated account's linked employee record, never from query input; users without one receive a graceful empty profile response. Queries are scoped by employee ID, counts use database aggregation, and each request source retrieves only its five newest records. No schema change, new notification event or workflow change is required.

Pending states reflect existing workflows: leave `pending`; loan `PENDING_REVIEW`/`PENDING_APPROVAL`; training `PENDING_SUPERVISOR_APPROVAL`/`PENDING_HR_REVIEW`/`PENDING_HR_APPROVAL`; exit `submitted`/`under_review`/`clearance_pending` excluding terminal decisions; complaint `PENDING_REVIEW`/`PENDING_APPROVAL`. Only `ACTIVE` loans count as active. Latest payslip uses existing approved payroll records. Dates are presented in Africa/Lagos; raw timestamps remain UTC.

## UI behavior and acceptance

Use existing page shell, tokens, `StatCard`, `StatusBadge`, date helpers, responsive grid and existing routes. Summary and notifications load independently with explicit loading, error and empty states; no profile is handled gracefully. Do not provide a dead View All link. Verify authentication, cross-employee isolation, missing/empty records, counts, ordering, notification ownership, destinations, responsiveness and design system compliance through focused tests and build. UI acceptance remains separate from automated checks.

Verification: focused tests cover unauthenticated HTTP access, ignoring a supplied employee ID, exact employee lookup, owner-scoped source queries, missing profile, missing balance and payslip, zero counts, request ordering and generic complaint copy. The existing notification API supplies its own recipient scoping. A local database query returned a complete summary. Browser interaction and responsive visual acceptance have not been performed.

An initial full backend run reported a dashboard test-file process failure despite passing assertions; the focused tests and a subsequent full suite rerun passed (166 tests). Frontend build and targeted dashboard lint passed; automated component coverage is not available in the current frontend test setup.
