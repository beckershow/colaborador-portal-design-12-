export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="h-12 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-96 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
}
