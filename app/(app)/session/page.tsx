'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { SessionLoggerForm } from '@/components/session/SessionLoggerForm';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { readTestAccessSession } from '@/lib/utils/testAccess';

export default function SessionPage() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess(): Promise<void> {
      try {
        if (readTestAccessSession()) {
          if (isMounted) {
            setIsReady(true);
          }
          return;
        }

        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          router.replace('/login');
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw new Error(error.message);
        }

        if (!data.session) {
          router.replace('/login');
          return;
        }

        if (isMounted) {
          setIsReady(true);
        }
      } catch {
        router.replace('/login');
      }
    }

    void checkAccess();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isReady) {
    return <SkeletonCard />;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Log Session</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Capture what happened in today&apos;s lesson, even if this device is offline right now.
        </p>
      </div>
      <SessionLoggerForm />
    </div>
  );
}
