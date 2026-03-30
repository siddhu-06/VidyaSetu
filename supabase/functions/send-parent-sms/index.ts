import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import twilio from 'npm:twilio@5.9.0';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type AppLocale = 'en' | 'hi' | 'te';

interface SmsContext {
  childName: string;
  mentorName: string;
  sessionDateLabel: string;
  progressHighlight: string;
  concernFlag: boolean;
}

interface SmsRequestBody {
  studentId: string;
  to: string;
  locale: AppLocale;
  context: SmsContext;
}

function buildParentUpdateSms(locale: AppLocale, context: SmsContext): string {
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

  const prompt = {
    en: 'Reply H if all is fine, C if you want a callback.',
    hi: 'सब ठीक है तो H भेजें, बात करनी है तो C भेजें।',
    te: 'అన్నీ బాగుంటే H, మాట్లాడాలి అంటే C పంపండి.',
  }[locale];

  return [
    `VidyaSetu update for ${context.childName}.`,
    `${context.mentorName} met the child on ${context.sessionDateLabel}.`,
    context.progressHighlight,
    concernLine,
    prompt,
  ].join(' ');
}

serve(async (request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!accountSid || !authToken || !fromNumber || !supabaseUrl || !serviceRoleKey) {
      throw new Error('Twilio or Supabase service credentials are missing.');
    }

    const body = (await request.json()) as SmsRequestBody;
    const messageBody = buildParentUpdateSms(body.locale, body.context);
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      to: body.to,
      from: fromNumber,
      body: messageBody,
    });
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from('parent_messages').insert({
      student_id: body.studentId,
      direction: 'outbound',
      channel: 'sms',
      locale: body.locale,
      body: messageBody,
      delivery_status: message.status ?? 'queued',
      response_code: null,
    });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        sid: message.sid,
        status: message.status,
        body: messageBody,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unable to send SMS.',
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
