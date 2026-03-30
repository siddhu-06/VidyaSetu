import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function parseResponseCode(body: string): 'H' | 'C' | 'N' {
  const normalizedBody = body.trim().toUpperCase();

  if (normalizedBody.startsWith('H')) {
    return 'H';
  }

  if (normalizedBody.startsWith('C')) {
    return 'C';
  }

  return 'N';
}

serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok');
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase service credentials are missing.');
    }

    const formData = await request.formData();
    const from = normalizePhone(String(formData.get('From') ?? ''));
    const body = String(formData.get('Body') ?? '');

    if (!from || !body) {
      throw new Error('Incoming SMS is missing sender or body.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, preferred_language')
      .eq('guardian_phone', from)
      .maybeSingle();

    if (studentError) {
      throw studentError;
    }

    if (!student) {
      return new Response('<Response></Response>', {
        headers: {
          'Content-Type': 'text/xml',
        },
      });
    }

    const responseCode = parseResponseCode(body);
    const { error } = await supabase.from('parent_messages').insert({
      student_id: student.id,
      direction: 'inbound',
      channel: 'sms',
      locale: student.preferred_language,
      body,
      delivery_status: 'received',
      response_code: responseCode,
    });

    if (error) {
      throw error;
    }

    return new Response('<Response></Response>', {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    return new Response('<Response></Response>', {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
});

