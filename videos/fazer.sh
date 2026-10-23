#!/usr/bin/env bash
# Pipeline de um vídeo da Série B: narração → captura → preparo para o Remotion (o áudio entra por cena).
# Uso: ./fazer.sh <id-do-roteiro> [--sem-narracao]   (rode da pasta videos/)
set -euo pipefail
ID="$1"
PY=.tts/.venv/bin/python
[ "${2:-}" = "--sem-narracao" ] || $PY tts/gerar.py "roteiros/$ID.json" > /dev/null
node capturas/serie-b.mjs "$ID"
node preparar.mjs "$ID"
