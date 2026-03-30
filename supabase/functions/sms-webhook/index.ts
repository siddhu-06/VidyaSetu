import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const POSITIVE_REPLIES = new Set(['H', 'HAAN', 'HAN', 'YES', 'HAPPY', 'ACCHA', 'THEEK', 'OK']);
const NEGATIVE_REPLIES = new Set(['C', 'NAHI', 'NAHIN', 'NO', 'NOT', 'CONCERN', 'BURA']);

interface RecentSentimentRow {
  sentiment: 1 | -1 | null;
}

function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  const sortedKeys = Object.keys(params).sort();
  const validationStr = url + sortedKeys.map((key) => `${key}${params[key]}`).join('');
  const hmac = createHmac('sha1', authToken);
  hmac.update(validationStr);
  const expected = hmac.digest('base64');
  return expected === signature;
}

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
    const twilioSignature = req.headers.get('X-Twilio-Signature') ?? '';

    const text = await req.text();
    const params = Object.fromEntries(new URLSearchParams(text));

    const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sms-webhook`;
    if (!validateTwilioSignature(authToken, twilioSignature, url, params)) {
      return new Response('Unauthorized', { status: 403 });
    }

    const fromPhone = params['From'] ?? '';
    const replyBody = (params['Body'] ?? '').trim().toUpperCase();

    let sentiment: 1 | -1 | null = null;
    let isUnknown = false;

    if (POSITIVE_REPLIES.has(replyBody)) {
      sentiment = 1;
    } else if (NEGATIVE_REPLIES.has(replyBody)) {
      sentiment = -1;
    } else {
      isUnknown = true;
    }

    const { data: smsLog } = await supabase
      .from('sms_log')
      .select('id, student_id')
      .eq('phone', fromPhone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (smsLog) {
      await supabase.from('sms_log')
        .update({ reply: params['Body'], sentiment })
        .eq('id', smsLog.id);

      if (!isUnknown && sentiment !== null) {
        const { data: recent } = await supabase
          .from('sms_log')
          .select('sentiment')
          .eq('student_id', smsLog.student_id)
          .not('sentiment', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);

        const typedRecent = (recent ?? []) as RecentSentimentRow[];
        const sentiments = typedRecent.map((row) => (row.sentiment === 1 ? 1 : 0));
        const engScore =
          sentiments.length > 0
            ? sentiments.reduce((left: number, right: number) => left + right, 0) / sentiments.length
            : 0.5;

        await supabase.from('students')
          .update({ engagement_score: engScore })
          .eq('id', smsLog.student_id);

        const lastThree = sentiments.slice(0, 3);
        if (lastThree.length === 3 && lastThree.every((value: number) => value === 0)) {
          await supabase.from('coordinator_alerts').insert({
            student_id: smsLog.student_id,
            ngo_id: Deno.env.get('DEFAULT_NGO_ID') ?? '',
            alert_type: 'parent_concern',
          });
        }
      }

      if (isUnknown) {
        const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
        const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
        const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';

        const guidanceBody = new URLSearchParams({
          To: fromPhone,
          From: twilioFrom,
          Body: 'Reply H for happy, C for concern.',
        });
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: guidanceBody.toString(),
        }).catch(() => {});
      }
    }

    return new Response('<?xml version="1.0" ?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (_err) {
    return new Response('<?xml version="1.0" ?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
});
