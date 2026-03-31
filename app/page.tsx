import Link from 'next/link';

import type { UserRole } from '@/types';

type RoleKey = UserRole;

interface RoleCard {
  key: RoleKey;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  accentClass: string;
  badgeClass: string;
  cardRingClass: string;
  ctaClass: string;
}

const roleCards: RoleCard[] = [
  {
    key: 'mentor',
    title: 'Mentor Login',
    subtitle: 'For teaching and assessment delivery',
    description:
      'Open your field workspace, review assigned students, log sessions, and keep offline evidence flowing when internet drops.',
    bullets: [
      'Track assigned learners and recent sessions',
      'Log assessments with offline queue support',
      'Follow sync health and at-risk student signals',
    ],
    accentClass: 'text-[#B8F04A]',
    badgeClass: 'bg-[#B8F04A]/15 text-[#B8F04A]',
    cardRingClass: 'hover:border-[#B8F04A]/70',
    ctaClass: 'bg-[#B8F04A] hover:bg-[#c7f56e] focus-visible:ring-[#B8F04A]',
  },
  {
    key: 'ngo',
    title: 'NGO Login',
    subtitle: 'For operational monitoring and oversight',
    description:
      'See mentors, learners, centers, alerts, and communication in one operating dashboard built for day-to-day program control.',
    bullets: [
      'Monitor mentor coverage and session activity',
      'Track learner risk, alerts, and engagement',
      'Review operational evidence across centers',
    ],
    accentClass: 'text-[#F2B53C]',
    badgeClass: 'bg-[#F2B53C]/15 text-[#F2B53C]',
    cardRingClass: 'hover:border-[#F2B53C]/70',
    ctaClass: 'bg-[#F2B53C] hover:bg-[#f6c56a] focus-visible:ring-[#F2B53C]',
  },
  {
    key: 'student',
    title: 'Student Login',
    subtitle: 'For personal progress and learning updates',
    description:
      'Check your recent sessions, progress trend, learning gaps, and the focus areas your mentor wants you to tackle next.',
    bullets: [
      'See your progress and recent learning evidence',
      'Review your current gap profile clearly',
      'Follow supportive focus areas and updates',
    ],
    accentClass: 'text-[#3ECFB2]',
    badgeClass: 'bg-[#3ECFB2]/15 text-[#3ECFB2]',
    cardRingClass: 'hover:border-[#3ECFB2]/70',
    ctaClass: 'bg-[#3ECFB2] hover:bg-[#61dac4] focus-visible:ring-[#3ECFB2]',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0C0F0A] text-[#E8EDE4]">
      <section className="relative overflow-hidden px-5 pb-12 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-[#B8F04A]/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-[#3ECFB2]/10 blur-3xl" aria-hidden="true" />

        <div className="mx-auto w-full max-w-6xl">
          <header className="rounded-2xl border border-white/10 bg-[#141810]/90 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#B8F04A] text-sm font-bold text-[#0C0F0A]">
                VS
              </span>
              <p className="font-display text-2xl tracking-wide text-[#B8F04A]">VidyaSetu</p>
            </div>

            <h1 className="mt-6 max-w-3xl text-3xl font-display leading-tight text-white sm:text-4xl">
              Choose your workspace and enter a role-specific learning system.
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#9AA792] sm:text-base">
              VidyaSetu keeps mentor action, NGO operations, and student progress in one connected flow.
              Start from the role that matches how you use the platform.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-[#C9D3C4]">Offline-capable session logging</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-[#C9D3C4]">Real-time learning risk visibility</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-[#C9D3C4]">Built for NGO education delivery</span>
            </div>
          </header>

          <section aria-label="Role-based login options" className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {roleCards.map((role) => (
              <article
                key={role.key}
                className={`group rounded-2xl border border-white/10 bg-[#141810] p-5 transition-all duration-200 ${role.cardRingClass} hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.25)]`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${role.badgeClass}`}>
                    {role.key}
                  </span>
                  <span className={`text-xs font-medium ${role.accentClass}`}>Secure entry</span>
                </div>

                <h2 className="mt-4 text-2xl font-display text-white">{role.title}</h2>
                <p className="mt-1 text-sm text-[#A4B09C]">{role.subtitle}</p>
                <p className="mt-4 text-sm leading-7 text-[#C6D0C0]">{role.description}</p>

                <ul className="mt-4 space-y-2 text-sm text-[#C6D0C0]">
                  {role.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <span className={`mt-1 inline-block h-2 w-2 rounded-full ${role.badgeClass}`} aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Link
                    href={`/auth?role=${role.key}&tab=signin`}
                    className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-[#0C0F0A] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141810] ${role.ctaClass}`}
                  >
                    Continue as {role.title.replace(' Login', '')}
                  </Link>
                  <Link
                    href={`/auth?role=${role.key}&tab=signup`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8EDE4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#141810]"
                  >
                    Create account
                  </Link>
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
