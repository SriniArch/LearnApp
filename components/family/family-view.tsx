"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FamilyHeader } from "@/components/family/family-header"
import { ChildProgressCard } from "@/components/family/child-progress-card"
import {
  FAMILY_SHORTCUTS,
  fetchFamilyAccount,
  rosterCodes,
  type FamilyAccountResult,
} from "@/lib/family-progress"
import { isBuddyCode, normalizeBuddyCode } from "@/lib/buddy-code"

export function FamilyView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryCode = searchParams.get("code")
  const codes = useMemo(() => rosterCodes(queryCode), [queryCode])
  const [codeInput, setCodeInput] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, FamilyAccountResult | "loading">>({})

  useEffect(() => {
    let cancelled = false
    for (const code of codes) {
      setResults((prev) => (prev[code] ? prev : { ...prev, [code]: "loading" }))
      void fetchFamilyAccount(code).then((result) => {
        if (cancelled) return
        setResults((prev) => ({ ...prev, [code]: result }))
      })
    }
    return () => {
      cancelled = true
    }
  }, [codes])

  function lookUpCode(raw: string) {
    const code = normalizeBuddyCode(raw)
    if (!isBuddyCode(code)) {
      setFormError("Try magi, yazhini, or a code like PANDA-847.")
      return
    }
    setFormError(null)
    router.push(`/family?code=${encodeURIComponent(code)}`)
    document.getElementById(code)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="min-h-screen">
      <FamilyHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <p className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-foreground">
          View only
        </p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Family progress
        </h1>
        <p className="mt-3 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          Look up Magi, Yazhini, or any buddy code. This page only reads weekly daily-challenge XP
          (Sunday–Saturday). It does not become that child on this phone — use their code on the
          home screen to play as them.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {FAMILY_SHORTCUTS.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => lookUpCode(item.code)}
              className="rounded-2xl bg-secondary px-4 py-2.5 font-display text-base font-extrabold text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </button>
          ))}
        </div>

        <form
          className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            lookUpCode(codeInput)
          }}
        >
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-bold text-foreground" htmlFor="family-code">
              Buddy code
            </label>
            <input
              id="family-code"
              value={codeInput}
              onChange={(event) => setCodeInput(event.target.value)}
              placeholder="PANDA-847"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 font-display text-lg font-extrabold tracking-wide text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={!codeInput.trim()}
            className="rounded-2xl bg-primary px-4 py-3 font-display text-base font-extrabold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            Look up
          </button>
        </form>
        {formError && (
          <p className="mt-2 text-sm font-semibold text-destructive" role="alert">
            {formError}
          </p>
        )}

        <div className="mt-10 space-y-8">
          {codes.map((code) => {
            const result = results[code]
            if (!result || result === "loading") {
              return (
                <section
                  key={code}
                  id={code}
                  className="rounded-3xl bg-card p-5 text-muted-foreground shadow-sm ring-1 ring-border sm:p-6"
                >
                  Loading {code}…
                </section>
              )
            }
            return <ChildProgressCard key={code} result={result} />
          })}
        </div>
      </main>
    </div>
  )
}
