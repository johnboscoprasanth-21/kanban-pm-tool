import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { useReducer } from 'react'
import { SAMPLE_BOARD } from '../lib/board'
import { boardReducer } from '../lib/boardReducer'
import { CardDetailModal } from './CardDetailModal'

function Harness({ onClose }: { onClose: () => void }) {
  const [board, dispatch] = useReducer(boardReducer, SAMPLE_BOARD)
  return (
    <CardDetailModal
      card={board.cards.c3}
      columnId="col-todo"
      board={board}
      dispatch={dispatch}
      onClose={onClose}
    />
  )
}

describe('CardDetailModal', () => {
  it('renders the card title in the modal heading', () => {
    render(<Harness onClose={() => {}} />)
    expect(
      screen.getByRole('dialog', { name: /Card: Add card priority field/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Card title/i)).toHaveValue(
      'Add card priority field',
    )
  })

  it('shows existing priority and labels selected', () => {
    render(<Harness onClose={() => {}} />)
    // c3 has priority: 'high', labels: ['feature']
    expect(
      screen.getByRole('button', { name: /^High$/, pressed: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Feature$/, pressed: true }),
    ).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: /^Cancel$/ }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('lists all columns in the Move dropdown', () => {
    render(<Harness onClose={() => {}} />)
    const select = screen.getByLabelText(/Move to column/i)
    expect(select).toHaveValue('col-todo')
    const options = (select as HTMLSelectElement).querySelectorAll('option')
    expect(options.length).toBe(SAMPLE_BOARD.columnIds.length)
  })
})
