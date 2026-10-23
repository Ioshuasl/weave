// Prepara um vídeo para o Remotion: converte a captura em MP4, copia áudio/legendas e atualiza src/data/index.json.
// Uso: node preparar.mjs <id>   (precisa de build/<id>/{bruto.webm,cena-*.wav,marcas.json,tempos.json})
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const id = process.argv[2]
const FF = process.env.FFMPEG ?? execFileSync(path.join(AQUI, '.tts/.venv/bin/python'), ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim()
const pasta = path.join(AQUI, 'build', id)
const publico = path.join(AQUI, 'remotion', 'public', id)
fs.mkdirSync(publico, { recursive: true })

const roteiro = JSON.parse(fs.readFileSync(path.join(AQUI, 'roteiros', `${id}.json`), 'utf8'))
const marcas = JSON.parse(fs.readFileSync(path.join(pasta, 'marcas.json'), 'utf8'))
const tempos = JSON.parse(fs.readFileSync(path.join(pasta, 'tempos.json'), 'utf8')).duracoes

execFileSync(FF, ['-loglevel', 'error', '-y', '-i', path.join(pasta, 'bruto.webm'), '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-an', path.join(publico, 'video.mp4')])
fs.mkdirSync(path.join(publico, 'audio'), { recursive: true })
for (const c of marcas.cenas) fs.copyFileSync(path.join(pasta, `cena-${c.id}.wav`), path.join(publico, 'audio', `${c.id}.wav`))

const dados = {
  id,
  passo: roteiro.passo,
  titulo: roteiro.titulo,
  proximo: roteiro.proximo,
  duracaoVideo: marcas.duracao,
  cenas: marcas.cenas.map((m) => ({ id: m.id, inicio: m.inicio, fim: m.fim, duracaoAudio: tempos[m.id], fala: roteiro.cenas.find((c) => c.id === m.id).fala, ...(roteiro.cenas.find((c) => c.id === m.id).rapido ? { rapido: roteiro.cenas.find((c) => c.id === m.id).rapido } : {}) })),
}
const destino = path.join(AQUI, 'remotion', 'src', 'data')
fs.mkdirSync(destino, { recursive: true })
const indice = path.join(destino, 'index.json')
const atual = fs.existsSync(indice) ? JSON.parse(fs.readFileSync(indice, 'utf8')) : []
fs.writeFileSync(indice, JSON.stringify([...atual.filter((v) => v.id !== id), dados].sort((a, b) => a.id.localeCompare(b.id)), null, 2))
console.log(`preparado: ${id} (${marcas.duracao}s)`)
