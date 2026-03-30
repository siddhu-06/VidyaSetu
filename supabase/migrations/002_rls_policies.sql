alter table public.mentors enable row level security;
alter table public.students enable row level security;
alter table public.session_templates enable row level security;
alter table public.sessions enable row level security;
alter table public.passport_shares enable row level security;
alter table public.parent_messages enable row level security;
alter table public.risk_snapshots enable row level security;
alter table public.mentor_matches enable row level security;

drop policy if exists mentors_authenticated_read on public.mentors;
create policy mentors_authenticated_read
on public.mentors
for select
to authenticated
using (true);

drop policy if exists mentors_authenticated_write on public.mentors;
create policy mentors_authenticated_write
on public.mentors
for all
to authenticated
using (true)
with check (true);

drop policy if exists students_authenticated_read on public.students;
create policy students_authenticated_read
on public.students
for select
to authenticated
using (true);

drop policy if exists students_authenticated_write on public.students;
create policy students_authenticated_write
on public.students
for all
to authenticated
using (true)
with check (true);

drop policy if exists students_public_passport_read on public.students;
create policy students_public_passport_read
on public.students
for select
to anon
using (
  exists (
    select 1
    from public.passport_shares
    where passport_shares.student_id = students.id
      and passport_shares.active = true
  )
);

drop policy if exists templates_authenticated_read on public.session_templates;
create policy templates_authenticated_read
on public.session_templates
for select
to authenticated
using (true);

drop policy if exists templates_authenticated_write on public.session_templates;
create policy templates_authenticated_write
on public.session_templates
for all
to authenticated
using (true)
with check (true);

drop policy if exists sessions_authenticated_read on public.sessions;
create policy sessions_authenticated_read
on public.sessions
for select
to authenticated
using (true);

drop policy if exists sessions_authenticated_write on public.sessions;
create policy sessions_authenticated_write
on public.sessions
for all
to authenticated
using (true)
with check (true);

drop policy if exists sessions_public_passport_read on public.sessions;
create policy sessions_public_passport_read
on public.sessions
for select
to anon
using (
  exists (
    select 1
    from public.passport_shares
    where passport_shares.student_id = sessions.student_id
      and passport_shares.active = true
  )
);

drop policy if exists shares_authenticated_read on public.passport_shares;
create policy shares_authenticated_read
on public.passport_shares
for select
to authenticated
using (true);

drop policy if exists shares_authenticated_write on public.passport_shares;
create policy shares_authenticated_write
on public.passport_shares
for all
to authenticated
using (true)
with check (true);

drop policy if exists shares_public_read on public.passport_shares;
create policy shares_public_read
on public.passport_shares
for select
to anon
using (active = true);

drop policy if exists parent_messages_authenticated_read on public.parent_messages;
create policy parent_messages_authenticated_read
on public.parent_messages
for select
to authenticated
using (true);

drop policy if exists parent_messages_authenticated_write on public.parent_messages;
create policy parent_messages_authenticated_write
on public.parent_messages
for all
to authenticated
using (true)
with check (true);

drop policy if exists risk_snapshots_authenticated_read on public.risk_snapshots;
create policy risk_snapshots_authenticated_read
on public.risk_snapshots
for select
to authenticated
using (true);

drop policy if exists risk_snapshots_authenticated_write on public.risk_snapshots;
create policy risk_snapshots_authenticated_write
on public.risk_snapshots
for all
to authenticated
using (true)
with check (true);

drop policy if exists risk_snapshots_public_passport_read on public.risk_snapshots;
create policy risk_snapshots_public_passport_read
on public.risk_snapshots
for select
to anon
using (
  exists (
    select 1
    from public.passport_shares
    where passport_shares.student_id = risk_snapshots.student_id
      and passport_shares.active = true
  )
);

drop policy if exists mentor_matches_authenticated_read on public.mentor_matches;
create policy mentor_matches_authenticated_read
on public.mentor_matches
for select
to authenticated
using (true);

drop policy if exists mentor_matches_authenticated_write on public.mentor_matches;
create policy mentor_matches_authenticated_write
on public.mentor_matches
for all
to authenticated
using (true)
with check (true);

