# Kanban PM

[![CI/CD](https://github.com/johnboscoprasanth-21/kanban-pm-tool/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/johnboscoprasanth-21/kanban-pm-tool/actions/workflows/ci-cd.yml)

A Trello/Jira-style project management tool, built **in phases**, each phase auto-deployed by GitHub Actions.

**Live demo:** https://johnboscoprasanth-21.github.io/kanban-pm-tool/

---

## Phase plan

| Phase | Scope | Status |
|---|---|---|
| **1 · Foundation** | Vite + React + TS scaffold, CI/CD pipeline, theme, static board with 4 columns + sample cards, IST clock, build info | ✅ live |
| **2 · Card CRUD** | Add / edit / delete cards inline; localStorage persistence | ✅ live |
| **3 · Drag-and-drop** | `@dnd-kit/core` — drag cards between columns, reorder within | ⏳ |
| **4 · Multiple boards** | Board switcher, create / rename / delete boards | ⏳ |
| **5 · Polish** | Search, labels, priority, due dates (IST), dark mode | ⏳ |

Every push to `main` triggers a Lint → Test → Build → Deploy pipeline; the live URL above always reflects the latest green commit on `main`.

## Tech stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite 6
- **Tests:** Vitest + React Testing Library + happy-dom
- **Lint:** ESLint 9 (typescript-eslint)
- **DnD (Phase 3+):** `@dnd-kit/core`
- **CI:** GitHub Actions
- **Hosting:** GitHub Pages

## Local development

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint
npm run test
npm run build
```

## Pipeline

```
push to main / PR
        │
        ▼
┌──────────────────────────────────────────┐
│ Job: build-and-test  (ubuntu-latest)     │
│  Checkout · Setup Node 20 · npm ci       │
│  Lint · Test · Build · Upload artifact   │
└────────────────┬─────────────────────────┘
                 │ needs: build-and-test
                 ▼  (only on push to main)
┌──────────────────────────────────────────┐
│ Job: deploy                              │
│  actions/deploy-pages@v4                 │
│  → https://johnboscoprasanth-21          │
│       .github.io/kanban-pm-tool/         │
└──────────────────────────────────────────┘
```

## Data model

The board / column / card shape (see `src/lib/board.ts`) is fixed in Phase 1 so the same types carry through every later phase:

```ts
Board { id, name, columnIds, columns: Record<id, Column>, cards: Record<id, Card> }
Column { id, name, cardIds }
Card   { id, title, description? }
```

Drag-and-drop in Phase 3 will only mutate `columns[*].cardIds`. CRUD in Phase 2 will only mutate `cards` and column `cardIds`. No model rewrites needed between phases.

## Build info on the page

The deployed page shows: current development phase, git commit SHA, and build time in `DD-MM-YYYY HH:MM:SS IST` format — baked at build time via Vite `define`. Proves the deployed bundle matches the latest CI run.
