-- فارسی‌یار V6 — Supabase schema امن‌تر برای کلاس زنده
create extension if not exists pgcrypto;

create table if not exists public.farsiyar_classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  room_code text unique not null check (room_code ~ '^FAR-[0-9]{4}$'),
  title text not null default 'کلاس فارسی امروز',
  lesson_index integer not null default 1 check (lesson_index between 1 and 17),
  mission jsonb not null default '{}'::jsonb,
  notice text not null default '',
  board_state jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farsiyar_roster (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.farsiyar_classes(id) on delete cascade,
  student_name text not null,
  pin_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(class_id, student_name)
);

create table if not exists public.farsiyar_responses (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.farsiyar_classes(id) on delete cascade,
  roster_id uuid not null references public.farsiyar_roster(id) on delete cascade,
  student_name text not null,
  kind text not null,
  answer text not null default '',
  score integer not null default 0 check (score between 0 and 3),
  created_at timestamptz not null default now()
);

create table if not exists public.farsiyar_scores (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.farsiyar_classes(id) on delete cascade,
  roster_id uuid not null references public.farsiyar_roster(id) on delete cascade,
  student_name text not null,
  points integer not null default 0 check (points >= 0),
  updated_at timestamptz not null default now(),
  unique(class_id, roster_id)
);

create index if not exists idx_farsiyar_classes_owner on public.farsiyar_classes(owner_id);
create index if not exists idx_farsiyar_roster_class on public.farsiyar_roster(class_id);
create index if not exists idx_farsiyar_responses_class on public.farsiyar_responses(class_id,created_at desc);
create index if not exists idx_farsiyar_scores_class on public.farsiyar_scores(class_id,points desc);

alter table public.farsiyar_classes enable row level security;
alter table public.farsiyar_roster enable row level security;
alter table public.farsiyar_responses enable row level security;
alter table public.farsiyar_scores enable row level security;

-- مالک معلم
 drop policy if exists class_owner_select on public.farsiyar_classes;
 drop policy if exists class_owner_insert on public.farsiyar_classes;
 drop policy if exists class_owner_update on public.farsiyar_classes;
 drop policy if exists class_owner_delete on public.farsiyar_classes;
create policy class_owner_select on public.farsiyar_classes for select to authenticated using (owner_id=auth.uid());
create policy class_owner_insert on public.farsiyar_classes for insert to authenticated with check (owner_id=auth.uid());
create policy class_owner_update on public.farsiyar_classes for update to authenticated using (owner_id=auth.uid()) with check (owner_id=auth.uid());
create policy class_owner_delete on public.farsiyar_classes for delete to authenticated using (owner_id=auth.uid());

-- roster فقط مالک معلم
 drop policy if exists roster_owner_select on public.farsiyar_roster;
 drop policy if exists roster_owner_insert on public.farsiyar_roster;
 drop policy if exists roster_owner_update on public.farsiyar_roster;
 drop policy if exists roster_owner_delete on public.farsiyar_roster;
create policy roster_owner_select on public.farsiyar_roster for select to authenticated using (exists(select 1 from public.farsiyar_classes c where c.id=class_id and c.owner_id=auth.uid()));
create policy roster_owner_insert on public.farsiyar_roster for insert to authenticated with check (exists(select 1 from public.farsiyar_classes c where c.id=class_id and c.owner_id=auth.uid()));
create policy roster_owner_update on public.farsiyar_roster for update to authenticated using (exists(select 1 from public.farsiyar_classes c where c.id=class_id and c.owner_id=auth.uid())) with check (exists(select 1 from public.farsiyar_classes c where c.id=class_id and c.owner_id=auth.uid()));
create policy roster_owner_delete on public.farsiyar_roster for delete to authenticated using (exists(select 1 from public.farsiyar_classes c where c.id=class_id and c.owner_id=auth.uid()));

-- دانش‌آموز مستقیم جدول‌های حساس را نمی‌خواند/نمی‌نویسد؛ از RPCهای محدود استفاده می‌کند.
-- مالک معلم پاسخ‌ها و امتیازها را می‌بیند.
drop policy if exists response_owner_select on public.farsiyar_responses;
create policy response_owner_select on public.farsiyar_responses for select to authenticated using (exists(select 1 from public.farsiyar_classes c where c.id=class_id and c.owner_id=auth.uid()));
drop policy if exists response_owner_delete on public.farsiyar_responses;
create policy response_owner_delete on public.farsiyar_responses for delete to authenticated using (exists(select 1 from public.farsiyar_classes c where c.id=class_id and c.owner_id=auth.uid()));
drop policy if exists score_owner_select on public.farsiyar_scores;
create policy score_owner_select on public.farsiyar_scores for select to authenticated using (exists(select 1 from public.farsiyar_classes c where c.id=class_id and c.owner_id=auth.uid()));

-- مدیریت امن فهرست دانش‌آموزان و PINها؛ فقط مالک کلاس مجاز است.
drop function if exists public.teacher_replace_roster(uuid,text[],text[]);
create or replace function public.teacher_replace_roster(p_class_id uuid,p_names text[],p_pins text[])
returns setof public.farsiyar_roster
language plpgsql security definer set search_path=public as $$
declare i integer; nm text; pn text; rec public.farsiyar_roster;
begin
  if not exists(select 1 from public.farsiyar_classes where id=p_class_id and owner_id=auth.uid()) then
    raise exception 'اجازه مدیریت این کلاس را ندارید';
  end if;
  if coalesce(array_length(p_names,1),0)=0 or array_length(p_names,1)<>array_length(p_pins,1) then
    raise exception 'فهرست نام‌ها و رمزها نامعتبر است';
  end if;
  if array_length(p_names,1)>29 then raise exception 'حداکثر ۲۹ دانش‌آموز مجاز است'; end if;
  delete from public.farsiyar_roster where class_id=p_class_id;
  for i in 1..array_length(p_names,1) loop
    nm=trim(p_names[i]); pn=trim(p_pins[i]);
    if nm='' then raise exception 'نام دانش‌آموز نمی‌تواند خالی باشد'; end if;
    if pn !~ '^[0-9]{6}$' then raise exception 'رمز هر دانش‌آموز باید ۶ رقمی باشد'; end if;
    insert into public.farsiyar_roster(class_id,student_name,pin_hash)
    values(p_class_id,nm,crypt(pn,gen_salt('bf'))) returning * into rec;
    return next rec;
  end loop;
end $$;
grant execute on function public.teacher_replace_roster(uuid,text[],text[]) to authenticated;

-- خروجی عمومی امن کلاس: فقط اطلاعاتی که دانش‌آموز لازم دارد.
create or replace function public.get_public_class(p_room_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.farsiyar_classes; names jsonb;
begin
 select * into c from public.farsiyar_classes where room_code=upper(trim(p_room_code));
 if not found then return null; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',student_name) order by student_name),'[]'::jsonb) into names from public.farsiyar_roster where class_id=c.id and active;
 return jsonb_build_object('id',c.id,'room_code',c.room_code,'title',c.title,'lesson_index',c.lesson_index,'mission',c.mission,'notice',c.notice,'board_state',c.board_state,'roster',names);
end $$;
grant execute on function public.get_public_class(text) to anon, authenticated;

-- ورود دانش‌آموز با PIN: نام به‌تنهایی کافی نیست.
create or replace function public.student_join(p_room_code text,p_student_name text,p_pin text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.farsiyar_classes; r public.farsiyar_roster; s integer;
begin
 select * into c from public.farsiyar_classes where room_code=upper(trim(p_room_code));
 if not found then raise exception 'کد کلاس پیدا نشد'; end if;
 select * into r from public.farsiyar_roster where class_id=c.id and student_name=trim(p_student_name) and active;
 if not found then raise exception 'این نام در فهرست کلاس نیست'; end if;
 if not (r.pin_hash=crypt(p_pin,r.pin_hash)) then raise exception 'رمز ورود دانش‌آموز نادرست است'; end if;
 insert into public.farsiyar_scores(class_id,roster_id,student_name) values(c.id,r.id,r.student_name) on conflict(class_id,roster_id) do nothing;
 return jsonb_build_object('roster_id',r.id,'name',r.student_name,'class_id',c.id,'room_code',c.room_code);
end $$;
grant execute on function public.student_join(text,text,text) to anon, authenticated;

-- ثبت پاسخ فقط با room+name+pin و مأموریت فعال؛ delta از سمت دانش‌آموز پذیرفته نمی‌شود.
create or replace function public.submit_student_response(p_room_code text,p_student_name text,p_pin text,p_kind text,p_answer text,p_auto_score integer default 0)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.farsiyar_classes; r public.farsiyar_roster; final_score integer; rid uuid;
begin
 select * into c from public.farsiyar_classes where room_code=upper(trim(p_room_code));
 if not found then raise exception 'کد کلاس پیدا نشد'; end if;
 select * into r from public.farsiyar_roster where class_id=c.id and student_name=trim(p_student_name) and active;
 if not found or r.pin_hash<>crypt(p_pin,r.pin_hash) then raise exception 'اطلاعات ورود دانش‌آموز نادرست است'; end if;
 if coalesce(c.mission->>'active','false')<>'true' then raise exception 'در حال حاضر مأموریت فعالی وجود ندارد'; end if;
 final_score=greatest(0,least(3,coalesce(p_auto_score,0)));
 insert into public.farsiyar_responses(class_id,roster_id,student_name,kind,answer,score) values(c.id,r.id,r.student_name,left(p_kind,40),left(p_answer,5000),final_score) returning id into rid;
 if final_score>0 then insert into public.farsiyar_scores(class_id,roster_id,student_name,points) values(c.id,r.id,r.student_name,final_score) on conflict(class_id,roster_id) do update set points=public.farsiyar_scores.points+final_score,updated_at=now(); end if;
 return jsonb_build_object('response_id',rid,'score',final_score);
end $$;
grant execute on function public.submit_student_response(text,text,text,text,text,integer) to anon, authenticated;

-- امتیازدهی دستی فقط توسط مالک کلاس و حداکثر ۳ امتیاز.
create or replace function public.teacher_add_score(p_class_id uuid,p_roster_id uuid,p_delta integer)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 if not exists(select 1 from public.farsiyar_classes where id=p_class_id and owner_id=auth.uid()) then raise exception 'اجازه امتیازدهی ندارید'; end if;
 if p_delta not between 1 and 3 then raise exception 'امتیاز باید بین ۱ تا ۳ باشد'; end if;
 insert into public.farsiyar_scores(class_id,roster_id,student_name,points) select p_class_id,id,student_name,p_delta from public.farsiyar_roster where id=p_roster_id and class_id=p_class_id and active on conflict(class_id,roster_id) do update set points=public.farsiyar_scores.points+p_delta,updated_at=now() returning points into n;
 if n is null then raise exception 'دانش‌آموز پیدا نشد'; end if; return n;
end $$;
grant execute on function public.teacher_add_score(uuid,uuid,integer) to authenticated;

-- Realtime
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


-- لایه عمومی Realtime: فقط وضعیت آموزشی و جدول امتیاز؛ بدون owner_id و PIN.
create table if not exists public.farsiyar_public_state (
  class_id uuid primary key references public.farsiyar_classes(id) on delete cascade,
  room_code text unique not null,
  lesson_index integer not null,
  mission jsonb not null default '{}'::jsonb,
  notice text not null default '',
  board_state jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.farsiyar_public_state enable row level security;
drop policy if exists public_state_read on public.farsiyar_public_state;
create policy public_state_read on public.farsiyar_public_state for select to anon,authenticated using (true);


create or replace function public.sync_public_state() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.farsiyar_public_state(class_id,room_code,lesson_index,mission,notice,board_state,updated_at)
  values(new.id,new.room_code,new.lesson_index,new.mission,new.notice,new.board_state,now())
  on conflict(class_id) do update set room_code=excluded.room_code,lesson_index=excluded.lesson_index,mission=excluded.mission,notice=excluded.notice,board_state=excluded.board_state,updated_at=now();
  return new;
end $$;
drop trigger if exists trg_sync_public_state on public.farsiyar_classes;
create trigger trg_sync_public_state after insert or update of room_code,lesson_index,mission,notice,board_state on public.farsiyar_classes
for each row execute function public.sync_public_state();

create table if not exists public.farsiyar_public_scores (
  class_id uuid not null references public.farsiyar_classes(id) on delete cascade,
  room_code text not null,
  roster_id uuid not null,
  student_name text not null,
  points integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(class_id,roster_id)
);
alter table public.farsiyar_public_scores enable row level security;
drop policy if exists public_scores_read on public.farsiyar_public_scores;
create policy public_scores_read on public.farsiyar_public_scores for select to anon,authenticated using (true);

create or replace function public.sync_public_score() returns trigger
language plpgsql security definer set search_path=public as $$
declare code text;
begin
 select room_code into code from public.farsiyar_classes where id=new.class_id;
 insert into public.farsiyar_public_scores(class_id,room_code,roster_id,student_name,points,updated_at)
 values(new.class_id,code,new.roster_id,new.student_name,new.points,now())
 on conflict(class_id,roster_id) do update set room_code=excluded.room_code,student_name=excluded.student_name,points=excluded.points,updated_at=now();
 return new;
end $$;
drop trigger if exists trg_sync_public_score on public.farsiyar_scores;
create trigger trg_sync_public_score after insert or update of points,student_name on public.farsiyar_scores
for each row execute function public.sync_public_score();

create or replace function public.get_public_scores(p_room_code text)
returns jsonb language sql security definer set search_path=public as $$
select coalesce(jsonb_agg(jsonb_build_object('roster_id',roster_id,'student_name',student_name,'points',points) order by points desc,student_name),'[]'::jsonb)
from public.farsiyar_public_scores where room_code=upper(trim(p_room_code));
$$;
grant execute on function public.get_public_scores(text) to anon,authenticated;


do $$ begin
  alter publication supabase_realtime add table public.farsiyar_public_state;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.farsiyar_public_scores;
exception when duplicate_object then null; end $$;
