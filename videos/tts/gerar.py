"""Gera a narração (Kokoro, pt-BR, offline) de um roteiro: um .wav por cena + tempos.json.

Uso: .tts/.venv/bin/python tts/gerar.py roteiros/<id>.json [voz]
"""
import json, sys, pathlib
import soundfile as sf
from kokoro_onnx import Kokoro

AQUI = pathlib.Path(__file__).resolve().parent.parent
MODELO = AQUI / ".tts" / "kokoro-v1.0.onnx"
VOZES = AQUI / ".tts" / "voices-v1.0.bin"

def main():
    roteiro = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    voz = sys.argv[2] if len(sys.argv) > 2 else "pf_dora"
    saida = AQUI / "build" / roteiro["id"]
    saida.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(str(MODELO), str(VOZES))
    tempos = {}
    for cena in roteiro["cenas"]:
        audio, taxa = kokoro.create(cena["fala"], voice=voz, speed=float(sys.argv[3]) if len(sys.argv) > 3 else 0.97, lang="pt-br")
        arquivo = saida / f"cena-{cena['id']}.wav"
        sf.write(arquivo, audio, taxa)
        tempos[cena["id"]] = round(len(audio) / taxa, 3)
        print(f"{cena['id']}: {tempos[cena['id']]}s")
    (saida / "tempos.json").write_text(json.dumps({"voz": voz, "duracoes": tempos}, indent=2), encoding="utf-8")

main()
