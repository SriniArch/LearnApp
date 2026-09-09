import { todayKey } from "@/lib/quiz"

/** Local calendar date from YYYY-MM-DD (noon avoids DST edge issues). */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year!, month! - 1, day!, 12, 0, 0, 0)
}

/** Sunday of the week containing `date` (local), as YYYY-MM-DD. */
export function weekStartKey(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // Sunday = 0
  return todayKey(d)
}

/** Saturday of the week containing `date` (local), as YYYY-MM-DD. */
export function weekEndKey(date: Date = new Date()): string {
  const start = parseDateKey(weekStartKey(date))
  start.setDate(start.getDate() + 6)
  return todayKey(start)
}

/** Seven YYYY-MM-DD keys from Sunday through Saturday. */
export function weekDateKeys(weekStart: string): string[] {
  const start = parseDateKey(weekStart)
  const keys: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    keys.push(todayKey(d))
  }
  return keys
}

export function weekRangeLabel(weekStart: string): string {
  const start = parseDateKey(weekStart)
  const end = parseDateKey(weekEndKey(start))
  const sameYear = start.getFullYear() === end.getFullYear()
  const startLabel = start.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  })
  const endLabel = end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  return `${startLabel}–${endLabel}`
}

export function weekdayLabel(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, { weekday: "long" })
}
