import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SMS_TEMPLATES: Record<string, (name: string, subject: string) => string> = {
  hi: (name, subject) =>
    `${name} ne aaj ${subject} ki class ki. Khush hain? H bhejo khush ke liye, C bhejo concern ke liye.`,
  te: (name, subject) =>
    `${name} ee roju ${subject} class chesindi. Santoshamga unnara? H pampa??i santhosham kosam, C pampa??i concern kosam.`,
  en: (name, subject) =>
    `${name} attended ${subject} class today. Happy? Reply H for happy, C for concern.`,
};

const RATE_LIMIT_HOURS = 6;

serve(async (req) => {
  try {
    const { session_ids } = (await req.json()) as { session_ids: string[] };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID') ?? '';
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN') ?? '';
    const twilioFrom = Deno.env.get('TWILIO_FROM_NUMBER') ?? '';

    const results: { session_id: string; status: string }[] = [];

    for (const sessionId of session_ids) {
      try {
        const { data: session } = await supabase
          .from('sessions')
          .select('id, student_id, subjects_covered')
          .eq('id', sessionId)
          .single();

        if (!session) {
          results.push({ session_id: sessionId, status: 'session_not_found' });
          continue;
        }

        const { data: student } = await supabase
          .from('students')
          .select('id, name, parent_language')
          .eq('id', session.student_id)
          .single();

        if (!student) {
          results.push({ session_id: sessionId, status: 'student_not_found' });
          continue;
        }

        const { data: parentContact } = await supabase
          .from('parent_contacts')
          .select('phone, language, sms_consent, last_sms_at')
          .eq('student_id', student.id)
          .single();

        if (!parentContact || !parentContact.sms_consent) {
          results.push({ session_id: sessionId, status: 'no_consent' });
          continue;
        }

        if (parentContact.last_sms_at) {
          const lastSmsTime = new Date(parentContact.last_sms_at).getTime();
          const hoursSince = (Date.now() - lastSmsTime) / (1000 * 60 * 60);
          if (hoursSince < RATE_LIMIT_HOURS) {
            results.push({ session_id: sessionId, status: 'rate_limited' });
            continue;
          }
        }

        const lang = (parentContact.language || student.parent_language || 'hi') as string;
        const subjectsList = (session.subjects_covered as string[]).join(', ');
        const templateFn = SMS_TEMPLATES[lang] ?? SMS_TEMPLATES['en'];
        const messageBody = templateFn(student.name, subjectsList);

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const body = new URLSearchParams({
          To: parentContact.phone,
          From: twilioFrom,
          Body: messageBody,
        });

        const twilioRes = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${btoa(`${twilioSid}:${twilioToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });

        const twilioData = (await twilioRes.json()) as { sid?: string; message?: string };

        await supabase.from('sms_log').insert({
          student_id: student.id,
          session_id: sessionId,
          phone: parentContact.phone,
          message_body: messageBody,
          twilio_sid: twilioData.sid ?? null,
        });

        await supabase.from('parent_contacts')
          .update({ last_sms_at: new Date().toISOString() })
          .eq('student_id', student.id);

        results.push({ session_id: sessionId, status: 'sent' });
      } catch (err) {
        results.push({ session_id: sessionId, status: `error: ${String(err)}` });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
