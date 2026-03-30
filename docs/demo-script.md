## ████ SECTION 12 — DEMO SCRIPT ████

```
DEMO DEVICE: Android phone (Chrome), Airplane Mode capable

SETUP (before judges arrive):
  - App installed as PWA (Add to Home Screen done)
  - Student cache pre-loaded (open app once while online)
  - Template cache pre-loaded (30 session plans cached)
  - session_queue empty — SyncStatusBadge shows "0 pending"
  - Seed data confirmed: 4 red, 4 amber, 4 green in dashboard

─────────────────────────────────────────
ACT 1 — "The Airplane Mode proof"  [0:00–1:00]
─────────────────────────────────────────
ACTION : Enable Airplane Mode in full view of judges
VERIFY : OfflineBanner appears — "Offline — sessions will sync when online"
ACTION : Open VidyaSetu PWA from home screen
VERIFY : App loads in under 2 seconds (Service Worker cache)
ACTION : Navigate to Students → tap "Priya Sharma" (Grade 5, Nalgonda)
VERIFY : Learning Passport loads entirely from IndexedDB —
           Radar chart: Math 2.3 · Reading 2.0 · Science 1.8
           QR code renders without any network request
ACTION : Tap "Session Plan" for Priya
VERIFY : Template "Fractions catch-up (Grade 4–5)" loads from cache
SCRIPT : "Every volunteer in Nalgonda sees exactly this.
          No WiFi. No data plan. The system works."

─────────────────────────────────────────
ACT 2 — "Foundation Pulse — emotional setup"  [1:00–2:00]
─────────────────────────────────────────
ACTION : Navigate to Dashboard (still in Airplane Mode)
VERIFY : Risk heatmap loads from student_cache —
           4 red cards · 4 amber cards · 4 green cards visible
ACTION : Tap Priya's red card → Foundation Pulse tab
VERIFY : Healing chart shows all 8 weeks —
           Math: 4.2 → 4.0 → 3.8 → 3.5 → 3.2 → 2.9 → 2.6 → 2.3
           Reading: 3.1 → 3.0 → 2.9 → 2.8 → 2.6 → 2.4 → 2.2 → 2.0
SCRIPT : "This is Priya's journey. Eight weeks of data.
          Watch what a single session does."

─────────────────────────────────────────
ACT 3 — "Log offline → watch sync"  [2:00–3:15]
─────────────────────────────────────────
ACTION : Navigate to Session Logger (still in Airplane Mode)
ACTION : Select "Priya Sharma" from student list
ACTION : Set skill ratings —
           Math: Improving
           Reading: Steady
           Science / English / Comprehension: Not Covered
ACTION : Type note —
           "Carrying clicked today — used house method.
            Still hesitant on 3-digit numbers."
ACTION : Tap "Save Session"
VERIFY : Toast — "Session saved. Will sync when online."
         SyncStatusBadge — "1 pending"
         IndexedDB session_queue has 1 record with synced: false
ACTION : Disable Airplane Mode
VERIFY : Within 3–5 seconds —
           SyncStatusBadge: "Syncing..." → "Synced ✓"
           Foundation Pulse chart: Math updates to ~2.0
           Priya's risk card: red → amber
SCRIPT : "The Service Worker detected connectivity.
          Session pushed to Supabase. Gap detector ran.
          Priya's score improved — automatically."

─────────────────────────────────────────
ACT 4 — "The feature-phone moment"  [3:15–4:15]
─────────────────────────────────────────
ACTION : Navigate to Dashboard → SMS Log section
VERIFY : New entry shows —
           "Priya ne aaj Maths ki class ki. H bhejo."
ACTION : On second device (prop phone or second Android) —
           Reply "H" to the Twilio number
VERIFY : Within 10 seconds —
           sms_log row updates: reply = "H", sentiment = 1
           Priya's engagement_score increments in students table
           Dashboard engagement rate stat updates
SCRIPT : "65% of parents in this program use a phone exactly like this.
          VidyaSetu is the only platform in India
          that closes the feedback loop with them."

─────────────────────────────────────────
ACT 5 — "One-click CSR report"  [4:15–5:00]
─────────────────────────────────────────
ACTION : Navigate to Dashboard → tap "Generate CSR Report"
VERIFY : PDF downloads in under 3 seconds
         Filename: vidyasetu-csr-{Month}-{Year}.pdf
         PDF contains:
           Sessions completed this month
           Learning gains per subject
           Parent engagement rate
           Student risk distribution (red / amber / green)
SCRIPT : "This is what Youngistaan's Synchrony donor
          has been asking for since 2018.
          It now takes one click."
```

---

## ████ SECTION 14 — QUALITY GATES (with loop-break rule) ████

Run these checks in order. Fix one error at a time. Do not skip ahead.

```
CHECK 1 — TypeScript
  Command : npx tsc --noEmit
  Expected: 0 errors
  If fails : Read the FIRST error only. Fix that one file. Run again.
             Do NOT touch any other file. Do NOT run check 2 yet.

CHECK 2 — Lint
  Command : npx next lint
  Expected: 0 errors, 0 warnings
  If fails : Same rule — fix first error only, one file, run again.

CHECK 3 — Build
  Command : npm run build
  Expected: Process exits 0. No red text in output.
  If fails : Read the FIRST error line only.
             Look up the file it points to.
             Fix only that file.
             Run npm run build once more.
             STOP after 3 attempts. If still failing after 3 attempts,
             paste the exact error here and wait for a human fix.
             DO NOT guess. DO NOT touch unrelated files. DO NOT loop.

CHECK 4 — PWA
  Tool    : Chrome DevTools → Lighthouse → PWA category
  Expected: Score ≥ 90
  If fails : Check manifest.json icons exist in /public/icons/

CHECK 5 — Offline
  Tool    : Chrome DevTools → Network tab → check "Offline"
  Action  : Refresh the page
  Expected: App loads fully from Service Worker cache in under 2 seconds

CHECK 6 — IndexedDB
  Tool    : Chrome DevTools → Application → Storage → IndexedDB → vidyasetu
  Expected: 4 stores present —
              session_queue
              student_cache
              template_cache
              sync_log

CHECK 7 — Sync
  Action  : 1. Check "Offline" in DevTools
             2. Open Session Logger → log a session → save
             3. Verify IndexedDB session_queue has 1 record (synced: false)
             4. Uncheck "Offline"
             5. Watch SyncStatusBadge
  Expected: Session appears in Supabase sessions table within 5 seconds

CHECK 8 — RLS
  Action  : Log in as Ravi Kumar (ravi.kumar@demo.vidyasetu.app)
             Open browser console → run:
             supabase.from('students').select('*').then(console.log)
  Expected: Only Nalgonda center students returned (4 students, not 12)
```

### Critical Checklist — tick every box before hackathon demo

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx next lint` → 0 errors, 0 warnings
- [ ] `npm run build` → exits 0
- [ ] App loads from Service Worker in Airplane Mode (under 2 seconds)
- [ ] OfflineBanner appears when device goes offline
- [ ] SyncStatusBadge shows pending count while offline
- [ ] Session written to IndexedDB while offline (synced: false)
- [ ] Session syncs to Supabase within 5 seconds of going online
- [ ] Gap Detector Edge Function runs post-sync (check gap_history table updated)
- [ ] Risk Scorer updates student.risk_color (check students table)
- [ ] Foundation Pulse chart shows 8 weeks of Priya's healing data
- [ ] Risk heatmap shows exactly 4 red, 4 amber, 4 green
- [ ] CSR PDF downloads with correct filename format
- [ ] Learning Passport loads from IndexedDB (no network request)
- [ ] QR code renders offline
- [ ] SMS sent after session sync (check sms_log table in Supabase)
- [ ] SMS reply H updates engagement_score on student row
- [ ] Magic link login works (check email arrives)
- [ ] RLS blocks mentor from seeing other center's students

---

## ████ GIT COMMIT — after all 19 checklist items are ticked ████

```bash
# Stage only the two files you changed in this module
git add supabase/migrations/003_seed_data.sql

# If you have a demo script or checklist file, add it too
git add docs/demo-script.md   # or wherever you saved Module 13

git commit -m "fix: seed data FK violations and demo checklist

- 003_seed_data.sql: drop NOT NULL on user_id for seed-safe mentor insert
- 003_seed_data.sql: add ON CONFLICT DO NOTHING to all inserts
- 003_seed_data.sql: fix INTERVAL syntax for gap_history dates
- 003_seed_data.sql: remove duplicate offline_id in Priya sessions
- Module 13: add loop-break rule to build quality gate (max 3 attempts)
- Module 13: clarify demo VERIFY steps with exact data values"

git push origin main
```
