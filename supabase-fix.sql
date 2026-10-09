-- فارسی‌یار: اصلاح/بازسازی تابع ساخت کلاس و امتیازدهی
-- برای دیتابیس تازه، ابتدا supabase-schema.sql را اجرا کنید.
create extension if not exists pgcrypto;
create or replace function public.create_farsiyar_class()
returns public.farsiyar_classes language plpgsql security invoker set search_path = public as $$
declare v_user uuid := auth.uid(); v_code text; v_row public.farsiyar_classes; v_try integer := 0;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  loop
    v_try := v_try + 1;
    v_code := 'FAR-' || lpad(floor(random()*10000)::integer::text,4,'0');
    begin
      insert into public.farsiyar_classes(owner_id,room_code,title,lesson_index,roster,mission,notice,board_state)
      values(v_user,v_code,'کلاس فارسی چهارم',0,'[]'::jsonb,null,'','[]'::jsonb) returning * into v_row;
      return v_row;
    exception when unique_violation then if v_try >= 30 then raise exception 'ROOM_CODE_EXHAUSTED'; end if;
    end;
  end loop;
end; $$;
revoke all on function public.create_farsiyar_class() from public;
grant execute on function public.create_farsiyar_class() to authenticated;

create or replace function public.award_farsiyar_points(p_room_code text,p_student_name text,p_delta integer)
returns integer language plpgsql security definer set search_path = public as $$
declare new_points integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED' using errcode='42501'; end if;
  if p_delta is null or p_delta < -3 or p_delta > 3 or p_delta = 0 then raise exception 'INVALID_DELTA'; end if;
  if not exists(select 1 from public.farsiyar_classes c where c.room_code=upper(trim(p_room_code)) and c.owner_id=auth.uid()) then raise exception 'NOT_CLASS_OWNER' using errcode='42501'; end if;
  if not exists(select 1 from public.farsiyar_classes c where c.room_code=upper(trim(p_room_code)) and c.roster @> jsonb_build_array(trim(p_student_name))) then raise exception 'STUDENT_NOT_IN_ROSTER'; end if;
  insert into public.farsiyar_scores(room_code,student_name,points,updated_at) values(upper(trim(p_room_code)),trim(p_student_name),greatest(0,p_delta),now())
  on conflict(room_code,student_name) do update set points=greatest(0,public.farsiyar_scores.points+p_delta),updated_at=now() returning points into new_points;
  return new_points;
end; $$;
revoke all on function public.award_farsiyar_points(text,text,integer) from public;
grant execute on function public.award_farsiyar_points(text,text,integer) to authenticated;

do $$ begin alter publication supabase_realtime add table public.farsiyar_responses; exception when duplicate_object then null; when undefined_object then raise notice 'Publication supabase_realtime not found.'; end $$;
do $$ begin alter publication supabase_realtime add table public.farsiyar_scores; exception when duplicate_object then null; when undefined_object then raise notice 'Publication supabase_realtime not found.'; end $$;
