-- ============================================================================
-- Catálogos administrables desde el panel.
--
-- Colores, tallas, categorías, los textos de la portada y la foto de las
-- colecciones dejan de estar fijos en el código o cargados por SQL.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Colores y tallas se pueden ocultar, igual que las categorías.
-- Borrarlos falla cuando hay variantes que los usan (la clave foránea es
-- `on delete restrict`), y esa señal es la que el panel traduce en "se ocultó".
-- ----------------------------------------------------------------------------

alter table colors add column active boolean not null default true;
alter table sizes add column active boolean not null default true;

alter table colors
	add constraint colors_hex_format check (hex ~ '^#[0-9a-fA-F]{6}$');

-- ----------------------------------------------------------------------------
-- Bloques de la portada, bajo el hero.
-- ----------------------------------------------------------------------------

create table home_highlights (
	id uuid primary key default gen_random_uuid(),
	eyebrow text not null,
	title text not null,
	body text not null,
	sort_order integer not null default 0,
	active boolean not null default true
);

-- Se siembran con los textos que hoy están escritos en la portada, para que
-- nada cambie de aspecto al desplegar esta migración.
insert into home_highlights (eyebrow, title, body, sort_order) values
	(
		'Pedidos',
		'Se cierra por WhatsApp',
		'Armas tu carrito acá y el pedido llega listo al chat, con tallas, colores y total.',
		0
	),
	(
		'Stock real',
		'Sin sorpresas de talla',
		'Cada talla y color tiene su inventario. Si aparece disponible, está disponible.',
		1
	),
	(
		'Envíos',
		'A todo el país',
		'Calculamos el costo según tu ciudad antes de confirmar.',
		2
	);

-- ----------------------------------------------------------------------------
-- Hero de la portada: o manda una colección, o mandan estos textos.
-- ----------------------------------------------------------------------------

alter table settings
	add column hero_title text,
	add column hero_subtitle text,
	add column hero_collection_id uuid references collections (id) on delete set null;

-- Hasta ahora la portada usaba la primera colección activa: se conserva esa
-- elección para que la tienda no cambie de aspecto al aplicar la migración.
update settings
set hero_collection_id = (
	select id from collections where active order by sort_order, created_at limit 1
)
where hero_collection_id is null;

-- Ruta en Storage de la foto de colección, para poder borrarla al reemplazarla.
alter table collections add column hero_storage_path text;

-- ----------------------------------------------------------------------------
-- Seguridad
-- ----------------------------------------------------------------------------

alter table home_highlights enable row level security;

create policy home_highlights_read on home_highlights for select using (active);

create policy home_highlights_admin_all on home_highlights for all to authenticated
	using (is_admin()) with check (is_admin());

grant select on table home_highlights to anon, authenticated;
grant select, insert, update, delete on table home_highlights to authenticated;
grant all on table home_highlights to service_role;
