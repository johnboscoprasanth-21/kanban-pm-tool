import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useReducer } from 'react'
import { DndContext } from '@dnd-kit/core'
import { SAMPLE_BOARD } from '../lib/board'
import { boardReducer } from '../lib/boardReducer'
import { KanbanColumn } from './KanbanColumn'

function Harness({
  columnId,
  onOpen,
}: {
  columnId: string
  onOpen?: (id: string) => void
}) {
  const [board, dispatch] = useReducer(boardReducer, SAMPLE_BOARD)
  return (
    <DndContext>
      <KanbanColumn
        board={board}
        columnId={columnId}
        dispatch={dispatch}
        onOpenCard={onOpen}
      />
    </DndContext>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('KanbanCard · open via click', () => {
  it('calls onOpen with the card id', () => {
    const onOpen = vi.fn()
    render(<Harness columnId="col-todo" onOpen={onOpen} />)
    const card = screen
      .getByText(/Design board switcher UI/i)
      .closest('article')!
    fireEvent.click(card)
    expect(onOpen).toHaveBeenCalledWith('c1')
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

describe('KanbanCard · priority and label rendering', () => {
  it('renders priority dot when set', () => {
    render(<Harness columnId="col-todo" />)
    // c3 has priority: 'high'
    const c3 = screen.getByTestId('card-c3')
    expect(within(c3).getByLabelText(/High priority/i)).toBeInTheDocument()
  })

  it('renders label chips when set', () => {
    render(<Harness columnId="col-todo" />)
    // c3 has labels: ['feature']
    const c3 = screen.getByTestId('card-c3')
    expect(within(c3).getByText('Feature')).toBeInTheDocument()
  })
})
