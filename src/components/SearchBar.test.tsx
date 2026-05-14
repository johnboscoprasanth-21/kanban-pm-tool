import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { SearchBar } from './SearchBar'
import { matchesQuery } from '../lib/matchesQuery'

function Harness() {
  const [q, setQ] = useState('')
  return (
    <div>
      <SearchBar query={q} onChange={setQ} />
      <div data-testid="echo">{q}</div>
    </div>
  )
}

describe('SearchBar component', () => {
  it('types update the controlled value', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText(/Search cards/i), 'review')
    expect(screen.getByTestId('echo')).toHaveTextContent('review')
  })

  it('shows a clear button only when query is non-empty', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByRole('button', { name: /Clear search/i })).toBeNull()
    await user.type(screen.getByLabelText(/Search cards/i), 'x')
    await user.click(screen.getByRole('button', { name: /Clear search/i }))
    expect(screen.getByTestId('echo')).toHaveTextContent('')
  })
})

describe('matchesQuery', () => {
  it('returns true for empty query', () => {
    expect(matchesQuery({ title: 'Hello' }, '')).toBe(true)
    expect(matchesQuery({ title: 'Hello' }, '   ')).toBe(true)
  })
  it('case-insensitive title match', () => {
    expect(matchesQuery({ title: 'Plan dnd-kit' }, 'DND')).toBe(true)
  })
  it('matches description as well', () => {
    expect(
      matchesQuery({ title: 'X', description: 'Lint, Test, Build' }, 'test'),
    ).toBe(true)
  })
  it('no match returns false', () => {
    expect(matchesQuery({ title: 'foo' }, 'bar')).toBe(false)
  })
})
