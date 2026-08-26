#!/usr/bin/env bash
# Bloquea patrones prohibidos por CLAUDE.md en los archivos que entran al commit.
set -euo pipefail

status=0

for file in "$@"; do
	[ -f "$file" ] || continue
	# Archivos generados por shadcn-svelte: no se editan a mano.
	case "$file" in
		*src/lib/components/ui/*) continue ;;
		*src/lib/utils.ts) continue ;;
	esac

	while IFS= read -r match; do
		echo "BLOQUEADO $file: $match"
		status=1
	done < <(grep -nE 'console\.log|: any\b|as any\b|@ts-ignore|@ts-expect-error|export let |on:click=|\$:' "$file" || true)
done

if [ "$status" -ne 0 ]; then
	echo ""
	echo "Corrige los patrones anteriores (ver CLAUDE.md). No uses --no-verify."
fi

exit "$status"
