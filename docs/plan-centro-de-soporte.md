# Plan: centro de soporte de Globerce

Estado: **plan aprobado en concepto, sin implementar** (2 de noviembre de 2026).

Soporte entre las dueñas de tienda y el equipo de Globerce, con conversaciones e
historial dentro de la plataforma. **No es** el asistente de IA de la tienda
(`/asistente`, que atiende a las compradoras) ni la sección «Avisos» del panel
(clientas que piden aviso de reposición, `RestockRequest`).

## Punto de partida (auditoría)

- No existe nada en ninguna rama de `ecommerce-api` ni del frontend: ni modelo
  Prisma, ni módulo de la API, ni rutas en el panel o en `/plataforma`.
- La única vía hoy es la página pública `/contacto`
  (`src/routes/(marketing)/contacto/+page.svelte`), con WhatsApp
  (`EMPRESA.whatsapp`) y `mailto:`.
- `/plataforma` tiene solo inicio, `pagos` y `tiendas` (`tiendas/[id]`).
- La API ya trae lo necesario para reutilizar:
  - el `Mailer` global (`src/shared/mail/`: `SmtpMailer` o `LogMailer` según
    `MAIL_DRIVER`, plantillas en `templates.ts`);
  - el aislamiento por tienda con RLS: el runtime usa el rol `tienda_app` sin
    `BYPASSRLS`. Ver la migración `20260916120000_cuentas_y_equipo`;
  - la noción de administrador de la plataforma (`PlatformAdmin`) y la
    membresía de tienda (`StoreMember`).

## Ramas

- `ecommerce-api`: `feat/centro-de-soporte` desde `main`.
- Frontend: `feat/centro-de-soporte` desde `main`, no desde la rama de la
  landing, para no mezclar cambios.

## Etapa 1 · API (`ecommerce-api`)

### Modelos Prisma

`SupportTicket`

| Campo                     | Tipo                   | Nota                                                                          |
| ------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| `id`                      | uuid                   |                                                                               |
| `storeId`                 | FK `Store`             | índice                                                                        |
| `openedById`              | FK `User`              | quién lo abrió                                                                |
| `subject`                 | string                 | 3–120 caracteres                                                              |
| `category`                | enum `SupportCategory` | `store_setup`, `domain`, `payments`, `plan`, `catalog_orders`, `bug`, `other` |
| `status`                  | enum `SupportStatus`   | `open`, `answered`, `closed`; por defecto `open`                              |
| `lastMessageAt`           | datetime               | para ordenar la bandeja                                                       |
| `ownerReadAt`             | datetime?              | última vez que la tienda abrió el hilo                                        |
| `staffReadAt`             | datetime?              | última vez que el equipo abrió el hilo                                        |
| `createdAt` / `updatedAt` | datetime               |                                                                               |

`SupportMessage`

| Campo        | Tipo               | Nota                        |
| ------------ | ------------------ | --------------------------- |
| `id`         | uuid               |                             |
| `ticketId`   | FK `SupportTicket` | `onDelete: Cascade`, índice |
| `authorId`   | FK `User`          |                             |
| `authorSide` | enum `SupportSide` | `store` o `staff`           |
| `body`       | text               | 1–5000 caracteres           |
| `createdAt`  | datetime           |                             |

- **Sin leer**: no hace falta otra tabla. Para la tienda hay respuesta nueva si
  `lastMessageAt > ownerReadAt` y el último mensaje es `staff`; para el equipo,
  al revés. Abrir el hilo actualiza el `*ReadAt` de ese lado.
- **Estado automático**: si responde el equipo, pasa a `answered`. Si escribe la
  tienda, pasa a `open`, también desde `closed` para que se reabra. El equipo
  puede ponerlo a mano en `closed`.
- **Migración**: escribirla a mano con las políticas RLS de las dos tablas, igual
  que las demás tablas por tienda. Para `SupportMessage`, la política va por el
  `storeId` del ticket. Verificar que con el rol `tienda_app` una tienda no lee
  los tickets de otra.

### Módulo `src/modules/support`

Controladores separados por superficie, con los mismos guards que el resto:

**Tienda** (sesión de panel; la tienda sale del token, nunca del body):

- `GET /panel/support/tickets`: lista de la tienda, con un indicador de no leído
  y paginación.
- `POST /panel/support/tickets`: crea el ticket con su primer mensaje.
- `GET /panel/support/tickets/:id`: hilo completo; marca `ownerReadAt`. Responde
  404, no 403, si el ticket es de otra tienda.
- `POST /panel/support/tickets/:id/messages`: nuevo mensaje de la tienda.
- `GET /panel/support/unread-count`: para el contador del menú.

**Plataforma** (solo `PlatformAdmin`):

- `GET /platform/support/tickets?status=&q=&page=`: todas las tiendas, con los
  pendientes primero (`open` y la tienda escribió de último). Busca por asunto,
  nombre de tienda o correo.
- `GET /platform/support/tickets/:id`: hilo, tienda y quién lo abrió; marca
  `staffReadAt`.
- `POST /platform/support/tickets/:id/messages`: respuesta del equipo.
- `PATCH /platform/support/tickets/:id`: cambia el `status`.
- `GET /platform/support/unread-count`.

Validar las entradas con zod, como el resto de la API. Los permisos se deciden en
la API; el frontend solo esconde.

### Notificaciones (reusar `Mailer`)

- Ticket nuevo: correo a los `PlatformAdmin`, con el asunto, la tienda y el
  enlace a `/plataforma/soporte/:id`.
- Respuesta del equipo: correo a quien abrió el ticket, con el enlace a
  `/admin/soporte/:id`. No incluir el texto completo si trae datos sensibles;
  basta un extracto corto.
- Plantillas nuevas en `templates.ts`, con prueba en `templates.spec.ts`.
- Si el envío del correo falla, no se cae el mensaje: se registra con
  `console.warn`, sin datos de la clienta.

### Pruebas (`test/support.e2e-spec.ts`)

- La tienda crea un ticket, lo lista y escribe un mensaje.
- El equipo lo ve, responde y el estado pasa a `answered`. La tienda ve que no
  está leído; al abrirlo deja de estarlo.
- La tienda B no ve ni puede escribir en el ticket de la tienda A (404).
- Una dueña sin `PlatformAdmin` recibe 403 en `/platform/support/*`.
- Un ticket `closed` se reabre cuando la tienda escribe.
- Validación: asunto vacío o mensaje demasiado largo dan 400.

## Etapa 2 · Panel de la dueña (`/admin/soporte`)

Patrón a replicar: `src/routes/(admin)/admin/(panel)/cupones/`.

- `$lib/server/api/panel-support.ts`: cliente sobre `panelRequest`, que devuelve
  `ApiResult<T>`. Las respuestas se leen con zod y se traducen a
  `$lib/domain/support.ts`.
- `$lib/schemas/support.ts`: esquemas de los formularios (asunto, categoría,
  mensaje).
- `soporte/+page.server.ts` y `+page.svelte`: lista de tickets con su estado y la
  marca «Respuesta nueva», y la action `crear` para abrir uno nuevo.
- `soporte/[id]/+page.server.ts` y `+page.svelte`: el hilo, con burbujas de la
  tienda y del equipo, y la action `responder`.
- Toda action empieza con `panelContext(event)`. Llevan `use:enhance` y el botón
  se deshabilita mientras se envía.
- Menú del panel: la entrada «Soporte» con el icono `LifeBuoy` de lucide y un
  contador de no leídos que carga `+layout.server.ts`.
- Etiquetas en español: `SUPPORT_STATUS_LABEL` (`open` «Abierto», `answered`
  «Respondido», `closed` «Cerrado») y `SUPPORT_CATEGORY_LABEL`.
- En `/contacto`, opcional: un aviso de que las dueñas pueden escribir desde su
  panel.

## Etapa 3 · Consola de la plataforma (`/plataforma/soporte`)

- `$lib/server/api/platform.ts`, o un archivo `platform-support.ts` nuevo, sobre
  `accountContext(event)` / `requirePlatformAdmin`.
- `plataforma/soporte/+page.server.ts` y `+page.svelte`: la bandeja, con tienda,
  quién abrió, asunto, estado y tiempo sin respuesta.
  - Los pendientes van resaltados.
  - Filtro por estado, búsqueda y paginación en `URLSearchParams`.
- `plataforma/soporte/[id]`: el hilo, con un enlace a la ficha
  `plataforma/tiendas/[id]`, la action `responder` y la action `estado`.
- Entrada en el menú de la consola, con su contador.

## Etapa 4 · Verificación

1. Levantar la base local (Docker, `docker-compose.yml`) y correr
   `pnpm db:migrate` en `ecommerce-api`. **Nunca contra producción.**
2. API: `pnpm typecheck`, `pnpm lint:check`, `pnpm format:check`, `pnpm test`,
   `pnpm test:e2e`.
3. Frontend: `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test`,
   `pnpm build`.
4. Probar en el navegador el flujo completo, en móvil y en escritorio: la dueña
   abre un ticket, el equipo lo ve y responde, la dueña ve la respuesta y
   contesta, el equipo lo cierra. Comprobar que la tienda B no lo ve.

## Para llevarlo a producción (después)

- Correr `pnpm db:deploy` en el servidor de la API.
- Configurar el correo: `MAIL_DRIVER=smtp`, `SMTP_URL` y `MAIL_FROM`.
- Confirmar que el equipo tiene `PlatformAdmin` (`pnpm platform:grant-admin`).

## Fuera de alcance por ahora

- Adjuntos o capturas en los mensajes. Si se agregan, reenviarlos a la API como
  las fotos de producto.
- Avisos en tiempo real (websocket); por ahora el contador se actualiza al
  navegar.
- Asignar tickets a una persona del equipo y respuestas guardadas.
