'use client'

import { FileText, GraduationCap, LifeBuoy, Library, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/ui/Skeleton'
import { ForcePasswordChange } from '@/features/auth/components/ForcePasswordChange'
import { SettingsDialog } from '@/features/settings/components/SettingsDialog'
import { WeaveLogo } from '@/shared/ui/WeaveLogo'
import { AccountSwitchDialog } from './AccountSwitchDialog'
import { UserMenu } from './UserMenu'

const NAV = [
  { href: '/', label: 'Meus modelos', icon: FileText },
  { href: '/biblioteca', label: 'Biblioteca', icon: Library },
  { href: '/treinamento', label: 'Treinamento', icon: GraduationCap },
  { href: '/equipe', label: 'Equipe', icon: Users },
] as const

const SUPPORT_NAV = { href: '/suporte', label: 'Suporte', icon: LifeBuoy } as const

const AppShellSkeleton = () => (
  <div className="min-h-dvh">
    <div className="flex h-14 items-center gap-4 border-b border-border bg-surface px-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-40" />
    </div>
    <div className="mx-auto max-w-4xl space-y-3 px-4 py-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
    </div>
  </div>
)

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { status, user, activeMembership } = useAuth()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSwitchOpen, setIsSwitchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleGuard = () => {
    if (status === 'anonymous') router.replace('/login')
  }
  useEffect(() => {
    handleGuard()
  }, [status])

  if (status !== 'authenticated' || !user) return <AppShellSkeleton />
  // primeiro acesso com senha provisória: nenhuma tela do app é exibida (a API também recusa as chamadas)
  if (user.mustChangePassword) return <ForcePasswordChange />

  // conta pessoal tem um único usuário: sem "Equipe"
  const isCompany = activeMembership?.accountType === 'COMPANY'
  const baseNav = isCompany ? NAV : NAV.filter((item) => item.href !== '/equipe')
  const navItems = user.platformRole === 'SUPPORT' ? [...baseNav, SUPPORT_NAV] : baseNav

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-surface px-4">
        <Link href="/" aria-label="Weave"><WeaveLogo /></Link>
        <nav className="ml-4 flex items-center gap-1" aria-label="Principal">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' || pathname.startsWith('/modelos') : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors',
                  active ? 'bg-surface-selected text-primary' : 'text-fg-secondary hover:bg-surface-secondary hover:text-foreground',
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <UserMenu onOpenSettings={() => setIsSettingsOpen(true)} onOpenAccountSwitch={() => setIsSwitchOpen(true)} />
        </div>
      </header>
      <main key={activeMembership?.accountId}>{children}</main>
      {isSwitchOpen && <AccountSwitchDialog onClose={() => setIsSwitchOpen(false)} />}
      {isSettingsOpen && <SettingsDialog onClose={() => setIsSettingsOpen(false)} />}
    </div>
  )
}
