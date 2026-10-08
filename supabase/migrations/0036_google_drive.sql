-- ============================================================
-- Google Drive da Emerge — conexão OAuth única (da empresa, não por
-- usuário) + cache das pastas usadas pelo Calendário Social.
-- Aditivo: nada existente é tocado.
-- ============================================================

create table if not exists public.google_drive_connection (
  id               boolean primary key default true check (id), -- singleton
  google_email     text,
  access_token     text not null,
  refresh_token    text not null,
  token_expires_at timestamptz not null,
  -- pasta raiz dos clientes: dentro dela fica <cliente>/Social/<post>
  root_folder_id   text,
  root_folder_name text,
  connected_by     uuid references auth.users(id),
  updated_at       timestamptz not null default now()
);

-- RLS ligada e SEM policy: tokens só são lidos/escritos via service_role
-- (createAdminClient), nunca pelo client de um usuário.
alter table public.google_drive_connection enable row level security;

-- pasta "<cliente>/Social" do projeto e pasta do post (cache de ids)
alter table public.social_projects add column if not exists drive_folder_id text;
alter table public.social_posts add column if not exists drive_folder_id text;
