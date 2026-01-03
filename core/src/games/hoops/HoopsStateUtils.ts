type DashEntry = {
  id: string
  until: number
}

const encodeDashEntry = (id: string, until: number) => `${id}|${until}`

const parseDashEntry = (entry: string): DashEntry | null => {
  const sep = entry.lastIndexOf("|")
  if (sep <= 0) return null

  const id = entry.slice(0, sep)
  const until = Number(entry.slice(sep + 1))

  if (!Number.isFinite(until)) return null

  return { id, until }
}

export const getDashUntil = (entries: string[], id: string): number | undefined => {
  for (const entry of entries) {
    const parsed = parseDashEntry(entry)
    if (parsed?.id === id) return parsed.until
  }
}

export const setDashEntry = (entries: string[], id: string, until: number): string[] => {
  const next: string[] = []

  for (const entry of entries) {
    const parsed = parseDashEntry(entry)
    if (!parsed || parsed.id !== id) next.push(entry)
  }

  next.push(encodeDashEntry(id, until))
  return next
}

export const pruneDashEntries = (
  entries: string[],
  now: number,
  exists: (id: string) => boolean,
  keepUntil: (until: number, now: number) => boolean
): string[] => {
  const next: string[] = []

  for (const entry of entries) {
    const parsed = parseDashEntry(entry)
    if (!parsed) continue
    if (!exists(parsed.id)) continue
    if (!keepUntil(parsed.until, now)) continue
    next.push(entry)
  }

  return next
}
