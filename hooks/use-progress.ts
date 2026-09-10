"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  BUDDY_ACCOUNT_KEY,
  displayBuddyCode,
  isBuddyCode,
  normalizeBuddyCode,
  reservedCodeHint,
} from "@/lib/buddy-code"
import { dailyProgressKey } from "@/lib/quiz"
import {
  mergeProgress,
  progressEqual,
  type ProgressMap,
  type ProgressRecord,
  type TopicStatus,
} from "@/lib/progress-data"

export type { TopicStatus, ProgressRecord }

const STORAGE_KEY = "kids-learning-progress-v1"
const ACCOUNT_KEY = BUDDY_ACCOUNT_KEY

interface StoredAccount {
  code: string
  name: string
}

function readProgress(): ProgressMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ProgressMap) : {}
  } catch {
    return {}
  }
}

function readAccount(): StoredAccount | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAccount
    if (!parsed?.code || !isBuddyCode(parsed.code)) return null
    return { code: parsed.code, name: parsed.name ?? "" }
  } catch {
    return null
  }
}

function keyFor(gradeId: string, subjectId: string, topicId: string) {
  return `${gradeId}:${subjectId}:${topicId}`
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({})
  const [account, setAccount] = useState<StoredAccount | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const progressRef = useRef<ProgressMap>({})
  const accountRef = useRef<StoredAccount | null>(null)
  const saveTimer = useRef<number | null>(null)

  progressRef.current = progress
  accountRef.current = account

  const persistLocal = useCallback((next: ProgressMap) => {
    setProgress(next)
    progressRef.current = next
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore write errors (e.g. private mode)
    }
  }, [])

  const persistAccount = useCallback((next: StoredAccount | null) => {
    setAccount(next)
    accountRef.current = next
    try {
      if (next) window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next))
      else window.localStorage.removeItem(ACCOUNT_KEY)
    } catch {
      // ignore
    }
  }, [])

  const pushRemote = useCallback(async (nextProgress: ProgressMap, nextAccount: StoredAccount) => {
    const res = await fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: nextAccount.code,
        name: nextAccount.name,
        progress: nextProgress,
      }),
    })
    const data = (await res.json()) as {
      progress?: ProgressMap
      name?: string
      error?: string
    }
    if (!res.ok) throw new Error(data.error ?? "Could not save to your buddy code.")
    return data
  }, [])

  const scheduleRemoteSave = useCallback(
    (next: ProgressMap) => {
      const currentAccount = accountRef.current
      if (!currentAccount) return
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        setSyncing(true)
        void pushRemote(next, currentAccount)
          .then((data) => {
            setSyncError(null)
            if (data.progress && !progressEqual(data.progress, progressRef.current)) {
              persistLocal(mergeProgress(progressRef.current, data.progress))
            }
            if (data.name !== undefined && data.name !== accountRef.current?.name && accountRef.current) {
              persistAccount({ ...accountRef.current, name: data.name })
            }
          })
          .catch((err: unknown) => {
            setSyncError(err instanceof Error ? err.message : "Could not save to your buddy code.")
          })
          .finally(() => setSyncing(false))
      }, 450)
    },
    [persistAccount, persistLocal, pushRemote],
  )

  const persist = useCallback(
    (next: ProgressMap) => {
      persistLocal(next)
      scheduleRemoteSave(next)
    },
    [persistLocal, scheduleRemoteSave],
  )

  useEffect(() => {
    const localProgress = readProgress()
    const localAccount = readAccount()
    persistLocal(localProgress)
    persistAccount(localAccount)
    setLoaded(true)

    if (!localAccount) return

    setSyncing(true)
    void fetch(`/api/progress?code=${encodeURIComponent(localAccount.code)}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          progress?: ProgressMap
          name?: string
          error?: string
        }
        if (!res.ok) throw new Error(data.error ?? "Could not load your buddy code.")
        const merged = mergeProgress(localProgress, data.progress ?? {})
        persistLocal(merged)
        if (data.name) persistAccount({ code: localAccount.code, name: data.name })
        if (!progressEqual(merged, data.progress ?? {})) {
          await pushRemote(merged, { code: localAccount.code, name: data.name ?? localAccount.name })
        }
        setSyncError(null)
      })
      .catch((err: unknown) => {
        setSyncError(err instanceof Error ? err.message : "Could not load your buddy code.")
      })
      .finally(() => setSyncing(false))
  }, [persistAccount, persistLocal, pushRemote])

  const getStatus = useCallback(
    (gradeId: string, subjectId: string, topicId: string): TopicStatus => {
      return progress[keyFor(gradeId, subjectId, topicId)]?.status ?? "not-started"
    },
    [progress],
  )

  const getRecord = useCallback(
    (gradeId: string, subjectId: string, topicId: string): ProgressRecord | undefined => {
      return progress[keyFor(gradeId, subjectId, topicId)]
    },
    [progress],
  )

  const markInProgress = useCallback(
    (gradeId: string, subjectId: string, topicId: string) => {
      const k = keyFor(gradeId, subjectId, topicId)
      if (progress[k]?.status === "completed") return
      persist({ ...progress, [k]: { ...progress[k], status: "in-progress" } })
    },
    [progress, persist],
  )

  const markCompleted = useCallback(
    (gradeId: string, subjectId: string, topicId: string, score: number, total: number) => {
      const k = keyFor(gradeId, subjectId, topicId)
      const prevBest = progress[k]?.bestScore ?? 0
      persist({
        ...progress,
        [k]: {
          status: "completed",
          bestScore: Math.max(prevBest, score),
          total,
        },
      })
    },
    [progress, persist],
  )

  const getDailyRecord = useCallback(
    (gradeId: string): ProgressRecord | undefined => {
      return progress[dailyProgressKey(gradeId)]
    },
    [progress],
  )

  const markDailyInProgress = useCallback(
    (gradeId: string) => {
      const k = dailyProgressKey(gradeId)
      if (progress[k]?.status === "completed") return
      persist({ ...progress, [k]: { ...progress[k], status: "in-progress" } })
    },
    [progress, persist],
  )

  const markDailyCompleted = useCallback(
    (gradeId: string, score: number, total: number) => {
      const k = dailyProgressKey(gradeId)
      // First completed attempt locks the day's XP; retries do not update.
      if (progress[k]?.status === "completed") return
      persist({
        ...progress,
        [k]: {
          status: "completed",
          bestScore: score,
          total,
          completedAt: new Date().toISOString(),
        },
      })
    },
    [progress, persist],
  )

  const countCompleted = useCallback(
    (gradeId: string, subjectId: string, topicIds: string[]): number => {
      return topicIds.filter(
        (topicId) => progress[keyFor(gradeId, subjectId, topicId)]?.status === "completed",
      ).length
    },
    [progress],
  )

  const createBuddyCode = useCallback(
    async (name: string) => {
      setSyncing(true)
      setSyncError(null)
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, progress: progressRef.current }),
        })
        const data = (await res.json()) as {
          code?: string
          name?: string
          progress?: ProgressMap
          error?: string
        }
        if (!res.ok || !data.code) throw new Error(data.error ?? "Could not make a buddy code.")
        persistAccount({ code: data.code, name: data.name ?? name })
        if (data.progress) persistLocal(data.progress)
        return { code: data.code, displayCode: displayBuddyCode(data.code) }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Could not make a buddy code."
        setSyncError(message)
        throw new Error(message)
      } finally {
        setSyncing(false)
      }
    },
    [persistAccount, persistLocal],
  )

  const joinBuddyCode = useCallback(
    async (rawCode: string) => {
      const code = normalizeBuddyCode(rawCode)
      if (!isBuddyCode(code)) {
        throw new Error(reservedCodeHint())
      }
      setSyncing(true)
      setSyncError(null)
      try {
        const res = await fetch(`/api/progress?code=${encodeURIComponent(code)}`)
        const data = (await res.json()) as {
          progress?: ProgressMap
          name?: string
          error?: string
        }
        if (!res.ok) throw new Error(data.error ?? "We could not find that buddy code.")
        const merged = mergeProgress(progressRef.current, data.progress ?? {})
        persistLocal(merged)
        persistAccount({ code, name: data.name ?? "" })
        await pushRemote(merged, { code, name: data.name ?? "" })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "We could not find that buddy code."
        setSyncError(message)
        throw new Error(message)
      } finally {
        setSyncing(false)
      }
    },
    [persistAccount, persistLocal, pushRemote],
  )

  const forgetBuddyCode = useCallback(() => {
    persistAccount(null)
    setSyncError(null)
  }, [persistAccount])

  return {
    loaded,
    syncing,
    syncError,
    buddyCode: account?.code ?? null,
    displayBuddyCode: account ? displayBuddyCode(account.code) : null,
    displayName: account?.name ?? "",
    getStatus,
    getRecord,
    getDailyRecord,
    markInProgress,
    markCompleted,
    markDailyInProgress,
    markDailyCompleted,
    countCompleted,
    createBuddyCode,
    joinBuddyCode,
    forgetBuddyCode,
  }
}
