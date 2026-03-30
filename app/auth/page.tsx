'use client';

import { useMemo, useState } from 'react';
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

const ROLE_META: Record<
  UserRole,
  { label: string; icon: string; accent: string; tintedBg: string; loginLabel: string }
> = {
  ngo: {
    label: 'NGO Admin',
    icon: '🏢',
    accent: '#F2B53C',
    tintedBg: 'rgba(242,181,60,0.12)',
    loginLabel: 'NGO Admin',
  },
  volunteer: {
    label: 'Volunteer',
    icon: '🙋',
    accent: '#B8F04A',
    tintedBg: 'rgba(184,240,74,0.12)',
    loginLabel: 'Volunteer',
  },
  student: {
    label: 'Student',
    icon: '📚',
    accent: '#3ECFB2',
    tintedBg: 'rgba(62,207,178,0.12)',
    loginLabel: 'Student',
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

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, signOut, resetPassword } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('volunteer');
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

  const accent = ROLE_META[selectedRole].accent;

  const canSubmitSignIn = useMemo(
    () => signInEmail.trim().length > 0 && signInPassword.trim().length > 0,
    [signInEmail, signInPassword],
  );

  const canSubmitSignUp = useMemo(() => {
    if (!firstName.trim() || !lastName.trim() || !signUpEmail.trim() || !city.trim()) {
      return false;
    }
    if (signUpPassword.length < 8) {
      return false;
    }
    if (selectedRole === 'ngo' && !orgName.trim()) {
      return false;
    }
    return true;
  }, [city, firstName, lastName, orgName, selectedRole, signUpEmail, signUpPassword]);

  function showError(message: string) {
    setToast({ tone: 'error', message });
  }

  function showSuccess(message: string) {
    setToast({ tone: 'success', message });
  }

  async function fetchProfileRole(userId: string): Promise<UserRole | null> {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    return (data?.role as UserRole | undefined) ?? null;
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
      const resolvedRole = metadataRole ?? profileRole;

      if (resolvedRole && resolvedRole !== selectedRole) {
        await signOut();
        showError(
          `This account is registered as ${ROLE_META[resolvedRole].loginLabel}. Select the correct role.`,
        );
        return;
      }

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
      showError(
        selectedRole === 'ngo'
          ? 'Please complete all required fields, including organisation name.'
          : 'Please complete all required fields.',
      );
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
        selectedRole === 'ngo' ? orgName.trim() : undefined,
      );

      if (result.session) {
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
    <div className="min-h-screen px-4 py-10" style={{ background: '#0C0F0A' }}>
      <div className="mx-auto w-full max-w-md">
        <div
          className="overflow-hidden rounded-2xl border"
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
          <div className="px-6 pb-7 pt-6">
            <h1 className="text-center font-serif text-4xl tracking-wide" style={{ color: '#B8F04A' }}>
              VidyaSetu
            </h1>
            <p
              className="mt-2 text-center font-mono text-xs uppercase tracking-[0.24em]"
              style={{ color: '#7A8872' }}
            >
              NGO Learning Infrastructure
            </p>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_META) as UserRole[]).map((roleKey) => {
                const roleConfig = ROLE_META[roleKey];
                const isActive = selectedRole === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => setSelectedRole(roleKey)}
                    className="rounded-xl border px-2 py-3 text-center transition"
                    style={{
                      borderColor: isActive ? roleConfig.accent : 'rgba(255,255,255,0.10)',
                      background: isActive ? roleConfig.tintedBg : '#1C2218',
                      color: isActive ? roleConfig.accent : '#E8EDE4',
                    }}
                  >
                    <div className="text-base">{roleConfig.icon}</div>
                    <div className="mt-1 text-xs font-medium">{roleConfig.label}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl p-[3px]" style={{ background: '#1C2218' }}>
              <div className="grid grid-cols-2 gap-[3px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition"
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
                  className="rounded-lg border px-3 py-2 text-sm font-medium transition"
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
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(event) => setSignInPassword(event.target.value)}
                      className="h-11 w-full rounded-xl border px-3 pr-11 text-sm outline-none transition"
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

                <div className="flex justify-end">
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
                      Please wait…
                    </span>
                  ) : (
                    'Sign In'
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

                {selectedRole === 'ngo' ? (
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-[0.18em]" style={{ color: '#7A8872' }}>
                      Organisation Name
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
                      Please wait…
                    </span>
                  ) : (
                    'Create Account'
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
        </div>
      </div>
    </div>
  );
}

