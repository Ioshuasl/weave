# Vídeos de treinamento do Weave

Série B — **Montando um Instrumento de Protesto do zero** (passos 1 a 11 prontos; falta o vídeo de abertura e o de comparação com a Biblioteca). Cada vídeo segue uma seção de
`../docs/treinamento/02-montando-o-instrumento-de-protesto.md` (o texto é a fonte única).

```
roteiros/<id>.json   narração por cena (texto pt-BR)
tts/gerar.py         Kokoro (offline) → um .wav por cena + tempos
capturas/            Playwright grava a tela do Weave (cursor visível, 1080p) cena a cena
tts/montar.py        junta as cenas no instante exato em que a captura as iniciou
preparar.mjs         converte a captura em MP4 e registra o vídeo no Remotion (src/data/index.json)
remotion/            abertura, legendas, selo do passo e fechamento → MP4 final em out/
```

## Primeira vez
```bash
# voz (Kokoro, Apache-2.0): ambiente Python + modelo (~340 MB)
uv venv --python 3.12 .tts/.venv
uv pip install --python .tts/.venv/bin/python kokoro-onnx soundfile imageio-ffmpeg
curl -L -o .tts/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o .tts/voices-v1.0.bin   https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
(cd capturas && npm i && npx playwright install chromium)
(cd remotion && npm i)
```

## Gerar um vídeo
O app (`http://192.168.1.100:3100`) e a API precisam estar no ar (`WEAVE_WEB` / `WEAVE_API` mudam os endereços).

```bash
./fazer.sh b01-dados-de-exemplo          # narração + captura + mistura + preparo
cd remotion && npx remotion render b01-dados-de-exemplo ../out/b01-dados-de-exemplo.mp4
```

Grave **na ordem** (b01 → b11): o passo 1 cria o modelo `Instrumento de Protesto (treino)` na conta de demonstração
`treinamento@weave-demo.com` e cada passo seguinte continua do ponto em que o anterior salvou.

## Observações
- A voz padrão é `pf_dora` (pt-BR). Para trocar: `python tts/gerar.py roteiros/<id>.json pm_alex`.
- O Remotion é gratuito para equipes de até 3 pessoas; acima disso exige licença de empresa.
- Para abrir o Studio: `cd remotion && npx remotion studio`.

## Vídeo único para o suporte da Orius (15 min)
`roteiros/suporte-instrumento-de-protesto.json` — 7 etapas (folha e lista, cabeçalho, título e dados do título, devedores, selo e QR Code, finalização, conferência final), com a pré-visualização ao fim de cada etapa. Os dados já vêm carregados (o modelo é criado pela API antes de gravar).

```bash
.tts/.venv/bin/python tts/gerar.py roteiros/suporte-instrumento-de-protesto.json pf_dora 1.05   # narração
node capturas/suporte.mjs                                                                       # captura (1920x972) ≈ 14 min
node preparar-resumo.mjs                                                                        # prepara para o Remotion
cd remotion && npx remotion render suporte-instrumento-de-protesto ../out/suporte-instrumento-de-protesto.mp4
```
- A captura é 1920×972; os 108 px de baixo são da faixa de legenda (nada da interface é coberto).
- O corte segue a narração (nunca o contrário): cada cena dura o que a narração/ação real durar. A pré-visualização de cada etapa fica parada 7,5 s (`PAUSA_PREVIA`) para dar tempo de conferir.
- `R` em `capturas/suporte.mjs` é o ritmo das ações (0,9 ≈ 15 min no total).
