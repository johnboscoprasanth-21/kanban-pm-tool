import {
  LABELS,
  PRIORITY_META,
  type LabelId,
  type Priority,
} from '../lib/board'
import { EMPTY_FILTER, isEmptyFilter, type Filter } from '../lib/filters'

interface FilterBarProps {
  filter: Filter
  onChange: (next: Filter) => void
}

export function FilterBar({ filter, onChange }: FilterBarProps) {
  const toggle = (patch: Partial<Filter>) => onChange({ ...filter, ...patch })
  const toggleLabel = (id: LabelId) => {
    const has = filter.labels.includes(id)
    toggle({
      labels: has
        ? filter.labels.filter((l) => l !== id)
        : [...filter.labels, id],
    })
  }
  const setPriority = (p: Priority | undefined) => toggle({ priority: p })

  const empty = isEmptyFilter(filter)

  return (
    <div className="filter-bar" aria-label="Filters">
      <span className="filter-label">Filters</span>

      <button
        type="button"
        className={`filter-chip ${empty ? 'is-on' : ''}`}
        onClick={() => onChange(EMPTY_FILTER)}
      >
        All
      </button>

      <button
        type="button"
        className={`filter-chip ${filter.overdue ? 'is-on' : ''}`}
        onClick={() => toggle({ overdue: !filter.overdue })}
        aria-pressed={filter.overdue}
      >
        Overdue
      </button>

      <button
        type="button"
        className={`filter-chip ${filter.dueToday ? 'is-on' : ''}`}
        onClick={() => toggle({ dueToday: !filter.dueToday })}
        aria-pressed={filter.dueToday}
      >
        Due today
      </button>

      <span className="filter-sep" aria-hidden="true" />

      {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
        <button
          key={p}
          type="button"
          className={`filter-chip priority-${p} ${
            filter.priority === p ? 'is-on' : ''
          }`}
          onClick={() => setPriority(filter.priority === p ? undefined : p)}
          aria-pressed={filter.priority === p}
        >
          {PRIORITY_META[p].label}
        </button>
      ))}

      <span className="filter-sep" aria-hidden="true" />

      {(Object.keys(LABELS) as LabelId[]).map((id) => {
        const meta = LABELS[id]
        const on = filter.labels.includes(id)
        return (
          <button
            key={id}
            type="button"
            className={`filter-chip label-chip-filter ${on ? 'is-on' : ''}`}
            style={
              on
                ? { background: meta.color, borderColor: meta.color, color: '#fff' }
                : { borderColor: meta.color, color: meta.color }
            }
            onClick={() => toggleLabel(id)}
            aria-pressed={on}
          >
            {meta.name}
          </button>
        )
      })}
    </div>
  )
}
