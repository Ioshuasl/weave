import { AuthStage } from '@/features/auth/components/stage/AuthStage'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthStage>{children}</AuthStage>
}
