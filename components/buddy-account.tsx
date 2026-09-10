"use client"

import { useEffect, useId, useState } from "react"
import Link from "next/link"
import { KeyRound, X } from "lucide-react"
import { reservedAccountNames, RESERVED_BUDDY_ACCOUNTS } from "@/lib/buddy-code"
import type { useProgress } from "@/hooks/use-progress"

interface BuddyAccountDialogProps {
  open: boolean
  onClose: () => void
  progress: ReturnType<typeof useProgress>
}

export function BuddyAccountDialog({ open, onClose, progress }: BuddyAccountDialogProps) {
  const titleId = useId()
  const [name, setName] = useState(progress.displayName)
  const [codeInput, setCodeInput] = useState("")
  const [copied, setCopied] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(progress.displayName)
    setCodeInput("")
    setFormError(null)
    setCopied(false)
  }, [open, progress.displayName])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      await progress.createBuddyCode(name)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Could not make a buddy code.")
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      await progress.joinBuddyCode(codeInput)
      setCodeInput("")
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "We could not find that buddy code.")
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy() {
    if (!progress.displayBuddyCode) return
    try {
      await navigator.clipboard.writeText(progress.displayBuddyCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setFormError("Could not copy. Write the code down instead.")
    }
  }

  const error = formError ?? progress.syncError
  const reservedNames = reservedAccountNames()
  const codePlaceholder = RESERVED_BUDDY_ACCOUNTS[0]?.code ?? "PANDA-847"

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl ring-1 ring-border"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
              <KeyRound className="size-4" aria-hidden="true" />
              Buddy code
            </p>
            <h2 id={titleId} className="mt-1 font-display text-2xl font-extrabold text-foreground">
              Keep progress on every device
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {progress.buddyCode && progress.displayBuddyCode ? (
          <div className="mt-5 space-y-4">
            {progress.displayName ? (
              <p className="text-base text-muted-foreground">
                Hi, <span className="font-bold text-foreground">{progress.displayName}</span> — use
                this code on another phone or tablet.
              </p>
            ) : (
              <p className="text-base text-muted-foreground">
                Type this code on another phone or tablet to keep the same stars and scores.
              </p>
            )}
            <p className="rounded-2xl bg-secondary px-4 py-4 text-center font-display text-3xl font-extrabold tracking-wide text-secondary-foreground">
              {progress.displayBuddyCode}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="rounded-2xl bg-primary px-4 py-2.5 font-display text-base font-extrabold text-primary-foreground shadow-sm"
              >
                {copied ? "Copied!" : "Copy code"}
              </button>
              <button
                type="button"
                onClick={progress.forgetBuddyCode}
                className="rounded-2xl bg-muted px-4 py-2.5 font-display text-base font-extrabold text-foreground"
              >
                Forget on this device
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Forgetting only unlinks this device. Your saved progress stays with the code.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <p className="text-base text-muted-foreground">
              No email or password. Make a short code, or type one you already have.
            </p>

            <form onSubmit={(event) => void handleCreate(event)} className="space-y-3">
              <label className="block text-sm font-bold text-foreground" htmlFor="buddy-name">
                Your first name (optional)
              </label>
              <input
                id="buddy-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={32}
                placeholder="Maya"
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={busy || progress.syncing}
                className="w-full rounded-2xl bg-primary px-4 py-3 font-display text-lg font-extrabold text-primary-foreground shadow-sm disabled:opacity-60"
              >
                Make a buddy code
              </button>
            </form>

            <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={(event) => void handleJoin(event)} className="space-y-3">
              <label className="block text-sm font-bold text-foreground" htmlFor="buddy-code">
                I already have a code
              </label>
              <p className="text-sm text-muted-foreground">
                {reservedNames ? `${reservedNames} can type their name. ` : ""}
                Other codes look like PANDA-847. Use this code makes this phone that child.
              </p>
              <input
                id="buddy-code"
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                placeholder={codePlaceholder}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-2xl border border-input bg-background px-4 py-3 font-display text-lg font-extrabold tracking-wide text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="submit"
                disabled={busy || progress.syncing || !codeInput.trim()}
                className="w-full rounded-2xl bg-secondary px-4 py-3 font-display text-lg font-extrabold text-secondary-foreground disabled:opacity-60"
              >
                Use this code
              </button>
            </form>
          </div>
        )}

        <p className="mt-5 text-sm text-muted-foreground">
          Grown-ups:{" "}
          <Link
            href="/family"
            className="font-bold text-primary underline-offset-2 hover:underline"
            onClick={onClose}
          >
            View Progress
          </Link>{" "}
          lets you view {reservedNames || "a reserved name"}, or any code without switching
          the kid on this phone.
        </p>

        {error && (
          <p className="mt-4 rounded-2xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
