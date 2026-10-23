import { PrismaClient } from '@prisma/client'

/** Uso: npm run support:grant -- email@dominio.com   |   npm run support:revoke -- email@dominio.com */
const [action, rawEmail] = process.argv.slice(2)
const prisma = new PrismaClient()

const main = async () => {
  const email = rawEmail?.trim().toLowerCase()
  if (!email || (action !== 'grant' && action !== 'revoke')) {
    console.error('Uso: tsx scripts/support-role.ts <grant|revoke> <email>')
    process.exitCode = 1
    return
  }
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) {
    console.error(`Usuário não encontrado: ${email}`)
    process.exitCode = 1
    return
  }
  const platformRole = action === 'grant' ? 'SUPPORT' : 'USER'
  await prisma.user.update({ where: { id: user.id }, data: { platformRole } })
  console.log(`${email} agora é ${platformRole}`)
}

main().finally(() => prisma.$disconnect())
