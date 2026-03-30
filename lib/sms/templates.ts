import type { Language } from '@/types';

export const SMS_TEMPLATES: Record<Language, (studentName: string, subject: string) => string> = {
  hi: (name, subject) =>
    `${name} ne aaj ${subject} ki class ki. Khush hain? H bhejo khush ke liye, C bhejo concern ke liye.`,
  te: (name, subject) =>
    `${name} ee roju ${subject} class chesindi. Santoshamga unnara? H pampa??i santhosham kosam, C pampa??i concern kosam.`,
  en: (name, subject) =>
    `${name} attended ${subject} class today. Happy? Reply H for happy, C for concern.`,
};

export const GUIDANCE_SMS: Record<Language, string> = {
  hi: 'Kripaya H bhejein agar khush hain, C bhejein agar koi concern hai.',
  te: 'Dayachesi H pampa??i santosham unte, C pampa??i concern unte.',
  en: 'Please reply H for happy, C for concern.',
};
