import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, it, expect } from 'vitest'
import { useReducer } from 'react'
import { SAMPLE_WORKSPACE } from '../lib/workspace'
import { workspaceReducer } from '../lib/workspaceReducer'
import { BoardSwitcher } from './BoardSwitcher'

function Harness() {
  const [workspace, dispatch] = useReducer(workspaceReducer, SAMPLE_WORKSPACE)
  return (
    <div>
      <BoardSwitcher workspace={workspace} dispatch={dispatch} />
      <div data-testid="active-name">
        {workspace.boards[workspace.activeBoardId].name}
      </div>
      <div data-testid="board-count">{workspace.boardOrder.length}</div>
    </div>
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('BoardSwitcher', () => {
  it('shows the active board name in the trigger', () => {
    render(<Harness />)
    expect(
      within(
        screen.getByRole('button', { name: /Switch board/i }),
      ).getByText('KRA Sprint 14'),
    ).toBeInTheDocument()
  })

  it('opens the menu listing every board', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Switch board/i }))
    const menu = screen.getByRole('menu', { name: /Boards/i })
    expect(within(menu).getByText('KRA Sprint 14')).toBeInTheDocument()
    expect(within(menu).getByText('Personal')).toBeInTheDocument()
  })

  it('switches the active board on click', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Switch board/i }))
    // Click the menu item for Personal — it's the button with "Personal" text.
    const personalItem = screen
      .getAllByText('Personal')
      .find((el) => el.closest('.bs-item-switch'))!
    await user.click(personalItem)
    expect(screen.getByTestId('active-name')).toHaveTextContent('Personal')
  })

  it('creates a new board', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Switch board/i }))
    await user.click(screen.getByRole('button', { name: /\+ New board/i }))
    const input = screen.getByLabelText(/New board name/i)
    await user.type(input, 'Q3 Planning')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(screen.getByTestId('active-name')).toHaveTextContent('Q3 Planning')
    expect(screen.getByTestId('board-count')).toHaveTextContent('3')
  })

  it('renames a board inline', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Switch board/i }))
    await user.click(
      screen.getByRole('button', { name: /Rename board: Personal/i }),
    )
    const input = screen.getByLabelText(/Rename Personal/i)
    await user.clear(input)
    await user.type(input, 'Side Quests{Enter}')
    expect(screen.getByText('Side Quests')).toBeInTheDocument()
  })
})
