-- ════════════════════════════════════════════════════════════
-- OAB Rio Preto — Eventos — schema inicial (Supabase / Postgres)
-- Substitui o modelo "uma aba do Sheets por evento" por duas
-- tabelas relacionais normais. O Table Editor do Supabase já
-- funciona como visualização "tipo planilha" — não precisa
-- recriar nada disso na mão.
-- ════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── EVENTOS ────────────────────────────────────────────────────
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  descricao        text default '',
  data             date,
  hora             text default '',
  local            text default '',
  tipo             text default 'gratuito' check (tipo in ('gratuito','pago')),
  valor            numeric default 0,
  modalidade       text default 'Presencial' check (modalidade in ('Presencial','Online','Híbrido')),
  status           text default 'ATIVO' check (status in ('ATIVO','INATIVO','FINALIZADO')),
  imagens          text[] default '{}',       -- URLs no Supabase Storage
  campos           jsonb default '[]',        -- definição dos campos extras do formulário
  lotes            jsonb default '[]',        -- lotes/categorias com preço
  bg_theme         text default 'white',
  bg_custom        text default '#f4f6fa',
  fonte            text default 'jakarta',
  cor              text default '#4f46e5',
  btn_txt          text default '',
  msg_esgotado     text default '',
  email_protocolo  text default '',
  vagas            int default 0,
  vagas_vis        text default 'visivel' check (vagas_vis in ('visivel','invisivel')),
  nomes_manuais    text default '',           -- nomes adicionados à mão, 1 por linha
  created_by       uuid references auth.users(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists idx_events_status on public.events(status);
create index if not exists idx_events_data   on public.events(data);

-- ── INSCRIÇÕES ─────────────────────────────────────────────────
create table if not exists public.registrations (
  id                     uuid primary key default gen_random_uuid(),
  event_id               uuid not null references public.events(id) on delete cascade,
  nome                   text not null,
  telefone               text,
  email                  text,
  cpf                    text,
  dados                  jsonb default '{}',   -- respostas dos campos dinâmicos {label: valor}
  possui_deficiencia     text,
  descricao_deficiencia  text,
  lgpd_aceito            boolean default false,
  lote                   text,
  valor_lote             numeric,
  presenca               boolean default false,
  presenca_em            timestamptz,
  sorteado               boolean default false,
  sorteado_em            timestamptz,
  protocolo              text,
  created_at             timestamptz default now()
);

create index if not exists idx_reg_event   on public.registrations(event_id);
create index if not exists idx_reg_cpf     on public.registrations(cpf);
create index if not exists idx_reg_presenca on public.registrations(event_id, presenca);

-- ── trigger simples para updated_at ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ── contagem automática de inscritos (view, sempre correta) ────
create or replace view public.v_event_stats as
select
  e.id as event_id,
  count(r.id) filter (where true) as total_inscritos,
  count(r.id) filter (where r.presenca) as total_presentes
from public.events e
left join public.registrations r on r.event_id = e.id
group by e.id;

-- ── view pública "enxuta" de inscrições (sem email/telefone/cpf) ─
-- Usada na lista pública de presença e no contador de vagas,
-- pra não expor dado pessoal de terceiros como o Sheets antigo expunha.
create or replace view public.v_public_registrations as
select id, event_id, nome, presenca, created_at
from public.registrations;

-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════
alter table public.events enable row level security;
alter table public.registrations enable row level security;

-- Qualquer pessoa (inclusive anônima) pode LER eventos —
-- necessário para o formulário público e a página de presença.
drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events
  for select using (true);

-- Só usuários autenticados (o admin logado no painel) podem
-- criar / editar / apagar eventos.
drop policy if exists "events_admin_write" on public.events;
create policy "events_admin_write" on public.events
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Qualquer pessoa pode se inscrever (inserir registration) —
-- é o formulário público de inscrição.
drop policy if exists "registrations_public_insert" on public.registrations;
create policy "registrations_public_insert" on public.registrations
  for insert with check (true);

-- Leitura completa (com email/telefone/cpf) só para o admin logado.
drop policy if exists "registrations_admin_read" on public.registrations;
create policy "registrations_admin_read" on public.registrations
  for select using (auth.role() = 'authenticated');

-- Update (marcar presença, sorteio, etc.) — liberado também para
-- anônimo porque as páginas públicas de check-in por CPF e de
-- sorteio público precisam gravar sem login. Se quiser travar isso,
-- troque para 'authenticated' e mova check-in/sorteio para uma
-- Edge Function (ver supabase/functions).
drop policy if exists "registrations_write" on public.registrations;
create policy "registrations_write" on public.registrations
  for update using (true) with check (true);

-- ════════════════════════════════════════════════════════════
-- STORAGE (imagens de evento + comprovantes/uploads)
-- Rode isto uma vez, ou crie o bucket "uploads" pela UI do
-- Supabase (Storage -> New bucket -> público).
-- ════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "uploads_public_read" on storage.objects;
create policy "uploads_public_read" on storage.objects
  for select using (bucket_id = 'uploads');

drop policy if exists "uploads_anyone_insert" on storage.objects;
create policy "uploads_anyone_insert" on storage.objects
  for insert with check (bucket_id = 'uploads');
