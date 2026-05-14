import { useEffect, useState } from 'react'
import { formatIstDate, formatIstTime } from '../lib/formatIst'

/** Live IST clock — updates every second. */
export function IstClock() {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="ist-clock" aria-label="Current time in IST">
      <span className="ist-clock-date">{formatIstDate(now)}</span>
      <span className="ist-clock-time" data-testid="ist-time">
        {formatIstTime(now)}
      </span>
      <span className="ist-clock-tz">IST</span>
    </div>
  )
}
