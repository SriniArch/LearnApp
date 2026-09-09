import { Suspense } from "react"
import { FamilyView } from "@/components/family/family-view"
import { FamilyHeader } from "@/components/family/family-header"

export const metadata = {
  title: "Family progress — Learn Buddy",
  description: "Read-only weekly daily-challenge XP for a buddy code.",
}

function FamilyFallback() {
  return (
    <div className="min-h-screen">
      <FamilyHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pt-8 text-muted-foreground sm:px-6">
        Loading family progress…
      </main>
    </div>
  )
}

export default function FamilyPage() {
  return (
    <Suspense fallback={<FamilyFallback />}>
      <FamilyView />
    </Suspense>
  )
}
