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
