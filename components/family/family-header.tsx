"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { GraduationCap, Users } from "lucide-react"
import { BUDDY_ACCOUNT_KEY, displayBuddyCode, isBuddyCode } from "@/lib/buddy-code"

export function FamilyHeader() {
  const [buddyCode, setBuddyCode] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BUDDY_ACCOUNT_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { code?: string }
      if (!parsed?.code || !isBuddyCode(parsed.code)) return
      setBuddyCode(displayBuddyCode(parsed.code))
    } catch {
      // ignore private mode / invalid storage
    }
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full outline-none transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Learn Buddy
          </span>
        </Link>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-bold text-secondary-foreground">
          <Users className="size-4" aria-hidden="true" />
          View Progress
        </span>
        {buddyCode ? (
          <span className="ml-auto max-w-[10rem] truncate rounded-full bg-muted px-3 py-1.5 text-sm font-bold text-foreground">
            {buddyCode}
          </span>
        ) : null}
      </div>
    </header>
  )
}
