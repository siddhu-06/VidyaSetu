<div align="center">

<br/>

```
 ██╗   ██╗██╗██████╗ ██╗   ██╗ █████╗ ███████╗███████╗████████╗██╗   ██╗
 ██║   ██║██║██╔══██╗╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝╚══██╔══╝██║   ██║
 ██║   ██║██║██║  ██║ ╚████╔╝ ███████║███████╗█████╗     ██║   ██║   ██║
 ╚██╗ ██╔╝██║██║  ██║  ╚██╔╝  ██╔══██║╚════██║██╔══╝     ██║   ██║   ██║
  ╚████╔╝ ██║██████╔╝   ██║   ██║  ██║███████║███████╗   ██║   ╚██████╔╝
   ╚═══╝  ╚═╝╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝    ╚═════╝
```

### *The operating system for NGO tutoring in India.*

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-98%25-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Cost](https://img.shields.io/badge/Monthly%20Cost-₹0-B8F04A?style=flat-square)](#tech-stack)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

<br/>

> **VidyaSetu is not an EdTech app.**  
> It is the offline-first infrastructure layer that turns volunteer tutoring sessions  
> into measurable educational outcomes — visible to NGOs, parents, and donors alike.

<br/>

**Built at** · [GDG on Campus CVR](https://gdg.community.dev/) · 36-Hour National Hackathon  
**Problem Statement** · Youngistaan Foundation

<br/>

---

</div>

## The Problem

Across India, NGOs like Youngistaan Foundation coordinate thousands of volunteer tutors working with underserved children in government schools. **The volunteers are willing. The children need help. But the infrastructure is paper, WhatsApp, and hope.**

| Gap | Reality | Signal |
|-----|---------|--------|
| 📋 **No session tracking** | Volunteers use paper registers or nothing at all. A child can attend 30 sessions with zero learning history the NGO can act on. | Youngistaan currently uses paper registers + WhatsApp groups for all coordination |
| 🔍 **Undetected learning gaps** | No mechanism exists to tell a volunteer "this child cannot do two-digit arithmetic." Every session restarts from guesswork. | ASER 2024: 42% of Grade 5 children cannot do Grade 2 arithmetic |
| 👻 **Migrant children vanish** | 30% of rural families migrate seasonally. When a child moves, their learning history disappears. No platform in India maintains portable child-level learning identity. | UDISE+ 2025 |
| 💸 **Donors see no evidence** | CSR partners fund programs on trust. NGOs can't produce session-level impact reports. Funding cycles depend on anecdotes, not data. | CEP Survey 2025: 67% of NGOs report losing donors due to poor impact reporting |

---

## The Solution

**Three key insights drive VidyaSetu's architecture:**

**1. Offline-first is non-negotiable, not a nice-to-have.**  
Tutoring sessions in Nalgonda, Wanaparthy, and GHMC slum clusters happen in homes, courtyards, and community halls — not in WiFi zones. VidyaSetu captures everything locally using IndexedDB and syncs whenever a connection appears. The volunteer doesn't notice the difference. The data is never lost.

**2. The session note is the fundamental unit of intelligence.**  
When a volunteer writes *"Priya struggled with carrying in addition today,"* that sentence contains diagnostic information. VidyaSetu's lightweight NLP engine maps that note to a specific NCERT learning level (Grade 2 · Maths-2.3) and updates Priya's gap profile automatically. No forms. No rubrics. The volunteer writes naturally. The system learns.

**3. Feature-phone parents are not an edge case — they are the majority.**  
65% of parents in Youngistaan's target zones use basic keypad phones. VidyaSetu sends a simple SMS after every session. The parent replies with one letter. No smartphone. No data plan. Full engagement loop — on a ₹500 Nokia.

---

## Modules

VidyaSetu ships **six purpose-built modules**, each solving a documented Youngistaan pain point.

### M-01 · Session Logger — 60-Second Offline Session Record

> *The paper register killer.*

A volunteer opens the PWA, selects the student, taps 3–4 ASER-aligned checkboxes, writes a short free-text note, and submits. 60 seconds. Works completely offline. Replaces paper registers permanently.

- **Offline-first:** IndexedDB stores the session locally; Background Sync API pushes to Supabase when connectivity appears
- **ASER-aligned checkboxes:** 5 domains — Number recognition, Reading fluency, Comprehension, Writing, Basic arithmetic — the same domains ASER uses nationally
- **Free-text note:** 1–3 sentences fed automatically to the Gap Detector on sync
- **Learning Passport QR:** every student gets a printable QR card linking to their full learning history — portable across NGOs and cities
- **Radar chart visualisation:** 5-axis progress chart visible to the volunteer and the NGO dashboard

---

### M-02 · Ghost Mentor — Structured Session Plan Generator

> *A first-time volunteer is session-ready in under 2 minutes.*

Before the volunteer arrives, the system has already prepared a 3-step session plan based on the student's current gap profile: Warm-up → Core concept → Closing game. Content pre-loaded from DIKSHA's open API. No internet needed during the session.

- **Rule-based recommender:** gap profile (`Maths-2.3: Division`) → pulls template from pre-seeded DIKSHA library
- **30 pre-seeded session templates:** Grades 3–6, 5 subjects, offline-cached on first open
- **Session continuity score:** checks whether today's plan builds on the last session — prevents teaching the same concept twice
- **Phase 2 upgrade path:** Transformers.js distilbert (80MB, runs in-browser, tested on Redmi 9A)

---

### M-03 · Smart Match — 5-Signal Mentor–Student Pairing

> *Pure JavaScript. No ML API. No server call. Runs entirely in the browser.*

Scores every available mentor against a student's profile across 5 signals and presents the top 3 matches with plain-language explanations. Replaces WhatsApp group matching chaos.

| Signal | Description |
|--------|-------------|
| **Subject fit** | Student gap tags vs. mentor's declared expertise (0–1 score) |
| **Availability overlap** | Calendar time-slot alignment |
| **Learning pace** | Student's assessed pace vs. mentor's historical session tempo |
| **Outcome history** | Did this mentor's previous students improve? (initialised at 0.5) |
| **Gender safety** | For girl students, option to prefer female mentors |

*Result UI → `"Ravi — 87% match. Why? Maths expert + 9 AM available + fast-pace"`*

---

### M-04 · Parent Connect Bridge — SMS Engagement for Feature-Phone Families ★

> *The most genuinely novel feature in Indian EdTech.*

65% of parents in Youngistaan's target zones use basic keypad phones. VidyaSetu sends a post-session SMS. The parent replies with one letter. The NGO gets engagement data.

```
VidyaSetu  →  "Priya ne aaj Maths ki class ki. Khush hain? H bhejo khush ke liye, C bhejo concern ke liye."
Parent     ←  H
Webhook    →  logs sentiment → updates child engagement score → NGO dashboard refreshed
3× C reply →  escalation alert to NGO coordinator
2 wk silence → "parent unreachable" flag → prompts in-person visit
```

- Accepted replies: `H / haan / han / yes / happy` → Happy · `C / concern / nahi / no` → Concern
- WhatsApp fallback for smartphone parents (richer format, same logic)
- Telugu SMS version available via i18next

---

### M-05 · Foundation Pulse — NGO Coordinator Dashboard

> *Live operational intelligence. Three questions, answered instantly.*

Which students are falling behind? Which volunteers are showing up? What can I show my donor this quarter?

- **Risk heatmap:** students colour-coded by risk score — red, amber, green
- **Foundation Pulse healing chart:** a struggling student's score rising week by week — the emotional peak of every demo
- **Program analytics:** sessions per week, subject gap distribution, parent engagement rate
- **Volunteer leaderboard:** session count, student improvement rate per mentor
- **CSR Report generation:** one-click PDF with program outcomes, generated by jsPDF — no manual data entry

---

### M-06 · Learning Passport — Portable Child Identity via QR

> *The feature that solves the problem no other platform in India addresses.*

A printable QR card — or a WhatsApp-shareable link — that carries a child's full learning profile across cities, NGOs, and state borders. 30% of rural families migrate seasonally. Every existing EdTech platform abandons that child at the state border. **VidyaSetu does not.**

The QR carries: complete session history (encrypted, Supabase hosted) · current gap profile (5 domains, ASER-aligned) · current learning level per subject · last mentor + session continuity data · parent contact for SMS bridge handover.

*Physical QR print works even if the receiving NGO is not yet on VidyaSetu — any coordinator can scan to a mobile-friendly webpage.*

---

## Intelligence Layer

### Gap Detector — Rule-Based NLP

```
keyword → NCERT standard mapping

"carrying"  | "regroup"            → Maths-2.3
"multiplication table" | "tables"  → Maths-3.1
"reading aloud" | "sounding out"   → Hindi-L1.2
"comprehension" | "summary"        → Hindi-L2.4
"fraction" | "half" | "quarter"    → Maths-4.2

gap score = (missed / attempted) over rolling 4 sessions
```

400-keyword map covers all NCERT Grade 1–6 learning standards. Zero dependencies. Always works offline. Accuracy improves with session volume — no retraining required. Fallback: unclassified sessions remain visible to the coordinator.

### Student Risk Scorer — 3-Signal Alert

Runs automatically after every sync. Flags students who need coordinator attention before they fall too far behind to catch up.

- **Signal 1 — Attendance drop:** missed 2+ of last 4 sessions
- **Signal 2 — Gap stagnation:** same gap persists across 3+ sessions
- **Signal 3 — Parent silence:** no SMS reply for 2 consecutive weeks

> A child flagged across all 3 signals triggers a **"Foundation Pulse critical"** alert — visible on the NGO dashboard and sent as an SMS to the assigned coordinator. This is triage for children at risk of dropping out entirely.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    PRESENTATION                     │
│   Next.js 15 · Tailwind CSS · Recharts · PWA Shell  │
├─────────────────────────────────────────────────────┤
│                    INTELLIGENCE                     │
│   Rule-based NLP (Gap Detector) · Risk Scorer       │
│   Smart Match Engine · Ghost Mentor Recommender     │
├─────────────────────────────────────────────────────┤
│                 OFFLINE PERSISTENCE                 │
│   IndexedDB · Background Sync API · Service Worker  │
│   (Workbox) · DIKSHA Content Cache                  │
├─────────────────────────────────────────────────────┤
│                     SYNC LAYER                      │
│   Supabase (Postgres + Realtime + Auth + Webhooks)  │
├─────────────────────────────────────────────────────┤
│                  COMMUNICATION                      │
│   Twilio SMS · Fast2SMS · WhatsApp Cloud API        │
│   i18next (Hindi + Telugu)                          │
└─────────────────────────────────────────────────────┘
```

**The sync event:** IndexedDB queues records offline → Background Sync API detects connectivity → Service Worker pushes to Supabase → Gap Detector runs → Risk Scorer reruns → Foundation Pulse updates in realtime → Parent SMS fires.

---

## Tech Stack

| Technology | Role | Why | Cost |
|------------|------|-----|------|
| **Next.js + Vercel** | Frontend + hosting | SSR + PWA support. Vercel free tier handles NGO-scale traffic permanently. | Free |
| **Supabase** | Database, realtime, auth, webhooks | 200 students × 52 sessions × 2KB = ~20MB/yr. Free tier lasts 10+ years for a typical NGO. | Free |
| **IndexedDB + Background Sync API** | Offline storage and sync | Browser-native. No library. Zero cost. Works on Android 8.0+. | Free |
| **Service Worker (Workbox)** | PWA offline capability | Google-maintained, open-source. Caches DIKSHA content library on first load. | Free |
| **DIKSHA Open API** | Session content library (Grades 3–6) | Government of India's official educational content platform. NCERT-aligned. | Free |
| **Rule-based NLP (custom JS)** | Gap Detector keyword mapping | Zero dependencies. Always works offline. 400-keyword map. No ML training required. | Free |
| **Twilio SMS / Fast2SMS** | Parent SMS bridge | Twilio free trial for demo. Fast2SMS free tier (50 SMS/day) for pilot. DLT: 24 hrs, ₹0. | Free |
| **jsPDF** | CSR report generation | Client-side PDF. No server required. One-click donor report. | Free |
| **Recharts** | Dashboard charts + radar visualisation | Open-source React charting. Responsive. | Free |
| **i18next** | Hindi / Telugu localisation | SMS templates, app UI, and session plans in both languages. | Free |
| **qrcode.js** | Learning Passport QR generation | Generates printable QR cards. No server required. Works offline. | Free |

**Monthly infrastructure cost: ₹0.** No proprietary dependencies. No vendor lock-in.

> **Why not Transformers.js / Gemma-3?** Gemma-3 4B requires 4GB+ RAM and crashes on ₹5,000–₹8,000 Android devices used by field volunteers. Transformers.js distilbert (80MB) is technically viable but adds demo risk. The rule-based NLP gap detector is faster, always works, and easier to explain. Transformers.js is documented as the **Phase 2 upgrade path** — demonstrating architectural foresight, not limitation.

---

## Project Structure

```
VidyaSetu/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
│   ├── dashboard/          # Foundation Pulse NGO dashboard
│   ├── session/            # Session Logger module
│   ├── mentor/             # Ghost Mentor + Smart Match
│   ├── passport/           # Learning Passport QR
│   └── sms/                # Parent Connect Bridge
├── hooks/                  # Custom React hooks
├── i18n/                   # Hindi + Telugu translations
├── lib/                    # Core logic
│   ├── nlp/                # Gap Detector keyword engine
│   ├── risk/               # Student Risk Scorer
│   ├── match/              # Smart Match algorithm
│   └── sync/               # IndexedDB + Background Sync
├── public/                 # Static assets + PWA manifest
├── scripts/                # Utility + seed scripts
├── store/                  # State management
├── supabase/               # DB schema + migrations + RLS
├── tests/                  # Vitest test suite
├── types/                  # TypeScript type definitions
├── .env.local.example      # Environment variable template
└── vitest.config.ts        # Test configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A [Supabase](https://supabase.com) account (free)
- A [Twilio](https://twilio.com) account for SMS (free trial)

### Installation

```bash
# Clone the repository
git clone https://github.com/siddhu-06/VidyaSetu.git
cd VidyaSetu

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# SMS Bridge
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Optional: Fast2SMS (for production pilot)
FAST2SMS_API_KEY=your_fast2sms_key
```

### Database Setup

```bash
# Apply Supabase migrations
npx supabase db push

# Seed DIKSHA content library (offline cache)
npm run seed:diksha
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
npm run test
```

---

## The Complete Tutoring Workflow

*One session. Five stakeholders touched. 48 minutes.*

```
T − 10 min  ·  Volunteer opens VidyaSetu (Airplane Mode ON)
              Ghost Mentor loads Priya's 3-step plan from IndexedDB.
              App loads in <2s. No internet. No waiting.

T +  0 min  ·  Session begins
              Volunteer follows the plan. Priya works through Warm-up →
              Core concept (carrying method) → Closing quiz (4/5 correct).

T + 45 min  ·  60-second session log (still offline)
              Volunteer taps checkboxes, writes free-text note.
              IndexedDB stores the record. "Session saved. Will sync when online."

T + 47 min  ·  WiFi detected — Background Sync fires automatically
              Service Worker pushes to Supabase. Gap Detector runs.
              Priya's Maths-2.3 gap score: 0.75 → 0.20. Risk score: GREEN.
              Foundation Pulse dashboard updates in realtime.

T + 48 min  ·  Parent SMS sent. NGO dashboard updated.
              "Priya ne aaj Maths ki class ki. H bhejo."
              Priya's mother replies H on her Nokia keypad.
              Engagement score updated. CSR report is one click away.

────────────────────────────────────────────────────────
 Volunteer: guided.  Student: supported.  Parent: informed.
 NGO: data-rich.  Donor: proof-ready.
────────────────────────────────────────────────────────
```

---

## Stakeholders

| Role | Before VidyaSetu | After VidyaSetu |
|------|-----------------|-----------------|
| 🧑‍🏫 **Volunteer** | Shows up with no plan, no history, improvises every session | Arrives with a 3-step plan. Knows exactly where the child is. Session-ready in 2 minutes. |
| 👧 **Student** | Learning history resets with every new volunteer or city move | Continuous learning profile. Portable QR identity. Sessions build on each other — never from zero. |
| 📱 **Parent** | No visibility into sessions. No way to communicate concerns. | Post-session SMS in Hindi or Telugu. Single-letter reply. Concern escalation. Works on a ₹500 Nokia. |
| 🏢 **NGO Coordinator** | Manages 20+ volunteers via WhatsApp. No session quality visibility. | Live dashboard. Risk alerts before children fall behind. One-click CSR report for any donor. |
| 💼 **CSR Donor** | Funds programs on anecdotes and annual reports. | Session-level outcome data. Student learning curves. Standardised impact PDF. Evidence-based renewal. |

---

## Scale Vision

```
Month 1    ·  Youngistaan Hyderabad Pilot
              50 students · 20 volunteers · 3 centers
              Nalgonda, Wanaparthy, GHMC slum clusters
              Real data. Real SMS replies. Real CSR PDF for Synchrony.

Month 3    ·  Multi-City Expansion
              Youngistaan operates in 60 cities.
              VidyaSetu scales with zero additional infrastructure cost.
              Anonymous benchmarking begins across programs.

Year 1     ·  NGO Network Effect
              Cross-NGO benchmarks → India's first NGO education intelligence layer.
              Learning gap data at national scale available to researchers.
              Platform becomes self-reinforcing.

Year 2     ·  Government Integration
              VidyaSetu session data feeds Vidya Samiksha Kendra (VSK).
              DigiLocker integration → formal digital academic identity.
              UDISE+ NGO data layer. Learning Passport → national standard.

Year 3     ·  Feature-Phone India at Scale
              IVRS (missed-call + keypress) for parents who cannot type.
              Every non-smartphone parent in India is now reachable.
              250 million underserved children — every one visible to someone who can help.
```

---

## Offline Demo Proof

> Enable Airplane Mode. Open VidyaSetu. Log a session. Re-enable WiFi.  
> Watch Supabase receive the data.  
> **The entire flow takes 10 seconds.**

This single demonstration settles every *"but what about connectivity?"* question before it can be asked.

---

## Frequently Asked Questions

**"The SMS system requires DLT registration — how long does that take?"**  
DLT registration takes 24–72 hours through any telecom operator. For demo, Twilio's free trial operates in sandbox mode and bypasses DLT. Fast2SMS provides DLT support within 24 hours at ₹0 — already on the post-hackathon deployment timeline.

**"How is this different from Pratham, Teach For India, or other EdTech platforms?"**  
Pratham generates national data. Teach For India trains teachers. VidyaSetu is operational infrastructure for NGO-run tutoring programs — the layer those platforms do not provide. It is offline-first (others are not), closes the feedback loop with non-smartphone parents (others cannot), and generates donor-ready impact reports from session data (others require manual compilation).

**"Will rule-based NLP be accurate enough for real learning gap detection?"**  
For detecting whether a session note mentions a specific curriculum concept, a curated keyword map outperforms general NLP models. A volunteer who writes "Priya struggled with carrying" is giving a precise diagnostic signal. The 400-keyword map covers all NCERT Grade 1–6 standards. Accuracy improves with session volume without retraining. Transformers.js distilbert is the documented Phase 2 upgrade.

**"Supabase free tier is only 500MB — how long does that last?"**  
200 students × 52 sessions × 2KB per record = ~20MB/year. Including all metadata and profiles: ~50MB/year. **The Supabase free tier lasts over 10 years for a 200-student NGO.**

**"What is the sustainability model?"**  
The platform costs ₹0/month at NGO scale. The sustainability model is institutional: NGOs that generate credible CSR reports retain corporate funding partners at measurably higher rates. A freemium tier (advanced analytics, multi-city benchmarking, UDISE+ integration) is the future revenue path, priced below any NGO's existing data management cost.

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**VidyaSetu** · Built with purpose at GDG on Campus CVR · Hyderabad, India

*"The volunteers exist. The children exist. The funding exists.*  
*What was missing was the connecting layer."*

<br/>

[⭐ Star this repo](https://github.com/siddhu-06/VidyaSetu) · [🐛 Report a bug](https://github.com/siddhu-06/VidyaSetu/issues) · [💡 Request a feature](https://github.com/siddhu-06/VidyaSetu/issues)

</div>
