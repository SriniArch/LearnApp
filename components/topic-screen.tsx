"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, BookOpen, Lightbulb, Sparkles } from "lucide-react"
import type { Question, Subject, Topic } from "@/lib/curriculum"
import { buildTopicQuiz } from "@/lib/quiz"
import { getSubjectStyle } from "@/lib/subject-style"
import { SubjectIcon } from "@/components/subject-icon"
import { QuizView, ResultView } from "@/components/quiz-play"
import type { useProgress } from "@/hooks/use-progress"

type Phase = "lesson" | "quiz" | "result"

interface TopicScreenProps {
  gradeId: string
  subject: Subject
  topic: Topic
  hasNextTopic: boolean
  onBack: () => void
  onNextTopic: () => void
  progress: ReturnType<typeof useProgress>
}

export function TopicScreen({
  gradeId,
  subject,
  topic,
  hasNextTopic,
  onBack,
  onNextTopic,
  progress,
}: TopicScreenProps) {
  const style = getSubjectStyle(subject.color)
  const [phase, setPhase] = useState<Phase>("lesson")
  const [quizQuestions, setQuizQuestions] = useState<Question[]>(topic.questions)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)

  const total = quizQuestions.length
  const question = quizQuestions[index]

  useEffect(() => {
    // Scroll to top when the topic changes.
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  function startQuiz() {
    setQuizQuestions(buildTopicQuiz(gradeId, subject.id, topic.id, topic.questions))
    progress.markInProgress(gradeId, subject.id, topic.id)
    setPhase("quiz")
    setIndex(0)
    setScore(0)
    setAnswered(false)
    setWasCorrect(false)
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
      progress.markCompleted(gradeId, subject.id, topic.id, score, total)
      setPhase("result")
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  function tryAgain() {
    startQuiz()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="pt-6" style={style.vars}>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to {subject.title}
      </button>

      {/* Topic heading */}
      <div className="mb-6 flex items-center gap-3">
        <span className={`flex size-12 items-center justify-center rounded-2xl ${style.solid} shadow-sm`}>
          <SubjectIcon color={subject.color} className="size-6" />
        </span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${style.text}`}>
            {subject.title}
          </p>
          <h1 className="font-display text-3xl font-extrabold text-foreground">{topic.title}</h1>
        </div>
      </div>

      {phase === "lesson" && (
        <LessonView topic={topic} colorText={style.text} soft={style.soft} onStart={startQuiz} />
      )}

      {phase === "quiz" && (
        <QuizView
          question={question}
          index={index}
          total={total}
          answered={answered}
          wasCorrect={wasCorrect}
          barClass={style.bar}
          onAnswer={handleAnswer}
          onNext={nextQuestion}
          isLast={index + 1 === total}
        />
      )}

      {phase === "result" && (
        <ResultView
          score={score}
          total={total}
          soft={style.soft}
          colorText={style.text}
          onTryAgain={tryAgain}
          primaryLabel={hasNextTopic ? "Next Topic" : "Back to topics"}
          onPrimary={hasNextTopic ? onNextTopic : onBack}
        />
      )}
    </div>
  )
}

/* -------------------------------- Lesson -------------------------------- */

function LessonView({
  topic,
  colorText,
  soft,
  onStart,
}: {
  topic: Topic
  colorText: string
  soft: string
  onStart: () => void
}) {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border sm:p-8">
      <div className="flex items-center gap-2">
        <BookOpen className={`size-5 ${colorText}`} aria-hidden="true" />
        <h2 className="font-display text-xl font-extrabold text-foreground">Let&apos;s learn</h2>
      </div>

      <ul className="mt-4 space-y-3">
        {topic.lesson.concept.map((point, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${soft} ${colorText} text-sm font-extrabold`}
            >
              {i + 1}
            </span>
            <span className="text-pretty text-lg leading-relaxed text-foreground">{point}</span>
          </li>
        ))}
      </ul>

      <div className={`mt-6 flex items-start gap-3 rounded-2xl ${soft} p-4`}>
        <Lightbulb className={`mt-0.5 size-5 shrink-0 ${colorText}`} aria-hidden="true" />
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${colorText}`}>Example</p>
          <p className="mt-1 text-pretty text-lg leading-relaxed text-foreground">
            {topic.lesson.example}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 font-display text-lg font-extrabold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
      >
        <Sparkles className="size-5" aria-hidden="true" />
        Start the quiz
      </button>
    </div>
  )
}
