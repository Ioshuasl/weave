import type { CSSProperties } from 'react'

export const A4_PORTRAIT_RATIO = 794 / 1123

/** Caixa da folha dentro do palco: retrato ocupa a altura toda; paisagem ocupa a largura toda (sem cortar a miniatura). */
export const sheetBoxStyle = (ratio: number): CSSProperties =>
  ratio > 1 ? { aspectRatio: String(ratio), width: '100%', height: 'auto' } : { aspectRatio: String(ratio), height: '100%', width: 'auto' }
