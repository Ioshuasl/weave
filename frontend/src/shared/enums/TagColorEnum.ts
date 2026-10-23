export const TagColorEnum = {
  DEFAULT: 'DEFAULT',
  GRAY: 'GRAY',
  BROWN: 'BROWN',
  ORANGE: 'ORANGE',
  YELLOW: 'YELLOW',
  GREEN: 'GREEN',
  BLUE: 'BLUE',
  PURPLE: 'PURPLE',
  PINK: 'PINK',
  RED: 'RED',
} as const
export type TagColorEnum = (typeof TagColorEnum)[keyof typeof TagColorEnum]

export const TagColorLabel: Record<TagColorEnum, string> = {
  DEFAULT: 'Padrão',
  GRAY: 'Cinza',
  BROWN: 'Marrom',
  ORANGE: 'Laranja',
  YELLOW: 'Amarelo',
  GREEN: 'Verde',
  BLUE: 'Azul',
  PURPLE: 'Roxo',
  PINK: 'Rosa',
  RED: 'Vermelho',
}

/** Classes estáticas (o Tailwind precisa ver os nomes completos) — tokens definidos em globals.css. */
export const TagColorClasses: Record<TagColorEnum, string> = {
  DEFAULT: 'bg-tag-default text-tag-default-fg',
  GRAY: 'bg-tag-gray text-tag-gray-fg',
  BROWN: 'bg-tag-brown text-tag-brown-fg',
  ORANGE: 'bg-tag-orange text-tag-orange-fg',
  YELLOW: 'bg-tag-yellow text-tag-yellow-fg',
  GREEN: 'bg-tag-green text-tag-green-fg',
  BLUE: 'bg-tag-blue text-tag-blue-fg',
  PURPLE: 'bg-tag-purple text-tag-purple-fg',
  PINK: 'bg-tag-pink text-tag-pink-fg',
  RED: 'bg-tag-red text-tag-red-fg',
}
