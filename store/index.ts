'use client';

import { create } from 'zustand';

import type { AppLocale, AppNotification, AppRole, SyncStatusSnapshot } from '@/types';

interface AppStoreState {
  locale: AppLocale;
  currentRole: AppRole;
  syncSnapshot: SyncStatusSnapshot;
  notifications: AppNotification[];
  setLocale: (locale: AppLocale) => void;
  setCurrentRole: (role: AppRole) => void;
  setSyncSnapshot: (snapshot: SyncStatusSnapshot) => void;
  pushNotification: (notification: Omit<AppNotification, 'id'>) => void;
  dismissNotification: (notificationId: string) => void;
}

const defaultSyncSnapshot: SyncStatusSnapshot = {
  state: 'idle',
  queueMetrics: {
    queued: 0,
    syncing: 0,
    failed: 0,
  },
  lastSyncedAt: null,
  message: 'Ready to capture sessions offline.',
};

export const useAppStore = create<AppStoreState>((set) => ({
  locale: 'en',
  currentRole: 'mentor',
  syncSnapshot: defaultSyncSnapshot,
  notifications: [],
  setLocale: (locale) => set({ locale }),
  setCurrentRole: (currentRole) => set({ currentRole }),
  setSyncSnapshot: (syncSnapshot) => set({ syncSnapshot }),
  pushNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: crypto.randomUUID(),
        },
      ],
    })),
  dismissNotification: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== notificationId),
    })),
}));

