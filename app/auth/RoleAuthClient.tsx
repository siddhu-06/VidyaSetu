'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types';

type AuthTab = 'signin' | 'signup';
type ToastTone = 'error' | 'success';

interface ToastState {
  tone: ToastTone;
  message: string;
}

interface BootstrapPayload {
  role: UserRole;
  city?: string;
  orgName?: string;
  phone?: string;
  grade?: 3 | 4 | 5 | 6;
}

const ROLE_META: Record<
  UserRole,
  {
    label: string;
    icon: string;
    accent: string;
    tintedBg: string;
    loginLabel: string;
    helper: string;
  }
> = {
  mentor: {
    label: 'Mentor',
    icon: 'M',
    accent: '#B8F04A',
    tintedBg: 'rgba(184,240,74,0.12)',
    loginLabel: 'Mentor',
    helper: 'Manage learners, assessments, and sync-ready field sessions.',
  },
  ngo: {
    label: 'NGO',
    icon: 'N',
    accent: '#F2B53C',
    tintedBg: 'rgba(242,181,60,0.12)',
    loginLabel: 'NGO',
    helper: 'Monitor centers, mentors, learners, alerts, and communication.',
  },
  student: {
    label: 'Student',
    icon: 'S',
    accent: '#3ECFB2',
    tintedBg: 'rgba(62,207,178,0.12)',
    loginLabel: 'Student',
    helper: 'See your progress, recent sessions, and focus areas clearly.',
  },
};

function mapAuthError(rawMessage: string): string {
  const message = rawMessage.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please confirm your email. Check your inbox.';
  }
  if (message.includes('user already registered')) {
    return 'Account exists. Try signing in instead.';
  }
  if (message.includes('password should be')) {
    return 'Password must be at least 8 characters.';
  }
  if (message.includes('failed to fetch')) {
    return 'Network error. Check your connection.';
  }

  return rawMessage;
}

export function RoleAuthClient() {
  const router = useRouter();
  const { signIn, signUp, signOut, resetPassword, reloadProfile } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('mentor');
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [city, setCity] = useState('');
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [grade, setGrade] = useState<3 | 4 | 5 | 6>(5);

  const accent = ROLE_META[selectedRole].accent;

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const roleParam = searchParams.get('role');
    const tabParam = searchParams.get('tab');

    if (roleParam === 'mentor' || roleParam === 'ngo' || roleParam === 'student') {
      setSelectedRole(roleParam);
    }

    if (tabParam === 'signin' || tabParam === 'signup') {
      setActiveTab(tabParam);
    }
  }, []);

  const canSubmitSignIn = useMemo(
    () => signInEmail.trim().length > 0 && signInPassword.trim().length > 0,
    [signInEmail, signInPassword],
  );

  const canSubmitSignUp = useMemo(() => {
    if (!firstName.trim() || !lastName.trim() || !signUpEmail.trim() || !city.trim() || !orgName.trim()) {
      return false;
    }

    if (signUpPassword.length < 8) {
      return false;
    }

    if (selectedRole === 'mentor' && phone.trim().length < 10) {
      return false;
    }

    return true;
  }, [city, firstName, lastName, orgName, phone, selectedRole, signUpEmail, signUpPassword]);

  function showError(message: string) {
    setToast({ tone: 'error', message });
  }

  function showSuccess(message: string) {
    setToast({ tone: 'success', message });
  }

  async function fetchProfileRole(userId: string): Promise<UserRole | null> {
    const { data, error } = await supabase.from('user_profiles').select('role').eq('id', userId).maybeSingle();

    if (error) {
      return null;
    }

    return (data?.role as UserRole | undefined) ?? null;
  }

  async function bootstrapProfile(payload: BootstrapPayload): Promise<void> {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new Error('Your session is missing. Please sign in again.');
    }

    const response = await fetch('/api/auth/bootstrap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? 'Unable to prepare this account for dashboard access.');
    }

    await reloadProfile();
  }

  async function handleSignInSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);

    if (!canSubmitSignIn) {
      showError('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(signInEmail.trim(), signInPassword);
      const user = result.user;

      if (!user) {
        throw new Error('Sign in succeeded, but no user session was returned.');
      }

      const metadataRole = user.user_metadata?.role as UserRole | undefined;
      const profileRole = await fetchProfileRole(user.id);
      const resolvedRole = profileRole ?? metadataRole;

      if (resolvedRole && resolvedRole !== selectedRole) {
        await signOut();
        showError(`This account is registered as ${ROLE_META[resolvedRole].loginLabel}. Select the correct role.`);
        return;
      }

      await bootstrapProfile({ role: selectedRole });
      router.push('/dashboard');
    } catch (error) {
      showError(mapAuthError(error instanceof Error ? error.message : 'Unable to sign in.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setToast(null);

    if (!signInEmail.trim()) {
      showError('Enter your email above, then use Forgot password.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(signInEmail.trim());
      showSuccess('Password reset email sent. Please check your inbox.');
    } catch (error) {
      showError(mapAuthError(error instanceof Error ? error.message : 'Unable to reset password.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setToast(null);

    if (!canSubmitSignUp) {
      showError('Please complete all required fields for this role before creating the account.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(
        signUpEmail.trim(),
        signUpPassword,
        selectedRole,
        firstName.trim(),
        lastName.trim(),
        city.trim(),
        orgName.trim(),
        {
          phone: selectedRole === 'mentor' ? phone.trim() : undefined,
          grade: selectedRole === 'student' ? grade : undefined,
        },
      );

      if (result.session) {
        await bootstrapProfile({
          role: selectedRole,
          city: city.trim(),
          orgName: orgName.trim(),
          phone: selectedRole === 'mentor' ? phone.trim() : undefined,
          grade: selectedRole === 'student' ? grade : undefined,
        });
        router.push('/dashboard');
        return;
      }

      showSuccess('Account created. Please sign in with your credentials.');
      setActiveTab('signin');
      setSignInEmail(signUpEmail.trim());
      setSignInPassword('');
    } catch (error) {
      showError(mapAuthError(error instanceof Error ? error.message : 'Unable to create account.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0C0F0A] px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(184,240,74,0.14),_transparent_32%),linear-gradient(180deg,_rgba(20,24,16,0.96),_rgba(12,15,10,0.92))] p-7 text-[#E8EDE4] sm:p-9">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#B8F04A] text-sm font-bold text-[#0C0F0A]">
              VS
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-[#A7B49F]">Role-based access</span>
          </div>

          <h1 className="mt-8 max-w-xl font-display text-4xl leading-tight text-white sm:text-5xl">
            Sign in to the right workspace from the very first step.
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#B9C3B2] sm:text-base">
            Mentor, NGO, and student accounts each land in a purpose-built flow. Pick the role that
            matches your work, then continue with secure email and password access.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {(Object.keys(ROLE_META) as UserRole[]).map((roleKey) => {
              const roleConfig = ROLE_META[roleKey];
              const isActive = selectedRole === roleKey;

              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setSelectedRole(roleKey)}
                  className="rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141810]"
                  style={{
                    borderColor: isActive ? roleConfig.accent : 'rgba(255,255,255,0.10)',
                    background: isActive ? roleConfig.tintedBg : '#1C2218',
                    color: '#E8EDE4',
                  }}
                >
                  <div
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                    style={{
                      background: isActive ? roleConfig.accent : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#0C0F0A' : '#E8EDE4',
                    }}
                  >
                    {roleConfig.icon}
                  </div>
                  <p className="mt-4 text-sm font-semibold" style={{ color: isActive ? roleConfig.accent : '#E8EDE4' }}>
                    {roleConfig.label}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#99A594]">{roleConfig.helper}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section
          className="overflow-hidden rounded-[28px] border"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: '#141810',
          }}
        >
          <div
            className="h-px w-full"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
            }}
          />
          <div className="px-6 pb-7 pt-6 sm:px-8">
            <h2 className="text-center font-display text-4xl tracking-wide" style={{ color: '#B8F04A' }}>
              VidyaSetu
            </h2>
            <p className="mt-2 text-center font-mono text-xs uppercase tracking-[0.24em]" style={{ color: '#7A8872' }}>
              Learning operations for Bharat
            </p>

            <div className="mt-6 rounded-xl p-[3px]" style={{ background: '#1C2218' }}>
              <div className="grid grid-cols-2 gap-[3px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderColor: activeTab === 'signin' ? accent : 'transparent',
                    background: activeTab === 'signin' ? '#141810' : 'transparent',
                    color: activeTab === 'signin' ? accent : '#7A8872',
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    borderColor: activeTab === 'signup' ? accent : 'transparent',
                    background: activeTab === 'signup' ? '#141810' : 'transparent',
                    color: activeTab === 'signup' ? accent : '#7A8872',
                  }}
                >
                  Create Account
                </button>
              </div>
            </div>

            {activeTab === 'signin' ? (
              <form className="mt-6 space-y-4" onSubmit={handleSignInSubmit}>
                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                    Email
                  </span>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                    className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus-visible:ring-2"
                    style={{
                      background: '#1C2218',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: '#E8EDE4',
                    }}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                    Password
                  </span>
                  <div className="relative">
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(event) => setSignInPassword(event.target.value)}
                      className="h-11 w-full rounded-xl border px-3 pr-11 text-sm outline-none transition focus-visible:ring-2"
                      style={{
                        background: '#1C2218',
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: '#E8EDE4',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: '#7A8872' }}
                    >
                      {showSignInPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <div className="flex justify-between gap-3">
                  <p className="text-xs" style={{ color: '#7A8872' }}>
                    Signing in as {ROLE_META[selectedRole].label}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleForgotPassword()}
                    className="text-xs underline underline-offset-4"
                    style={{ color: '#7A8872' }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !canSubmitSignIn}
                  className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: accent, color: '#0C0F0A' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Please wait...
                    </span>
                  ) : (
                    `Sign In as ${ROLE_META[selectedRole].label}`
                  )}
                </button>
              </form>
            ) : (
              <form className="mt-6 space-y-4" onSubmit={handleSignUpSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                      First Name
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        background: '#1C2218',
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: '#E8EDE4',
                      }}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                      Last Name
                    </span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        background: '#1C2218',
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: '#E8EDE4',
                      }}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                    Email
                  </span>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                    className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                    style={{
                      background: '#1C2218',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: '#E8EDE4',
                    }}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                    Password
                  </span>
                  <div className="relative">
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(event) => setSignUpPassword(event.target.value)}
                      className="h-11 w-full rounded-xl border px-3 pr-11 text-sm outline-none transition"
                      style={{
                        background: '#1C2218',
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: '#E8EDE4',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                      style={{ color: '#7A8872' }}
                    >
                      {showSignUpPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                    City / District
                  </span>
                  <input
                    type="text"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                    style={{
                      background: '#1C2218',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: '#E8EDE4',
                    }}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                    NGO / Organisation Name
                  </span>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(event) => setOrgName(event.target.value)}
                    className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                    style={{
                      background: '#1C2218',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: '#E8EDE4',
                    }}
                  />
                </label>

                {selectedRole === 'mentor' ? (
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                      Phone
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        background: '#1C2218',
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: '#E8EDE4',
                      }}
                    />
                  </label>
                ) : null}

                {selectedRole === 'student' ? (
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                      Grade
                    </span>
                    <select
                      value={grade}
                      onChange={(event) => setGrade(Number(event.target.value) as 3 | 4 | 5 | 6)}
                      className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        background: '#1C2218',
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: '#E8EDE4',
                      }}
                    >
                      {[3, 4, 5, 6].map((gradeOption) => (
                        <option key={gradeOption} value={gradeOption}>
                          Grade {gradeOption}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !canSubmitSignUp}
                  className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: accent, color: '#0C0F0A' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Please wait...
                    </span>
                  ) : (
                    `Create ${ROLE_META[selectedRole].label} Account`
                  )}
                </button>
              </form>
            )}

            {toast ? (
              <div
                className="mt-4 rounded-xl border px-4 py-3 text-sm"
                style={
                  toast.tone === 'error'
                    ? {
                        background: 'rgba(240,96,64,0.12)',
                        borderColor: 'rgba(240,96,64,0.3)',
                        color: '#F8A090',
                      }
                    : {
                        background: 'rgba(62,207,178,0.10)',
                        borderColor: 'rgba(62,207,178,0.3)',
                        color: '#3ECFB2',
                      }
                }
              >
                {toast.message}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
