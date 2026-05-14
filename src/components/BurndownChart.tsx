import type { Board, Sprint } from '../lib/board'
import { computeBurndown } from '../lib/burndown'
import { formatIstDate } from '../lib/formatIst'

interface BurndownChartProps {
  board: Board
  sprint: Sprint
}

const W = 640
const H = 160
const PAD_L = 36
const PAD_R = 16
const PAD_T = 18
const PAD_B = 28

export function BurndownChart({ board, sprint }: BurndownChartProps) {
  const series = computeBurndown(board, sprint)
  if (!series) return null

  const { totalPoints, donePoints, remainingPoints, startedAt, now, endsAt, sprintDays, dayOfSprint, actual } = series

  const innerW = W - PAD_L - PAD_R
  const innerH = H - PAD_T - PAD_B
  const xScale = (t: number) => {
    const ratio = (t - startedAt) / (endsAt - startedAt)
    return PAD_L + Math.max(0, Math.min(1, ratio)) * innerW
  }
  const yScale = (points: number) => {
    if (totalPoints === 0) return PAD_T + innerH
    return PAD_T + (1 - points / totalPoints) * innerH
  }

  // Ideal line: from (start, totalPoints) to (endsAt, 0)
  const idealX1 = xScale(startedAt)
  const idealY1 = yScale(totalPoints)
  const idealX2 = xScale(endsAt)
  const idealY2 = yScale(0)

  // Actual line: connected dots
  let actualPath = ''
  for (let i = 0; i < actual.length; i++) {
    const p = actual[i]
    const x = xScale(p.at)
    const y = yScale(p.remaining)
    actualPath += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `
  }

  const nowX = xScale(now)
  const baseY = yScale(0)
  const topY = yScale(totalPoints)

  // Y-axis ticks
  const yTicks: number[] = []
  if (totalPoints > 0) {
    const step = totalPoints > 20 ? 10 : totalPoints > 10 ? 5 : 2
    for (let v = 0; v <= totalPoints; v += step) yTicks.push(v)
    if (yTicks[yTicks.length - 1] !== totalPoints) yTicks.push(totalPoints)
  }

  const aheadOfIdeal =
    actual.length > 0 &&
    yScale(actual[actual.length - 1].remaining) >=
      // Linear interpolation of ideal at "now"
      idealY1 + ((nowX - idealX1) / (idealX2 - idealX1)) * (idealY2 - idealY1)

  return (
    <section className="burndown" aria-label="Sprint burndown">
      <header className="burndown-head">
        <div>
          <h2 className="burndown-title">
            {sprint.name} burndown
            <span
              className={`burndown-trend ${aheadOfIdeal ? 'is-behind' : 'is-on-track'}`}
            >
              {aheadOfIdeal ? 'Behind ideal' : 'On track'}
            </span>
          </h2>
          <p className="burndown-sub">
            <strong>{donePoints}</strong> / {totalPoints} pts done ·{' '}
            <strong>{remainingPoints}</strong> remaining · day{' '}
            <strong>{dayOfSprint}</strong> of {sprintDays} · started{' '}
            {formatIstDate(new Date(startedAt))}
          </p>
        </div>
      </header>

      <svg
        className="burndown-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Sprint burndown chart"
      >
        {/* Y-axis grid + labels */}
        {yTicks.map((v) => {
          const y = yScale(v)
          return (
            <g key={v} className="burndown-grid">
              <line
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.08"
              />
              <text
                x={PAD_L - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize="10"
                fill="currentColor"
                fillOpacity="0.55"
              >
                {v}
              </text>
            </g>
          )
        })}

        {/* X-axis baseline */}
        <line
          x1={PAD_L}
          y1={baseY}
          x2={W - PAD_R}
          y2={baseY}
          stroke="currentColor"
          strokeOpacity="0.25"
        />

        {/* Ideal line */}
        <line
          x1={idealX1}
          y1={idealY1}
          x2={idealX2}
          y2={idealY2}
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeDasharray="4 4"
          strokeWidth="1.5"
        />

        {/* Actual line + dots */}
        <path
          d={actualPath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {actual.map((p, i) => (
          <circle
            key={i}
            cx={xScale(p.at)}
            cy={yScale(p.remaining)}
            r="3.2"
            fill="var(--primary)"
          />
        ))}

        {/* Today marker */}
        <line
          x1={nowX}
          y1={topY}
          x2={nowX}
          y2={baseY}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.7"
        />
        <text
          x={nowX}
          y={PAD_T - 4}
          textAnchor="middle"
          fontSize="9"
          fill="var(--accent)"
          fontWeight="700"
        >
          Today
        </text>

        {/* Legend */}
        <g transform={`translate(${PAD_L}, ${H - 6})`}>
          <line
            x1="0"
            y1="-2"
            x2="14"
            y2="-2"
            stroke="currentColor"
            strokeOpacity="0.45"
            strokeDasharray="4 4"
          />
          <text x="18" y="0" fontSize="10" fill="currentColor" fillOpacity="0.7">
            Ideal
          </text>
          <line
            x1="60"
            y1="-2"
            x2="74"
            y2="-2"
            stroke="var(--primary)"
            strokeWidth="2"
          />
          <text x="78" y="0" fontSize="10" fill="currentColor" fillOpacity="0.7">
            Actual
          </text>
        </g>
      </svg>
    </section>
  )
}
