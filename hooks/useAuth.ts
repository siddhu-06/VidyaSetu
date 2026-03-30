'use client';

import { useCallback, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

export function useAuth() {
  const { user, profile, role, loading, setUser, setProfile, setLoading, reset } = useAuthStore();

  const fetchProfile = useCallback(
    async (id: string) => {
      setLoading(true);
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) {
        setProfile(data);
      }
      setLoading(false);
    },
    [setLoading, setProfile],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        void fetchProfile(data.session.user.id);
      } else {
        reset();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        void fetchProfile(session.user.id);
      } else {
        reset();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile, reset, setUser]);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    return data;
  }

  async function signUp(
    email: string,
    password: string,
    roleToSave: UserRole,
    firstName: string,
    lastName: string,
    city: string,
    orgName?: string,
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: roleToSave,
          first_name: firstName,
          last_name: lastName,
          city,
          org_name: orgName ?? '',
        },
      },
    });
    if (error) {
      throw error;
    }
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    reset();
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    if (error) {
      throw error;
    }
  }

  return { user, profile, role, loading, signIn, signUp, signOut, resetPassword };
}
