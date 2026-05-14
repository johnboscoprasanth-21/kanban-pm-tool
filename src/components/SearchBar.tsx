import type { ChangeEvent } from 'react'

interface SearchBarProps {
  query: string
  onChange: (next: string) => void
}

export function SearchBar({ query, onChange }: SearchBarProps) {
  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden="true">
        ⌕
      </span>
      <input
        type="search"
        className="search-input"
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="Search cards…"
        aria-label="Search cards"
      />
      {query && (
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
          title="Clear"
        >
          ✕
        </button>
      )}
    </div>
  )
}
