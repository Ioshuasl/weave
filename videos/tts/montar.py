"""Monta narracao.wav: cada cena entra no instante em que a captura a iniciou (build/<id>/marcas.json).

Uso: .tts/.venv/bin/python tts/montar.py <id> [atraso_abertura_s]
"""
import json, sys, pathlib
import numpy as np
import soundfile as sf

AQUI = pathlib.Path(__file__).resolve().parent.parent

def main():
    id_ = sys.argv[1]
    atraso = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
    pasta = AQUI / "build" / id_
    marcas = json.loads((pasta / "marcas.json").read_text(encoding="utf-8"))
    taxa = 24000
    trilha = np.zeros(int((marcas["duracao"] + atraso + 3) * taxa), dtype=np.float32)
    for cena in marcas["cenas"]:
        audio, t = sf.read(pasta / f"cena-{cena['id']}.wav", dtype="float32")
        assert t == taxa, (t, taxa)
        inicio = int((cena["inicio"] + atraso) * taxa)
        trilha[inicio:inicio + len(audio)] += audio
    pico = float(np.abs(trilha).max()) or 1.0
    trilha = trilha / max(pico, 1.0) * 0.95
    sf.write(pasta / "narracao.wav", trilha, taxa)
    print("narracao.wav", round(len(trilha) / taxa, 1), "s")

main()
