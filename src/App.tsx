import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import './App.css'
import { IstClock } from './components/IstClock'
import { KanbanBoard } from './components/KanbanBoard'
import { BoardSwitcher } from './components/BoardSwitcher'
import { SearchBar } from './components/SearchBar'
import { ThemeToggle } from './components/ThemeToggle'
import { FilterBar } from './components/FilterBar'
import { BoardStats } from './components/BoardStats'
import { UndoToast } from './components/UndoToast'
import { CardDetailModal } from './components/CardDetailModal'
import { ShortcutsOverlay } from './components/ShortcutsOverlay'
import type { Board, Card, CardId, ColumnId } from './lib/board'
import { activeBoard } from './lib/workspace'
import {
  workspaceReducer,
  loadWorkspace,
  saveWorkspace,
  type WorkspaceAction,
} from './lib/workspaceReducer'
import { useTheme } from './lib/useTheme'
import { EMPTY_FILTER, type Filter } from './lib/filters'

interface UndoState {
  card: Card
  columnId: ColumnId
  atIndex: number
}

function findCardLocation(
  board: ReturnType<typeof activeBoard>,
  cardId: CardId,
): { columnId: ColumnId; atIndex: number } | null {
  for (const colId of board.columnIds) {
    const col = board.columns[colId]
    const idx = col.cardIds.indexOf(cardId)
    if (idx >= 0) return { columnId: colId, atIndex: idx }
  }
  return null
}

function downloadBoardAsJson(board: Board): void {
  const data = JSON.stringify(board, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = board.name.replace(/[^a-z0-9\-_]+/gi, '_').toLowerCase()
  a.href = url
  a.download = `${safeName || 'board'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 200)
}

function looksLikeBoard(input: unknown): input is Board {
  if (!input || typeof input !== 'object') return false
  const b = input as Board
  return (
    typeof b.name === 'string' &&
    Array.isArray(b.columnIds) &&
    b.columns !== null &&
    typeof b.columns === 'object' &&
    b.cards !== null &&
    typeof b.cards === 'object'
  )
}

function App() {
  const [workspace, baseDispatch] = useReducer(
    workspaceReducer,
    undefined,
    loadWorkspace,
  )
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER)
  const [theme, , toggleTheme] = useTheme()
  const [openCardId, setOpenCardId] = useState<CardId | null>(null)
  const [undo, setUndo] = useState<UndoState | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const workspaceRef = useRef(workspace)
  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  useEffect(() => {
    saveWorkspace(workspace)
  }, [workspace])

  // Dispatch wrapper that captures a snapshot before DELETE_CARD so we
  // can offer Undo.
  const dispatch = useCallback((action: WorkspaceAction) => {
    if (action.type === 'DELETE_CARD') {
      const ws = workspaceRef.current
      const board = ws.boards[ws.activeBoardId]
      const card = board?.cards[action.cardId]
      const loc = board && findCardLocation(board, action.cardId)
      if (card && loc) {
        setUndo({ card, columnId: loc.columnId, atIndex: loc.atIndex })
      }
    }
    baseDispatch(action)
  }, [])

  // Keyboard shortcuts: "/" focus search, "?" open shortcuts overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const tag = t?.tagName?.toLowerCase()
      const typing =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        t?.isContentEditable === true
      if (typing) return
      if (e.key === '/') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      } else if (e.key === '?') {
        e.preventDefault()
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const board = activeBoard(workspace)
  const openCard = openCardId ? board.cards[openCardId] : null
  const openCardColumn = openCardId
    ? findCardLocation(board, openCardId)?.columnId
    : null

  const handleUndo = () => {
    if (!undo) return
    baseDispatch({
      type: 'RESTORE_CARD',
      card: undo.card,
      columnId: undo.columnId,
      atIndex: undo.atIndex,
    })
    setUndo(null)
  }

  const handleExport = () => {
    downloadBoardAsJson(board)
  }

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!looksLikeBoard(parsed)) {
          alert('That file doesn’t look like a board JSON.')
          return
        }
        dispatch({ type: 'IMPORT_BOARD', board: parsed })
      } catch {
        alert('Failed to parse JSON. Check the file and try again.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-logo" aria-hidden="true">
            <span>K</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">Kanban PM</span>
            <span className="brand-tag">
              A project management tool · React + CI/CD
            </span>
          </div>
        </div>
        <div className="header-right">
          <SearchBar query={query} onChange={setQuery} inputRef={searchRef} />
          <BoardSwitcher workspace={workspace} dispatch={dispatch} />
          <span className="phase-pill" title="Current development phase">
            {__APP_PHASE__}
          </span>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setShortcutsOpen(true)}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
          >
            ?
          </button>
          <ThemeToggle theme={theme} toggle={toggleTheme} />
          <IstClock />
        </div>
      </header>

      <div className="sub-header">
        <BoardStats board={board} />
        <FilterBar filter={filter} onChange={setFilter} />
      </div>

      <main className="app-main">
        <KanbanBoard
          board={board}
          dispatch={dispatch}
          query={query}
          filter={filter}
          onOpenCard={setOpenCardId}
          onExport={handleExport}
          onImport={handleImportClick}
        />

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImportFile(f)
            e.target.value = ''
          }}
        />

        <section className="build-card" aria-label="Build info">
          <h2>Build info</h2>
          <dl className="meta">
            <dt>Phase</dt>
            <dd>
              <code>{__APP_PHASE__}</code>
            </dd>
            <dt>Active board</dt>
            <dd>
              <code>
                {board.name} ({workspace.boardOrder.length} total)
              </code>
            </dd>
            <dt>Commit</dt>
            <dd>
              <code>{__COMMIT_SHA__}</code>
            </dd>
            <dt>Built at</dt>
            <dd>
              <code>{__BUILD_TIME__}</code>
            </dd>
          </dl>
        </section>
      </main>

      <footer className="app-footer">
        <span>
          John Bosco Prasanth · Built in phases · Each phase auto-deployed via
          GitHub Actions
        </span>
      </footer>

      {openCard && openCardColumn && (
        <CardDetailModal
          card={openCard}
          columnId={openCardColumn}
          board={board}
          dispatch={dispatch}
          onClose={() => setOpenCardId(null)}
        />
      )}

      {undo && (
        <UndoToast
          key={undo.card.id}
          message={`Deleted "${undo.card.title}"`}
          onUndo={handleUndo}
          onDismiss={() => setUndo(null)}
        />
      )}

      {shortcutsOpen && (
        <ShortcutsOverlay onClose={() => setShortcutsOpen(false)} />
      )}
    </div>
  )
}

export default App
