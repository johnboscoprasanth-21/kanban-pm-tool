import type { Dispatch } from 'react'
import {
  ASSIGNEE_IDS,
  TEAM,
  type AssigneeId,
  type Board,
  type CardId,
  type SprintId,
} from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'

interface BulkActionBarProps {
  board: Board
  selectedIds: CardId[]
  dispatch: Dispatch<BoardAction>
  onClear: () => void
}

export function BulkActionBar({
  board,
  selectedIds,
  dispatch,
  onClear,
}: BulkActionBarProps) {
  if (selectedIds.length === 0) return null

  const setSprintForAll = (sprintId: SprintId | null) => {
    for (const id of selectedIds) {
      dispatch({ type: 'SET_CARD_SPRINT', cardId: id, sprintId })
    }
    onClear()
  }

  const setAssigneeForAll = (assignee: AssigneeId) => {
    for (const id of selectedIds) {
      dispatch({
        type: 'UPDATE_CARD',
        cardId: id,
        patch: { assignee },
      })
    }
    onClear()
  }

  const deleteAll = () => {
    if (
      !confirm(
        `Delete ${selectedIds.length} card(s)? Each deletion is undoable individually for 5 seconds.`,
      )
    ) {
      return
    }
    for (const id of selectedIds) {
      dispatch({ type: 'DELETE_CARD', cardId: id })
    }
    onClear()
  }

  const sprintOrder = board.sprintOrder ?? []
  const sprints = board.sprints ?? {}

  return (
    <div className="bulk-bar" role="region" aria-label="Bulk actions">
      <span className="bulk-count">{selectedIds.length} selected</span>

      <label className="bulk-action">
        <span className="bulk-label">Sprint</span>
        <select
          className="modal-select"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value
            if (v === '') return
            setSprintForAll(v === '__backlog' ? null : v)
            e.target.value = ''
          }}
          aria-label="Move selected cards to sprint"
        >
          <option value="" disabled>
            Move to…
          </option>
          <option value="__backlog">Backlog</option>
          {sprintOrder.map((sid) => {
            const s = sprints[sid]
            if (!s) return null
            return (
              <option key={sid} value={sid}>
                {s.name} ({s.state})
              </option>
            )
          })}
        </select>
      </label>

      <label className="bulk-action">
        <span className="bulk-label">Assignee</span>
        <select
          className="modal-select"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value
            if (v === '') return
            setAssigneeForAll(v as AssigneeId)
            e.target.value = ''
          }}
          aria-label="Set assignee for selected cards"
        >
          <option value="" disabled>
            Set to…
          </option>
          {ASSIGNEE_IDS.map((id) => (
            <option key={id} value={id}>
              {TEAM[id].name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn btn-ghost btn-danger btn-sm"
        onClick={deleteAll}
      >
        Delete
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={onClear}
        aria-label="Clear selection"
      >
        Clear
      </button>
    </div>
  )
}
