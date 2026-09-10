"use client"

import Link from "next/link"
import { ChevronRight, GraduationCap, Home, KeyRound, Users } from "lucide-react"
import { getGrade } from "@/lib/curriculum"

interface AppHeaderProps {
  view: "home" | "subject" | "topic" | "daily"
  gradeId: string
  subjectTitle?: string
  topicTitle?: string
  buddyLabel: string
  onOpenAccount: () => void
  onHome: () => void
  onBackToSubject: () => void
}

export function AppHeader({
  view,
  gradeId,
  subjectTitle,
  topicTitle,
  buddyLabel,
  onOpenAccount,
  onHome,
  onBackToSubject,
}: AppHeaderProps) {
  const gradeTitle = getGrade(gradeId)?.title ?? ""

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Learn Buddy
          </span>
        </button>
        <Link
          href="/family"
          className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
        >
          <Users className="size-4" aria-hidden="true" />
          View Progress
        </Link>
        <Link
          href="/family"
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
          aria-label="View Progress"
        >
          <Users className="size-4" aria-hidden="true" />
        </Link>

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold text-muted-foreground"
        >
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{gradeTitle || "Home"}</span>
          </button>

          {(view === "subject" || view === "topic") && subjectTitle && (
            <>
              <ChevronRight className="size-4 opacity-50" aria-hidden="true" />
              <button
                type="button"
                onClick={onBackToSubject}
                disabled={view === "subject"}
                className="max-w-[8rem] truncate rounded-full px-2 py-1 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent aria-[current=page]:text-foreground"
                aria-current={view === "subject" ? "page" : undefined}
              >
                {subjectTitle}
              </button>
            </>
          )}

          {view === "daily" && (
            <>
              <ChevronRight className="size-4 opacity-50" aria-hidden="true" />
              <span className="max-w-[10rem] truncate px-2 py-1 text-foreground" aria-current="page">
                Daily challenge
              </span>
            </>
          )}

          {view === "topic" && topicTitle && (
            <>
              <ChevronRight className="size-4 opacity-50" aria-hidden="true" />
              <span className="max-w-[8rem] truncate px-2 py-1 text-foreground" aria-current="page">
                {topicTitle}
              </span>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={onOpenAccount}
          className="ml-auto inline-flex max-w-[10rem] items-center gap-1.5 truncate rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <KeyRound className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{buddyLabel}</span>
        </button>
      </div>
    </header>
  )
}
