'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { role, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.replace('/auth');
      return;
    }
    if (role === 'ngo') {
      router.replace('/dashboard/ngo');
      return;
    }
    if (role === 'volunteer') {
      router.replace('/dashboard/volunteer');
      return;
    }
    if (role === 'student') {
      router.replace('/dashboard/student');
    }
  }, [role, loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#0C0F0A' }}>
      <p style={{ color: '#7A8872', fontSize: 14 }}>Loading your dashboard…</p>
    </div>
  );
}
