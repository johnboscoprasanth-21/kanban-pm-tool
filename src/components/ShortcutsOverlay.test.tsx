import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ShortcutsOverlay } from './ShortcutsOverlay'

describe('ShortcutsOverlay', () => {
  it('renders the title and at least the / shortcut', () => {
    render(<ShortcutsOverlay onClose={() => {}} />)
    expect(
      screen.getByRole('dialog', { name: /Keyboard shortcuts/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Focus the search box/i)).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<ShortcutsOverlay onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on close button click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ShortcutsOverlay onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /Close shortcuts/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
