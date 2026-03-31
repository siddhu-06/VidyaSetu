import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { UserRole } from '@/types';

interface BootstrapBody {
  role?: UserRole;
  city?: string;
  orgName?: string;
  phone?: string;
  grade?: 3 | 4 | 5 | 6;
}

interface AuthenticatedUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

interface NgoRow {
  id: string;
  name: string;
  contact_email: string | null;
}

interface CenterRow {
  id: string;
  name: string;
  city: string;
  ngo_id: string;
}

type ServiceClient = SupabaseClient<any, 'public', any>;

const DEFAULT_GAP_PROFILE = {
  math: 0,
  reading: 0,
  science: 0,
  english: 0,
  comprehension: 0,
};

const DEFAULT_AVAILABILITY = {
  mon: ['09:00', '17:00'],
  tue: ['09:00', '17:00'],
  wed: ['09:00', '17:00'],
  thu: ['09:00', '17:00'],
  fri: ['09:00', '17:00'],
};

function toSafeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toRole(value: unknown): UserRole {
  return value === 'ngo' || value === 'student' ? value : 'mentor';
}

function buildDisplayName(firstName: string, lastName: string, email: string | null | undefined): string {
  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return email?.split('@')[0]?.replace(/[._-]+/g, ' ') || 'VidyaSetu User';
}

async function getAuthenticatedUser(
  url: string,
  anonKey: string,
  accessToken: string,
): Promise<AuthenticatedUser> {
  const authClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const { data, error } = await authClient.auth.getUser();

  if (error || !data.user) {
    throw new Error('Unable to verify the signed-in user for account bootstrap.');
  }

  return data.user as AuthenticatedUser;
}

async function ensureNgo(
  serviceClient: ServiceClient,
  orgName: string,
  contactEmail: string | null | undefined,
): Promise<NgoRow> {
  const { data: ngoRows, error } = await serviceClient.from('ngos').select('id,name,contact_email').order('created_at');

  if (error) {
    throw new Error(error.message);
  }

  const existingNgo = ((ngoRows ?? []) as NgoRow[]).find(
    (ngo) =>
      ngo.name.trim().toLowerCase() === orgName.toLowerCase() ||
      (contactEmail ? ngo.contact_email?.trim().toLowerCase() === contactEmail.toLowerCase() : false),
  );

  if (existingNgo) {
    return existingNgo;
  }

  const { data: createdNgo, error: createError } = await serviceClient
    .from('ngos')
    .insert({
      name: orgName,
      contact_email: contactEmail ?? null,
    })
    .select('id,name,contact_email')
    .single();

  if (createError || !createdNgo) {
    throw new Error(createError?.message ?? 'Unable to create NGO record.');
  }

  return createdNgo as NgoRow;
}

async function ensureCenter(
  serviceClient: ServiceClient,
  ngoId: string,
  city: string,
): Promise<CenterRow> {
  const { data: centerRows, error } = await serviceClient
    .from('centers')
    .select('id,name,city,ngo_id')
    .eq('ngo_id', ngoId)
    .order('created_at');

  if (error) {
    throw new Error(error.message);
  }

  const existingCenter = ((centerRows ?? []) as CenterRow[]).find(
    (center) => center.city.trim().toLowerCase() === city.toLowerCase(),
  );

  if (existingCenter) {
    return existingCenter;
  }

  const { data: createdCenter, error: createError } = await serviceClient
    .from('centers')
    .insert({
      ngo_id: ngoId,
      city,
      name: `${city} Center`,
    })
    .select('id,name,city,ngo_id')
    .single();

  if (createError || !createdCenter) {
    throw new Error(createError?.message ?? 'Unable to create center record.');
  }

  return createdCenter as CenterRow;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 500 });
    }

    const authorization = request.headers.get('authorization');
    const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as BootstrapBody;
    const user = await getAuthenticatedUser(supabaseUrl, supabaseAnonKey, accessToken);
    const serviceClient: ServiceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const metadata = user.user_metadata ?? {};
    const role = toRole(body.role ?? metadata.role);
    const firstName = toSafeString(metadata.first_name);
    const lastName = toSafeString(metadata.last_name);
    const city = toSafeString(body.city) || toSafeString(metadata.city) || 'Hyderabad';
    const orgName = toSafeString(body.orgName) || toSafeString(metadata.org_name) || 'VidyaSetu Demo NGO';
    const phone = toSafeString(body.phone) || toSafeString(metadata.phone);
    const grade = body.grade ?? (typeof metadata.grade === 'number' ? (metadata.grade as 3 | 4 | 5 | 6) : 5);
    const name = buildDisplayName(firstName, lastName, user.email);

    const ngo = await ensureNgo(serviceClient, orgName, user.email);
    const center = await ensureCenter(serviceClient, ngo.id, city);

    await serviceClient.from('user_profiles').upsert(
      {
        id: user.id,
        role,
        ngo_id: ngo.id,
        center_id: center.id,
        first_name: firstName,
        last_name: lastName,
        city,
        org_name: orgName,
      },
      { onConflict: 'id' },
    );

    if (role === 'mentor') {
      if (!phone) {
        return NextResponse.json({ error: 'Mentor signup requires a phone number.' }, { status: 400 });
      }

      const { data: mentorRow, error: mentorLookupError } = await serviceClient
        .from('mentors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (mentorLookupError) {
        throw new Error(mentorLookupError.message);
      }

      if (mentorRow) {
        const { error: mentorUpdateError } = await serviceClient
          .from('mentors')
          .update({
            name,
            phone,
            center_id: center.id,
            active: true,
          })
          .eq('id', mentorRow.id);

        if (mentorUpdateError) {
          throw new Error(mentorUpdateError.message);
        }
      } else {
        const { error: mentorInsertError } = await serviceClient.from('mentors').insert({
          user_id: user.id,
          name,
          phone,
          subjects: ['math', 'reading', 'english'],
          availability: DEFAULT_AVAILABILITY,
          center_id: center.id,
          gender: 'other',
          active: true,
        });

        if (mentorInsertError) {
          throw new Error(mentorInsertError.message);
        }
      }
    }

    if (role === 'student') {
      const { data: studentRow, error: studentLookupError } = await serviceClient
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentLookupError) {
        throw new Error(studentLookupError.message);
      }

      if (studentRow) {
        const { error: studentUpdateError } = await serviceClient
          .from('students')
          .update({
            name,
            grade,
            center_id: center.id,
          })
          .eq('id', studentRow.id);

        if (studentUpdateError) {
          throw new Error(studentUpdateError.message);
        }
      } else {
        const { error: studentInsertError } = await serviceClient.from('students').insert({
          user_id: user.id,
          name,
          grade,
          gender: 'other',
          center_id: center.id,
          gap_profile: DEFAULT_GAP_PROFILE,
          risk_score: 0.35,
          risk_color: 'green',
          engagement_score: 0.5,
          preferred_time_slot: '17:00',
          parent_language: 'en',
        });

        if (studentInsertError) {
          throw new Error(studentInsertError.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      role,
      ngoId: ngo.id,
      centerId: center.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to bootstrap this account.',
      },
      { status: 500 },
    );
  }
}
