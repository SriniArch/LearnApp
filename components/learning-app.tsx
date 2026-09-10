"use client"

import { useState } from "react"
import { curriculum, getSubject, getTopic } from "@/lib/curriculum"
import { useProgress } from "@/hooks/use-progress"
import { HomeScreen } from "@/components/home-screen"
import { SubjectScreen } from "@/components/subject-screen"
import { TopicScreen } from "@/components/topic-screen"
import { DailyChallengeScreen } from "@/components/daily-challenge-screen"
import { AppHeader } from "@/components/app-header"
import { BuddyAccountDialog } from "@/components/buddy-account"

type View = "home" | "subject" | "topic" | "daily"

export function LearningApp() {
  const progress = useProgress()

  const [view, setView] = useState<View>("home")
  const [gradeId, setGradeId] = useState<string>(curriculum[0].id)
  const [subjectId, setSubjectId] = useState<string | null>(null)
  const [topicId, setTopicId] = useState<string | null>(null)
  const [accountOpen, setAccountOpen] = useState(false)

  const subject = subjectId ? getSubject(gradeId, subjectId) : undefined
  const topic = subjectId && topicId ? getTopic(gradeId, subjectId, topicId) : undefined

  function openSubject(nextSubjectId: string) {
    setSubjectId(nextSubjectId)
    setView("subject")
  }

  function openTopic(nextTopicId: string) {
    setTopicId(nextTopicId)
    setView("topic")
  }

  function goHome() {
    setView("home")
    setSubjectId(null)
    setTopicId(null)
  }

  function openDaily() {
    setSubjectId(null)
    setTopicId(null)
    setView("daily")
  }

  function goToSubject() {
    setView("subject")
    setTopicId(null)
  }

  function goToNextTopic() {
    if (!subject || !topicId) {
      goToSubject()
      return
    }
    const index = subject.topics.findIndex((t) => t.id === topicId)
    const next = subject.topics[index + 1]
    if (next) {
      setTopicId(next.id)
      setView("topic")
      // Scroll handled by key change in TopicScreen.
    } else {
      goToSubject()
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader
        view={view}
        gradeId={gradeId}
        subjectTitle={subject?.title}
        topicTitle={topic?.title}
        buddyLabel={progress.displayBuddyCode || "Save progress"}
        onOpenAccount={() => setAccountOpen(true)}
        onHome={goHome}
        onBackToSubject={goToSubject}
      />

      <BuddyAccountDialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        progress={progress}
      />

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
        {view === "home" && (
          <HomeScreen
            gradeId={gradeId}
            onSelectGrade={setGradeId}
            onSelectSubject={openSubject}
            onSelectDaily={openDaily}
            progress={progress}
          />
        )}

        {view === "subject" && subject && (
          <SubjectScreen
            gradeId={gradeId}
            subject={subject}
            onSelectTopic={openTopic}
            onBack={goHome}
            progress={progress}
          />
        )}

        {view === "daily" && (
          <DailyChallengeScreen
            key={gradeId}
            gradeId={gradeId}
            onBack={goHome}
            progress={progress}
          />
        )}

        {view === "topic" && subject && topic && (
          <TopicScreen
            key={`${gradeId}-${subject.id}-${topic.id}`}
            gradeId={gradeId}
            subject={subject}
            topic={topic}
            hasNextTopic={
              subject.topics.findIndex((t) => t.id === topic.id) < subject.topics.length - 1
            }
            onBack={goToSubject}
            onNextTopic={goToNextTopic}
            progress={progress}
          />
        )}
      </main>
    </div>
  )
}
