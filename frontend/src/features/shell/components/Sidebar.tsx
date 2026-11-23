'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/shared/lib/cn'
import { spring } from '@/shared/lib/motion'
import { WeaveLogo } from '@/shared/ui/WeaveLogo'
import { UserMenu } from './UserMenu'

export type NavItem = { href: string; label: string; icon: LucideIcon }

const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' || pathname.startsWith('/modelos') : pathname.startsWith(href)

const NavLink = ({ item, scope, onNavigate }: { item: NavItem; scope: string; onNavigate?: () => void }) => {
  const pathname = usePathname()
  const active = isActive(item.href, pathname)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
        active ? 'text-primary' : 'text-fg-secondary hover:bg-surface-secondary hover:text-foreground',
      )}
    >
      {active && (
        // layoutId: o destaque desliza entre os itens ao trocar de página
        <motion.span layoutId={`sidebar-active-${scope}`} transition={spring} className="absolute inset-0 rounded-lg bg-surface-selected ring-1 ring-primary-border" />
      )}
      <Icon className="relative size-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" aria-hidden />
      <span className="relative truncate">{item.label}</span>
    </Link>
  )
}

type SidebarProps = {
  items: readonly NavItem[]
  /** separa o destaque animado da sidebar fixa e da gaveta móvel */
  scope: string
  onNavigate?: () => void
  onOpenSettings: () => void
  onOpenAccountSwitch: () => void
}

export const Sidebar = ({ items, scope, onNavigate, onOpenSettings, onOpenAccountSwitch }: SidebarProps) => (
  <div className="flex h-full flex-col bg-surface px-3 py-5">
    <Link href="/" onClick={onNavigate} aria-label="Weave — Meus modelos" className="mb-6 px-3">
      <WeaveLogo />
    </Link>
    <nav className="flex-1 space-y-1 overflow-y-auto" aria-label="Principal">
      {items.map((item) => <NavLink key={item.href} item={item} scope={scope} onNavigate={onNavigate} />)}
    </nav>
    <div className="mt-3 border-t border-border pt-3">
      <UserMenu onOpenSettings={onOpenSettings} onOpenAccountSwitch={onOpenAccountSwitch} />
    </div>
  </div>
)
