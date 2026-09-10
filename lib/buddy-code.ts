import reservedBuddyAccounts from "@/data/reserved-buddy-accounts.json"

const ANIMALS = [
  "panda",
  "tiger",
  "otter",
  "koala",
  "whale",
  "eagle",
  "robin",
  "puppy",
  "kitten",
  "bunny",
  "horse",
  "zebra",
  "giraffe",
  "monkey",
  "frog",
  "duck",
  "owl",
  "fox",
  "wolf",
  "seal",
  "dolphin",
  "turtle",
  "penguin",
  "hippo",
  "camel",
  "llama",
  "sheep",
  "mouse",
  "moose",
  "crab",
  "shark",
  "parrot",
  "toucan",
  "swan",
  "goose",
  "raccoon",
  "beaver",
  "hedgehog",
  "squirrel",
  "jaguar",
  "cheetah",
  "leopard",
] as const

const ANIMAL_SET = new Set<string>(ANIMALS)
const CODE_PATTERN = /^[a-z]+-\d{3}$/

export const RESERVED_BUDDY_ACCOUNTS: { code: string; name: string }[] =
  reservedBuddyAccounts

const RESERVED_CODES = new Set<string>(
  RESERVED_BUDDY_ACCOUNTS.map((account) => account.code),
)

export function generateBuddyCode(): string {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  const digits = String(100 + Math.floor(Math.random() * 900))
  return `${animal}-${digits}`
}

export function normalizeBuddyCode(raw: string): string {
  const compact = raw.trim().toLowerCase().replace(/[\s_]+/g, "-")
  const match = compact.match(/^([a-z]+)[-\s]?(\d{3})$/)
  if (match) return `${match[1]}-${match[2]}`
  const lettersOnly = compact.replace(/-/g, "")
  if (RESERVED_CODES.has(lettersOnly)) return lettersOnly
  return compact
}

export function isBuddyCode(value: string): boolean {
  if (RESERVED_CODES.has(value)) return true
  return CODE_PATTERN.test(value) && ANIMAL_SET.has(value.split("-")[0] ?? "")
}

export function displayBuddyCode(code: string): string {
  return code.toUpperCase()
}

export function sanitizeDisplayName(raw: unknown): string {
  if (typeof raw !== "string") return ""
  return raw.replace(/\s+/g, " ").trim().slice(0, 32)
}

function joinNames(names: string[]): string {
  if (names.length === 0) return ""
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`
}

export function reservedAccountNames(): string {
  return joinNames(RESERVED_BUDDY_ACCOUNTS.map((account) => account.name))
}

export function reservedCodeHint(): string {
  const codes = RESERVED_BUDDY_ACCOUNTS.map((account) => account.code)
  const listed = joinNames(codes)
  if (!listed) return "Try a code like PANDA-847."
  return `Try ${listed}, or a code like PANDA-847.`
}

export const BUDDY_ACCOUNT_KEY = "kids-learning-buddy-v1"
