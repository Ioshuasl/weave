import { resolveVideoEmbed } from '@/shared/actions/resolveVideoEmbed'

export const VideoPlayer = ({ url, title }: { url?: string | null; title: string }) => {
  const embed = resolveVideoEmbed(url)
  if (!embed) return null
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-foreground">
      {embed.kind === 'iframe' ? (
        <iframe src={embed.src} title={title} className="size-full" allow="fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : (
        <video src={embed.src} controls className="size-full" title={title} />
      )}
    </div>
  )
}
