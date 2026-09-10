import {
  BookOpen,
  Calculator,
  FlaskConical,
  Globe2,
  Languages,
  Monitor,
  type LucideIcon,
} from "lucide-react"
import type { SubjectColor } from "@/lib/curriculum"

const iconMap: Record<string, LucideIcon> = {
  math: Calculator,
  science: FlaskConical,
  geography: Globe2,
  english: BookOpen,
  tamil: Languages,
  computer: Monitor,
}

export function SubjectIcon({
  color,
  className,
}: {
  color: SubjectColor
  className?: string
}) {
  const Icon = iconMap[color.toLowerCase()] ?? BookOpen
  return <Icon className={className} aria-hidden="true" />
}
