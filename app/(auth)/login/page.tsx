'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/utils/validation';
import { useAppStore } from '@/store';

export default function LoginPage() {
  const setCurrentRole = useAppStore((state) => state.setCurrentRole);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'mentor' | 'coordinator' | 'viewer'>('mentor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    const parsedInput = loginSchema.safeParse({ email, role });

    if (!parsedInput.success) {
      setErrorMessage(parsedInput.error.issues[0]?.message ?? 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      setCurrentRole(role);
      const supabase = getSupabaseBrowserClient();

      if (!supabase) {
        setMessage('Supabase is not configured yet. Add environment variables to enable magic-link login.');
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: parsedInput.data.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo:
            typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
          data: {
            role: parsedInput.data.role,
          },
        },
      });

      if (error) {
        throw error;
      }

      setMessage(`Magic link sent to ${parsedInput.data.email}. Open it on this device to continue.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to send magic link.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(135deg,_#f8fafc,_#e2e8f0)] px-4 py-10">
      <Card className="w-full max-w-lg overflow-hidden">
        <CardHeader className="bg-slate-900 text-white">
          <CardTitle>Sign in with a magic link</CardTitle>
          <CardDescription className="text-slate-300">
            Built for NGO teams who need field-ready tools that survive patchy connectivity.
          </CardDescription>
        </CardHeader>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <CardContent className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Email address</span>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                type="email"
                placeholder="volunteer@youngistaan.org"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Sign in as</span>
              <select
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as 'mentor' | 'coordinator' | 'viewer')
                }
              >
                <option value="mentor">Volunteer mentor</option>
                <option value="coordinator">NGO coordinator</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Login needs internet once. After that, the session logger and cached pages continue to work offline.
            </div>
            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {message}
              </div>
            ) : null}
            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {errorMessage}
              </div>
            ) : null}
            <Button type="submit" isLoading={isSubmitting}>
              Send magic link
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

