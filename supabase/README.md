# Migrations

Sem Supabase CLI configurado no projeto ainda. Para aplicar uma migration:

1. Abra o SQL Editor do projeto **taksINTERNO** (vaxotbozscqaczwzaxtr) no dashboard do Supabase.
2. Cole o conteúdo do arquivo `.sql` e rode.

Ou, com a CLI: `supabase db push` (após `supabase link`).

As migrations são aditivas e idempotentes (`if not exists` / `on conflict do nothing`).
