export const AccountTypeEnum = { PERSONAL: 'PERSONAL', COMPANY: 'COMPANY' } as const
export type AccountTypeEnum = (typeof AccountTypeEnum)[keyof typeof AccountTypeEnum]

export const AccountTypeLabel: Record<AccountTypeEnum, string> = {
  PERSONAL: 'Pessoa física',
  COMPANY: 'Empresa',
}
