-- ============================================================
-- Sistema de Boletas de Lavandería — CC0154 / JJC
-- Ejecutar completo en Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. Secuencia del correlativo (arranca en 1 → se muestra como 00001)
create sequence if not exists boleta_numero_seq start 1;

-- 2. Boletas
create table if not exists boletas (
  id            uuid primary key default gen_random_uuid(),
  numero        bigint not null unique default nextval('boleta_numero_seq'),
  fecha         date not null default current_date,
  empresa       text not null default 'JJC CONTRATISTAS GENERALES S.A.',
  nombres       text not null,
  dni           text not null,
  hospedaje     text not null,
  habitacion    text,
  total_prendas int  not null default 0,
  observaciones text,

  estado        text not null default 'enviada'
                check (estado in ('enviada','validada')),

  -- Lo que completa lavandería al recoger
  total_kilos          numeric(6,2),
  obs_lavanderia       text,
  validado_por_nombre  text,
  validado_por         uuid references auth.users(id),
  validado_en          timestamptz,

  creado_en     timestamptz not null default now()
);

create index if not exists boletas_dni_idx    on boletas (dni);
create index if not exists boletas_estado_idx on boletas (estado);
create index if not exists boletas_fecha_idx  on boletas (fecha desc);

-- 3. Detalle de prendas
create table if not exists boleta_items (
  id                  uuid primary key default gen_random_uuid(),
  boleta_id           uuid not null references boletas(id) on delete cascade,
  tipo_ropa           text not null,
  cantidad            int  not null check (cantidad > 0),
  cantidad_confirmada int,               -- lo que realmente contó lavandería
  descripcion         text,
  orden               int  not null default 0
);

create index if not exists boleta_items_boleta_idx on boleta_items (boleta_id);

-- 4. Perfiles (solo para el personal de lavandería y el admin)
create table if not exists perfiles (
  id     uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol    text not null default 'lavanderia'
         check (rol in ('admin','lavanderia'))
);

-- 5. Row Level Security
alter table boletas      enable row level security;
alter table boleta_items enable row level security;
alter table perfiles     enable row level security;

-- El trabajador no tiene cuenta: registra y consulta sin autenticarse.
drop policy if exists "boletas: registrar sin cuenta" on boletas;
create policy "boletas: registrar sin cuenta"
  on boletas for insert to anon, authenticated with check (true);

drop policy if exists "boletas: consultar" on boletas;
create policy "boletas: consultar"
  on boletas for select to anon, authenticated using (true);

-- Solo lavandería/admin (usuarios con sesión) pueden dar el visto bueno.
drop policy if exists "boletas: validar" on boletas;
create policy "boletas: validar"
  on boletas for update to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "boletas: eliminar admin" on boletas;
create policy "boletas: eliminar admin"
  on boletas for delete to authenticated
  using (exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin'));

drop policy if exists "items: registrar" on boleta_items;
create policy "items: registrar"
  on boleta_items for insert to anon, authenticated with check (true);

drop policy if exists "items: consultar" on boleta_items;
create policy "items: consultar"
  on boleta_items for select to anon, authenticated using (true);

drop policy if exists "items: confirmar" on boleta_items;
create policy "items: confirmar"
  on boleta_items for update to authenticated
  using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "perfiles: leer propio" on perfiles;
create policy "perfiles: leer propio"
  on perfiles for select to authenticated using (id = auth.uid());

-- 6. Bloqueo: una boleta validada ya no se puede editar de nuevo
create or replace function bloquear_boleta_validada()
returns trigger language plpgsql as $$
begin
  if old.estado = 'validada' then
    raise exception 'La boleta % ya fue validada y no puede modificarse.', old.numero;
  end if;
  return new;
end $$;

drop trigger if exists trg_bloquear_boleta on boletas;
create trigger trg_bloquear_boleta
  before update on boletas
  for each row execute function bloquear_boleta_validada();

-- ============================================================
-- Después de crear el usuario de lavandería en Authentication → Users,
-- copia su UUID y ejecuta (una vez por cada usuario):
--
-- insert into perfiles (id, nombre, rol)
-- values ('UUID-AQUI', 'Lavandería Marcona', 'lavanderia');
--
-- insert into perfiles (id, nombre, rol)
-- values ('UUID-AQUI', 'Julio Huallanca', 'admin');
-- ============================================================
