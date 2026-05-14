import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect } from 'vitest'
import { useReducer } from 'react'
import { DndContext } from '@dnd-kit/core'
import { SAMPLE_BOARD } from '../lib/board'
import { boardReducer } from '../lib/boardReducer'
import { KanbanColumn } from './KanbanColumn'

function Harness({ columnId }: { columnId: string }) {
  const [board, dispatch] = useReducer(boardReducer, SAMPLE_BOARD)
  return (
    <DndContext>
      <KanbanColumn board={board} columnId={columnId} dispatch={dispatch} />
    </DndContext>
  )
}

beforeEach(() => {
  localStorage.clear()
})

// NOTE: using fireEvent.click for the card itself because @dnd-kit's
// PointerSensor swallows the userEvent click simulation in happy-dom.
// In a real browser the activationConstraint{distance:6} lets clicks through.

describe('KanbanCard · edit', () => {
  it('enters edit mode on click and saves changes', async () => {
    const user = userEvent.setup()
    render(<Harness columnId="col-todo" />)
    const card = screen
      .getByText(/Design board switcher UI/i)
      .closest('article')!
    fireEvent.click(card)
    const titleInput = screen.getByLabelText(/Card title/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Renamed task')
    await user.click(screen.getByRole('button', { name: /^Save$/ }))
    expect(screen.getByText('Renamed task')).toBeInTheDocument()
    expect(
      screen.queryByText(/Design board switcher UI/i),
    ).not.toBeInTheDocument()
  })

  it('cancels edit and restores original title', async () => {
    const user = userEvent.setup()
    render(<Harness columnId="col-todo" />)
    const card = screen
      .getByText(/Design board switcher UI/i)
      .closest('article')!
    fireEvent.click(card)
    const titleInput = screen.getByLabelText(/Card title/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'should-not-stick')
    await user.click(screen.getByRole('button', { name: /^Cancel$/ }))
    expect(screen.getByText(/Design board switcher UI/i)).toBeInTheDocument()
    expect(screen.queryByText('should-not-stick')).not.toBeInTheDocument()
  })
})

describe('KanbanCard · delete', () => {
  it('removes the card on delete click', async () => {
    const user = userEvent.setup()
    render(<Harness columnId="col-todo" />)
    const delBtn = screen.getByRole('button', {
      name: /Delete card: Design board switcher UI/i,
    })
    await user.click(delBtn)
    expect(
      screen.queryByText(/Design board switcher UI/i),
    ).not.toBeInTheDocument()
    const col = screen.getByTestId('column-col-todo')
    expect(within(col).getByLabelText('Card count')).toHaveTextContent('2')
  })
})
