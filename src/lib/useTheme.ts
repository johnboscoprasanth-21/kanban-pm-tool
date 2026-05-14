import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'kanban-pm-tool.theme'

function readInitialTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  // Respect OS preference on first visit.
  if (
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }
  return 'light'
}

/** Persisted light/dark theme. Applies `[data-theme]` to <html>. */
export function useTheme(): readonly [
  Theme,
  (next: Theme) => void,
  () => void,
] {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme)
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return [theme, setTheme, toggle] as const
}
