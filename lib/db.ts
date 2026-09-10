import { neon, type NeonQueryFunction } from "@neondatabase/serverless"

export type Sql = NeonQueryFunction<false, false>

function databaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim()
  if (!raw) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local.")
  }
  try {
    const url = new URL(raw)
    url.searchParams.delete("channel_binding")
    return url.toString()
  } catch {
    throw new Error("DATABASE_URL is not a valid connection string.")
  }
}

let sql: Sql | null = null
let schemaReady: Promise<void> | null = null

export function getSql(): Sql {
  if (!sql) {
    sql = neon(databaseUrl())
  }
  return sql
}

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getSql()`
      CREATE TABLE IF NOT EXISTS buddy_accounts (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        progress JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `.then(() => undefined)
  }
  await schemaReady
}
