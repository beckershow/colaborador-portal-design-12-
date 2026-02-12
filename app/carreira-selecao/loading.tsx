import { Skeleton } from "@/components/ui/skeleton"

export default function CarreiraSelecaoLoading() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
