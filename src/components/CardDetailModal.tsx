import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
} from 'react'
import {
  ASSIGNEE_IDS,
  ISSUE_TYPES,
  ISSUE_TYPE_IDS,
  LABELS,
  LINK_TYPES,
  LINK_TYPE_META,
  POINT_OPTIONS,
  PRIORITIES,
  PRIORITY_META,
  TEAM,
  assigneeInitials,
  type AssigneeId,
  type Board,
  type Card,
  type CardId,
  type ChecklistItem,
  type ColumnId,
  type IssueType,
  type LabelId,
  type LinkType,
  type Priority,
  type SprintId,
} from '../lib/board'
import type { BoardAction } from '../lib/boardReducer'
import { formatIst } from '../lib/formatIst'

interface CardDetailModalProps {
  card: Card
  columnId: ColumnId
  board: Board
  dispatch: Dispatch<BoardAction>
  onClose: () => void
  /** Click-through on a linked issue jumps to that card. */
  onNavigate?: (cardId: CardId) => void
}

function epochToInputValue(ms: number | undefined): string {
  if (ms === undefined) return ''
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function inputValueToEpoch(v: string): number | undefined {
  if (!v) return undefined
  const ms = new Date(v + 'T00:00:00').getTime()
  return Number.isNaN(ms) ? undefined : ms
}

function makeChecklistItemId(): string {
  return `cl-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

export function CardDetailModal({
  card,
  columnId,
  board,
  dispatch,
  onClose,
  onNavigate,
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description ?? '')
  const [priority, setPriority] = useState<Priority | undefined>(card.priority)
  const [labels, setLabels] = useState<LabelId[]>(card.labels ?? [])
  const [dueInput, setDueInput] = useState(epochToInputValue(card.dueDate))
  const [type, setType] = useState<IssueType | undefined>(card.type)
  const [points, setPoints] = useState<number | undefined>(card.points)
  const [assignee, setAssignee] = useState<AssigneeId | undefined>(
    card.assignee,
  )
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    card.checklist ? card.checklist.map((i) => ({ ...i })) : [],
  )
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')
  const [commentAuthor, setCommentAuthor] = useState<AssigneeId>('jbp')
  const [linkType, setLinkType] = useState<LinkType>('blocks')
  const [linkTarget, setLinkTarget] = useState<CardId | ''>('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = (e?: FormEvent) => {
    e?.preventDefault()
    if (!title.trim()) return
    dispatch({
      type: 'UPDATE_CARD',
      cardId: card.id,
      patch: {
        title,
        description,
        priority,
        labels,
        dueDate: inputValueToEpoch(dueInput),
        type,
        points,
        assignee,
        checklist,
      },
    })
    onClose()
  }

  const remove = () => {
    dispatch({ type: 'DELETE_CARD', cardId: card.id })
    onClose()
  }

  const moveTo = (toColumnId: ColumnId) => {
    if (toColumnId === columnId) return
    const len = board.columns[toColumnId]?.cardIds.length ?? 0
    dispatch({
      type: 'MOVE_CARD',
      cardId: card.id,
      toColumnId,
      toIndex: len,
    })
    onClose()
  }

  const toggleLabel = (id: LabelId) => {
    setLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    )
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((it) => (it.id === id ? { ...it, done: !it.done } : it)),
    )
  }

  const removeChecklistItem = (id: string) => {
    setChecklist((prev) => prev.filter((it) => it.id !== id))
  }

  const addChecklistItem = () => {
    const text = newSubtask.trim()
    if (!text) return
    setChecklist((prev) => [
      ...prev,
      { id: makeChecklistItemId(), text, done: false },
    ])
    setNewSubtask('')
  }

  const setSprint = (sprintId: SprintId | null) => {
    dispatch({ type: 'SET_CARD_SPRINT', cardId: card.id, sprintId })
  }

  const postComment = () => {
    const text = newComment.trim()
    if (!text) return
    dispatch({
      type: 'ADD_COMMENT',
      cardId: card.id,
      authorId: commentAuthor,
      text,
    })
    setNewComment('')
  }

  const addLink = () => {
    if (!linkTarget || linkTarget === card.id) return
    dispatch({
      type: 'ADD_LINK',
      cardId: card.id,
      linkType,
      targetCardId: linkTarget,
    })
    setLinkTarget('')
  }

  const removeLink = (lt: LinkType, targetCardId: CardId) => {
    dispatch({
      type: 'REMOVE_LINK',
      cardId: card.id,
      linkType: lt,
      targetCardId,
    })
  }

  const checklistDone = checklist.filter((i) => i.done).length
  const sprintOrder = board.sprintOrder ?? []
  const sprints = board.sprints ?? {}

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Card: ${card.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form className="modal-card" onSubmit={save}>
        <header className="modal-head">
          <div className="modal-key-block">
            {card.key && <span className="modal-key">{card.key}</span>}
            {type && (
              <span
                className="type-icon type-modal"
                style={{ background: ISSUE_TYPES[type].color }}
                title={ISSUE_TYPES[type].name}
              >
                {ISSUE_TYPES[type].icon}
              </span>
            )}
          </div>
          <input
            type="text"
            className="modal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            maxLength={120}
            aria-label="Card title"
            placeholder="Card title"
          />
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close card"
            title="Close"
          >
            ✕
          </button>
        </header>

        <div className="modal-body">
          <label className="modal-field">
            <span className="modal-field-label">Description</span>
            <textarea
              className="modal-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add a description…"
              maxLength={1000}
              aria-label="Card description"
            />
          </label>

          <div className="modal-row">
            <label className="modal-field">
              <span className="modal-field-label">Column</span>
              <select
                className="modal-select"
                value={columnId}
                onChange={(e) => moveTo(e.target.value)}
                aria-label="Move to column"
              >
                {board.columnIds.map((cid) => {
                  const c = board.columns[cid]
                  if (!c) return null
                  return (
                    <option key={cid} value={cid}>
                      {c.name}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="modal-field">
              <span className="modal-field-label">Sprint</span>
              <select
                className="modal-select"
                value={card.sprintId ?? ''}
                onChange={(e) =>
                  setSprint(e.target.value === '' ? null : e.target.value)
                }
                aria-label="Sprint"
              >
                <option value="">Backlog</option>
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

            <label className="modal-field">
              <span className="modal-field-label">Due (IST)</span>
              <input
                type="date"
                className="modal-input"
                value={dueInput}
                onChange={(e) => setDueInput(e.target.value)}
                aria-label="Due date"
              />
            </label>
          </div>

          <div className="modal-row">
            <div className="modal-field">
              <span className="modal-field-label">Issue type</span>
              <div className="type-picker" role="radiogroup" aria-label="Type">
                {ISSUE_TYPE_IDS.map((t) => {
                  const meta = ISSUE_TYPES[t]
                  const on = type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`type-btn ${on ? 'is-on' : ''}`}
                      onClick={() => setType(on ? undefined : t)}
                      aria-pressed={on}
                      style={
                        on
                          ? {
                              background: meta.color,
                              borderColor: meta.color,
                              color: '#fff',
                            }
                          : { borderColor: meta.color, color: meta.color }
                      }
                    >
                      <span
                        className="type-chip-icon"
                        style={
                          on
                            ? { background: '#ffffff33', color: '#fff' }
                            : { background: meta.color, color: '#fff' }
                        }
                      >
                        {meta.icon}
                      </span>
                      {meta.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="modal-field">
              <span className="modal-field-label">Assignee</span>
              <select
                className="modal-select"
                value={assignee ?? 'unassigned'}
                onChange={(e) =>
                  setAssignee(
                    e.target.value === 'unassigned'
                      ? 'unassigned'
                      : (e.target.value as AssigneeId),
                  )
                }
                aria-label="Assignee"
              >
                {ASSIGNEE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {TEAM[id].name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="modal-field">
            <span className="modal-field-label">Story points</span>
            <div className="points-picker" role="radiogroup" aria-label="Story points">
              <button
                type="button"
                className={`points-btn ${points === undefined ? 'is-on' : ''}`}
                onClick={() => setPoints(undefined)}
                aria-pressed={points === undefined}
              >
                –
              </button>
              {POINT_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`points-btn ${points === p ? 'is-on' : ''}`}
                  onClick={() => setPoints(p)}
                  aria-pressed={points === p}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <span className="modal-field-label">Priority</span>
            <div
              className="priority-picker"
              role="radiogroup"
              aria-label="Priority"
            >
              <button
                type="button"
                className={`priority-btn ${
                  priority === undefined ? 'is-on' : ''
                }`}
                onClick={() => setPriority(undefined)}
                aria-pressed={priority === undefined}
              >
                None
              </button>
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`priority-btn priority-${p} ${
                    priority === p ? 'is-on' : ''
                  }`}
                  onClick={() => setPriority(p)}
                  aria-pressed={priority === p}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-field">
            <span className="modal-field-label">Labels</span>
            <div className="label-picker" role="group" aria-label="Labels">
              {(Object.keys(LABELS) as LabelId[]).map((id) => {
                const meta = LABELS[id]
                const on = labels.includes(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className={`label-chip ${on ? 'is-on' : ''}`}
                    style={
                      on
                        ? {
                            background: meta.color,
                            borderColor: meta.color,
                            color: '#fff',
                          }
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
          </div>

          <div className="modal-field">
            <span className="modal-field-label">
              Checklist
              {checklist.length > 0 && (
                <span className="checklist-progress-inline">
                  {' '}
                  · {checklistDone} of {checklist.length} done
                </span>
              )}
            </span>
            {checklist.length > 0 && (
              <ul className="checklist">
                {checklist.map((it) => (
                  <li
                    key={it.id}
                    className={`checklist-item ${it.done ? 'is-done' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={it.done}
                      onChange={() => toggleChecklistItem(it.id)}
                      aria-label={
                        it.done
                          ? `Mark "${it.text}" not done`
                          : `Mark "${it.text}" done`
                      }
                    />
                    <span className="checklist-text">{it.text}</span>
                    <button
                      type="button"
                      className="checklist-remove"
                      onClick={() => removeChecklistItem(it.id)}
                      aria-label={`Remove subtask: ${it.text}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="checklist-add">
              <input
                type="text"
                className="modal-input"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask…"
                maxLength={120}
                aria-label="New subtask"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChecklistItem()
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={addChecklistItem}
                disabled={!newSubtask.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {card.createdAt !== undefined && (
            <p className="modal-meta">
              Created {formatIst(new Date(card.createdAt))}
            </p>
          )}

          {card.history && card.history.length > 0 && (
            <div className="modal-field">
              <span className="modal-field-label">Activity</span>
              <ul className="history-list">
                {card.history
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <li key={`${h.at}-${i}`} className="history-item">
                      <time className="history-time">
                        {formatIst(new Date(h.at))}
                      </time>
                      <span className="history-text">{h.text}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <div className="modal-field">
            <span className="modal-field-label">
              Links
              {card.links && card.links.length > 0 && (
                <span className="checklist-progress-inline">
                  {' '}
                  · {card.links.length}
                </span>
              )}
            </span>
            {card.links && card.links.length > 0 && (
              <ul className="links-list">
                {card.links.map((l) => {
                  const target = board.cards[l.targetCardId]
                  const meta = LINK_TYPE_META[l.type]
                  return (
                    <li key={`${l.type}:${l.targetCardId}`} className="link-item">
                      <span
                        className="link-type-pill"
                        style={{
                          background: meta.color,
                          color: '#fff',
                        }}
                      >
                        {meta.label}
                      </span>
                      {target ? (
                        <button
                          type="button"
                          className="link-target"
                          onClick={() => onNavigate?.(l.targetCardId)}
                          aria-label={`Open ${target.key ?? ''} ${target.title}`}
                        >
                          {target.key && (
                            <span className="card-key">{target.key}</span>
                          )}
                          <span className="link-target-title">
                            {target.title}
                          </span>
                        </button>
                      ) : (
                        <span className="link-target is-missing">
                          (deleted card)
                        </span>
                      )}
                      <button
                        type="button"
                        className="bs-icon-btn bs-icon-danger link-remove"
                        onClick={() => removeLink(l.type, l.targetCardId)}
                        aria-label="Remove link"
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="link-compose">
              <select
                className="modal-select"
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as LinkType)}
                aria-label="Link type"
              >
                {LINK_TYPES.map((lt) => (
                  <option key={lt} value={lt}>
                    {LINK_TYPE_META[lt].label}
                  </option>
                ))}
              </select>
              <select
                className="modal-select link-target-select"
                value={linkTarget}
                onChange={(e) => setLinkTarget(e.target.value)}
                aria-label="Link target card"
              >
                <option value="">Select a card…</option>
                {Object.values(board.cards)
                  .filter((c) => c.id !== card.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.key ? `${c.key} — ${c.title}` : c.title}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={addLink}
                disabled={!linkTarget}
              >
                Link
              </button>
            </div>
          </div>

          <div className="modal-field">
            <span className="modal-field-label">
              Comments
              {card.comments && card.comments.length > 0 && (
                <span className="checklist-progress-inline">
                  {' '}
                  · {card.comments.length}
                </span>
              )}
            </span>
            {card.comments && card.comments.length > 0 && (
              <ul className="comments-list">
                {card.comments.map((cm) => {
                  const author = TEAM[cm.authorId]
                  return (
                    <li key={cm.id} className="comment-item">
                      <span
                        className="avatar avatar-sm"
                        style={{ background: author.color }}
                        aria-hidden="true"
                      >
                        {assigneeInitials(cm.authorId)}
                      </span>
                      <div className="comment-body">
                        <div className="comment-head">
                          <strong>{author.name}</strong>
                          <time>{formatIst(new Date(cm.at))}</time>
                        </div>
                        <p className="comment-text">{cm.text}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="comment-compose">
              <select
                className="modal-select comment-author"
                value={commentAuthor}
                onChange={(e) =>
                  setCommentAuthor(e.target.value as AssigneeId)
                }
                aria-label="Comment author"
              >
                {ASSIGNEE_IDS.filter((a) => a !== 'unassigned').map((id) => (
                  <option key={id} value={id}>
                    {TEAM[id].name}
                  </option>
                ))}
              </select>
              <textarea
                className="modal-textarea comment-input"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
                maxLength={500}
                aria-label="New comment"
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={postComment}
                disabled={!newComment.trim()}
              >
                Post
              </button>
            </div>
          </div>
        </div>

        <footer className="modal-foot">
          <button
            type="button"
            className="btn btn-ghost btn-danger"
            onClick={remove}
            aria-label={`Delete card: ${card.title}`}
          >
            Delete
          </button>
          <div className="modal-foot-right">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save changes
            </button>
          </div>
        </footer>
      </form>
    </div>
  )
}
