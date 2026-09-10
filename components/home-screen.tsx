"use client"

import { ArrowRight, Sparkles, Trophy } from "lucide-react"
import { curriculum, getGrade } from "@/lib/curriculum"
import { getSubjectStyle } from "@/lib/subject-style"
import { SubjectIcon } from "@/components/subject-icon"
import type { useProgress } from "@/hooks/use-progress"

interface HomeScreenProps {
  gradeId: string
  onSelectGrade: (gradeId: string) => void
  onSelectSubject: (subjectId: string) => void
  onSelectDaily: () => void
  progress: ReturnType<typeof useProgress>
}

export function HomeScreen({
  gradeId,
  onSelectGrade,
  onSelectSubject,
  onSelectDaily,
  progress,
}: HomeScreenProps) {
  const grade = getGrade(gradeId)
  const daily = progress.getDailyRecord(gradeId)

  return (
    <div className="pt-8 sm:pt-12">
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
          Let&apos;s learn something fun
        </span>
        <h1 className="mt-4 text-balance font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          What do you want to learn?
        </h1>
        <p className="mt-3 max-w-md text-pretty text-base text-muted-foreground sm:text-lg">
          Pick your grade, choose a subject, and start playing your way through lessons and quizzes.
        </p>
      </div>

      {/* Grade selection */}
      <div className="mt-10">
        <h2 className="mb-3 text-center font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Choose your grade
        </h2>
        <div className="mx-auto flex max-w-md flex-wrap justify-center gap-3">
          {curriculum.map((g) => {
            const active = g.id === gradeId
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => onSelectGrade(g.id)}
                aria-pressed={active}
                className={[
                  "rounded-2xl px-6 py-3 font-display text-lg font-extrabold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "scale-105 bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-card text-foreground shadow-sm ring-1 ring-border hover:scale-105 hover:ring-primary/40",
                ].join(" ")}
              >
                {g.title}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-10">
        <button
          type="button"
          onClick={onSelectDaily}
          className="group relative mx-auto flex w-full max-w-2xl items-center gap-4 overflow-hidden rounded-3xl bg-primary p-5 text-left text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
        >
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Trophy className="size-7" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-2xl font-extrabold">Daily challenge</span>
            <span className="mt-1 block text-sm font-semibold text-primary-foreground/85">
              {daily?.status === "completed" && daily.bestScore !== undefined && daily.total !== undefined
                ? `Done today — ${daily.bestScore}/${daily.total} XP`
                : daily?.status === "in-progress"
                  ? "You started today's mix. Finish it!"
                  : "20 mixed questions. Same for everyone today."}
            </span>
          </span>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="size-5" aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* Subject cards */}
      <div className="mt-12">
        <h2 className="mb-4 text-center font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {grade?.title} subjects
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {grade?.subjects.map((subject) => {
            const style = getSubjectStyle(subject.color)
            const total = subject.topics.length
            const done = progress.countCompleted(
              gradeId,
              subject.id,
              subject.topics.map((t) => t.id),
            )
            return (
              <button
                key={subject.id}
                type="button"
                onClick={() => onSelectSubject(subject.id)}
                style={style.vars}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-card p-6 text-left shadow-sm ring-1 ring-border transition-all hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={`mb-4 flex size-16 items-center justify-center rounded-2xl ${style.solid} shadow-sm transition-transform group-hover:scale-110`}
                >
                  <SubjectIcon color={subject.color} className="size-8" />
                </span>
                <h3 className="font-display text-2xl font-extrabold text-foreground">
                  {subject.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{style.tagline}</p>

                <div className="mt-5 flex items-center justify-between">
                  <span className={`text-sm font-bold ${style.text}`}>
                    {done}/{total} done
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
