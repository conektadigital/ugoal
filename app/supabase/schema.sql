-- UGOAL · respaldo por usuario (una fila con todo su estado)
create table if not exists public.snapshots (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.snapshots enable row level security;

create policy "cada quien lee lo suyo" on public.snapshots
  for select using (auth.uid() = user_id);
create policy "cada quien guarda lo suyo" on public.snapshots
  for insert with check (auth.uid() = user_id);
create policy "cada quien actualiza lo suyo" on public.snapshots
  for update using (auth.uid() = user_id);

-- Metas en grupo (siguiente fase): cada integrante registra su parte desde su celular.
create table if not exists public.groups (
  code text primary key,
  goal jsonb not null,
  owner uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.group_members (
  code text references public.groups (code) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  paid numeric not null default 0,
  show_amount boolean not null default false,
  primary key (code, user_id)
);
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
-- Función con permisos propios para evitar que las reglas se llamen a sí mismas.
create or replace function public.is_member(c text) returns boolean
  language sql security definer set search_path = public stable as
$$ select exists (select 1 from public.group_members where code = c and user_id = auth.uid()) $$;
create policy "miembros ven su grupo" on public.groups for select using (public.is_member(code) or owner = auth.uid());
create policy "dueño crea grupo" on public.groups for insert with check (owner = auth.uid());
create policy "miembros ven integrantes" on public.group_members for select using (public.is_member(code));
create policy "cada quien se une" on public.group_members for insert with check (user_id = auth.uid());
create policy "cada quien actualiza su parte" on public.group_members for update using (user_id = auth.uid());
