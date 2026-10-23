// Prepara o vídeo único do suporte para o Remotion: converte a captura, copia o áudio por cena e grava src/data/resumo.json.
// Uso: node preparar-resumo.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const ID = 'suporte-instrumento-de-protesto'
const FF = process.env.FFMPEG ?? execFileSync(path.join(AQUI, '.tts/.venv/bin/python'), ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim()
const pasta = path.join(AQUI, 'build', ID)
const publico = path.join(AQUI, 'remotion', 'public', 'suporte')
fs.mkdirSync(path.join(publico, 'audio'), { recursive: true })

const roteiro = JSON.parse(fs.readFileSync(path.join(AQUI, 'roteiros', `${ID}.json`), 'utf8'))
const marcas = JSON.parse(fs.readFileSync(path.join(pasta, 'marcas.json'), 'utf8'))
const tempos = JSON.parse(fs.readFileSync(path.join(pasta, 'tempos.json'), 'utf8')).duracoes

const destinoVideo = path.join(publico, 'video.mp4')
if (!fs.existsSync(destinoVideo) || fs.statSync(destinoVideo).mtimeMs < fs.statSync(path.join(pasta, 'bruto.webm')).mtimeMs)
  execFileSync(FF, ['-loglevel', 'error', '-y', '-i', path.join(pasta, 'bruto.webm'), '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-an', path.join(publico, 'video.mp4')])
for (const c of marcas.cenas) fs.copyFileSync(path.join(pasta, `cena-${c.id}.wav`), path.join(publico, 'audio', `${c.id}.wav`))

/** Instante (na captura) do último quadro em que a pré-visualização ainda está aberta: o fundo escurecido deixa o fundo cinza da área de edição escurece. */
const ultimoQuadroComPrevia = (inicio, fim) => {
  const bytes = execFileSync(FF, ['-loglevel', 'error', '-ss', String(inicio), '-t', String(fim - inicio), '-i', path.join(pasta, 'bruto.webm'), '-vf', 'fps=10,crop=10:10:330:520,scale=1:1,format=gray', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 24 })
  let ultimo = -1
  for (let i = 0; i < bytes.length; i++) if (bytes[i] < 225) ultimo = i
  // recua 0,8 s: antes de o cursor chegar ao botão Fechar
  return ultimo < 0 ? null : Math.max(inicio + 1, Math.round((inicio + ultimo / 10 - 0.8) * 100) / 100)
}
/** Quadro escolhido à mão (a rolagem da pré-visualização passou do ponto que mostra o assunto da etapa). */
const CONGELAR_MANUAL = { 'e5-previa': 692.3 } // folha 1 inteira, com o selo e o QR Code, antes de rolar
const ehPrevia = (id) => id.endsWith('previa') || id === 'e7-final'

const dados = {
  id: ID,
  titulo: roteiro.titulo,
  subtitulo: roteiro.subtitulo,
  etapas: roteiro.etapas,
  cenas: marcas.cenas.map((m) => {
    const r = roteiro.cenas.find((c) => c.id === m.id)
    const congelar = CONGELAR_MANUAL[m.id] ?? (ehPrevia(m.id) ? ultimoQuadroComPrevia(m.inicio, m.fim) : null)
    return { id: m.id, etapa: r.etapa, inicio: m.inicio, fim: m.fim, duracaoAudio: tempos[m.id], fala: r.fala, ...(congelar ? { congelar } : {}) }
  }),
  destaques: marcas.destaques ?? [],
}
fs.writeFileSync(path.join(AQUI, 'remotion', 'src', 'data', 'resumo.json'), JSON.stringify(dados, null, 2))
console.log(`preparado: ${ID} (${marcas.duracao}s de captura, ${dados.destaques.length} destaques)`)
