/** Case-insensitive substring match against card title or description. */
export function matchesQuery(
  card: { title: string; description?: string },
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    card.title.toLowerCase().includes(q) ||
    (card.description?.toLowerCase().includes(q) ?? false)
  )
}
