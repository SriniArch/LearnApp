import {
  isBuddyCode,
  normalizeBuddyCode,
  reservedCodeHint,
  RESERVED_BUDDY_ACCOUNTS,
} from "@/lib/buddy-code"
import { isProgressMap, type ProgressMap } from "@/lib/progress-data"

export const FAMILY_SHORTCUTS = RESERVED_BUDDY_ACCOUNTS.map((account) => ({
  code: account.code,
  label: account.name,
}))

export type FamilyAccountOk = {
  ok: true
  code: string
  name: string
  progress: ProgressMap
  updatedAt?: string
}

export type FamilyAccountErr = {
  ok: false
  code: string
  error: string
}

export type FamilyAccountResult = FamilyAccountOk | FamilyAccountErr

export async function fetchFamilyAccount(rawCode: string): Promise<FamilyAccountResult> {
  const code = normalizeBuddyCode(rawCode)
  if (!isBuddyCode(code)) {
    return {
      ok: false,
      code,
      error: reservedCodeHint(),
    }
  }

  try {
    const res = await fetch(`/api/progress?code=${encodeURIComponent(code)}`)
    const data = (await res.json()) as {
      code?: string
      name?: string
      progress?: ProgressMap
      updatedAt?: string
      error?: string
    }
    if (!res.ok) {
      return {
        ok: false,
        code,
        error: data.error ?? "We could not find that buddy code.",
      }
    }
    if (!data.progress || !isProgressMap(data.progress)) {
      return { ok: false, code, error: "Progress data is not valid." }
    }
    return {
      ok: true,
      code: data.code ?? code,
      name: data.name ?? "",
      progress: data.progress,
      updatedAt: data.updatedAt,
    }
  } catch {
    return { ok: false, code, error: "Could not load that buddy code." }
  }
}

export function rosterCodes(extraCode?: string | null): string[] {
  const codes: string[] = FAMILY_SHORTCUTS.map((item) => item.code)
  const extra = extraCode ? normalizeBuddyCode(extraCode) : ""
  if (!extra || !isBuddyCode(extra)) return codes
  if (codes.includes(extra)) {
    return [extra, ...codes.filter((code) => code !== extra)]
  }
  return [extra, ...codes]
}
