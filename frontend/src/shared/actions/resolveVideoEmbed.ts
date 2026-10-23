export type VideoEmbed = { kind: 'iframe'; src: string } | { kind: 'video'; src: string }

/** Converte um link de vídeo (YouTube, Vimeo ou arquivo mp4/webm) no player adequado. */
export const resolveVideoEmbed = (url?: string | null): VideoEmbed | null => {
  if (!url) return null
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = u.searchParams.get('v') ?? u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1]
    return id ? { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` } : null
  }
  if (host === 'vimeo.com') {
    const id = u.pathname.match(/\/(\d+)/)?.[1]
    return id ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` } : null
  }
  if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return { kind: 'video', src: url }
  return null
}
