'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const [message, setMessage] = useState('Checking your session…');

  useEffect(() => {
    let isMounted = true;

    async function resolveInitialRoute(): Promise<void> {
      try {
        const supabase = getSupabaseBrowserClient();

        if (!supabase) {
          router.replace('/login');
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        router.replace(data.session ? '/dashboard' : '/login');
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : 'Routing to login…');
          router.replace('/login');
        }
      }
    }

    void resolveInitialRoute();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Opening VidyaSetu</CardTitle>
          <CardDescription>Preparing the offline-ready workspace for this device.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">{message}</CardContent>
      </Card>
    </div>
  );
}

