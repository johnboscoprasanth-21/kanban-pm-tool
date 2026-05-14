import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App (Phase 1)', () => {
  it('shows the Kanban PM brand', () => {
    render(<App />)
    expect(screen.getByText('Kanban PM')).toBeInTheDocument()
  })

  it('shows the live IST clock', () => {
    render(<App />)
    expect(screen.getByLabelText(/Current time in IST/i)).toBeInTheDocument()
  })

  it('renders the sample board with all four columns', () => {
    render(<App />)
    for (const name of ['To Do', 'In Progress', 'Review', 'Done']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('displays the current development phase', () => {
    render(<App />)
    // Phase string is injected by Vite via __APP_PHASE__ define.
    // At least the prefix should always be present.
    expect(screen.getAllByText(/Phase 1/i).length).toBeGreaterThan(0)
  })
})
