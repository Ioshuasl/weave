#!/usr/bin/env bash
# Sincroniza o motor do editor (cópia vendorizada) a partir do app Orius.
# Uso: scripts/sync-weave-package.sh [caminho-do-app]   (padrão: ../app)
# O pacote não recebe alterações locais: tudo que muda no motor nasce em app/src/packages/weave.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$ROOT/../app}/src/packages/weave"
DST="$ROOT/frontend/src/packages/weave"
[ -d "$SRC" ] || { echo "Origem não encontrada: $SRC" >&2; exit 1; }
rsync -a --delete --exclude='*.test.ts' --exclude='*.test.tsx' "$SRC/" "$DST/"
echo "Sincronizado: $SRC -> $DST"
echo "Branch de origem: $(git -C "$SRC" rev-parse --abbrev-ref HEAD 2>/dev/null || echo desconhecida) @ $(git -C "$SRC" rev-parse --short HEAD 2>/dev/null || echo -)"
echo "Próximo passo: (cd frontend && npx tsc --noEmit && npx next build); se surgir import novo, instale a dependência."
