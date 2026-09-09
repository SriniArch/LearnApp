"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Sparkles, Trophy } from "lucide-react"
import type { Question } from "@/lib/curriculum"
import { getGrade } from "@/lib/curriculum"
import { buildDailyQuiz } from "@/lib/quiz"
import { QuizView, ResultView } from "@/components/quiz-play"
import type { useProgress } from "@/hooks/use-progress"

type Phase = "intro" | "quiz" | "result"

interface DailyChallengeScreenProps {
  gradeId: string
  onBack: () => void
  progress: ReturnType<typeof useProgress>
}

export function DailyChallengeScreen({ gradeId, onBack, progress }: DailyChallengeScreenProps) {
  const grade = getGrade(gradeId)
  const [phase, setPhase] = useState<Phase>("intro")
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    [],
  )

  const record = progress.getDailyRecord(gradeId)
  const total = quizQuestions.length
  const question = quizQuestions[index]

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  function startQuiz() {
    const questions = buildDailyQuiz(gradeId)
    setQuizQuestions(questions)
    progress.markDailyInProgress(gradeId)
    setPhase("quiz")
    setIndex(0)
    setScore(0)
    setAnswered(false)
    setWasCorrect(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleAnswer(correct: boolean) {
    setAnswered(true)
    setWasCorrect(correct)
    if (correct) setScore((s) => s + 1)
  }

  function nextQuestion() {
    if (index + 1 < total) {
      setIndex((i) => i + 1)
      setAnswered(false)
      setWasCorrect(false)
    } else {
      progress.markDailyCompleted(gradeId, score, total)
      setPhase("result")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <div className="pt-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back home
      </button>

      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Trophy className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">{grade?.title}</p>
          <h1 className="font-display text-3xl font-extrabold text-foreground">Daily challenge</h1>
        </div>
      </div>

      {phase === "intro" && (
        <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{dateLabel}</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground">
            A mixed quiz for today
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Twenty questions from {grade?.title ?? "your grade"} Math, Science, and Geography. Everyone
            gets the same set today — it changes tomorrow.
          </p>

          {record?.status === "completed" && record.bestScore !== undefined && record.total !== undefined && (
            <p className="mt-4 font-display text-lg font-extrabold text-primary">
              Best today: {record.bestScore} / {record.total}
            </p>
          )}

          <button
            type="button"
            onClick={startQuiz}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
          >
            <Sparkles className="size-5" aria-hidden="true" />
            {record?.status === "completed" ? "Play again" : "Start today's challenge"}
          </button>
        </div>
      )}

      {phase === "quiz" && question && (
        <QuizView
          question={question}
          index={index}
          total={total}
          answered={answered}
          wasCorrect={wasCorrect}
          barClass="bg-primary"
          onAnswer={handleAnswer}
          onNext={nextQuestion}
          isLast={index + 1 === total}
        />
      )}

      {phase === "result" && (
        <ResultView
          score={score}
          total={total}
          soft="bg-secondary"
          colorText="text-primary"
          onTryAgain={startQuiz}
          primaryLabel="Back home"
          onPrimary={onBack}
        />
      )}
    </div>
  )
}
