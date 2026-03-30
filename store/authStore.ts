'use client';

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';

import type { Profile, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: null,
  loading: true,
  setUser: (user) => set({ user, role: (user?.user_metadata?.role as UserRole) ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, profile: null, role: null, loading: false }),
}));

