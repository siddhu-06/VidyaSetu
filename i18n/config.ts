'use client';

import { createElement, type ReactNode } from 'react';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import en from '@/i18n/locales/en.json';
import hi from '@/i18n/locales/hi.json';
import te from '@/i18n/locales/te.json';
import type { AppLocale } from '@/types';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  te: { translation: te },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

export function AppI18nProvider({ children }: { children: ReactNode }) {
  return createElement(I18nextProvider, { i18n }, children);
}

export async function setAppLanguage(locale: AppLocale): Promise<void> {
  await i18n.changeLanguage(locale);
}

export { i18n };
