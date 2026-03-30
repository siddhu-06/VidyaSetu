'use client';

import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push('/auth');
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8" style={{ background: '#0C0F0A' }}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: '#3ECFB2' }}>
              Student Dashboard
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#7A8872' }}>
              Welcome {profile?.first_name ?? 'Student'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="rounded-xl border px-4 py-2 text-sm transition hover:text-[#E8EDE4]"
            style={{ borderColor: 'rgba(255,255,255,0.10)', color: '#7A8872' }}
          >
            Sign out
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {['My Progress', 'Badges', 'Learning Passport'].map((section) => (
            <section
              key={section}
              className="rounded-2xl border p-5"
              style={{ background: '#141810', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <h2 className="text-base font-semibold" style={{ color: '#E8EDE4' }}>
                {section}
              </h2>
              <p className="mt-2 text-sm" style={{ color: '#7A8872' }}>
                Placeholder section for {section.toLowerCase()}.
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

