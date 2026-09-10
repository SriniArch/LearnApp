import { generateBuddyCode, RESERVED_BUDDY_ACCOUNTS } from "@/lib/buddy-code"
import { ensureSchema, getSql } from "@/lib/db"
import { mergeProgress, type ProgressMap } from "@/lib/progress-data"

export interface BuddyAccount {
  code: string
  name: string
  progress: ProgressMap
  updatedAt: string
}

interface AccountRow {
  code: string
  name: string
  progress: unknown
  updated_at: string | Date
}

let queue: Promise<unknown> = Promise.resolve()

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function asProgressMap(value: unknown): ProgressMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as ProgressMap
}

function toIso(value: string | Date): string {
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
}

function mapRow(row: AccountRow): BuddyAccount {
  return {
    code: row.code,
    name: row.name ?? "",
    progress: asProgressMap(row.progress),
    updatedAt: toIso(row.updated_at),
  }
}

async function seedReservedAccounts() {
  const sql = getSql()
  for (const seed of RESERVED_BUDDY_ACCOUNTS) {
    await sql`
      INSERT INTO buddy_accounts (code, name, progress)
      VALUES (${seed.code}, ${seed.name}, '{}'::jsonb)
      ON CONFLICT (code) DO NOTHING
    `
  }
}

async function readyStore() {
  await ensureSchema()
  await seedReservedAccounts()
}

async function selectAccount(code: string): Promise<BuddyAccount | null> {
  const sql = getSql()
  const rows = (await sql`
    SELECT code, name, progress, updated_at
    FROM buddy_accounts
    WHERE code = ${code}
    LIMIT 1
  `) as AccountRow[]
  const row = rows[0]
  return row ? mapRow(row) : null
}

async function insertAccount(account: BuddyAccount) {
  const sql = getSql()
  const progressJson = JSON.stringify(account.progress)
  await sql`
    INSERT INTO buddy_accounts (code, name, progress, updated_at)
    VALUES (${account.code}, ${account.name}, ${progressJson}::jsonb, ${account.updatedAt}::timestamptz)
  `
}

async function updateAccount(account: BuddyAccount) {
  const sql = getSql()
  const progressJson = JSON.stringify(account.progress)
  await sql`
    UPDATE buddy_accounts
    SET
      name = ${account.name},
      progress = ${progressJson}::jsonb,
      updated_at = ${account.updatedAt}::timestamptz
    WHERE code = ${account.code}
  `
}

export async function getAccount(code: string): Promise<BuddyAccount | null> {
  return withLock(async () => {
    await readyStore()
    return selectAccount(code)
  })
}

export async function createAccount(name: string, progress: ProgressMap): Promise<BuddyAccount> {
  return withLock(async () => {
    await readyStore()
    for (let i = 0; i < 40; i++) {
      const code = generateBuddyCode()
      const existing = await selectAccount(code)
      if (existing) continue
      const account: BuddyAccount = {
        code,
        name,
        progress,
        updatedAt: new Date().toISOString(),
      }
      await insertAccount(account)
      return account
    }
    throw new Error("Could not allocate a buddy code")
  })
}

export async function mergeAndSave(
  code: string,
  incoming: ProgressMap,
  name?: string,
): Promise<BuddyAccount | null> {
  return withLock(async () => {
    await readyStore()
    const existing = await selectAccount(code)
    if (!existing) return null
    const account: BuddyAccount = {
      code,
      name: name !== undefined ? name : existing.name,
      progress: mergeProgress(existing.progress, incoming),
      updatedAt: new Date().toISOString(),
    }
    await updateAccount(account)
    return account
  })
}

export async function upsertImportedAccount(incoming: BuddyAccount): Promise<BuddyAccount> {
  return withLock(async () => {
    await readyStore()
    const existing = await selectAccount(incoming.code)
    if (!existing) {
      await insertAccount(incoming)
      return incoming
    }
    const account: BuddyAccount = {
      code: incoming.code,
      name: incoming.name || existing.name,
      progress: mergeProgress(existing.progress, incoming.progress),
      updatedAt: incoming.updatedAt || existing.updatedAt,
    }
    await updateAccount(account)
    return account
  })
}
