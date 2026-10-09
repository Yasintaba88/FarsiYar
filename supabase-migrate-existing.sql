-- مهاجرت کم‌خطر برای جدول‌های قدیمی فارسی‌یار؛ اطلاعات حذف نمی‌شود.
-- این فایل با ساختار قدیمی farsiyar_responses/farsiyar_scores دارای class_id سازگار است.
begin;

alter table public.farsiyar_classes add column if not exists roster jsonb not null default '[]'::jsonb;
alter table public.farsiyar_classes add column if not exists room_code text;
alter table public.farsiyar_classes add column if not exists title text not null default 'کلاس فارسی چهارم';
alter table public.farsiyar_classes add column if not exists lesson_index integer not null default 0;
alter table public.farsiyar_classes add column if not exists mission jsonb;
alter table public.farsiyar_classes add column if not exists notice text not null default '';
alter table public.farsiyar_classes add column if not exists board_state jsonb not null default '[]'::jsonb;
alter table public.farsiyar_classes add column if not exists created_at timestamptz not null default now();
alter table public.farsiyar_classes add column if not exists updated_at timestamptz not null default now();

alter table public.farsiyar_responses add column if not exists room_code text;
alter table public.farsiyar_responses add column if not exists is_correct boolean;
alter table public.farsiyar_responses add column if not exists points_awarded integer not null default 0;
alter table public.farsiyar_scores add column if not exists room_code text;
alter table public.farsiyar_scores add column if not exists updated_at timestamptz not null default now();

-- جدول‌های قدیمی class_id و roster_id داشتند؛ کد جدید از room_code استفاده می‌کند.
-- ستون‌های قدیمی را حفظ می‌کنیم، فقط اجازه می‌دهیم درج‌های جدید بدون این شناسه‌های قدیمی انجام شوند.
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='farsiyar_responses' and column_name='class_id') then
    execute 'alter table public.farsiyar_responses alter column class_id drop not null';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='farsiyar_responses' and column_name='roster_id') then
    execute 'alter table public.farsiyar_responses alter column roster_id drop not null';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='farsiyar_scores' and column_name='class_id') then
    execute 'alter table public.farsiyar_scores alter column class_id drop not null';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='farsiyar_scores' and column_name='roster_id') then
    execute 'alter table public.farsiyar_scores alter column roster_id drop not null';
  end if;
end $$;

-- پرکردن کد کلاس از رابطهٔ قدیمی class_id، بدون تغییر ردیف‌های نامرتبط.
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='farsiyar_responses' and column_name='class_id') then
    update public.farsiyar_responses r set room_code=c.room_code from public.farsiyar_classes c where r.class_id=c.id and r.room_code is null;
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='farsiyar_scores' and column_name='class_id') then
    update public.farsiyar_scores s set room_code=c.room_code from public.farsiyar_classes c where s.class_id=c.id and s.room_code is null;
  end if;
end $$;

-- مهاجرت فهرست قدیمی به JSONB فقط وقتی roster هنوز خالی است.
do $$ begin
  if to_regclass('public.farsiyar_roster') is not null then
    update public.farsiyar_classes c set roster=(
      select coalesce(jsonb_agg(to_jsonb(r.student_name) order by r.created_at),'[]'::jsonb)
      from public.farsiyar_roster r where r.class_id=c.id and coalesce(r.active,true)=true
    ) where c.roster='[]'::jsonb and exists(select 1 from public.farsiyar_roster r where r.class_id=c.id and coalesce(r.active,true)=true);
  end if;
end $$;

-- جلوگیری از ساخت index ناقص: اگر دادهٔ یتیم وجود دارد، تراکنش با توضیح روشن متوقف می‌شود.
do $$ begin
  if exists(select 1 from public.farsiyar_responses where room_code is null) then raise exception 'Migration stopped: farsiyar_responses has rows without a matching room_code; review old class_id values first.'; end if;
  if exists(select 1 from public.farsiyar_scores where room_code is null) then raise exception 'Migration stopped: farsiyar_scores has rows without a matching room_code; review old class_id values first.'; end if;
end $$;

-- تابع امتیازدهی به این کلید نیاز دارد. اگر دادهٔ تکراری هست، هیچ ردیفی حذف نمی‌شود و خطا توضیح داده می‌شود.
do $$ begin
  if exists(select 1 from public.farsiyar_scores group by room_code,student_name having count(*)>1) then
    raise exception 'Migration stopped: duplicate score rows exist for the same room_code and student_name. No rows were deleted; resolve duplicates before adding the unique index.';
  end if;
end $$;
create unique index if not exists farsiyar_scores_room_student_uidx on public.farsiyar_scores(room_code,student_name);
create index if not exists farsiyar_responses_room_created_idx on public.farsiyar_responses(room_code,created_at desc);

commit;
