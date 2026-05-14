import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const repoName = 'kanban-pm-tool'

/** Format build moment as "DD-MM-YYYY HH:MM:SS IST" using Asia/Kolkata. */
function buildTimeIst(): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value]),
  )
  return `${parts.day}-${parts.month}-${parts.year} ${parts.hour}:${parts.minute}:${parts.second} IST`
}

export default defineConfig({
  plugins: [react()],
  base: `/${repoName}/`,
  define: {
    __BUILD_TIME__: JSON.stringify(buildTimeIst()),
    __COMMIT_SHA__: JSON.stringify(
      (process.env.GITHUB_SHA ?? 'local-dev').slice(0, 7),
    ),
    __APP_PHASE__: JSON.stringify('Phase 5 · Polish'),
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
})
