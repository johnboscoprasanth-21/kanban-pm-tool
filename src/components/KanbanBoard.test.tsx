import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SAMPLE_BOARD } from '../lib/board'
import { KanbanBoard } from './KanbanBoard'

describe('KanbanBoard', () => {
  it('renders the board name as the h1', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} />)
    expect(
      screen.getByRole('heading', { level: 1, name: SAMPLE_BOARD.name }),
    ).toBeInTheDocument()
  })

  it('renders all four columns', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} />)
    for (const name of ['To Do', 'In Progress', 'Review', 'Done']) {
      expect(screen.getByText(name)).toBeInTheDocument()
    }
  })

  it('renders cards under their parent column', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} />)
    const todoCol = screen.getByTestId('column-col-todo')
    expect(
      within(todoCol).getByText(/Design board switcher UI/i),
    ).toBeInTheDocument()
    const doneCol = screen.getByTestId('column-col-done')
    expect(
      within(doneCol).getByText(/Scaffold Vite \+ React \+ TS/i),
    ).toBeInTheDocument()
  })

  it('shows correct card count per column', () => {
    render(<KanbanBoard board={SAMPLE_BOARD} />)
    const todoCol = screen.getByTestId('column-col-todo')
    expect(within(todoCol).getByLabelText('Card count')).toHaveTextContent('3')
    const reviewCol = screen.getByTestId('column-col-review')
    expect(within(reviewCol).getByLabelText('Card count')).toHaveTextContent(
      '1',
    )
  })
})
