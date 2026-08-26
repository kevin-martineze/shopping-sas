/**
 * Aplica migraciones SQL contra la base indicada en SUPABASE_DB_URL.
 *
 * Cada archivo corre dentro de una transacción: o entra completo, o no entra
 * nada. Existe porque la conexión directa de Supabase es solo IPv6 y el CLI
 * necesita Docker; esto solo necesita Node.
 *
 * Uso:
 *   node scripts/migrate.mjs                        aplica las pendientes
 *   node scripts/migrate.mjs supabase/seed.sql      aplica un archivo suelto
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import postgres from 'postgres';

const MIGRATIONS_DIR = 'supabase/migrations';

function readEnvFile() {
	const env = {};

	try {
		for (const line of readFileSync('.env', 'utf8').split('\n')) {
			const match = line.match(/^([A-Z0-9_]+)="?([^"]*)"?\s*$/);
			if (match) env[match[1]] = match[2];
		}
	} catch {
		// Sin .env se cae al entorno del proceso.
	}

	return env;
}

const env = readEnvFile();
const url = process.env.SUPABASE_DB_URL ?? env.SUPABASE_DB_URL;

if (!url) {
	console.error('Falta SUPABASE_DB_URL. Ponla en .env o en el entorno.');
	process.exit(1);
}

/**
 * `db.<ref>.supabase.co` solo resuelve por IPv6 y la mayoría de redes no
 * llegan; el pooler sí es IPv4, así que se reescribe la cadena hacia él.
 */
function toPoolerUrl(original) {
	const parsed = new URL(original);
	const direct = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/);

	if (!direct) return original;

	const region = process.env.SUPABASE_REGION ?? env.SUPABASE_REGION ?? 'us-east-2';
	parsed.hostname = `aws-0-${region}.pooler.supabase.com`;
	parsed.username = `postgres.${direct[1]}`;

	return parsed.toString();
}

const sql = postgres(toPoolerUrl(url), { ssl: 'require', max: 1, onnotice: () => {} });

async function ensureLedger() {
	await sql`
		create table if not exists schema_migrations (
			name text primary key,
			applied_at timestamptz not null default now()
		)
	`;
}

async function appliedNames() {
	const rows = await sql`select name from schema_migrations`;
	return new Set(rows.map((row) => row.name));
}

async function applyFile(path, name) {
	const contents = readFileSync(path, 'utf8');

	await sql.begin(async (tx) => {
		await tx.unsafe(contents);
		if (name) await tx`insert into schema_migrations (name) values (${name})`;
	});

	console.log(`aplicado ${name ?? path}`);
}

async function main() {
	const [target] = process.argv.slice(2);

	if (target) {
		await applyFile(target, null);
		return;
	}

	await ensureLedger();
	const applied = await appliedNames();
	const files = readdirSync(MIGRATIONS_DIR)
		.filter((file) => file.endsWith('.sql'))
		.sort();

	let count = 0;

	for (const file of files) {
		if (applied.has(file)) continue;
		await applyFile(join(MIGRATIONS_DIR, file), file);
		count += 1;
	}

	console.log(count === 0 ? 'sin migraciones pendientes' : `${count} migraciones aplicadas`);
}

try {
	await main();
} catch (error) {
	console.error('falló:', error.message);
	process.exitCode = 1;
} finally {
	await sql.end();
}
