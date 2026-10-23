import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // acesso ao dev server por outra máquina (ex.: via SSH/rede interna)
  allowedDevOrigins: ['192.168.1.100'],
}

export default nextConfig
