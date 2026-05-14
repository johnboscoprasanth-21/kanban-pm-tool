import { render, screen, within } from '@testing-library/react'
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

describe('KanbanColumn · add a card', () => {
  it('shows the "+ Add a card" button by default', () => {
    render(<Harness columnId="col-todo" />)
    expect(
      screen.getByRole('button', { name: /Add a card to To Do/i }),
    ).toBeInTheDocument()
  })

  it('opens the add form and appends a new card', async () => {
    const user = userEvent.setup()
    render(<Harness columnId="col-todo" />)

    await user.click(
      screen.getByRole('button', { name: /Add a card to To Do/i }),
    )
    const input = screen.getByLabelText(/New card title/i)
    await user.type(input, 'New review task')
    await user.click(screen.getByRole('button', { name: /^Add$/ }))

    const col = screen.getByTestId('column-col-todo')
    expect(within(col).getByText('New review task')).toBeInTheDocument()
    expect(within(col).getByLabelText('Card count')).toHaveTextContent('4')
  })

  it('cancels the add form on Cancel click', async () => {
    const user = userEvent.setup()
    render(<Harness columnId="col-todo" />)
    await user.click(
      screen.getByRole('button', { name: /Add a card to To Do/i }),
    )
    await user.click(screen.getByRole('button', { name: /^Cancel$/ }))
    expect(
      screen.queryByLabelText(/New card title/i),
    ).not.toBeInTheDocument()
  })
})

describe('KanbanColumn · rename column', () => {
  it('opens inline rename input on header click', async () => {
    const user = userEvent.setup()
    render(<Harness columnId="col-todo" />)
    await user.click(
      screen.getByRole('button', { name: /Rename column: To Do/i }),
    )
    const input = screen.getByLabelText(/Rename column To Do/i)
    await user.clear(input)
    await user.type(input, 'Backlog{Enter}')
    expect(screen.getByText('Backlog')).toBeInTheDocument()
  })
})
