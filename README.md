# Globerce — tiendas de ropa con checkout por WhatsApp

Frontend de **Globerce**: el sitio que vende la plataforma, la tienda pública
de cada clienta (una por subdominio), su panel de administración y la consola
de la plataforma. Los cuatro salen del mismo despliegue y se reparten por host.

No hay pagos online en la tienda: la clienta arma su carrito, el pedido se
guarda en la API y se abre WhatsApp con el mensaje ya escrito para cerrar la
venta por chat.

**Stack:** SvelteKit 2 · Svelte 5 (runes) · TypeScript strict · Tailwind v4 ·
shadcn-svelte · API propia (`ecommerce-api`) · Cloudflare R2 · Vercel.

> Los datos NO salen de Supabase: todo pasa por `ecommerce-api`, que es quien
> habla con Postgres. Este repositorio no tiene acceso a la base. El porqué y
> el cómo del aislamiento entre tiendas están en `docs/ARCHITECTURE.md` de ese
> repositorio; lo que falta, en su `docs/PENDIENTES.md`.

---

## Puesta en marcha

### 1. Dependencias

```bash
pnpm install
```

### 2. La API

Este frontend no arranca solo: necesita `ecommerce-api` corriendo (su README
explica cómo levantarla con Docker en un par de comandos). Por defecto escucha
en `http://127.0.0.1:3000/v1`.

### 3. Variables de entorno

```bash
cp .env.example .env
```

| Variable                   | Qué es                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `API_URL`                  | La API con su prefijo de versión. Solo se llama desde el servidor.                    |
| `API_SHARED_SECRET`        | El secreto que la API exige en producción (`x-globerce-key`). Vacío en desarrollo.    |
| `SESSION_SECRET`           | Cifra la cookie del panel. Mínimo 32 caracteres; cambiarlo cierra todas las sesiones. |
| `PUBLIC_SITE_URL`          | URL pública, para los enlaces de WhatsApp y el sitemap.                               |
| `PUBLIC_STORE_ROOT_DOMAIN` | Dominio de las tiendas: cada una es un subdominio suyo.                               |
| `PUBLIC_STORE_SLUG`        | Tienda que sirve el dominio raíz. Sin ella, el raíz muestra el sitio comercial.       |

En local, `boutique.localhost:5173` sirve la tienda `boutique` sin tocar
`/etc/hosts`.

### 4. Desarrollo

```bash
pnpm dev
```

- Sitio comercial: <http://localhost:5173> (si `PUBLIC_STORE_SLUG` está vacío)
- Tienda: <http://nombre.localhost:5173>
- Panel: <http://localhost:5173/admin>
- Consola de la plataforma: <http://localhost:5173/plataforma>

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

## Qué sirve cada host

El hook universal `src/hooks.ts` decide antes de enrutar:

| Host                             | Qué muestra                                |
| -------------------------------- | ------------------------------------------ |
| `globerce.store`                 | El sitio que vende Globerce, y `/registro` |
| `boutique.globerce.store`        | La tienda de esa clienta                   |
| cualquiera de los dos + `/admin` | El panel de la tienda del host             |
| `.../plataforma`                 | La consola de quien vende el software      |

Los subdominios reservados (`www`, `api`, `admin`…) nunca son una tienda, y la
API tampoco deja registrarlos.

---

## Cómo funciona la compra

1. **Carrito en el navegador.** `localStorage` guarda solo `variantId` y
   cantidad — nunca precios. Vive en `src/lib/stores/cart.svelte.ts`.
2. **Revalidación.** `/carrito` manda el carrito a la form action `?/preparar`,
   que recalcula precios y stock reales, valida el cupón y suma el envío.
3. **Creación del pedido.** `?/confirmar` se lo pide a la API, que bloquea las
   variantes, vuelve a verificar stock, recalcula todo desde la base, descuenta
   inventario e inserta el pedido en una sola transacción.
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
│   ├── domain/         Tipos y reglas del dominio, en snake_case
│   ├── schemas/        Validación zod, la misma en el navegador y el servidor
│   ├── server/         Todo lo que habla con la API, la sesión y el contexto
│   ├── stores/         Carrito y favoritos (runes + localStorage)
│   └── utils/          Funciones puras (dinero, WhatsApp, slugs, formularios)
└── routes/
    ├── (marketing)/    El sitio que vende Globerce
    ├── (shop)/         La tienda pública
    ├── (admin)/admin/  El panel (login fuera del guard, resto dentro)
    └── (platform)/     La consola de la plataforma
```

---

## Notas de operación

- **Sesión.** Cookie cifrada (AES-256-GCM) con los tokens de la API dentro.
  Se emite para todo el dominio raíz, porque el registro vive arriba y el panel
  de cada tienda en su subdominio.
- **Stock.** Se descuenta al crear el pedido, no al pagar. Un pedido pendiente
  retiene inventario hasta que se confirme o cancele; el panel destaca los que
  llevan más de 24 horas.
- **Imágenes.** Las convierte la API al subirlas: tres tamaños en WebP
  (400/800/1600 px) más un LQIP embebido. Este frontend solo reenvía el archivo
  tal como llega del formulario.
- **Plantillas.** Cada tienda elige con cuál se viste; los tokens de cada una
  están en `src/app.css`, bajo `[data-storefront-template]`, y el catálogo en
  `src/lib/domain/templates.ts`.
- **Adaptador.** En Vercel se usa `adapter-vercel`; en local, `adapter-node`,
  porque el de Vercel crea symlinks y Windows los bloquea sin modo desarrollador.
- **Registro npm.** El `.npmrc` del proyecto apunta al registro público, para no
  heredar el CodeArtifact privado configurado a nivel de usuario.
