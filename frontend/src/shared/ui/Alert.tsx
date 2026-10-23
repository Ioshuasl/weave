import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

export const Alert = ({ tone = 'error', children }: { tone?: 'error' | 'success'; children: React.ReactNode }) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={cn(
      'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
      tone === 'error' ? 'border-destructive/30 bg-destructive-subtle text-destructive' : 'border-success/30 bg-success-subtle text-success',
    )}
  >
    {tone === 'error' ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />}
    <span>{children}</span>
  </div>
)
