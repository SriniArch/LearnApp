import { getExtraQuestions, getGrade, type Question } from "./curriculum"

// ----------------------------------------------------------------------------
// Randomization helpers used by quizzes and the daily challenge.
// ----------------------------------------------------------------------------

// Fisher-Yates shuffle. Accepts an optional RNG so results can be made
// deterministic (used by the daily challenge).
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shuffle the options of a multiple-choice question while keeping the
// correct answer pointing at the right option. Other question types are
// returned unchanged.
export function randomizeQuestion(q: Question, rng: () => number = Math.random): Question {
  if (q.type !== "mcq") return q
  const order = shuffle(
    q.options.map((_, i) => i),
    rng,
  )
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answerIndex: order.indexOf(q.answerIndex),
  }
}

// Ensure IDs are unique within one generated quiz.
// Keeps original id when possible; otherwise appends/increments __N.
function ensureUniqueQuestionIds(questions: readonly Question[]): Question[] {
  const used = new Set<string>()
  const counts = new Map<string, number>()

  return questions.map((q) => {
    const base = q.id
    let n = (counts.get(base) ?? 0) + 1
    counts.set(base, n)

    let candidate = n === 1 ? base : `${base}__${n}`
    while (used.has(candidate)) {
      n += 1
      counts.set(base, n)
      candidate = `${base}__${n}`
    }

    used.add(candidate)
    if (candidate === q.id) return q
    return { ...q, id: candidate }
  })
}

// Build a quiz by shuffling a pool, taking `size` questions, and shuffling
// the options within each one.
export function buildQuiz(
  pool: readonly Question[],
  size: number,
  rng: () => number = Math.random,
): Question[] {
  const selected = shuffle(pool, rng)
    .slice(0, size)
    .map((q) => randomizeQuestion(q, rng))

  return ensureUniqueQuestionIds(selected)
}

// Small, fast seeded RNG (mulberry32) so the daily challenge is the same for
// everyone on a given day but changes each day.
export function seededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A stable key + numeric seed for "today" in the user's local time.
export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function dailySeed(date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

export function dailyProgressKey(gradeId: string, date = new Date()): string {
  return `daily:${gradeId}:${todayKey(date)}`
}

const DAILY_KEY_PATTERN = /^daily:(.+):(\d{4}-\d{2}-\d{2})$/

export function parseDailyProgressKey(
  key: string,
): { gradeId: string; date: string } | null {
  const match = DAILY_KEY_PATTERN.exec(key)
  if (!match) return null
  const gradeId = match[1]
  const date = match[2]
  if (!gradeId || !isCalendarDate(date)) return null
  return { gradeId, date }
}

function isCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return false
  const dt = new Date(year, month - 1, day)
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  )
}

function sourceQuestion(q: Question, subjectId: string, topicId: string): Question {
  return { ...q, id: `${subjectId}-${topicId}-${q.id}` }
}

function saltFromString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Mix questions from every topic in the grade. Seeded so the same grade
// sees the same 20 questions on a given local calendar day.
export function buildDailyQuiz(gradeId: string, size = 20, date = new Date()): Question[] {
  const grade = getGrade(gradeId)
  if (!grade) return []

  const rng = seededRng(dailySeed(date) ^ saltFromString(gradeId))
  const topicPools: Question[][] = []

  for (const subject of grade.subjects) {
    for (const topic of subject.topics) {
      const pool = [
        ...topic.questions.map((q) => sourceQuestion(q, subject.id, topic.id)),
        ...getExtraQuestions(gradeId, subject.id, topic.id).map((q) =>
          sourceQuestion(q, subject.id, topic.id),
        ),
      ]
      if (pool.length > 0) topicPools.push(shuffle(pool, rng))
    }
  }

  const orderedPools = shuffle(topicPools, rng)
  const selected: Question[] = []
  let round = 0
  while (selected.length < size) {
    let added = false
    for (const pool of orderedPools) {
      const next = pool[round]
      if (!next) continue
      selected.push(next)
      added = true
      if (selected.length === size) break
    }
    if (!added) break
    round += 1
  }

  return ensureUniqueQuestionIds(selected.map((q) => randomizeQuestion(q, rng)))
}

export function buildTopicQuiz(
  gradeId: string,
  subjectId: string,
  topicId: string,
  baseQuestions: readonly Question[],
  size = 10,
  rng: () => number = Math.random,
): Question[] {
  const pool = [...baseQuestions, ...getExtraQuestions(gradeId, subjectId, topicId)]
  return buildQuiz(pool, Math.min(size, pool.length), rng)
}
