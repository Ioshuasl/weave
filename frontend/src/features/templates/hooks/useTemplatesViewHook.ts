'use client'

import { useState } from 'react'
import type { TemplatesViewMode } from '../components/ViewToggle'

const STORAGE_KEY = 'weave.templatesView'

const readStored = (): TemplatesViewMode => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

/** Modo de visualização da galeria (grade/lista), lembrado entre visitas. */
export const useTemplatesViewHook = () => {
  const [view, setView] = useState<TemplatesViewMode>('grid')
  const [isRestored, setIsRestored] = useState(false)

  const handleRestore = () => {
    if (isRestored) return
    setView(readStored())
    setIsRestored(true)
  }

  const handleChange = (mode: TemplatesViewMode) => {
    setView(mode)
    try {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* sem armazenamento: vale só nesta sessão */
    }
  }

  return { view, handleRestore, handleChange }
}
