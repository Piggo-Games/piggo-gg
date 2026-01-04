export const isShotCharging = (entries: string[], id: string): boolean => {
  for (const entry of entries) {
    if (entry === id) return true
  }
  return false
}

export const addShotCharging = (entries: string[], id: string): string[] => {
  if (isShotCharging(entries, id)) return entries
  return [...entries, id]
}

export const removeShotCharging = (entries: string[], id: string): string[] => {
  const next: string[] = []

  for (const entry of entries) {
    if (entry !== id) next.push(entry)
  }

  return next
}

export const pruneShotCharging = (entries: string[], exists: (id: string) => boolean): string[] => {
  const next: string[] = []

  for (const entry of entries) {
    if (!exists(entry)) continue
    next.push(entry)
  }

  return next
}
