-- Calendário Social — paridade com o legado (sistemaemerge.lovable.app/social-calendar)
-- + Kanban por status (Central) + vista pública por token opaco.
-- Tabelas novas prefixo social_*. FK só entre elas (on delete cascade).
-- client_id/task_id/created_by são uuid solto + index (padrão app_canvas/cronogramas,
-- sem tocar o grafo de constraints). Permissões social.view/manage/approve JÁ existem
-- em app_permissions (posições 70-72) e já concedidas a admin/socio/producao — a
-- migration só referencia. Idempotente. ACK Régie (Bloco 4, DP#2).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- projetos
create table if not exists public.social_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#45f0d1',
  client_id uuid,                       -- link opcional, sem FK formal
  share_token text unique not null default encode(gen_random_bytes(18), 'hex'),
  share_expires_at timestamptz,         -- null = sem expiração
  share_last_viewed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_projects_client_idx on public.social_projects (client_id);

-- ---------------------------------------------------------------- marcadores de dia
create table if not exists public.social_day_markers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.social_projects (id) on delete cascade,
  date date not null,
  label text not null,
  color text not null default '#f2b544',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists social_day_markers_project_idx on public.social_day_markers (project_id, date);

-- ---------------------------------------------------------------- posts
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.social_projects (id) on delete cascade,
  date date not null,
  "time" time,
  title text not null,
  platforms text[] not null default '{}',
  ideia text,
  objetivo text,
  legenda text,
  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_aprovacao', 'aprovado', 'reprovado', 'publicado')),
  task_id uuid,                         -- link opcional p/ tasks, sem FK formal
  position int not null default 0,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists social_posts_project_date_idx on public.social_posts (project_id, date);
create index if not exists social_posts_task_idx on public.social_posts (task_id) where task_id is not null;
create index if not exists social_posts_status_idx on public.social_posts (project_id, status);

-- ---------------------------------------------------------------- artes por formato
create table if not exists public.social_post_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts (id) on delete cascade,
  format text not null default 'feed_1_1',  -- feed_1_1 / feed_4_5 / feed_3_4 / stories_9_16 / reels_9_16 / carrossel_1_1 / ...
  image_url text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists social_post_assets_post_idx on public.social_post_assets (post_id, sort);

-- ---------------------------------------------------------------- comentários
create table if not exists public.social_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts (id) on delete cascade,
  body text not null,
  author_user uuid,       -- interno (logado)
  author_name text,       -- cliente (link público, sem login)
  author_ip inet,
  created_at timestamptz not null default now(),
  constraint social_comment_one_author check (
    (author_user is not null and author_name is null)
    or (author_user is null and author_name is not null)
  )
);
create index if not exists social_post_comments_post_idx on public.social_post_comments (post_id, created_at);

-- ---------------------------------------------------------------- RLS (5 tabelas)
do $$
declare
  t text;
begin
  foreach t in array array[
    'social_projects', 'social_day_markers', 'social_posts',
    'social_post_assets', 'social_post_comments'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'social view'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (app_has_permission(auth.uid(), %L))',
        'social view', t, 'social.view'
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'social manage'
    ) then
      execute format(
        'create policy %I on public.%I for all to authenticated using (app_has_permission(auth.uid(), %L)) with check (app_has_permission(auth.uid(), %L))',
        'social manage', t, 'social.manage', 'social.manage'
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- Storage bucket
insert into storage.buckets (id, name, public)
values ('social', 'social', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'social bucket read'
  ) then
    create policy "social bucket read" on storage.objects
      for select to public using (bucket_id = 'social');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'social bucket write'
  ) then
    create policy "social bucket write" on storage.objects
      for all to authenticated
      using (bucket_id = 'social' and app_has_permission(auth.uid(), 'social.manage'))
      with check (bucket_id = 'social' and app_has_permission(auth.uid(), 'social.manage'));
  end if;
end $$;

-- ---------------------------------------------------------------- Vista pública por token
-- Payload sem ids internos / created_by / token. Token opaco (144 bits) + expiração.
create or replace function public.get_social_share(p_token text)
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select jsonb_build_object(
    'project',
      to_jsonb(pr.*) - 'share_token' - 'created_by' - 'client_id'
        - 'share_expires_at' - 'share_last_viewed_at',
    'markers', coalesce((
      select jsonb_agg((to_jsonb(m.*) - 'created_by' - 'project_id') order by m.date)
      from public.social_day_markers m where m.project_id = pr.id
    ), '[]'::jsonb),
    'posts', coalesce((
      select jsonb_agg(
        (to_jsonb(po.*) - 'created_by' - 'task_id' - 'position')
        || jsonb_build_object(
          'assets', coalesce((
            select jsonb_agg((to_jsonb(a.*) - 'post_id') order by a.sort)
            from public.social_post_assets a where a.post_id = po.id
          ), '[]'::jsonb),
          'comments', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', c.id,
                'body', c.body,
                'author', coalesce(c.author_name, 'Equipe Emerge'),
                'is_client', c.author_name is not null,
                'created_at', c.created_at
              ) order by c.created_at
            )
            from public.social_post_comments c where c.post_id = po.id
          ), '[]'::jsonb)
        )
        order by po.date, po."time" nulls last
      )
      from public.social_posts po where po.project_id = pr.id
    ), '[]'::jsonb)
  )
  from public.social_projects pr
  where pr.share_token = p_token
    and (pr.share_expires_at is null or pr.share_expires_at > now());
$$;

grant execute on function public.get_social_share(text) to anon, authenticated;

-- registra abertura do link (quem/quando) — chamada 1x pela rota pública
create or replace function public.log_social_share_open(p_token text, p_ip text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.social_projects
    set share_last_viewed_at = now()
    where share_token = p_token
      and (share_expires_at is null or share_expires_at > now());
end $$;

grant execute on function public.log_social_share_open(text, text) to anon, authenticated;

-- cliente aprova / pede ajuste (sem login) — valida token↔post + expiração
create or replace function public.social_public_review(
  p_token text, p_post_id uuid, p_decision text, p_comment text, p_name text, p_ip text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_ok uuid;
begin
  if p_decision not in ('aprovado', 'reprovado') then
    raise exception 'decisão inválida';
  end if;
  if p_decision = 'reprovado' and coalesce(btrim(p_comment), '') = '' then
    raise exception 'comentário obrigatório ao pedir ajuste';
  end if;

  -- só posts que estão de fato em aprovação (cliente não "des-aprova" nem
  -- aprova rascunho / post já publicado). Régie hardening #4.
  select po.id into v_ok
  from public.social_posts po
  join public.social_projects pr on pr.id = po.project_id
  where pr.share_token = p_token
    and po.id = p_post_id
    and po.status = 'em_aprovacao'
    and (pr.share_expires_at is null or pr.share_expires_at > now());
  if v_ok is null then
    raise exception 'post não está em aprovação, ou link inválido/expirado';
  end if;

  update public.social_posts
    set status = p_decision, updated_at = now()
    where id = p_post_id;

  if coalesce(btrim(p_comment), '') <> '' then
    insert into public.social_post_comments (post_id, body, author_name, author_ip)
    values (p_post_id, btrim(p_comment), coalesce(nullif(btrim(p_name), ''), 'Cliente'),
            nullif(p_ip, '')::inet);
  end if;
end $$;

grant execute on function public.social_public_review(text, uuid, text, text, text, text) to anon, authenticated;

-- cliente comenta (sem mudar status)
create or replace function public.social_public_comment(
  p_token text, p_post_id uuid, p_name text, p_body text, p_ip text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_ok uuid;
begin
  if coalesce(btrim(p_body), '') = '' then
    raise exception 'comentário vazio';
  end if;
  select po.id into v_ok
  from public.social_posts po
  join public.social_projects pr on pr.id = po.project_id
  where pr.share_token = p_token
    and po.id = p_post_id
    and (pr.share_expires_at is null or pr.share_expires_at > now());
  if v_ok is null then
    raise exception 'link inválido ou expirado';
  end if;

  insert into public.social_post_comments (post_id, body, author_name, author_ip)
  values (p_post_id, btrim(p_body), coalesce(nullif(btrim(p_name), ''), 'Cliente'),
          nullif(p_ip, '')::inet);
end $$;

grant execute on function public.social_public_comment(text, uuid, text, text, text) to anon, authenticated;
