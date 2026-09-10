"use client"

import { ArrowLeft, CheckCircle2, Circle, PlayCircle } from "lucide-react"
import type { Subject } from "@/lib/curriculum"
import { getSubjectStyle } from "@/lib/subject-style"
import { SubjectIcon } from "@/components/subject-icon"
import type { TopicStatus, useProgress } from "@/hooks/use-progress"

interface SubjectScreenProps {
  gradeId: string
  subject: Subject
  onSelectTopic: (topicId: string) => void
  onBack: () => void
  progress: ReturnType<typeof useProgress>
}

const statusMeta: Record<
  TopicStatus,
  { label: string; icon: typeof Circle; className: string }
> = {
  "not-started": {
    label: "Not started",
    icon: Circle,
    className: "text-muted-foreground",
  },
  "in-progress": {
    label: "In progress",
    icon: PlayCircle,
    className: "text-primary",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "text-success",
  },
}

export function SubjectScreen({
  gradeId,
  subject,
  onSelectTopic,
  onBack,
  progress,
}: SubjectScreenProps) {
  const style = getSubjectStyle(subject.color)
  const total = subject.topics.length
  const done = progress.countCompleted(
    gradeId,
    subject.id,
    subject.topics.map((t) => t.id),
  )
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="pt-6" style={style.vars}>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </button>

      {/* Subject banner */}
      <div className={`overflow-hidden rounded-3xl ${style.soft} p-6 sm:p-8`}>
        <div className="flex items-center gap-4">
          <span
            className={`flex size-16 shrink-0 items-center justify-center rounded-2xl ${style.solid} shadow-sm`}
          >
            <SubjectIcon color={subject.color} className="size-8" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-foreground">
              {subject.title}
            </h1>
            <p className={`text-sm font-bold ${style.text}`}>
              {subject.title} — {done}/{total} topics completed
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-card/70"
            role="progressbar"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${done} of ${total} topics completed`}
          >
            <div
              className={`h-full rounded-full ${style.bar} transition-all duration-500`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Topic list */}
      <h2 className="mb-3 mt-8 font-display text-lg font-extrabold text-foreground">
        Choose a topic
      </h2>
      <ul className="grid gap-3">
        {subject.topics.map((topic, index) => {
          const status = progress.getStatus(gradeId, subject.id, topic.id)
          const meta = statusMeta[status]
          const StatusIcon = meta.icon
          const record = progress.getRecord(gradeId, subject.id, topic.id)
          return (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => onSelectTopic(topic.id)}
                className="group flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-border transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${style.soft} ${style.text} font-display text-lg font-extrabold`}
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold text-foreground">
                    {topic.title}
                  </span>
                  <span className={`flex items-center gap-1.5 text-sm font-semibold ${meta.className}`}>
                    <StatusIcon className="size-4" aria-hidden="true" />
                    {meta.label}
                    {status === "completed" && record?.bestScore != null && (
                      <span className="text-muted-foreground">
                        · best {record.bestScore}/{record.total}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
