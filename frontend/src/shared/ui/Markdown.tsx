import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Markdown seguro (sem HTML bruto) com a tipografia do design system. */
export const Markdown = ({ children }: { children: string }) => (
  <div className="space-y-3 text-base text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary-border [&_blockquote]:bg-primary-subtle [&_blockquote]:px-3 [&_blockquote]:py-2 [&_code]:rounded-sm [&_code]:bg-surface-secondary [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-md [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface-secondary [&_pre]:p-3 [&_pre_code]:bg-transparent [&_table]:w-full [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-5">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  </div>
)
