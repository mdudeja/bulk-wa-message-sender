import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query"
import { getUserAuthed } from "@/app/actions/getUserAuthed"
import { getUserQueues } from "@/app/actions/getUserQueues"
import UserAuthedComponent from "@/components/UserAuthedComponent"
import UserQueuesComponent from "@/components/UserQueuesComponent"

export default async function DashboardPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ["userAuthed"],
    queryFn: () => getUserAuthed(),
  })

  await queryClient.prefetchQuery({
    queryKey: ["userQueues"],
    queryFn: () => getUserQueues(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-2">
        <UserAuthedComponent />
        <UserQueuesComponent />
      </div>
    </HydrationBoundary>
  )
}
