import type { Theme } from '../lib/useTheme'

interface ThemeToggleProps {
  theme: Theme
  toggle: () => void
}

export function ThemeToggle({ theme, toggle }: ThemeToggleProps) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
    </button>
  )
}
