'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { GraduationCap, LifeBuoy, Library, Menu, FileText, Users, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { Skeleton } from '@/shared/ui/Skeleton'
import { ForcePasswordChange } from '@/features/auth/components/ForcePasswordChange'
import { SettingsDialog } from '@/features/settings/components/SettingsDialog'
import { spring } from '@/shared/lib/motion'
import { WeaveLogo } from '@/shared/ui/WeaveLogo'
import { AccountSwitchDialog } from './AccountSwitchDialog'
import { PageTransition } from './PageTransition'
import { Sidebar, type NavItem } from './Sidebar'

const NAV: readonly NavItem[] = [
  { href: '/', label: 'Meus modelos', icon: FileText },
  { href: '/biblioteca', label: 'Biblioteca', icon: Library },
  { href: '/treinamento', label: 'Treinamento', icon: GraduationCap },
  { href: '/equipe', label: 'Equipe', icon: Users },
]

const SUPPORT_NAV: NavItem = { href: '/suporte', label: 'Suporte', icon: LifeBuoy }

const AppShellSkeleton = () => (
  <div className="min-h-dvh lg:pl-60">
    <aside className="fixed inset-y-0 left-0 hidden w-60 space-y-3 border-r border-border bg-surface p-5 lg:block">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </aside>
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleGuard = () => {
    if (status === 'anonymous') router.replace('/login')
  }
  useEffect(() => {
    handleGuard()
  }, [status])

  // a gaveta móvel fecha ao navegar e com Esc
  useEffect(() => {
    setIsMenuOpen(false)
  }, [pathname])
  useEffect(() => {
    if (!isMenuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isMenuOpen])

  if (status !== 'authenticated' || !user) return <AppShellSkeleton />
  // primeiro acesso com senha provisória: nenhuma tela do app é exibida (a API também recusa as chamadas)
  if (user.mustChangePassword) return <ForcePasswordChange />

  // conta pessoal tem um único usuário: sem "Equipe"
  const isCompany = activeMembership?.accountType === 'COMPANY'
  const baseNav = isCompany ? NAV : NAV.filter((item) => item.href !== '/equipe')
  const navItems = user.platformRole === 'SUPPORT' ? [...baseNav, SUPPORT_NAV] : baseNav

  const sidebarProps = {
    items: navItems,
    onOpenSettings: () => setIsSettingsOpen(true),
    onOpenAccountSwitch: () => setIsSwitchOpen(true),
  }

  return (
    <div className="min-h-dvh">
      {/* desktop: sidebar fixa */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border lg:block">
        <Sidebar {...sidebarProps} scope="desktop" />
      </aside>

      {/* mobile/tablet: barra fina com o botão que abre a gaveta */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Abrir menu"
          className="flex size-9 items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-surface-secondary"
        >
          <Menu className="size-5" aria-hidden />
        </button>
        <Link href="/" aria-label="Weave"><WeaveLogo /></Link>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-border shadow-lg"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={spring}
            >
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Fechar menu"
                className="absolute right-3 top-4 z-10 flex size-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-secondary"
              >
                <X className="size-4" aria-hidden />
              </button>
              <Sidebar {...sidebarProps} scope="mobile" onNavigate={() => setIsMenuOpen(false)} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div key={activeMembership?.accountId} className="min-w-0 lg:pl-60">
        <PageTransition>{children}</PageTransition>
      </div>
      {isSwitchOpen && <AccountSwitchDialog onClose={() => setIsSwitchOpen(false)} />}
      {isSettingsOpen && <SettingsDialog onClose={() => setIsSettingsOpen(false)} />}
    </div>
  )
}
