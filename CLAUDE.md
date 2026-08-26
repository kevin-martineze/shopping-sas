# CLAUDE.md — Reglas del proyecto

Léelo entero antes de generar código. Son las convenciones del proyecto, no
sugerencias. Cualquier desviación necesita justificación explícita.

Stack: **SvelteKit 2 + Svelte 5 (runes) + TypeScript strict + Tailwind v4 +
shadcn-svelte + Supabase**.

---

## 1. Reglas duras

### TypeScript

1. **Prohibido `any`.** Usa `unknown` con type guards.
2. **Prohibido `as`.** Si necesitas castear, generaliza el tipo en su origen o
   escribe una guarda que lea campo a campo (ver `readOrderResult` en
   `src/lib/server/orders.ts`).
3. **Prohibido `@ts-ignore` / `@ts-expect-error`.**
4. **Prohibido `console.log`.** Solo `console.warn` / `console.error`, y nunca
   con datos de clientas.

### Svelte 5

5. **Solo runes.** Cero `export let`, `$:`, `on:click`, `<slot>`. Usa `$state`,
   `$derived`, `$props`, `$effect`, `$bindable`, snippets y `{@render}`.
6. **`$derived` para todo cálculo derivado**, nunca `$effect` con `$state =`.
7. **`$effect` solo para efectos reales:** DOM, suscripciones, timers,
   hidratación de `localStorage`, envío programático de forms.
8. **Nada de subcomponentes declarados dentro de otro componente.**
9. **`{#each items as item (key)}` siempre con key.**
10. **Props con `interface Props` tipada.** Nunca se mutan: si necesitas estado
    local que parte de un prop, cópialo con `$state(untrack(() => …))`.

### Datos

11. **La carga inicial se hace en `+page.server.ts` / `+layout.server.ts`.** El
    cliente no hace `fetch` a la API.
12. **Las mutaciones van por form actions** con `use:enhance`.
13. **El carrito y los favoritos viven en `localStorage`** y llegan al servidor
    por form action, nunca por `fetch` manual.
14. **Errores en load: `error(status, mensaje)`** de `@sveltejs/kit`.
15. **Los precios se recalculan siempre en el servidor.** El navegador solo
    manda identificadores y cantidades.

### Supabase

16. **Dos clientes, distintos permisos.** `locals.supabase` (clave anónima, con
    RLS) para leer catálogo; `supabaseAdmin()` (service role) solo en servidor y
    solo después de verificar la sesión de la administradora.
17. **La `SUPABASE_SERVICE_ROLE_KEY` nunca sale del servidor.**
18. **La lógica de pedidos vive en SQL** (`create_order`, `cancel_order`,
    `validate_coupon`). Si cambias una regla de precios, cámbiala también en
    `computeTotals` de `src/lib/server/cart.ts`, que la refleja para la vista
    previa del carrito.
19. **Cada cambio de esquema es una migración nueva** en `supabase/migrations/`,
    numerada. No se editan las ya aplicadas.

### UI

20. **Los consumidores importan de `$lib/components/atoms/*`, nunca de
    `$lib/components/ui/*`.** Los átomos son el lugar de los overrides de marca.
    Si una primitiva no existe: `pnpm dlx shadcn-svelte@latest add <nombre>` y
    luego crea el átomo que la re-exporta.
21. **Atomic design:** `atoms → molecules → organisms`. Un componente solo
    importa de niveles inferiores.
22. **Solo tokens de Tailwind** (`bg-background`, `text-muted-foreground`,
    `text-sale`, `bg-whatsapp`…). Cero `bg-[#…]`, cero `text-[12px]`.
23. **`cn()` para clases dinámicas.**
24. **Iconos: solo `@lucide/svelte`.** Cero emojis en la interfaz. Ojo: lucide ya
    no trae iconos de marca (no existe `instagram`).
25. **`type="button"` explícito** en todo botón que no sea submit.
26. **Los filtros, el orden y la paginación viven en `URLSearchParams`**, no en
    `$state`.

### Formularios

27. **Schemas zod en `$lib/schemas/`**, uno por dominio.
28. **Validación en el servidor siempre**, aunque el input tenga `required`.
29. **Botones de submit deshabilitados mientras se envía.**

### Imports

30. **Alias `$lib/`** para todo lo de `src/lib/`. Cero `../../`.
31. **Orden:** tipos → `svelte`/`@sveltejs/*` → librerías externas → `$app/*` →
    `$lib/*` → relativos. Línea en blanco entre grupos.

---

## 2. Textos de cara al público

Todo en español de Colombia, tuteando y sin tecnicismos. Los precios se muestran
con `formatMoney` (`$89.900`, sin decimales). Los estados internos se guardan en
inglés (`pending`, `shipped`) y se traducen al pintarlos con
`ORDER_STATUS_LABEL`.

---

## 3. Gates

`pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test` y `pnpm build` deben
pasar. El pre-commit corre Prettier, ESLint y un grep que bloquea `console.log`,
`: any`, `as any`, `@ts-ignore`, `export let`, `on:click` y `$:`. Si falla, se
arregla la causa: nunca `--no-verify`.

---

## 4. Antes de crear algo nuevo

Lee un archivo equivalente que ya exista y replica el patrón:

- Página de listado con filtros → `src/routes/(shop)/tienda/+page.svelte`
- Página con form action → `src/routes/(shop)/carrito/+page.server.ts`
- Pantalla de administración → `src/routes/(admin)/admin/(panel)/cupones/`
- Consulta a Supabase → `src/lib/server/catalog.ts`
- Función de negocio en SQL → `supabase/migrations/0002_rls_and_functions.sql`
