-- EPIC Equipe / Organização — TREM 2 fix-forward (finding Crivo, item 5):
-- o guard de ciclo de holding só existia no app (filtro no client + checagem na
-- server action). O BANCO passa a ser a fonte da verdade: trigger BEFORE em
-- app_companies recusa self-parent e qualquer ciclo A → … → A na cadeia de
-- parent_id, independente do caminho (app, SQL direto, importação futura).
--
-- ADITIVO + IDEMPOTENTE (create or replace + drop trigger if exists). Não toca
-- dados, RLS nem a app_has_permission. ACK Régie (EPIC Equipe/Org, Trem 2 fix).

create or replace function public.app_companies_no_cycle()
  returns trigger
  language plpgsql
  set search_path to ''
as $function$
declare
  v_cur   uuid;
  v_depth int := 0;
begin
  if new.parent_id is null then
    return new;
  end if;

  -- (a) self-parent
  if new.parent_id = new.id then
    raise exception 'Uma empresa não pode ser matriz de si mesma.'
      using errcode = 'check_violation';
  end if;

  -- (b) caminha a cadeia de matrizes a partir do parent proposto; se reencontrar
  --     new.id, este vínculo fecharia um ciclo.
  v_cur := new.parent_id;
  while v_cur is not null loop
    if v_cur = new.id then
      raise exception 'Isso criaria um ciclo de matriz (A → … → A).'
        using errcode = 'check_violation';
    end if;

    v_depth := v_depth + 1;
    if v_depth > 64 then
      raise exception 'Cadeia de matrizes profunda demais — possível ciclo.'
        using errcode = 'check_violation';
    end if;

    select c.parent_id into v_cur
    from public.app_companies c
    where c.id = v_cur;
  end loop;

  return new;
end $function$;

drop trigger if exists app_companies_no_cycle_trg on public.app_companies;
create trigger app_companies_no_cycle_trg
  before insert or update of parent_id on public.app_companies
  for each row
  execute function public.app_companies_no_cycle();

-- ------------------------------------------------------------ REVERSÃO (descomenta):
-- drop trigger if exists app_companies_no_cycle_trg on public.app_companies;
-- drop function if exists public.app_companies_no_cycle();
