/**
 * Los archivos se procesan por lotes: Windows corta la línea de comandos a
 * ~32 KB y un commit grande supera ese límite si se pasan todas las rutas de
 * una vez. Las primitivas generadas por shadcn-svelte se saltan porque no se
 * editan a mano.
 */
const BATCH_SIZE = 40;
const GENERATED = 'src/lib/components/ui/';

function quote(file) {
	return `"${file}"`;
}

function batches(files) {
	const usable = files.filter((file) => !file.replaceAll('\\', '/').includes(GENERATED));
	const chunks = [];

	for (let index = 0; index < usable.length; index += BATCH_SIZE) {
		chunks.push(
			usable
				.slice(index, index + BATCH_SIZE)
				.map(quote)
				.join(' ')
		);
	}

	return chunks;
}

export default {
	'*.{ts,svelte,svelte.ts}': (files) =>
		batches(files).flatMap((chunk) => [
			`prettier --write ${chunk}`,
			`eslint --max-warnings 0 --no-warn-ignored --fix ${chunk}`,
			`bash -c '".husky/check-patterns.sh" "$@"' -- ${chunk}`
		]),
	'*.{js,mjs,json,css,md}': (files) => batches(files).map((chunk) => `prettier --write ${chunk}`)
};
