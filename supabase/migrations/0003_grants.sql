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
