import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  it('shows the moon when in light mode and toggles', async () => {
    const user = userEvent.setup()
    const toggle = vi.fn()
    render(<ThemeToggle theme="light" toggle={toggle} />)
    expect(
      screen.getByRole('button', { name: /Switch to dark theme/i }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button'))
    expect(toggle).toHaveBeenCalledTimes(1)
  })

  it('shows the sun when in dark mode', () => {
    const toggle = vi.fn()
    render(<ThemeToggle theme="dark" toggle={toggle} />)
    expect(
      screen.getByRole('button', { name: /Switch to light theme/i }),
    ).toBeInTheDocument()
  })
})
