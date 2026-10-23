"""Folha de contato da captura: um quadro (fim de cada cena) por cena. Uso: python contato.py <id>"""
import json, subprocess, sys, pathlib
import imageio_ffmpeg
aqui = pathlib.Path(__file__).resolve().parent
id_ = sys.argv[1]
pasta = aqui / "build" / id_
ff = imageio_ffmpeg.get_ffmpeg_exe()
marcas = json.loads((pasta / "marcas.json").read_text())["cenas"]
q = pasta / "quadros"; q.mkdir(exist_ok=True)
for i, c in enumerate(marcas):
    t = max(c["fim"] - 1.0, c["inicio"] + 0.5)
    subprocess.run([ff, "-loglevel", "error", "-y", "-ss", str(t), "-i", str(pasta / "bruto.webm"), "-frames:v", "1", "-vf", "scale=960:-1", str(q / f"{i:02d}-{c['id']}.png")], check=True)
n = len(marcas); cols = 2; rows = (n + 1) // 2
subprocess.run([ff, "-loglevel", "error", "-y", "-pattern_type", "glob", "-i", str(q / "*.png"), "-filter_complex", f"tile={cols}x{rows}", "-frames:v", "1", str(pasta / "contato.png")], check=True)
print(pasta / "contato.png", [c["id"] for c in marcas])
