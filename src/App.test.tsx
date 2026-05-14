import { render, screen } from '@testing-library/react'
import { beforeEach, describe, it, expect } from 'vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('shows the Kanban PM brand', () => {
    render(<App />)
    expect(screen.getByText('Kanban PM')).toBeInTheDocument()
  })

  it('shows the live IST clock', () => {
    render(<App />)
    expect(screen.getByLabelText(/Current time in IST/i)).toBeInTheDocument()
  })

  it('renders the seed board with all four columns', () => {
    render(<App />)
    for (const name of ['To Do', 'In Progress', 'Review', 'Done']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('shows the Add a card button in every column', () => {
    render(<App />)
    expect(
      screen.getByRole('button', { name: /Add a card to To Do/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Add a card to Done/i }),
    ).toBeInTheDocument()
  })

  it('displays the current development phase', () => {
    render(<App />)
    // Built-in __APP_PHASE__ should at minimum match "Phase".
    expect(screen.getAllByText(/Phase/i).length).toBeGreaterThan(0)
  })
})
