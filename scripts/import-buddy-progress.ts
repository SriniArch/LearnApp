import { readFile } from "node:fs/promises"
import path from "node:path"
import { upsertImportedAccount, type BuddyAccount } from "@/lib/progress-store"

type AccountTable = Record<string, BuddyAccount>

async function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local")
  const raw = await readFile(envPath, "utf8")
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

async function main() {
  await loadEnvLocal()
  const filePath = path.join(process.cwd(), "data", "buddy-progress.json")
  const table = JSON.parse(await readFile(filePath, "utf8")) as AccountTable
  const entries = Object.values(table)
  if (entries.length === 0) {
    console.log("No accounts in data/buddy-progress.json")
    return
  }
  for (const account of entries) {
    const saved = await upsertImportedAccount({
      code: account.code,
      name: account.name ?? "",
      progress: account.progress ?? {},
      updatedAt: account.updatedAt ?? new Date().toISOString(),
    })
    const keys = Object.keys(saved.progress).length
    console.log(`Imported ${saved.code} (${saved.name || "unnamed"}, ${keys} progress keys)`)
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
