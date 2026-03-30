import type { AppRole } from '@/types';

export interface TestAccessSession {
  email: string;
  role: AppRole;
}

const TEST_ACCESS_STORAGE_KEY = 'vidyasetu-test-access-session';

function getConfiguredTestAccessEmail(): string | null {
  const configuredEmail = process.env.NEXT_PUBLIC_TEST_ACCESS_EMAIL;

  if (!configuredEmail) {
    return null;
  }

  return configuredEmail.trim().toLowerCase();
}

export function canUseTestAccess(email: string): boolean {
  const configuredEmail = getConfiguredTestAccessEmail();

  if (!configuredEmail) {
    return false;
  }

  return email.trim().toLowerCase() === configuredEmail;
}

export function readTestAccessSession(): TestAccessSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawSession = window.localStorage.getItem(TEST_ACCESS_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(rawSession) as Partial<TestAccessSession>;

    if (
      typeof parsedSession.email === 'string' &&
      ['mentor', 'coordinator', 'viewer'].includes(parsedSession.role ?? '')
    ) {
      return {
        email: parsedSession.email,
        role: parsedSession.role as AppRole,
      };
    }
  } catch (_error) {
    window.localStorage.removeItem(TEST_ACCESS_STORAGE_KEY);
  }

  return null;
}

export function writeTestAccessSession(session: TestAccessSession): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(TEST_ACCESS_STORAGE_KEY, JSON.stringify(session));
}

export function clearTestAccessSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TEST_ACCESS_STORAGE_KEY);
}
