/** Remove o prefixo IPv4-mapeado do IPv6 (::ffff:192.168.1.10 → 192.168.1.10). */
export const formatIp = (ip?: string | null) => (ip ? ip.replace(/^::ffff:/, '') : 'IP desconhecido')
