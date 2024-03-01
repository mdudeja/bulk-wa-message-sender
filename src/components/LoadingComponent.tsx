import { Skeleton } from "./ui/skeleton"

export default function LoadingComponent() {
  return (
    <div className="w-full h-96 flex flex-col justify-center items-center space-y-2">
      <Skeleton className="w-full h-8" />
      <Skeleton className="w-full h-8" />
      <Skeleton className="w-full h-8" />
      <Skeleton className="w-full h-8" />
    </div>
  )
}
