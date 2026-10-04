# MDCAT Academy LMS — SRS v1.1
**Prepared by:** NEXKODE  
**Status:** Active — Antigravity agents must treat this as the single source of truth.

---

## Critical Rules (Always Apply)
1. **NEVER send correct answers to the client during a test.**
2. **All authorization is enforced server-side** on every API route and server action — never rely on UI-only hiding.
3. **The server is the single source of truth for time.** Browser timer is display-only.
4. **Every database schema change goes through a Prisma migration.**
5. **Write automated tests** for scoring logic, timer logic, and permission/authorization logic.
6. **Mobile-first UI** — test at 360px minimum width.
7. **No real student data in development** — use seed data only.

---

## Section 44 — Non-Functional Requirements

### 44.1 Performance
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-P1 | Concurrent students on a test | 500 (scalable to 2,000) |
| NFR-P2 | Test load (all questions) | ≤ 3s on 4G |
| NFR-P3 | Move between questions | ≤ 300ms (preloaded in browser) |
| NFR-P4 | Answer autosave round-trip | ≤ 1s at 95th percentile |
| NFR-P5 | Result calculation after submit | ≤ 5s for 180 MCQs |
| NFR-P6 | Dashboard/page load | ≤ 3s on 4G |
| NFR-P7 | Video start time | ≤ 4s; adaptive bitrate |
| NFR-P8 | Admin lists (50,000+ questions) | Paginated, ≤ 2s per page |

> Load pattern: Exam start and end cause traffic spikes. Load test against simulated spikes, not averages.

### 44.2 Availability & Reliability
- NFR-A1: 99.5% monthly uptime [Confirm]; 99.9% during scheduled test windows
- NFR-A2: No maintenance during published test windows
- NFR-A3: Video service failure must NOT affect test-taking (independent components)
- NFR-A4: Submissions are idempotent — repeated submit never creates a second attempt or double-score
- NFR-A5: Graceful error pages — students never see raw errors or stack traces

### 44.3 Scalability
- Stateless application servers (horizontal scaling)
- Videos and files in object storage with CDN delivery — never from app server
- DB indexes on attempts, answers, results; read-heavy analytics via read replica or cached aggregates
- Incremental autosave during test — spike at submission time stays small

### 44.4 Security
- NFR-S1: HTTPS everywhere (TLS 1.2+)
- NFR-S2: Passwords hashed with bcrypt or Argon2 — never stored or logged in plain text
- NFR-S3: RBAC enforced on the server for every endpoint, not only hidden in UI
- NFR-S4: Students can only read their own attempts, results, and data
- NFR-S5: **Correct answers and explanations never sent to browser before allowed** (see Section 45.8)
- NFR-S6: Rate limiting on login and password reset; account lockout after repeated failures
- NFR-S7: Input validation and output escaping (SQL injection, XSS, CSRF protection)
- NFR-S8: Secrets in environment variables or secrets manager — never in code
- NFR-S9: Uploaded files checked for type/size; served via signed, expiring URLs
- NFR-S10: Audit log of sensitive admin actions (see 44.7)

### 44.5 Usability & Accessibility
- Mobile-first; tested at screens from 360px wide
- Latest 2 versions of Chrome, Safari, Edge, Firefox; Android/iOS browsers
- Usable on slow connections
- WCAG 2.1 AA colour contrast where practical
- Any lecture or test reachable in ≤ 4 taps from dashboard

### 44.6 Compatibility & Localization
- UI language: English at launch; structure must allow Urdu (RTL) later [Confirm]
- Question text supports KaTeX formulas, subscripts/superscripts, chemical structures, images
- Timezone: Asia/Karachi (PKT) for display, UTC stored internally

### 44.7 Data Management, Backup & Auditability
- NFR-D1: Automated daily backups, retained 30 days; point-in-time recovery preferred [Confirm]
- NFR-D2: RPO ≤ 24h (≤15min with PITR); RTO ≤ 4h
- NFR-D3: Restore test before go-live
- NFR-D4: Test attempts, answers, results — NEVER hard-deleted; soft-delete/archive only
- NFR-D5: Audit log for: result changes, test publish/unpublish, question edits on live tests, account activation/deactivation, password resets, role changes
- NFR-D6: Collect only necessary student data (name, contact, course, results) [Confirm retention period]
- NFR-D7: CSV/Excel export of results available to admins

### 44.8 Network Resilience
- Autosave tolerates short disconnections (queued locally, retried on reconnect)
- Clear online/offline indicator in test interface
- Small page weight; adaptive video quality with low-data option

### 44.9 Maintainability & Deployment
- Separate dev, staging, production environments
- Version-controlled source; automated tests for scoring, timer, permissions
- Schema changes via migrations only
- Monitoring, error tracking, alerts for downtime and error spikes

### 44.10 Capacity Assumptions [Confirm all]
| Item | Value |
|------|-------|
| Registered students (Year 1) | 1,000–3,000 |
| Question bank | 10,000–20,000 MCQs |
| Lecture videos | 300–1,000 hours |
| Largest single test | 180 MCQs |

---

## Section 45 — Exam Integrity & Examination Rules

### 45.1 Attempt Rules
- EX-1: Max attempts per student configurable (default: 1 for scheduled; unlimited for practice)
- EX-2: Only one active attempt per test per student at a time
- EX-3: Scheduled tests only startable within defined window
- EX-4: Late joiner gets remaining time only (unless configured as "full duration from start") [Confirm]
- EX-5: Test types: **Scheduled** (exam conditions) or **Practice** (open, immediate answer review)

### 45.2 Server-Controlled Timer
- EX-6: Server stores attempt start time and computed deadline — single source of truth
- EX-7: Browser timer is display-only; re-synced with server periodically and on reconnect
- EX-8: Changing device clock has NO effect on test
- EX-9: Refreshing/closing/switching devices does NOT pause or reset the timer
- EX-10: Server auto-submits at deadline even if browser is closed or offline
- EX-11: Answers arriving after deadline (beyond ≤5s grace) [Confirm] are rejected

### 45.3 Autosave & Connection Loss
- EX-12: Each answer saved to server as selected (or batched every few seconds)
- EX-13: Offline: answers held in browser, synced on reconnect; visible warning shown
- EX-14: Crash/device death: student can log in and resume same attempt with answers intact, timer continuing from server clock
- EX-15: Connection loss ≠ extra time. Admin may grant extensions (see 45.9)

### 45.4 Login & Session Control
- EX-16: One active session per student by default; new login ends previous session [Confirm]
- EX-17: Starting/continuing test from second device while another is active = blocked or takeover (logged)
- EX-18: Login events (time, IP, device type) logged and visible to admins
- EX-19: Admin can force-logout a student

### 45.5 Question Delivery & Randomization
- EX-20: Question order and option order randomized per student and stored per attempt (stable across refreshes)
- EX-21: Fixed pool selection (e.g., pick 50 of 120) stored per attempt
- EX-22: **Correct answers NEVER in data sent to browser during a test**
- EX-23: Questions edited after a test has attempts are versioned; existing attempts graded against version seen
- EX-24: Wrong question correction: admin can (a) accept all, (b) change answer, (c) cancel — triggers recalculation + audit log

### 45.6 Marking Rules
- EX-25: Marks per question configurable per test (default: 1)
- EX-26: Negative marking: off, or configurable deduction (e.g., −0.25). Unanswered = no penalty
- EX-27: Pass percentage configurable per test
- EX-28: Marking scheme snapshotted on test — immutable once attempts exist (except EX-24 correction)
- EX-29: Default MDCAT template: 180 MCQs, subject-wise distribution, duration set by academy [Confirm vs PMDC pattern]

### 45.7 Test Interface Behaviour
- EX-30: Free navigation between questions (or forward-only mode if configured)
- EX-31: Student can flag questions for review
- EX-32: Confirmation screen before submit: answered / unanswered / flagged counts
- EX-33: Submission is final — student cannot reopen attempt after submit
- EX-34: Idempotent submit — double-click or slow network produces exactly one result

### 45.8 Result & Answer Visibility
| Setting | Options |
|---------|---------|
| Score | Immediately / After window closes / Manual release |
| Correct answers | Never / After window closes / Immediately |
| Explanations | Never / After window closes / Immediately |
| Rankings (future) | Off / After window closes |

Default for scheduled tests: answers/explanations shown **after window closes**.

### 45.9 Admin Controls & Exceptions
- EX-36: View live attempts (who started, in progress, submitted)
- EX-37: Grant time extension or re-attempt to specific student (reason mandatory, logged)
- EX-38: Force-submit an attempt
- EX-39: Invalidate an attempt (reason stored, excluded from analytics/rankings, kept for record)
- EX-40: Result changes after publication logged with old and new values

### 45.10 Anti-Cheating Measures
**MVP:**
- Server-side timer, per-student randomization, single session, no answers to client
- Disable text selection and right-click on test pages (deterrent only)
- Log tab switches / window blur; show warning; count recorded per attempt for admin review

**Future:**
- Auto-submit after N tab-switch violations
- Full-screen mode requirement
- Webcam proctoring / supervised sessions
- Per-test access codes
- IP restrictions for on-premises tests

> Tab-switch flags must be reviewed by a human before any penalty — they can be accidental.

### 45.11 Lecture & Content Protection
- EX-41: Video and PDF URLs are signed and expire after a short time
- EX-42: Videos streamed (HLS), not offered as direct file downloads
- EX-43: Optional student-name/ID watermark on video playback
- EX-44: Content visibility respects enrollment — student sees only assigned courses
- EX-45: Screen recording CANNOT be fully prevented on any web platform (inform client)

### 45.12 Acceptance Criteria for Exam Integrity
- [ ] Resume after browser close with correct remaining time
- [ ] Device clock change has no effect on remaining time
- [ ] Auto-submit at deadline even if student is offline
- [ ] Two submit clicks produce one result
- [ ] No correct answers visible in browser network traffic during test
- [ ] Question order stable per student across refreshes, different between students
- [ ] Second login ends or blocks first session per configuration
- [ ] Admin time extension and attempt invalidation both recorded in audit log
- [ ] 500 concurrent students starting 180-MCQ test stay within NFR-P2 target (≤3s)

---

## Section 46 — Assumptions & Dependencies
1. Academy provides all content (videos, MCQs with answers/explanations) on agreed dates
2. Academy confirms current MDCAT pattern and marking scheme before question bank is finalized
3. Students have smartphone or computer with internet access
4. Cloud/streaming/domain/email/SMS costs are separate from development cost
5. Concurrent users, retention period, language support confirmed per [Confirm] items above

---

## Tech Stack
| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | NextAuth.js (credentials) |
| Video (MVP) | YouTube unlisted links |
| Video (Production) | Bunny Stream or Cloudflare Stream |
| Files | Supabase Storage |
| Hosting | Vercel + Supabase |
| Testing | Vitest (unit) + Playwright (E2E) |
| Math | KaTeX |
| Validation | Zod |
