import { render, screen, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SAMPLE_BOARD } from '../lib/board'
import { KanbanBoard } from './KanbanBoard'

const noop = vi.fn()

describe('KanbanBoard', () => {
  it('renders the board name as the h1', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} dispatch={noop} />)
    expect(
      screen.getByRole('heading', { level: 1, name: SAMPLE_BOARD.name }),
    ).toBeInTheDocument()
  })

  it('renders all four columns', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} dispatch={noop} />)
    for (const name of ['To Do', 'In Progress', 'Review', 'Done']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('renders cards under their parent column', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} dispatch={noop} />)
    const todoCol = screen.getByTestId('column-col-todo')
    expect(
      within(todoCol).getByText(/Design board switcher UI/i),
    ).toBeInTheDocument()
  })

  it('shows correct card count per column', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} dispatch={noop} />)
    const todoCol = screen.getByTestId('column-col-todo')
    expect(within(todoCol).getByLabelText('Card count')).toHaveTextContent('3')
  })

  it('has a Reset to demo button', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} dispatch={noop} />)
    expect(
      screen.getByRole('button', { name: /Reset board to demo data/i }),
    ).toBeInTheDocument()
  })
})
