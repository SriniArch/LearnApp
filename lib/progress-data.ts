export type TopicStatus = "not-started" | "in-progress" | "completed"

export interface ProgressRecord {
  status: TopicStatus
  bestScore?: number
  total?: number
  /** ISO timestamp when a daily challenge was first completed (XP lock time). */
  completedAt?: string
}

export type ProgressMap = Record<string, ProgressRecord>

const STATUS_RANK: Record<TopicStatus, number> = {
  "not-started": 0,
  "in-progress": 1,
  completed: 2,
}

const KEY_PATTERN = /^[\w-]+:[\w-]+:[\w-]+$/
const DAILY_KEY_PATTERN = /^daily:.+:\d{4}-\d{2}-\d{2}$/
const STATUSES = new Set<TopicStatus>(["not-started", "in-progress", "completed"])

function isDailyKey(key: string): boolean {
  return DAILY_KEY_PATTERN.test(key)
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false
  const t = Date.parse(value)
  return !Number.isNaN(t)
}

export function isProgressMap(value: unknown): value is ProgressMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  for (const [key, record] of Object.entries(value)) {
    if (!KEY_PATTERN.test(key)) return false
    if (!record || typeof record !== "object" || Array.isArray(record)) return false
    const rec = record as Record<string, unknown>
    if (typeof rec.status !== "string" || !STATUSES.has(rec.status as TopicStatus)) {
      return false
    }
    if (rec.bestScore !== undefined && (!Number.isFinite(rec.bestScore) || (rec.bestScore as number) < 0)) {
      return false
    }
    if (rec.total !== undefined && (!Number.isFinite(rec.total) || (rec.total as number) < 0)) {
      return false
    }
    if (rec.completedAt !== undefined && !isIsoTimestamp(rec.completedAt)) {
      return false
    }
  }
  return true
}

function mergeTopicRecord(prev: ProgressRecord, incoming: ProgressRecord): ProgressRecord {
  const status =
    STATUS_RANK[incoming.status] >= STATUS_RANK[prev.status] ? incoming.status : prev.status
  const prevBest = prev.bestScore ?? 0
  const nextBest = incoming.bestScore ?? 0
  const bestScore = Math.max(prevBest, nextBest)
  const total = nextBest >= prevBest ? (incoming.total ?? prev.total) : (prev.total ?? incoming.total)
  return {
    status,
    ...(bestScore > 0 ? { bestScore } : {}),
    ...(total !== undefined ? { total } : {}),
  }
}

/** Daily XP locks on first completion: prefer earlier completedAt when both exist. */
function mergeDailyRecord(prev: ProgressRecord, incoming: ProgressRecord): ProgressRecord {
  const status =
    STATUS_RANK[incoming.status] >= STATUS_RANK[prev.status] ? incoming.status : prev.status

  if (prev.status === "completed" && incoming.status === "completed") {
    const prevAt = prev.completedAt ? Date.parse(prev.completedAt) : NaN
    const nextAt = incoming.completedAt ? Date.parse(incoming.completedAt) : NaN
    if (!Number.isNaN(prevAt) && !Number.isNaN(nextAt)) {
      const keep = nextAt < prevAt ? incoming : prev
      return {
        status: "completed",
        ...(keep.bestScore !== undefined ? { bestScore: keep.bestScore } : {}),
        ...(keep.total !== undefined ? { total: keep.total } : {}),
        completedAt: keep.completedAt,
      }
    }
    // No reliable timestamps: keep the earlier-known score (prev) so sync cannot raise XP.
    return {
      status: "completed",
      ...(prev.bestScore !== undefined ? { bestScore: prev.bestScore } : {}),
      ...(prev.total !== undefined ? { total: prev.total } : {}),
      ...(prev.completedAt ?? incoming.completedAt
        ? { completedAt: prev.completedAt ?? incoming.completedAt }
        : {}),
    }
  }

  if (incoming.status === "completed") {
    return {
      status: "completed",
      ...(incoming.bestScore !== undefined ? { bestScore: incoming.bestScore } : {}),
      ...(incoming.total !== undefined ? { total: incoming.total } : {}),
      ...(incoming.completedAt ? { completedAt: incoming.completedAt } : {}),
    }
  }

  if (prev.status === "completed") {
    return {
      status: "completed",
      ...(prev.bestScore !== undefined ? { bestScore: prev.bestScore } : {}),
      ...(prev.total !== undefined ? { total: prev.total } : {}),
      ...(prev.completedAt ? { completedAt: prev.completedAt } : {}),
    }
  }

  return {
    status,
    ...(prev.bestScore !== undefined || incoming.bestScore !== undefined
      ? { bestScore: Math.max(prev.bestScore ?? 0, incoming.bestScore ?? 0) }
      : {}),
    ...(incoming.total !== undefined || prev.total !== undefined
      ? { total: incoming.total ?? prev.total }
      : {}),
  }
}

export function mergeProgress(a: ProgressMap, b: ProgressMap): ProgressMap {
  const out: ProgressMap = { ...a }
  for (const [key, incoming] of Object.entries(b)) {
    const prev = out[key]
    if (!prev) {
      out[key] = incoming
      continue
    }
    out[key] = isDailyKey(key) ? mergeDailyRecord(prev, incoming) : mergeTopicRecord(prev, incoming)
  }
  return out
}

export function progressEqual(a: ProgressMap, b: ProgressMap): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
