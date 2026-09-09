"use client"

import { displayBuddyCode } from "@/lib/buddy-code"
import type { FamilyAccountErr, FamilyAccountOk } from "@/lib/family-progress"
import {
  summarizeWeeklyDailyXp,
  type WeeklyDayXp,
} from "@/lib/progress-summary"
import { parseDateKey } from "@/lib/week"

function formatUpdatedAt(iso?: string) {
  if (!iso) return null
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function formatDayDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatCompletedAt(iso?: string) {
  if (!iso) return null
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

function DayRow({ day }: { day: WeeklyDayXp }) {
  const time = formatCompletedAt(day.completedAt)
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div>
        <p className="font-display text-base font-extrabold text-foreground">{day.weekday}</p>
        <p className="text-sm text-muted-foreground">
          {formatDayDate(day.date)}
          {time ? ` · ${time}` : ""}
        </p>
      </div>
      <p className="tabular-nums text-base font-extrabold text-foreground">
        {day.xp > 0 ? `${day.xp} XP` : "—"}
      </p>
    </li>
  )
}

export function ChildProgressCard({
  result,
}: {
  result: FamilyAccountOk | FamilyAccountErr
}) {
  if (!result.ok) {
    return (
      <section
        id={result.code}
        className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-6"
      >
        <h2 className="font-display text-xl font-extrabold text-foreground">
          {displayBuddyCode(result.code)}
        </h2>
        <p className="mt-2 text-sm font-semibold text-destructive" role="alert">
          {result.error}
        </p>
      </section>
    )
  }

  const { currentWeek, pastWeeks } = summarizeWeeklyDailyXp(result.progress)
  const updated = formatUpdatedAt(result.updatedAt)
  const heading = result.name || displayBuddyCode(result.code)

  return (
    <section
      id={result.code}
      className="space-y-6 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-6"
    >
      <header>
        <h2 className="font-display text-2xl font-extrabold text-foreground">{heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Code {displayBuddyCode(result.code)}
          {updated ? ` · Last saved ${updated}` : ""}
        </p>
      </header>

      <div>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-lg font-extrabold text-foreground">This week</h3>
          <p className="text-sm font-semibold text-muted-foreground">{currentWeek.label}</p>
        </div>
        <p className="mb-2 text-sm text-muted-foreground">
          Daily challenge XP (Sunday–Saturday). First finish of the day locks the score.
        </p>
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-background/60 ring-1 ring-border">
          {currentWeek.days.map((day) => (
            <DayRow key={day.date} day={day} />
          ))}
        </ul>
        <p className="mt-3 font-display text-xl font-extrabold text-foreground">
          Week total: {currentWeek.totalXp} XP
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-display text-lg font-extrabold text-foreground">Past weeks</h3>
        {pastWeeks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No earlier weekly totals yet.</p>
        ) : (
          <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-background/60 ring-1 ring-border">
            {pastWeeks.map((week) => (
              <li
                key={week.start}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <p className="font-display text-base font-extrabold text-foreground">
                  {week.label}
                </p>
                <p className="tabular-nums text-base font-extrabold text-foreground">
                  {week.totalXp} XP
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
