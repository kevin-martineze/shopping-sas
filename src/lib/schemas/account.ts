import { z } from 'zod';

/** Doce caracteres y sin más reglas, igual que la API (ver `RegisterStoreDto`). */
export const PASSWORD_MIN = 12;

const email = z
	.string()
	.trim()
	.toLowerCase()
	// El campo vacío se queja de estar vacío; el mal escrito, de estarlo. Un
	// solo mensaje para los dos casos hace que el segundo suene a acusación.
	.min(1, 'Escribe tu correo.')
	.email('Correo inválido.')
	.max(255);

const newPassword = z
	.string()
	.min(PASSWORD_MIN, `La contraseña necesita al menos ${PASSWORD_MIN} caracteres.`)
	.max(200, 'La contraseña es demasiado larga.');

/** Contraseña nueva escrita dos veces. */
function withConfirmation<T extends z.ZodRawShape>(shape: T) {
	return z
		.object({ ...shape, password: newPassword, confirm: z.string() })
		.refine((value) => value.password === value.confirm, {
			message: 'Las contraseñas no coinciden.',
			path: ['confirm']
		});
}

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = withConfirmation({
	token: z.string().min(20, 'El enlace no es válido. Pide uno nuevo.')
});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, 'Escribe tu contraseña actual.'),
		password: newPassword,
		confirm: z.string()
	})
	.refine((value) => value.password === value.confirm, {
		message: 'Las contraseñas no coinciden.',
		path: ['confirm']
	});

export const memberRoleSchema = z.enum(['owner', 'staff'], {
	errorMap: () => ({ message: 'Elige un rol.' })
});

export const inviteSchema = z.object({ email, role: memberRoleSchema });

/** Aceptar con una cuenta que ya existe: solo su contraseña. */
export const acceptExistingSchema = z.object({
	token: z.string().min(20),
	password: z.string().min(1, 'Escribe tu contraseña.')
});

/** Aceptar creando la cuenta: nombre y contraseña nueva. */
export const acceptNewSchema = withConfirmation({
	token: z.string().min(20),
	fullName: z.string().trim().min(2, 'Escribe tu nombre.').max(120)
});

/** Código de plan, como lo valida `ActivatePlanDto` en la API. */
export const planCodeSchema = z
	.string()
	.trim()
	.toLowerCase()
	.regex(/^[a-z0-9-]{2,40}$/, 'Elige un plan.');

export const STORE_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export const registerSchema = withConfirmation({
	storeName: z.string().trim().min(2, 'Ponle nombre a tu tienda.').max(80),
	storeSlug: z
		.string()
		.trim()
		.toLowerCase()
		.min(3, 'Elige la dirección de tu tienda.')
		.regex(
			STORE_SLUG_PATTERN,
			'La dirección admite minúsculas, números y guiones (3 a 40), y empieza y termina con letra o número.'
		),
	fullName: z.string().trim().min(2, 'Escribe tu nombre.').max(120),
	email,
	whatsappPhone: z
		.string()
		.trim()
		.min(1, 'Escribe el WhatsApp de ventas.')
		.transform((value) => value.replace(/\D/g, ''))
		.pipe(z.string().regex(/^\d{10,15}$/, 'El WhatsApp debe tener entre 10 y 15 dígitos.'))
});

/**
 * Los datos de la tienda, sin los de la cuenta.
 *
 * Es lo único que se pide cuando quien registra ya tiene sesión: su cuenta ya
 * existe, y volver a pedirle nombre y contraseña sería pedirle que se
 * registrara dos veces.
 */
export const storeFieldsSchema = registerSchema.innerType().pick({
	storeName: true,
	storeSlug: true,
	whatsappPhone: true
});
