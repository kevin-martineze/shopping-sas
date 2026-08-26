-- ============================================================================
-- Esquema completo de la tienda, listo para pegar en el SQL Editor de Supabase.
-- Generado a partir de supabase/migrations/. No editar a mano: editar las
-- migraciones y volver a generarlo.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0001_init.sql
-- ---------------------------------------------------------------------------

-- ============================================================================
-- Tienda de ropa — esquema inicial
-- Precios en pesos colombianos enteros (COP no usa decimales).
-- ============================================================================

create extension if not exists pgcrypto;

create type product_status as enum ('draft', 'active', 'archived');
create type order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type coupon_type as enum ('percent', 'fixed');

-- ----------------------------------------------------------------------------
-- Administración
-- ----------------------------------------------------------------------------

create table profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	email text not null,
	full_name text,
	role text not null default 'admin' check (role in ('admin')),
	created_at timestamptz not null default now()
);

-- Fila única con la configuración editable de la tienda.
create table settings (
	id boolean primary key default true check (id),
	store_name text not null default 'Tienda',
	whatsapp_phone text not null default '573000000000',
	instagram_url text,
	announcement text,
	free_shipping_threshold integer check (free_shipping_threshold >= 0),
	updated_at timestamptz not null default now()
);

insert into settings (id) values (true);

-- ----------------------------------------------------------------------------
-- Catálogo
-- ----------------------------------------------------------------------------

create table categories (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	name text not null,
	parent_id uuid references categories (id) on delete set null,
	sort_order integer not null default 0,
	active boolean not null default true
);

create table colors (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	name text not null,
	hex text not null,
	sort_order integer not null default 0
);

create table sizes (
	id uuid primary key default gen_random_uuid(),
	label text not null unique,
	sort_order integer not null default 0
);

create table products (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	name text not null,
	description text,
	material text,
	care text,
	category_id uuid references categories (id) on delete set null,
	base_price integer not null check (base_price >= 0),
	compare_at_price integer check (compare_at_price >= 0),
	status product_status not null default 'draft',
	featured boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index products_status_idx on products (status);
create index products_category_idx on products (category_id);
create index products_featured_idx on products (featured) where featured;

create table product_images (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references products (id) on delete cascade,
	color_id uuid references colors (id) on delete set null,
	storage_path text not null,
	url_full text not null,
	url_card text not null,
	url_thumb text not null,
	lqip text,
	alt text,
	sort_order integer not null default 0
);

create index product_images_product_idx on product_images (product_id, sort_order);

create table variants (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null references products (id) on delete cascade,
	color_id uuid not null references colors (id) on delete restrict,
	size_id uuid not null references sizes (id) on delete restrict,
	sku text unique,
	stock integer not null default 0 check (stock >= 0),
	price_override integer check (price_override >= 0),
	active boolean not null default true,
	unique (product_id, color_id, size_id)
);

create index variants_product_idx on variants (product_id);
create index variants_low_stock_idx on variants (stock) where stock <= 3;

-- ----------------------------------------------------------------------------
-- Colecciones / lookbook
-- ----------------------------------------------------------------------------

create table collections (
	id uuid primary key default gen_random_uuid(),
	slug text not null unique,
	name text not null,
	description text,
	hero_image_url text,
	active boolean not null default true,
	sort_order integer not null default 0,
	created_at timestamptz not null default now()
);

create table collection_products (
	collection_id uuid not null references collections (id) on delete cascade,
	product_id uuid not null references products (id) on delete cascade,
	sort_order integer not null default 0,
	-- Posición relativa (0-100) del producto etiquetado sobre la foto editorial.
	hotspot_x numeric(5, 2) check (hotspot_x between 0 and 100),
	hotspot_y numeric(5, 2) check (hotspot_y between 0 and 100),
	primary key (collection_id, product_id)
);

-- ----------------------------------------------------------------------------
-- Comercio: cupones, envíos, pedidos
-- ----------------------------------------------------------------------------

create table coupons (
	id uuid primary key default gen_random_uuid(),
	code text not null unique check (code = upper(code)),
	type coupon_type not null,
	value integer not null check (value > 0),
	min_subtotal integer not null default 0 check (min_subtotal >= 0),
	starts_at timestamptz,
	ends_at timestamptz,
	max_uses integer check (max_uses > 0),
	uses integer not null default 0,
	active boolean not null default true,
	created_at timestamptz not null default now(),
	constraint percent_range check (type <> 'percent' or value between 1 and 100)
);

create table shipping_zones (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	cost integer not null default 0 check (cost >= 0),
	eta_days integer check (eta_days >= 0),
	active boolean not null default true,
	sort_order integer not null default 0
);

create sequence order_number_seq start 1000;

create table orders (
	id uuid primary key default gen_random_uuid(),
	number bigint not null unique default nextval('order_number_seq'),
	-- Token del enlace público del pedido: permite compartirlo por WhatsApp sin
	-- exponer los demás pedidos a quien adivine un número.
	public_token uuid not null default gen_random_uuid(),
	status order_status not null default 'pending',
	customer_name text not null,
	customer_phone text not null,
	customer_city text,
	customer_address text,
	customer_notes text,
	shipping_zone_id uuid references shipping_zones (id) on delete set null,
	shipping_zone_name text,
	shipping_cost integer not null default 0 check (shipping_cost >= 0),
	coupon_id uuid references coupons (id) on delete set null,
	coupon_code text,
	subtotal integer not null check (subtotal >= 0),
	discount integer not null default 0 check (discount >= 0),
	total integer not null check (total >= 0),
	whatsapp_opened_at timestamptz,
	admin_notes text,
	-- Evita devolver stock dos veces si se cancela un pedido ya cancelado.
	stock_restored boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index orders_status_idx on orders (status, created_at desc);

-- Snapshot inmutable: si el producto cambia de precio o se archiva, el pedido no muta.
create table order_items (
	id uuid primary key default gen_random_uuid(),
	order_id uuid not null references orders (id) on delete cascade,
	variant_id uuid references variants (id) on delete set null,
	product_id uuid references products (id) on delete set null,
	product_name text not null,
	product_slug text not null,
	color_name text not null,
	size_label text not null,
	sku text,
	unit_price integer not null check (unit_price >= 0),
	qty integer not null check (qty > 0),
	line_total integer not null check (line_total >= 0)
);

create index order_items_order_idx on order_items (order_id);

create table restock_requests (
	id uuid primary key default gen_random_uuid(),
	variant_id uuid not null references variants (id) on delete cascade,
	contact text not null,
	created_at timestamptz not null default now(),
	notified_at timestamptz
);

create index restock_requests_pending_idx on restock_requests (created_at desc) where notified_at is null;

-- ----------------------------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql
as $fn$
begin
	new.updated_at = now();
	return new;
end;
$fn$;

create trigger products_touch before update on products
	for each row execute function touch_updated_at();

create trigger orders_touch before update on orders
	for each row execute function touch_updated_at();

create trigger settings_touch before update on settings
	for each row execute function touch_updated_at();


-- ---------------------------------------------------------------------------
-- 0002_rls_and_functions.sql
-- ---------------------------------------------------------------------------

-- ============================================================================
-- Seguridad (RLS) y lógica de negocio en base de datos.
--
-- Principio: el cliente anónimo solo LEE catálogo publicado. Todo lo que
-- escribe pasa por funciones security definer que recalculan precios desde
-- la base — nunca se confía en lo que manda el navegador.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------

create or replace function is_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
	select exists (select 1 from profiles where id = auth.uid());
$fn$;

-- Devuelve null si el cupón es aplicable, o el motivo del rechazo.
create or replace function coupon_rejection(c coupons, p_subtotal integer) returns text
language sql
immutable
as $fn$
	select case
		when c is null then 'not_found'
		when not c.active then 'inactive'
		when c.starts_at is not null and now() < c.starts_at then 'not_started'
		when c.ends_at is not null and now() > c.ends_at then 'expired'
		when c.max_uses is not null and c.uses >= c.max_uses then 'exhausted'
		when p_subtotal < c.min_subtotal then 'min_subtotal'
		else null
	end;
$fn$;

create or replace function coupon_discount(c coupons, p_subtotal integer) returns integer
language sql
immutable
as $fn$
	select case
		when c.type = 'percent' then least(p_subtotal, floor(p_subtotal * c.value / 100.0)::integer)
		else least(p_subtotal, c.value)
	end;
$fn$;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table profiles enable row level security;
alter table settings enable row level security;
alter table categories enable row level security;
alter table colors enable row level security;
alter table sizes enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table variants enable row level security;
alter table collections enable row level security;
alter table collection_products enable row level security;
alter table coupons enable row level security;
alter table shipping_zones enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table restock_requests enable row level security;

-- Lectura pública del catálogo publicado.
create policy settings_read on settings for select using (true);
create policy categories_read on categories for select using (active);
create policy colors_read on colors for select using (true);
create policy sizes_read on sizes for select using (true);
create policy products_read on products for select using (status = 'active');

create policy product_images_read on product_images for select using (
	exists (select 1 from products p where p.id = product_id and p.status = 'active')
);

create policy variants_read on variants for select using (
	active and exists (select 1 from products p where p.id = product_id and p.status = 'active')
);

create policy collections_read on collections for select using (active);

create policy collection_products_read on collection_products for select using (
	exists (select 1 from collections c where c.id = collection_id and c.active)
);

create policy shipping_zones_read on shipping_zones for select using (active);

-- Los códigos de cupón no se listan nunca al público: se validan por función.
-- Pedidos y avisos de reposición tampoco son legibles por el cliente.

-- El admin autenticado tiene acceso total a todo.
do $$
declare
	t text;
begin
	foreach t in array array[
		'profiles', 'settings', 'categories', 'colors', 'sizes', 'products',
		'product_images', 'variants', 'collections', 'collection_products',
		'coupons', 'shipping_zones', 'orders', 'order_items', 'restock_requests'
	] loop
		execute format(
			'create policy %I on %I for all to authenticated using (is_admin()) with check (is_admin())',
			t || '_admin_all', t
		);
	end loop;
end;
$$;

-- Único caso de escritura pública directa: pedir aviso de reposición.
create policy restock_requests_insert on restock_requests for insert to anon, authenticated
	with check (
		notified_at is null
		and length(btrim(contact)) between 5 and 120
		and exists (select 1 from variants v where v.id = variant_id)
	);

-- ----------------------------------------------------------------------------
-- validate_coupon: se llama desde el carrito antes de confirmar.
-- ----------------------------------------------------------------------------

create or replace function validate_coupon(p_code text, p_subtotal integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
	v_coupon coupons;
	v_reason text;
begin
	if p_subtotal is null or p_subtotal < 0 then
		return jsonb_build_object('ok', false, 'reason', 'invalid_subtotal');
	end if;

	select * into v_coupon from coupons where code = upper(btrim(p_code));

	if not found then
		return jsonb_build_object('ok', false, 'reason', 'not_found');
	end if;

	v_reason := coupon_rejection(v_coupon, p_subtotal);

	if v_reason is not null then
		return jsonb_build_object('ok', false, 'reason', v_reason, 'min_subtotal', v_coupon.min_subtotal);
	end if;

	return jsonb_build_object(
		'ok', true,
		'code', v_coupon.code,
		'type', v_coupon.type,
		'value', v_coupon.value,
		'discount', coupon_discount(v_coupon, p_subtotal)
	);
end;
$fn$;

-- ----------------------------------------------------------------------------
-- create_order: única puerta de entrada para crear un pedido.
--
-- Bloquea las variantes implicadas, revalida stock, recalcula precios,
-- descuenta inventario e inserta el pedido en una sola transacción.
-- ----------------------------------------------------------------------------

create or replace function create_order(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
	v_items jsonb := coalesce(p_payload -> 'items', '[]'::jsonb);
	v_customer jsonb := coalesce(p_payload -> 'customer', '{}'::jsonb);
	v_name text := btrim(coalesce(v_customer ->> 'name', ''));
	v_phone text := btrim(coalesce(v_customer ->> 'phone', ''));
	v_zone_id uuid := nullif(btrim(coalesce(p_payload ->> 'shipping_zone_id', '')), '')::uuid;
	v_coupon_code text := upper(btrim(coalesce(p_payload ->> 'coupon_code', '')));
	v_coupon coupons;
	v_reason text;
	v_problems jsonb;
	v_subtotal integer := 0;
	v_discount integer := 0;
	v_shipping integer := 0;
	v_zone_name text;
	v_threshold integer;
	v_order_id uuid;
	v_number bigint;
	v_token uuid;
begin
	if v_name = '' or length(v_name) > 120 then
		return jsonb_build_object('ok', false, 'error', 'invalid_name');
	end if;

	if v_phone !~ '^[0-9+ ()-]{7,20}$' then
		return jsonb_build_object('ok', false, 'error', 'invalid_phone');
	end if;

	if jsonb_array_length(v_items) = 0 then
		return jsonb_build_object('ok', false, 'error', 'empty_cart');
	end if;

	create temp table if not exists tmp_order_lines (
		variant_id uuid primary key,
		qty integer not null
	) on commit drop;
	-- `truncate`, no `delete`: Supabase activa safeupdate, que rechaza un DELETE
	-- sin WHERE aunque la tabla sea temporal.
	truncate table tmp_order_lines;

	insert into tmp_order_lines (variant_id, qty)
	select (e ->> 'variant_id')::uuid, (e ->> 'qty')::integer
	from jsonb_array_elements(v_items) e
	where (e ->> 'qty')::integer > 0
	on conflict (variant_id) do update set qty = tmp_order_lines.qty + excluded.qty;

	if not exists (select 1 from tmp_order_lines) then
		return jsonb_build_object('ok', false, 'error', 'empty_cart');
	end if;

	if exists (select 1 from tmp_order_lines where qty > 20) then
		return jsonb_build_object('ok', false, 'error', 'qty_too_high');
	end if;

	-- Orden por id para que dos pedidos simultáneos no se bloqueen en cruz.
	perform 1
	from variants v
	join tmp_order_lines r on r.variant_id = v.id
	order by v.id
	for update of v;

	select jsonb_agg(problem) into v_problems
	from (
		select jsonb_build_object(
			'variant_id', r.variant_id,
			'requested', r.qty,
			'available', coalesce(v.stock, 0),
			'product', coalesce(p.name, 'Producto'),
			'color', coalesce(c.name, ''),
			'size', coalesce(s.label, '')
		) as problem
		from tmp_order_lines r
		left join variants v on v.id = r.variant_id and v.active
		left join products p on p.id = v.product_id and p.status = 'active'
		left join colors c on c.id = v.color_id
		left join sizes s on s.id = v.size_id
		where v.id is null or p.id is null or v.stock < r.qty
	) t;

	if v_problems is not null then
		return jsonb_build_object('ok', false, 'error', 'stock', 'items', v_problems);
	end if;

	select coalesce(sum(coalesce(v.price_override, p.base_price) * r.qty), 0)
	into v_subtotal
	from tmp_order_lines r
	join variants v on v.id = r.variant_id
	join products p on p.id = v.product_id;

	if v_coupon_code <> '' then
		select * into v_coupon from coupons where code = v_coupon_code for update;
		v_reason := coupon_rejection(v_coupon, v_subtotal);

		if v_reason is not null then
			return jsonb_build_object('ok', false, 'error', 'coupon', 'reason', v_reason);
		end if;

		v_discount := coupon_discount(v_coupon, v_subtotal);
	end if;

	if v_zone_id is not null then
		select name, cost into v_zone_name, v_shipping
		from shipping_zones
		where id = v_zone_id and active;

		if not found then
			return jsonb_build_object('ok', false, 'error', 'invalid_zone');
		end if;
	end if;

	select free_shipping_threshold into v_threshold from settings where id;

	if v_threshold is not null and (v_subtotal - v_discount) >= v_threshold then
		v_shipping := 0;
	end if;

	insert into orders (
		customer_name, customer_phone, customer_city, customer_address, customer_notes,
		shipping_zone_id, shipping_zone_name, shipping_cost,
		coupon_id, coupon_code, subtotal, discount, total
	)
	values (
		v_name,
		v_phone,
		nullif(btrim(coalesce(v_customer ->> 'city', '')), ''),
		nullif(btrim(coalesce(v_customer ->> 'address', '')), ''),
		nullif(btrim(coalesce(v_customer ->> 'notes', '')), ''),
		v_zone_id,
		v_zone_name,
		v_shipping,
		v_coupon.id,
		nullif(v_coupon_code, ''),
		v_subtotal,
		v_discount,
		v_subtotal - v_discount + v_shipping
	)
	returning id, number, public_token into v_order_id, v_number, v_token;

	insert into order_items (
		order_id, variant_id, product_id, product_name, product_slug,
		color_name, size_label, sku, unit_price, qty, line_total
	)
	select
		v_order_id,
		v.id,
		p.id,
		p.name,
		p.slug,
		c.name,
		s.label,
		v.sku,
		coalesce(v.price_override, p.base_price),
		r.qty,
		coalesce(v.price_override, p.base_price) * r.qty
	from tmp_order_lines r
	join variants v on v.id = r.variant_id
	join products p on p.id = v.product_id
	join colors c on c.id = v.color_id
	join sizes s on s.id = v.size_id;

	update variants v
	set stock = v.stock - r.qty
	from tmp_order_lines r
	where v.id = r.variant_id;

	if v_coupon.id is not null then
		update coupons set uses = uses + 1 where id = v_coupon.id;
	end if;

	return jsonb_build_object(
		'ok', true,
		'id', v_order_id,
		'number', v_number,
		'token', v_token,
		'subtotal', v_subtotal,
		'discount', v_discount,
		'shipping_cost', v_shipping,
		'total', v_subtotal - v_discount + v_shipping
	);
end;
$fn$;

-- ----------------------------------------------------------------------------
-- Gestión posterior del pedido (solo admin / servidor)
-- ----------------------------------------------------------------------------

create or replace function cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
	v_order orders;
begin
	select * into v_order from orders where id = p_order_id for update;

	if not found then
		return jsonb_build_object('ok', false, 'error', 'not_found');
	end if;

	if v_order.status = 'cancelled' then
		return jsonb_build_object('ok', true, 'already_cancelled', true);
	end if;

	if not v_order.stock_restored then
		update variants v
		set stock = v.stock + i.qty
		from order_items i
		where i.order_id = p_order_id and i.variant_id = v.id;

		if v_order.coupon_id is not null then
			update coupons set uses = greatest(uses - 1, 0) where id = v_order.coupon_id;
		end if;
	end if;

	update orders
	set status = 'cancelled', stock_restored = true
	where id = p_order_id;

	return jsonb_build_object('ok', true);
end;
$fn$;

create or replace function mark_whatsapp_opened(p_number bigint)
returns void
language sql
security definer
set search_path = public
as $fn$
	update orders
	set whatsapp_opened_at = now()
	where number = p_number and whatsapp_opened_at is null;
$fn$;

-- ----------------------------------------------------------------------------
-- Permisos de ejecución
-- ----------------------------------------------------------------------------

revoke all on function create_order(jsonb) from public;
revoke all on function validate_coupon(text, integer) from public;
revoke all on function cancel_order(uuid) from public;
revoke all on function mark_whatsapp_opened(bigint) from public;
revoke all on function is_admin() from public;

grant execute on function create_order(jsonb) to anon, authenticated, service_role;
grant execute on function validate_coupon(text, integer) to anon, authenticated, service_role;
grant execute on function mark_whatsapp_opened(bigint) to anon, authenticated, service_role;
grant execute on function cancel_order(uuid) to authenticated, service_role;
grant execute on function is_admin() to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- Storage de imágenes: lectura pública, escritura solo desde el servidor.
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy product_images_public_read on storage.objects for select
	using (bucket_id = 'product-images');


-- ---------------------------------------------------------------------------
-- 0003_grants.sql
-- ---------------------------------------------------------------------------

-- ============================================================================
-- Privilegios de tabla.
--
-- RLS decide QUÉ FILAS ve cada rol, pero primero hace falta el permiso sobre la
-- tabla. Sin estos grants, PostgREST responde 42501 ("permission denied") antes
-- siquiera de evaluar las políticas.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Catálogo publicado: lectura para cualquier visitante. Las políticas de RLS
-- ya limitan a productos activos, categorías activas, etc.
grant select on table
	settings,
	categories,
	colors,
	sizes,
	products,
	product_images,
	variants,
	collections,
	collection_products,
	shipping_zones
to anon, authenticated;

-- Única escritura pública: pedir aviso cuando una talla vuelva a haber.
grant insert on table restock_requests to anon, authenticated;

-- La administradora entra como `authenticated`; sus políticas exigen is_admin().
grant select, insert, update, delete on all tables in schema public to authenticated;

-- El servidor usa service_role para el panel y para crear pedidos.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;

-- Tablas futuras heredan lo mismo sin tener que recordar estos grants.
alter default privileges in schema public
	grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
	grant all on tables to service_role;


