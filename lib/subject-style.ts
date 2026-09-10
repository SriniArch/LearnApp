import type { CSSProperties } from "react"
import type { SubjectColor } from "@/lib/curriculum"

export interface SubjectStyle {
  // Solid badge / accent
  solid: string
  // Soft tinted surface
  soft: string
  // Text in the subject color
  text: string
  // Ring / border in the subject color
  ring: string
  // Progress bar fill
  bar: string
  tagline: string
  /** Inline CSS variables for dynamic (non-Tailwind) palettes. */
  vars?: CSSProperties
}

const DYNAMIC_SOLID = "bg-[var(--subject)] text-[var(--subject-fg)]"
const DYNAMIC_SOFT = "bg-[var(--subject-soft)]"
const DYNAMIC_TEXT = "text-[var(--subject)]"
const DYNAMIC_RING = "ring-[color:var(--subject)]/40"
const DYNAMIC_BAR = "bg-[var(--subject)]"

interface PaletteSlot {
  solid: string
  soft: string
  fg: string
  tagline: string
}

/** Named palettes that keep existing Tailwind tokens for classic subjects. */
const namedTailwind: Record<string, SubjectStyle> = {
  math: {
    solid: "bg-math text-math-foreground",
    soft: "bg-math-soft",
    text: "text-math",
    ring: "ring-math/40",
    bar: "bg-math",
    tagline: "Numbers, shapes & puzzles",
  },
  science: {
    solid: "bg-science text-science-foreground",
    soft: "bg-science-soft",
    text: "text-science",
    ring: "ring-science/40",
    bar: "bg-science",
    tagline: "Explore how the world works",
  },
  geography: {
    solid: "bg-geography text-geography-foreground",
    soft: "bg-geography-soft",
    text: "text-geography",
    ring: "ring-geography/40",
    bar: "bg-geography",
    tagline: "Places, maps & our planet",
  },
}

/** Named dynamic palettes (no globals.css edit required). */
const namedDynamic: Record<string, PaletteSlot> = {
  english: {
    solid: "oklch(0.58 0.14 25)",
    soft: "oklch(0.95 0.04 25)",
    fg: "oklch(0.99 0.01 25)",
    tagline: "Words, reading & writing",
  },
  tamil: {
    solid: "oklch(0.55 0.16 350)",
    soft: "oklch(0.95 0.05 350)",
    fg: "oklch(0.99 0.01 350)",
    tagline: "Letters, words & reading",
  },
  computer: {
    solid: "oklch(0.55 0.12 230)",
    soft: "oklch(0.95 0.04 230)",
    fg: "oklch(0.99 0.01 230)",
    tagline: "Hardware, software & skills",
  },
}

/** Fallback slots for unknown color keys (deterministic by hash). */
const fallbackSlots: PaletteSlot[] = [
  {
    solid: "oklch(0.58 0.14 300)",
    soft: "oklch(0.95 0.04 300)",
    fg: "oklch(0.99 0.01 300)",
    tagline: "Keep learning",
  },
  {
    solid: "oklch(0.58 0.14 200)",
    soft: "oklch(0.95 0.04 200)",
    fg: "oklch(0.99 0.01 200)",
    tagline: "Keep learning",
  },
  {
    solid: "oklch(0.58 0.14 140)",
    soft: "oklch(0.95 0.04 140)",
    fg: "oklch(0.99 0.01 140)",
    tagline: "Keep learning",
  },
  {
    solid: "oklch(0.58 0.14 40)",
    soft: "oklch(0.95 0.04 40)",
    fg: "oklch(0.99 0.01 40)",
    tagline: "Keep learning",
  },
]

function hashColor(color: string): number {
  let h = 0
  for (let i = 0; i < color.length; i++) {
    h = (h * 31 + color.charCodeAt(i)) >>> 0
  }
  return h
}

function styleFromPalette(slot: PaletteSlot): SubjectStyle {
  return {
    solid: DYNAMIC_SOLID,
    soft: DYNAMIC_SOFT,
    text: DYNAMIC_TEXT,
    ring: DYNAMIC_RING,
    bar: DYNAMIC_BAR,
    tagline: slot.tagline,
    vars: {
      "--subject": slot.solid,
      "--subject-fg": slot.fg,
      "--subject-soft": slot.soft,
    } as CSSProperties,
  }
}

/** Always returns a style for any subject color key. */
export function getSubjectStyle(color: SubjectColor): SubjectStyle {
  const key = color.toLowerCase()
  if (namedTailwind[key]) return namedTailwind[key]
  if (namedDynamic[key]) return styleFromPalette(namedDynamic[key])
  const slot = fallbackSlots[hashColor(key) % fallbackSlots.length]
  return styleFromPalette(slot)
}
