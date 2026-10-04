# MDCAT Academy LMS — Antigravity Workspace Rules

## Source of Truth
Always read `/docs/SRS.md` before implementing any feature. That document is the single source of truth for all requirements.

## Critical Security Rules (NON-NEGOTIABLE)
1. **NEVER send correct answers to the client during an active test attempt.** The `correctOptionId` and `explanation` fields must never appear in any API response payload while a test is in progress.
2. **All authorization is enforced server-side.** Every API route and Server Action must verify the user's role and ownership before returning data or making changes. UI-only guards are insufficient.
3. **The server is the single source of truth for time.** The `Attempt.serverDeadline` is authoritative. Never trust client-supplied timestamps for timing.
4. **Submissions are idempotent.** Use database-level unique constraints + transaction checks to ensure a second submit request never creates a second result.

## Architecture Rules
5. **Every schema change goes through a Prisma migration.** Never modify the database directly.
6. **Stateless API routes.** No in-memory state that would break horizontal scaling.
7. **Videos and files via CDN/object storage only.** Never serve binary files from the Next.js app server.
8. **Soft-delete only for academic data.** Never hard-delete Attempt, AttemptAnswer, Result, or Question records.

## Code Quality Rules
9. **Write automated tests** for: scoring logic, negative marking, timer/deadline calculation, idempotent submit, and role-based access control. These tests are part of "done."
10. **Zod validation on all API inputs.** Validate and sanitize before touching the database.
11. **TypeScript strict mode.** No `any` types without explicit justification.
12. **Environment variables for all secrets.** Never hardcode credentials or API keys.

## UI/UX Rules
13. **Mobile-first.** Design for 360px minimum width. Test on mobile before considering desktop done.
14. **Student can reach any lecture or test in ≤ 4 taps** from the dashboard.
15. **Always show a clear online/offline indicator** during a test attempt.
16. **Never show raw error messages or stack traces** to students.

## Development Process Rules
17. **Produce an implementation plan first.** Do not write code until the plan is reviewed and approved.
18. **One phase at a time.** Complete and commit one phase before starting the next.
19. **No real student data in development.** Use Prisma seed data only.
20. **Separate environments:** dev → staging → production. Never test on production.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
