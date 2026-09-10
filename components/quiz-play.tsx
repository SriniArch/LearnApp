"use client"

import { useState } from "react"
import { ArrowRight, Check, RotateCcw, X } from "lucide-react"
import type { Question } from "@/lib/curriculum"

export function QuizView({
  question,
  index,
  total,
  answered,
  wasCorrect,
  barClass,
  onAnswer,
  onNext,
  isLast,
}: {
  question: Question
  index: number
  total: number
  answered: boolean
  wasCorrect: boolean
  barClass: string
  onAnswer: (correct: boolean) => void
  onNext: () => void
  isLast: boolean
}) {
  const pct = Math.round(((index + (answered ? 1 : 0)) / total) * 100)

  return (
    <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border sm:p-8">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-muted-foreground">
          <span>
            Question {index + 1} of {total}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${barClass} transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <h2 className="text-balance font-display text-2xl font-extrabold leading-snug text-foreground">
        {question.prompt}
      </h2>

      <div className="mt-6">
        <AnswerArea key={question.id} question={question} answered={answered} onAnswer={onAnswer} />
      </div>

      {answered && (
        <div
          className={[
            "mt-6 flex items-start gap-3 rounded-2xl p-4",
            wasCorrect ? "bg-success/10 text-foreground" : "bg-destructive/10 text-foreground",
          ].join(" ")}
          role="status"
        >
          <span
            className={[
              "flex size-8 shrink-0 items-center justify-center rounded-full",
              wasCorrect
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground",
            ].join(" ")}
          >
            {wasCorrect ? (
              <Check className="size-5" aria-hidden="true" />
            ) : (
              <X className="size-5" aria-hidden="true" />
            )}
          </span>
          <div>
            <p className="font-display text-lg font-extrabold">
              {wasCorrect ? "Correct! Nice work." : "Not quite."}
            </p>
            <p className="mt-0.5 text-pretty leading-relaxed text-muted-foreground">
              {question.explanation}
            </p>
          </div>
        </div>
      )}

      {answered && (
        <button
          type="button"
          onClick={onNext}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
        >
          {isLast ? "See my score" : "Next question"}
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function AnswerArea({
  question,
  answered,
  onAnswer,
}: {
  question: Question
  answered: boolean
  onAnswer: (correct: boolean) => void
}) {
  const [picked, setPicked] = useState<number | boolean | null>(null)
  const [numberValue, setNumberValue] = useState("")

  if (question.type === "mcq" || question.type === "boolean") {
    const options: { label: string; value: number | boolean; correct: boolean }[] =
      question.type === "mcq"
        ? question.options.map((label, i) => ({
            label,
            value: i,
            correct: i === question.answerIndex,
          }))
        : [
            { label: "True", value: true, correct: question.answer === true },
            { label: "False", value: false, correct: question.answer === false },
          ]

    return (
      <div className={question.type === "boolean" ? "grid grid-cols-2 gap-3" : "grid gap-3"}>
        {options.map((opt) => {
          const isPicked = picked === opt.value
          const showCorrect = answered && opt.correct
          const showWrongPick = answered && isPicked && !opt.correct

          return (
            <button
              key={String(opt.value)}
              type="button"
              disabled={answered}
              onClick={() => {
                if (answered) return
                setPicked(opt.value)
                onAnswer(opt.correct)
              }}
              aria-pressed={isPicked}
              className={[
                "flex items-center justify-between gap-3 rounded-2xl border-2 px-5 py-4 text-left font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "text-lg text-foreground",
                showCorrect
                  ? "border-success bg-success/10"
                  : showWrongPick
                    ? "border-destructive bg-destructive/10"
                    : answered
                      ? "border-border opacity-60"
                      : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md",
              ].join(" ")}
            >
              <span>{opt.label}</span>
              {showCorrect && <Check className="size-5 text-success" aria-hidden="true" />}
              {showWrongPick && <X className="size-5 text-destructive" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    )
  }

  const correctAnswer = question.answer
  const isNegative = numberValue.startsWith("-")
  const parsedAnswer = Number(numberValue)
  const canSubmit = numberValue.trim() !== "" && Number.isFinite(parsedAnswer)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (answered || !canSubmit) return
        onAnswer(parsedAnswer === correctAnswer)
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={numberValue}
          disabled={answered}
          onChange={(e) => setNumberValue(sanitizeNumericInput(e.target.value))}
          placeholder="Type your answer"
          aria-label="Your numeric answer"
          className="min-w-0 flex-1 rounded-2xl border-2 border-border bg-background px-5 py-4 text-lg font-bold text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground focus:border-primary disabled:opacity-70"
        />
        <button
          type="button"
          disabled={answered}
          onClick={() => setNumberValue((value) => toggleNumericSign(value))}
          aria-label="Toggle negative sign"
          aria-pressed={isNegative}
          className={[
            "shrink-0 rounded-2xl border-2 px-5 py-4 font-display text-lg font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            isNegative
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-background text-foreground hover:border-primary/50",
          ].join(" ")}
        >
          −
        </button>
      </div>
      <button
        type="submit"
        disabled={answered || !canSubmit}
        className="w-full rounded-2xl bg-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-md transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Check
      </button>
    </form>
  )
}

function sanitizeNumericInput(raw: string): string {
  let negative = false
  let body = ""
  let seenDot = false

  for (const ch of raw) {
    if (ch === "-" && body === "" && !negative) {
      negative = true
      continue
    }
    if (ch >= "0" && ch <= "9") {
      body += ch
      continue
    }
    if (ch === "." && !seenDot) {
      seenDot = true
      body += ch
    }
  }

  return `${negative ? "-" : ""}${body}`
}

function toggleNumericSign(value: string): string {
  if (value.startsWith("-")) return value.slice(1)
  return `-${value}`
}

export function ResultView({
  score,
  total,
  soft,
  colorText,
  onTryAgain,
  primaryLabel,
  onPrimary,
}: {
  score: number
  total: number
  soft: string
  colorText: string
  onTryAgain: () => void
  primaryLabel: string
  onPrimary: () => void
}) {
  const pct = total > 0 ? score / total : 0
  const message =
    pct === 1
      ? "Perfect score! You're a star!"
      : pct >= 0.6
        ? "Great job! Keep it up!"
        : "Good try! Practice makes perfect."

  return (
    <div className={`rounded-3xl ${soft} p-8 text-center shadow-sm`}>
      <p className="font-display text-2xl font-extrabold text-foreground">Your Score</p>
      <p className={`mt-2 font-display text-6xl font-extrabold ${colorText}`}>
        {score} / {total}
      </p>
      <p className="mt-3 text-pretty text-lg font-semibold text-foreground">{message}</p>

      <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={["size-3 rounded-full", i < score ? "bg-success" : "bg-card/70"].join(" ")}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onTryAgain}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-card px-6 py-4 font-display text-lg font-extrabold text-foreground shadow-sm ring-1 ring-border transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
          Try Again
        </button>

        <button
          type="button"
          onClick={onPrimary}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {primaryLabel}
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
