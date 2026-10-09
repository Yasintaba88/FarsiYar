-- FarsiYar: safe mission NULL repair for the existing database
-- Run once in Supabase SQL Editor. Does not delete classes or responses.
begin;

update public.farsiyar_classes
set mission = '{}'::jsonb
where mission is null;

alter table public.farsiyar_classes
  alter column mission set default '{}'::jsonb;

alter table public.farsiyar_classes
  alter column mission set not null;

-- Keep the public mirror consistent if that table exists.
do $do$
begin
  if to_regclass('public.farsiyar_public_state') is not null then
    execute $sql$update public.farsiyar_public_state set mission = '{}'::jsonb where mission is null$sql$;
    execute $sql$alter table public.farsiyar_public_state alter column mission set default '{}'::jsonb$sql$;
    execute $sql$alter table public.farsiyar_public_state alter column mission set not null$sql$;
  end if;
end
$do$;

create or replace function public.create_farsiyar_class()
returns public.farsiyar_classes
language plpgsql
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_code text;
  v_row public.farsiyar_classes;
  v_try integer := 0;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  loop
    v_try := v_try + 1;
    v_code := 'FAR-' || lpad(floor(random() * 10000)::integer::text, 4, '0');

    begin
      insert into public.farsiyar_classes
        (owner_id, room_code, title, lesson_index, roster, mission, notice, board_state)
      values
        (v_user, v_code, 'کلاس فارسی چهارم', 0,
         '[]'::jsonb, '{}'::jsonb, '', '[]'::jsonb)
      returning * into v_row;

      return v_row;
    exception when unique_violation then
      if v_try >= 30 then
        raise exception 'ROOM_CODE_EXHAUSTED';
      end if;
    end;
  end loop;
end;
$function$;

revoke all on function public.create_farsiyar_class() from public;
grant execute on function public.create_farsiyar_class() to authenticated;
notify pgrst, 'reload schema';
commit;
