/**
 * IST (Asia/Kolkata, UTC+5:30) date/time formatters.
 *   Date: DD-MM-YYYY
 *   Time: HH:MM:SS (24-hour)
 *   Combined: DD-MM-YYYY HH:MM:SS IST
 */

const IST_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}

const istParts = (date: Date): Record<string, string> => {
  const fmt = new Intl.DateTimeFormat('en-GB', IST_OPTS)
  return Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  )
}

export function formatIst(date: Date): string {
  const p = istParts(date)
  return `${p.day}-${p.month}-${p.year} ${p.hour}:${p.minute}:${p.second} IST`
}

export function formatIstDate(date: Date): string {
  const p = istParts(date)
  return `${p.day}-${p.month}-${p.year}`
}

export function formatIstTime(date: Date): string {
  const p = istParts(date)
  return `${p.hour}:${p.minute}:${p.second}`
}
