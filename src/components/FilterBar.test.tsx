import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { EMPTY_FILTER, type Filter } from '../lib/filters'
import { FilterBar } from './FilterBar'

function Harness() {
  const [f, setF] = useState<Filter>(EMPTY_FILTER)
  return (
    <div>
      <FilterBar filter={f} onChange={setF} />
      <div data-testid="overdue">{String(f.overdue)}</div>
      <div data-testid="priority">{f.priority ?? '-'}</div>
      <div data-testid="labels">{f.labels.join(',') || '-'}</div>
    </div>
  )
}

describe('FilterBar', () => {
  it('All chip is on by default', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: /^All$/ })).toHaveClass('is-on')
  })

  it('toggles overdue', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /^Overdue$/ }))
    expect(screen.getByTestId('overdue')).toHaveTextContent('true')
  })

  it('priority chips are mutually exclusive', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /^High$/ }))
    expect(screen.getByTestId('priority')).toHaveTextContent('high')
    await user.click(screen.getByRole('button', { name: /^Low$/ }))
    expect(screen.getByTestId('priority')).toHaveTextContent('low')
  })

  it('label chip click adds to labels list', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /^Urgent$/ }))
    expect(screen.getByTestId('labels')).toHaveTextContent('urgent')
  })

  it('All chip resets filters', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /^Overdue$/ }))
    await user.click(screen.getByRole('button', { name: /^High$/ }))
    await user.click(screen.getByRole('button', { name: /^All$/ }))
    expect(screen.getByTestId('overdue')).toHaveTextContent('false')
    expect(screen.getByTestId('priority')).toHaveTextContent('-')
  })
})
