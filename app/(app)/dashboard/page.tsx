'use client';

import { useEffect, useState } from 'react';

import { CSRReportButton } from '@/components/dashboard/CSRReportButton';
import { FoundationPulse } from '@/components/dashboard/FoundationPulse';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RiskHeatmap } from '@/components/dashboard/RiskHeatmap';
import { VolunteerLeaderboard } from '@/components/dashboard/VolunteerLeaderboard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { readTestAccessSession } from '@/lib/utils/testAccess';
import { useAppStore } from '@/store';
import type { AppRole } from '@/types';

function isCoordinatorRole(role: AppRole | null): role is 'coordinator' | 'admin' {
  return role === 'coordinator' || role === 'admin';
}

function parseRole(candidate: unknown): AppRole | null {
  if (
    candidate === 'mentor' ||
    candidate === 'coordinator' ||
    candidate === 'admin' ||
    candidate === 'viewer'
  ) {
    return candidate;
  }

  return null;
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonCard key={`dashboard-stat-${index}`} />
        ))}
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function DashboardView() {
  const currentRole = useAppStore((state) => state.currentRole);
  const [resolvedRole, setResolvedRole] = useState<AppRole | null>(null);

  useEffect(() => {
    let active = true;

    async function resolveRole(): Promise<void> {
      const testAccess = readTestAccessSession();

      if (testAccess) {
        if (active) {
          setResolvedRole(testAccess.role);
        }
        return;
      }

      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        if (active) {
          setResolvedRole(currentRole);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw new Error(error.message);
        }

        const metadataRole = parseRole(data.session?.user.user_metadata as unknown);

        if (active) {
          setResolvedRole(metadataRole ?? currentRole);
        }
      } catch {
        if (active) {
          setResolvedRole(currentRole);
        }
      }
    }

    void resolveRole();

    return () => {
      active = false;
    };
  }, [currentRole]);

  if (resolvedRole === null) {
    return <DashboardSkeleton />;
  }

  if (!isCoordinatorRole(resolvedRole)) {
    return (
      <EmptyState
        title="Coordinator access required"
        description="This dashboard is reserved for NGO coordinators and admins who need a live operational view."
      />
    );
  }

  return <CoordinatorDashboard />;
}

function CoordinatorDashboard() {
  const { stats, students, mentors, sessions, isLoading, error } = useRealtimeDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    throw error;
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Coordinator dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Foundation Pulse</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Monitor student risk, mentor momentum, and CSR-ready evidence in one live operations view.
        </p>
      </div>
      <QuickStats stats={stats} />
      <RiskHeatmap students={students} />
      <FoundationPulse students={students} />
      <VolunteerLeaderboard mentors={mentors} />
      <div className="flex justify-end">
        <CSRReportButton stats={stats} students={students} sessions={sessions} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardView />
    </ErrorBoundary>
  );
}
