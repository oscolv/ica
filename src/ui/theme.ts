import { useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'ica-theme'

export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // almacenamiento no disponible: el tema vive solo en el documento
  }
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return [theme, toggle]
}
