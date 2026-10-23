import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/features/auth/components/AuthProvider'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'Weave — Relatórios poderosos. Sem complicação.',
  description: 'Crie, edite e personalize seus relatórios de forma simples, visual e intuitiva.',
  icons: { icon: '/images/weave-logo-icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
