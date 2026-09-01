-- ============================================================================
-- Datos de ejemplo para desarrollo.
-- Las fotos apuntan a Unsplash solo para poder maquetar: se reemplazan por las
-- fotos reales subiéndolas desde el panel de administración.
-- ============================================================================

update settings
set
	store_name = 'Atelier',
	whatsapp_phone = '573000000000',
	instagram_url = 'https://instagram.com/',
	announcement = 'Envío gratis por compras sobre $250.000',
	free_shipping_threshold = 250000
where id;

insert into sizes (label, sort_order) values
	('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5);

insert into colors (slug, name, hex, sort_order) values
	('crudo', 'Crudo', '#EFE7DA', 1),
	('negro', 'Negro', '#141414', 2),
	('arena', 'Arena', '#D8C3A5', 3),
	('oliva', 'Oliva', '#6B705C', 4),
	('terracota', 'Terracota', '#B85C38', 5),
	('indigo', 'Índigo', '#2C3E50', 6);

insert into categories (slug, name, sort_order) values
	('blusas', 'Blusas', 1),
	('vestidos', 'Vestidos', 2),
	('pantalones', 'Pantalones', 3),
	('faldas', 'Faldas', 4),
	('abrigos', 'Abrigos', 5);

insert into shipping_zones (name, cost, eta_days, sort_order) values
	('Bogotá', 8000, 2, 1),
	('Ciudades principales', 12000, 3, 2),
	('Resto del país', 18000, 5, 3),
	('Recoge en tienda', 0, 0, 4);

insert into coupons (code, type, value, min_subtotal, active) values
	('BIENVENIDA10', 'percent', 10, 100000, true),
	('ENVIOGRATIS', 'fixed', 12000, 150000, true);

insert into products (slug, name, description, material, care, category_id, base_price, compare_at_price, status, featured)
select
	t.slug, t.name, t.description, t.material, t.care,
	(select id from categories where slug = t.category),
	t.base_price, t.compare_at_price, 'active', t.featured
from (values
	(
		'blusa-lino-vera', 'Blusa Vera',
		'Blusa de lino lavado con caída suelta y botonadura de nácar. Pensada para el calor sin perder la línea.',
		'100% lino lavado', 'Lavar a mano en agua fría. No usar secadora.',
		'blusas', 189000, null, true
	),
	(
		'vestido-midi-alba', 'Vestido Alba',
		'Vestido midi de algodón con cintura marcada y falda amplia. Cae en columna y se mueve con el paso.',
		'Algodón orgánico', 'Lavado a máquina en ciclo delicado.',
		'vestidos', 259000, 299000, true
	),
	(
		'pantalon-sastre-noa', 'Pantalón Noa',
		'Pantalón de sastre de tiro alto y pierna recta. Estructura limpia, sin pinzas visibles.',
		'Mezcla de lana fría', 'Limpieza en seco.',
		'pantalones', 229000, null, true
	),
	(
		'falda-plisada-ines', 'Falda Inés',
		'Falda plisada por debajo de la rodilla, con pretina elástica oculta.',
		'Poliéster reciclado', 'Lavar a mano. Colgar para secar.',
		'faldas', 179000, 199000, false
	),
	(
		'abrigo-lana-mira', 'Abrigo Mira',
		'Abrigo largo de lana con hombro caído y cierre cruzado. La pieza que sostiene todo el invierno.',
		'80% lana, 20% poliamida', 'Limpieza en seco. Cepillar tras cada uso.',
		'abrigos', 489000, null, true
	),
	(
		'blusa-seda-lena', 'Blusa Lena',
		'Blusa de seda lavada con cuello en V y manga tres cuartos.',
		'100% seda', 'Lavar a mano en agua fría con jabón neutro.',
		'blusas', 219000, null, false
	)
) as t(slug, name, description, material, care, category, base_price, compare_at_price, featured);

-- Variantes: cada producto se ofrece en dos colores y todas las tallas.
do $$
declare
	rec record;
begin
	for rec in
		select *
		from (values
			('blusa-lino-vera', array['crudo', 'negro']),
			('vestido-midi-alba', array['arena', 'negro']),
			('pantalon-sastre-noa', array['negro', 'oliva']),
			('falda-plisada-ines', array['terracota', 'crudo']),
			('abrigo-lana-mira', array['arena', 'indigo']),
			('blusa-seda-lena', array['crudo', 'indigo'])
		) as t(slug, colores)
	loop
		insert into variants (product_id, color_id, size_id, sku, stock)
		select
			p.id,
			c.id,
			s.id,
			upper(replace(p.slug, '-', '')) || '-' || upper(c.slug) || '-' || s.label,
			case when s.label in ('XS', 'XL') then 2 else 6 end
		from products p
		join colors c on c.slug = any (rec.colores)
		cross join sizes s
		where p.slug = rec.slug;
	end loop;
end;
$$;

-- Una talla agotada para poder probar el aviso de reposición.
update variants v
set stock = 0
from products p, sizes s
where v.product_id = p.id
	and v.size_id = s.id
	and p.slug = 'blusa-lino-vera'
	and s.label = 'M';

insert into product_images (product_id, color_id, storage_path, url_full, url_card, url_thumb, alt, sort_order)
select
	p.id,
	(select id from colors where slug = t.color),
	'seed/' || p.slug || '-' || t.sort_order,
	t.url || '&w=1600&q=80',
	t.url || '&w=800&q=75',
	t.url || '&w=400&q=70',
	p.name,
	t.sort_order
from products p
join (values
	('blusa-lino-vera', 'crudo', 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop', 0),
	('blusa-lino-vera', 'crudo', 'https://images.unsplash.com/photo-1554568218-0f1715e72254?auto=format&fit=crop', 1),
	('vestido-midi-alba', 'arena', 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop', 0),
	('vestido-midi-alba', 'arena', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop', 1),
	('pantalon-sastre-noa', 'negro', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop', 0),
	('pantalon-sastre-noa', 'negro', 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop', 1),
	('falda-plisada-ines', 'terracota', 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop', 0),
	('abrigo-lana-mira', 'arena', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop', 0),
	('abrigo-lana-mira', 'indigo', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop', 1),
	('blusa-seda-lena', 'crudo', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop', 0)
) as t(slug, color, url, sort_order) on t.slug = p.slug;

insert into collections (slug, name, description, hero_image_url, sort_order)
values (
	'temporada-clara',
	'Temporada clara',
	'Lino, algodón y seda en la paleta más luminosa del año. Piezas para superponer sin peso.',
	'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=80',
	1
);

insert into collection_products (collection_id, product_id, sort_order, hotspot_x, hotspot_y)
select
	(select id from collections where slug = 'temporada-clara'),
	p.id,
	t.sort_order,
	t.x,
	t.y
from products p
join (values
	('blusa-lino-vera', 0, 32.0, 38.0),
	('pantalon-sastre-noa', 1, 44.0, 70.0),
	('blusa-seda-lena', 2, 68.0, 42.0)
) as t(slug, sort_order, x, y) on t.slug = p.slug;

-- La colección de ejemplo encabeza la portada.
update settings
set hero_collection_id = (select id from collections where slug = 'temporada-clara')
where hero_collection_id is null;
