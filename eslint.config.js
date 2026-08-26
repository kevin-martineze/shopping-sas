import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/ban-ts-comment': 'error',
			'no-console': ['error', { allow: ['warn', 'error'] }],
			// La app se sirve en la raíz del dominio: no hay base path que resolver.
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		// Scripts de terminal: su salida por consola es la interfaz de la herramienta.
		files: ['scripts/**/*.mjs'],
		rules: {
			'no-console': 'off'
		}
	},
	{
		// Primitivas generadas por shadcn-svelte: no se editan a mano.
		files: ['src/lib/components/ui/**'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': 'off'
		}
	},
	{
		ignores: ['.svelte-kit/', 'build/', 'node_modules/', '.vercel/', 'static/', 'supabase/.temp/']
	}
);
