export const AccountSegmentEnum = {
  CARTORIO: 'CARTORIO',
  ADVOCACIA: 'ADVOCACIA',
  CONTABILIDADE: 'CONTABILIDADE',
  VAREJO: 'VAREJO',
  CONSTRUCAO: 'CONSTRUCAO',
  MEI: 'MEI',
  EMPRESA: 'EMPRESA',
  OUTRO: 'OUTRO',
} as const
export type AccountSegmentEnum = (typeof AccountSegmentEnum)[keyof typeof AccountSegmentEnum]

export const AccountSegmentLabel: Record<AccountSegmentEnum, string> = {
  CARTORIO: 'Cartório / serventia extrajudicial',
  ADVOCACIA: 'Advocacia',
  CONTABILIDADE: 'Contabilidade',
  VAREJO: 'Varejo / comércio',
  CONSTRUCAO: 'Construção civil',
  MEI: 'MEI / autônomo',
  EMPRESA: 'Outra empresa',
  OUTRO: 'Outro',
}
