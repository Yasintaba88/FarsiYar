-- فارسی‌یار: دیتابیس کلاس چنددستگاهی
-- در Supabase > SQL Editor اجرا شود.

create table if not exists public.farsiyar_classes (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  title text not null default 'کلاس فارسی چهارم',
  lesson_index integer not null default 0,
  mission jsonb,
  notice text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- برای نسخه مدرسه‌ای بدون حساب کاربری: دسترسی با کد کلاس کنترل می‌شود.
drop policy if exists farsiyar_classes_all on public.farsiyar_classes;
create policy farsiyar_classes_all on public.farsiyar_classes for all to anon, authenticated using (true) with check (true);

drop policy if exists farsiyar_responses_all on public.farsiyar_responses;
create policy farsiyar_responses_all on public.farsiyar_responses for all to anon, authenticated using (true) with check (true);

drop policy if exists farsiyar_scores_all on public.farsiyar_scores;
create policy farsiyar_scores_all on public.farsiyar_scores for all to anon, authenticated using (true) with check (true);

-- Realtime را برای همگام‌سازی زنده فعال کن.
alter table public.farsiyar_classes replica identity full;
alter table public.farsiyar_responses replica identity full;
alter table public.farsiyar_scores replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.farsiyar_classes;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.farsiyar_responses;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.farsiyar_scores;
exception when duplicate_object then null;
end $$;
