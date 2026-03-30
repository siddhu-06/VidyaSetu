import type { AppLocale, ParentResponseCode, ParentSmsTemplateContext } from '@/types';

const concernPrompt = {
  en: 'Reply H if all is fine, C if you want a callback.',
  hi: 'सब ठीक है तो H भेजें, बात करनी है तो C भेजें।',
  te: 'అన్నీ బాగుంటే H, మాట్లాడాలి అంటే C పంపండి.',
} satisfies Record<AppLocale, string>;

export function buildParentUpdateSms(
  locale: AppLocale,
  context: ParentSmsTemplateContext,
): string {
  const concernLine =
    context.concernFlag
      ? {
          en: 'Our team noticed a learning risk and will follow up.',
          hi: 'हमें पढ़ाई में थोड़ी चिंता दिखी है, हमारी टीम संपर्क करेगी।',
          te: 'అభ్యాసంలో ఒక జాగ్రత్త సూచన కనిపించింది, మా బృందం మిమ్మల్ని సంప్రదిస్తుంది.',
        }[locale]
      : {
          en: 'Today’s session showed steady effort.',
          hi: 'आज के सत्र में बच्चे ने अच्छा प्रयास किया।',
          te: 'ఈ రోజు తరగతిలో బిడ్డ మంచి ప్రయత్నం చేసింది.',
        }[locale];

  const greeting = {
    en: `VidyaSetu update for ${context.childName}:`,
    hi: `${context.childName} के लिए विद्यासेतु अपडेट:`,
    te: `${context.childName} కోసం విద్యాసేతు అప్‌డేట్:`,
  }[locale];

  const mentorLine = {
    en: `${context.mentorName} met the child on ${context.sessionDateLabel}.`,
    hi: `${context.mentorName} ने ${context.sessionDateLabel} को सत्र लिया।`,
    te: `${context.mentorName} ${context.sessionDateLabel}న సెషన్ నిర్వహించారు.`,
  }[locale];

  return [greeting, mentorLine, context.progressHighlight, concernLine, concernPrompt[locale]].join(' ');
}

export function parseParentResponse(body: string): ParentResponseCode {
  const normalizedBody = body.trim().toUpperCase();

  if (normalizedBody.startsWith('H')) {
    return 'H';
  }

  if (normalizedBody.startsWith('C')) {
    return 'C';
  }

  return 'N';
}

