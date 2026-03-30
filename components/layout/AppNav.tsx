'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils/cn';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/session', label: 'Session Logger' },
  { href: '/students', label: 'Students' },
  { href: '/mentors', label: 'Mentors' },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
      <div className="mb-4 rounded-2xl bg-slate-900 px-4 py-5 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">VidyaSetu</p>
        <h1 className="mt-2 text-xl font-semibold">Field operations, not paperwork.</h1>
      </div>
      <div className="grid gap-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-2xl px-4 py-3 text-sm font-medium transition',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Offline-ready session logs, smart mentor matching, and donor-ready evidence in one flow.
      </div>
    </nav>
  );
}

