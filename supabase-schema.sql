-- فارسی‌یار: دیتابیس کلاس چنددستگاهی
-- Supabase > SQL Editor

create table if not exists public.farsiyar_classes (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  title text not null default 'کلاس فارسی چهارم',
  lesson_index integer not null default 0,
  mission jsonb,
  notice text default '',
  roster jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farsiyar_classes add column if not exists roster jsonb not null default '[]'::jsonb;

create table if not exists public.farsiyar_responses (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.farsiyar_classes(room_code) on delete cascade,
  student_name text not null,
  kind text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.farsiyar_scores (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.farsiyar_classes(room_code) on delete cascade,
  student_name text not null,
  points integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(room_code, student_name)
);

alter table public.farsiyar_classes enable row level security;
alter table public.farsiyar_responses enable row level security;
alter table public.farsiyar_scores enable row level security;

drop policy if exists farsiyar_classes_all on public.farsiyar_classes;
create policy farsiyar_classes_all on public.farsiyar_classes for all to anon, authenticated using (true) with check (true);

drop policy if exists farsiyar_responses_all on public.farsiyar_responses;
create policy farsiyar_responses_all on public.farsiyar_responses for all to anon, authenticated using (true) with check (true);

drop policy if exists farsiyar_scores_all on public.farsiyar_scores;
create policy farsiyar_scores_all on public.farsiyar_scores for all to anon, authenticated using (true) with check (true);

alter table public.farsiyar_classes replica identity full;
alter table public.farsiyar_responses replica identity full;
alter table public.farsiyar_scores replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.farsiyar_classes;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.farsiyar_responses;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.farsiyar_scores;
exception when duplicate_object then null; end $$;

grant select, insert, update, delete on public.farsiyar_classes to anon, authenticated;
grant select, insert, update, delete on public.farsiyar_responses to anon, authenticated;
grant select, insert, update, delete on public.farsiyar_scores to anon, authenticated;

-- امتیاز را اتمیک افزایش می‌دهد تا همزمانی ۲۹ دانش‌آموز باعث از دست رفتن امتیاز نشود.
create or replace function public.increment_farsiyar_score(
  p_room_code text,
  p_student_name text,
  p_delta integer
) returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare new_points integer;
begin
  insert into public.farsiyar_scores(room_code, student_name, points, updated_at)
  values (p_room_code, p_student_name, greatest(0,p_delta), now())
  on conflict (room_code, student_name)
  do update set points = public.farsiyar_scores.points + excluded.points,
                updated_at = now()
  returning points into new_points;
  return new_points;
end;
$$;
grant execute on function public.increment_farsiyar_score(text,text,integer) to anon, authenticated;
