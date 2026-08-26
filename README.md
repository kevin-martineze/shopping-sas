# Tienda de ropa — catálogo con checkout por WhatsApp

Tienda pública con acabado editorial y panel de administración. No hay pagos
online: el cliente arma su carrito, el pedido se guarda en base de datos y se
abre WhatsApp con el mensaje ya escrito para cerrar la venta por chat.

**Stack:** SvelteKit 2 · Svelte 5 (runes) · TypeScript strict · Tailwind v4 ·
shadcn-svelte · Supabase (Postgres + Auth + Storage) · Vercel.

---

## Puesta en marcha

### 1. Dependencias

```bash
pnpm install
```

### 2. Proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el SQL Editor ejecuta, en orden:
   - `supabase/migrations/0001_init.sql` — tablas, índices y triggers.
   - `supabase/migrations/0002_rls_and_functions.sql` — RLS, funciones de
     negocio y el bucket de imágenes.
   - `supabase/seed.sql` — opcional, datos de ejemplo para maquetar.
3. Crea la cuenta de la administradora en **Authentication → Users** y luego
   dale acceso al panel:

   ```sql
   insert into profiles (id, email, full_name)
   select id, email, 'Nombre de la administradora'
   from auth.users
   where email = 'correo@de-la-tienda.com';
   ```

### 3. Variables de entorno

```bash
cp .env.example .env
```

| Variable                    | De dónde sale                                              |
| --------------------------- | ---------------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`       | Supabase → Project Settings → API → Project URL            |
| `PUBLIC_SUPABASE_ANON_KEY`  | misma pantalla → `anon` `public`                           |
| `SUPABASE_SERVICE_ROLE_KEY` | misma pantalla → `service_role` (**solo servidor**)        |
| `PUBLIC_SITE_URL`           | `http://localhost:5173` en local; el dominio en producción |

El número de WhatsApp **no** es variable de entorno: se edita desde
`/admin/ajustes` para que la tienda lo cambie sin redeploy.

### 4. Desarrollo

```bash
pnpm dev
```

- Tienda: <http://localhost:5173>
- Panel: <http://localhost:5173/admin>

---

## Comandos

| Comando       | Qué hace                     |
| ------------- | ---------------------------- |
| `pnpm dev`    | Servidor de desarrollo       |
| `pnpm build`  | Build de producción          |
| `pnpm check`  | Tipos de TypeScript y Svelte |
| `pnpm lint`   | ESLint                       |
| `pnpm format` | Prettier                     |
| `pnpm test`   | Tests unitarios (vitest)     |

Los cinco deben pasar antes de mergear. Si un hook de pre-commit falla, arregla
la causa: nunca `--no-verify`.

---

## Cómo funciona la compra

1. **Carrito en el navegador.** `localStorage` guarda solo `variantId` y
   cantidad — nunca precios. Vive en `src/lib/stores/cart.svelte.ts`.
2. **Revalidación.** `/carrito` manda el carrito a la form action `?/preparar`,
   que recalcula precios y stock reales, valida el cupón y suma el envío.
3. **Creación del pedido.** `?/confirmar` llama a la función SQL `create_order`,
   que bloquea las variantes, vuelve a verificar stock, recalcula todo desde la
   base, descuenta inventario e inserta el pedido en una sola transacción.
4. **WhatsApp.** Se redirige a `/pedido/[number]?t=<token>`, que arma el mensaje
   y ofrece el botón para abrir el chat. El token del enlace permite compartir
   el pedido sin exponer los demás.
5. **Panel.** La administradora confirma, envía o cancela. Cancelar devuelve el
   stock y libera el uso del cupón.

Los precios se recalculan siempre en el servidor: un carrito viejo nunca compra
a precio viejo.

---

## Estructura

```
src/
├── lib/
│   ├── actions/        Acciones de Svelte (reveal al hacer scroll)
│   ├── components/
│   │   ├── ui/         Primitivas shadcn-svelte (no editar a mano)
│   │   ├── atoms/      Wrappers de marca — los únicos que se importan
│   │   ├── molecules/  Composiciones sin lógica de negocio
│   │   └── organisms/  Composiciones con stores y form actions
│   ├── domain/         Tipos del dominio (catálogo, pedidos, ajustes)
│   ├── schemas/        Validación zod
│   ├── server/         Consultas y lógica de servidor (Supabase, imágenes)
│   ├── stores/         Carrito y favoritos (runes + localStorage)
│   └── utils/          Funciones puras (dinero, WhatsApp, slugs)
└── routes/
    ├── (shop)/         Tienda pública
    └── (admin)/admin/  Panel (login fuera del guard, resto dentro)
```

---

## Notas de operación

- **Stock.** Se descuenta al crear el pedido, no al pagar. Un pedido pendiente
  retiene inventario hasta que se confirme o cancele; el panel destaca los que
  llevan más de 24 horas.
- **Imágenes.** Al subir se generan tres tamaños en WebP (400/800/1600 px) más
  un LQIP embebido. Se hace con `sharp` porque la transformación de imágenes de
  Supabase Storage es de plan pago.
- **Adaptador.** En Vercel se usa `adapter-vercel`; en local, `adapter-node`,
  porque el de Vercel crea symlinks y Windows los bloquea sin modo desarrollador.
- **Registro npm.** El `.npmrc` del proyecto apunta al registro público, para no
  heredar el CodeArtifact privado configurado a nivel de usuario.
