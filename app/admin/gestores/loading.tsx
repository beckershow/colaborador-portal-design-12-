import { EngageSidebar } from "@/components/engage-sidebar"

export default function GestoresManagementLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <EngageSidebar />

      <main className="ml-72 flex-1">
        <div className="container mx-auto max-w-7xl space-y-8 p-8">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="space-y-3">
              <div className="h-10 w-96 rounded-lg bg-muted" />
              <div className="h-6 w-[600px] rounded-lg bg-muted" />
            </div>

            {/* Cards skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted" />
              ))}
            </div>

            {/* Content skeleton */}
            <div className="grid gap-6 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-96 rounded-2xl bg-muted" />
              ))}
            </div>

            {/* List skeleton */}
            <div className="space-y-4 rounded-2xl bg-muted p-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-background" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
