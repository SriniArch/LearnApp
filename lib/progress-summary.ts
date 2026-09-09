import { curriculum, getGrade } from "@/lib/curriculum"
import type { SubjectColor } from "@/lib/curriculum"
import { parseDailyProgressKey, todayKey } from "@/lib/quiz"
import type { ProgressMap, TopicStatus } from "@/lib/progress-data"
import {
  parseDateKey,
  weekDateKeys,
  weekEndKey,
  weekRangeLabel,
  weekStartKey,
  weekdayLabel,
} from "@/lib/week"

export interface DailyProgressRow {
  date: string
  gradeId: string
  gradeTitle: string
  bestScore?: number
  total?: number
  status: TopicStatus
}

export interface TopicProgressRow {
  topicId: string
  title: string
  status: TopicStatus
  bestScore?: number
  total?: number
}

export interface SubjectProgressGroup {
  subjectId: string
  title: string
  color: SubjectColor
  completed: number
  total: number
  topics: TopicProgressRow[]
}

export interface GradeProgressGroup {
  gradeId: string
  title: string
  subjects: SubjectProgressGroup[]
}

export interface ProgressSummary {
  daily: DailyProgressRow[]
  today: DailyProgressRow[]
  grades: GradeProgressGroup[]
}

export interface WeeklyDayXp {
  date: string
  weekday: string
  xp: number
  /** Earliest completedAt among daily records that day, if any. */
  completedAt?: string
}

export interface CurrentWeekXp {
  start: string
  end: string
  label: string
  days: WeeklyDayXp[]
  totalXp: number
}

export interface PastWeekXp {
  start: string
  end: string
  label: string
  totalXp: number
}

export interface WeeklyDailyXpSummary {
  currentWeek: CurrentWeekXp
  pastWeeks: PastWeekXp[]
}

function topicKey(gradeId: string, subjectId: string, topicId: string) {
  return `${gradeId}:${subjectId}:${topicId}`
}

/** Aggregate locked daily XP per calendar day (sum across grades). */
function dailyXpByDate(progress: ProgressMap): Map<string, { xp: number; completedAt?: string }> {
  const byDate = new Map<string, { xp: number; completedAt?: string }>()

  for (const [key, record] of Object.entries(progress)) {
    const parsed = parseDailyProgressKey(key)
    if (!parsed) continue
    if (record.status !== "completed" || record.bestScore === undefined) continue

    const prev = byDate.get(parsed.date)
    const xp = (prev?.xp ?? 0) + record.bestScore
    let completedAt = prev?.completedAt
    if (record.completedAt) {
      if (!completedAt || Date.parse(record.completedAt) < Date.parse(completedAt)) {
        completedAt = record.completedAt
      }
    }
    byDate.set(parsed.date, { xp, ...(completedAt ? { completedAt } : {}) })
  }

  return byDate
}

export function summarizeWeeklyDailyXp(
  progress: ProgressMap,
  options?: { today?: Date },
): WeeklyDailyXpSummary {
  const now = options?.today ?? new Date()
  const currentStart = weekStartKey(now)
  const currentEnd = weekEndKey(now)
  const byDate = dailyXpByDate(progress)

  const days: WeeklyDayXp[] = weekDateKeys(currentStart).map((date) => {
    const entry = byDate.get(date)
    return {
      date,
      weekday: weekdayLabel(date),
      xp: entry?.xp ?? 0,
      ...(entry?.completedAt ? { completedAt: entry.completedAt } : {}),
    }
  })

  const currentWeek: CurrentWeekXp = {
    start: currentStart,
    end: currentEnd,
    label: weekRangeLabel(currentStart),
    days,
    totalXp: days.reduce((sum, d) => sum + d.xp, 0),
  }

  const weekTotals = new Map<string, number>()
  for (const [date, entry] of byDate) {
    const start = weekStartKey(parseDateKey(date))
    if (start === currentStart) continue
    weekTotals.set(start, (weekTotals.get(start) ?? 0) + entry.xp)
  }

  const pastWeeks: PastWeekXp[] = [...weekTotals.entries()]
    .filter(([, totalXp]) => totalXp > 0)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([start, totalXp]) => ({
      start,
      end: weekEndKey(parseDateKey(start)),
      label: weekRangeLabel(start),
      totalXp,
    }))

  return { currentWeek, pastWeeks }
}

export function summarizeProgress(
  progress: ProgressMap,
  options?: { today?: string },
): ProgressSummary {
  const today = options?.today ?? todayKey()
  const daily: DailyProgressRow[] = []

  for (const [key, record] of Object.entries(progress)) {
    const parsed = parseDailyProgressKey(key)
    if (!parsed) continue
    daily.push({
      date: parsed.date,
      gradeId: parsed.gradeId,
      gradeTitle: getGrade(parsed.gradeId)?.title ?? parsed.gradeId,
      status: record.status,
      ...(record.bestScore !== undefined ? { bestScore: record.bestScore } : {}),
      ...(record.total !== undefined ? { total: record.total } : {}),
    })
  }

  daily.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.gradeTitle.localeCompare(b.gradeTitle)
  })

  const grades: GradeProgressGroup[] = curriculum.map((grade) => ({
    gradeId: grade.id,
    title: grade.title,
    subjects: grade.subjects.map((subject) => {
      const topics: TopicProgressRow[] = subject.topics.map((topic) => {
        const record = progress[topicKey(grade.id, subject.id, topic.id)]
        return {
          topicId: topic.id,
          title: topic.title,
          status: record?.status ?? "not-started",
          ...(record?.bestScore !== undefined ? { bestScore: record.bestScore } : {}),
          ...(record?.total !== undefined ? { total: record.total } : {}),
        }
      })
      return {
        subjectId: subject.id,
        title: subject.title,
        color: subject.color,
        completed: topics.filter((t) => t.status === "completed").length,
        total: topics.length,
        topics,
      }
    }),
  }))

  return {
    daily,
    today: daily.filter((row) => row.date === today),
    grades,
  }
}
